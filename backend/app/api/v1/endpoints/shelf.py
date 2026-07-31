from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from datetime import datetime
from bson import ObjectId
import json
from google import genai
from google.genai import types

from app.core.config import settings
from app.core.database import get_database
from app.models.schemas import UserResponse, ShelfScanResponse
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()

@router.post("/scan", response_model=ShelfScanResponse, status_code=status.HTTP_201_CREATED)
async def scan_shelf(
    file: UploadFile = File(...),
    current_user: UserResponse = Depends(get_current_user)
):
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured on server")
        
    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        
        image_bytes = await file.read()
        image_part = types.Part.from_bytes(
            data=image_bytes,
            mime_type=file.content_type
        )
        
        prompt = """
You are an advanced AI Retail Shelf Monitoring system.
Analyze this image of a retail shelf and provide a detailed report in JSON format.

Return ONLY valid JSON.

Determine an overall "health_score" out of 100 based on how well-stocked, organized, and undamaged the items look.

Detect the following:
1. "missing_products": Identify empty slots where a product should be but is completely out of stock. Guess the product name if there's a tag, or just describe the space.
2. "low_stock": Items that are visibly low in quantity on the shelf.
3. "expired_products": If you can magically read an expiry date and it's past, or if it looks visually extremely old/discolored (usually just guess [] if not visible).
4. "damaged_items": Products with crushed boxes, torn labels, or dents.
5. "misplaced_items": Products that are clearly in the wrong section (e.g. soap mixed with biscuits).
6. "empty_shelves_detected": Boolean true if there are large empty gaps.

For each item list in categories 1-5, use this format:
{ "name": "Product Name", "status": "missing/damaged/etc", "notes": "Optional reason" }

Example JSON format:
{
  "health_score": 85,
  "empty_shelves_detected": false,
  "missing_products": [],
  "low_stock": [],
  "expired_products": [],
  "damaged_items": [],
  "misplaced_items": []
}
"""
        response = client.models.generate_content(
            model='gemini-flash-latest',
            contents=[prompt, image_part]
        )
        
        # Clean the response to ensure it's valid JSON
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
            
        data = json.loads(text)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze shelf image: {str(e)}")
        
    # Save to database
    db = get_database()
    col = db["shelf_scans"]
    
    now = datetime.utcnow().isoformat()
    doc = {
        "store_id": current_user.store_id,
        "health_score": data.get("health_score", 100),
        "empty_shelves_detected": data.get("empty_shelves_detected", False),
        "missing_products": data.get("missing_products", []),
        "low_stock": data.get("low_stock", []),
        "expired_products": data.get("expired_products", []),
        "damaged_items": data.get("damaged_items", []),
        "misplaced_items": data.get("misplaced_items", []),
        "created_at": now
    }
    
    res = await col.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    
    return doc

@router.get("/scan/latest", response_model=ShelfScanResponse)
async def get_latest_scan(
    current_user: UserResponse = Depends(get_current_user)
):
    db = get_database()
    col = db["shelf_scans"]
    
    cursor = col.find({"store_id": current_user.store_id}).sort("created_at", -1)
    
    scans = await cursor.to_list(1)
    if not scans:
        raise HTTPException(status_code=404, detail="No shelf scans found")
        
    doc = scans[0]
    doc["id"] = str(doc.get("_id", scans[0].get("id")))
    return doc
