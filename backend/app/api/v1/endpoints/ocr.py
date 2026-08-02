from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from datetime import datetime
import json
import io
import re
from PIL import Image
from google import genai
from google.genai import types

from app.core.config import settings
from app.core.database import get_database
from app.models.schemas import UserResponse, OCRExtractResponse
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()

def calculate_expiry(expiry_date_str: str):
    """
    Tries to parse expiry_date_str and calculate days remaining.
    Returns (days_remaining, category).
    """
    if not expiry_date_str:
        return None, "Safe"
        
    try:
        match = re.search(r'\d{4}-\d{2}-\d{2}', expiry_date_str)
        if match:
            exp_date = datetime.strptime(match.group(), "%Y-%m-%d")
            delta = (exp_date - datetime.utcnow()).days
            
            if delta < 0:
                return delta, "Expired"
            elif delta <= 30:
                return delta, "Near Expiry"
            else:
                return delta, "Safe"
    except Exception:
        pass
        
    return None, "Safe"

def compress_image_bytes(image_bytes: bytes, max_dim: int = 1280) -> tuple[bytes, str]:
    """
    Resizes large images to reduce RAM usage and API payload size (< 20MB RAM).
    """
    try:
        img = Image.open(io.BytesIO(image_bytes))
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
            
        width, height = img.size
        if width > max_dim or height > max_dim:
            img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
            
        output = io.BytesIO()
        img.save(output, format="JPEG", quality=85)
        return output.getvalue(), "image/jpeg"
    except Exception:
        return image_bytes, "image/jpeg"

@router.post("/extract", response_model=OCRExtractResponse, status_code=status.HTTP_201_CREATED)
async def extract_ocr(
    file: UploadFile = File(...),
    current_user: UserResponse = Depends(get_current_user)
):
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured on server")
        
    raw_bytes = await file.read()
    if not raw_bytes:
        raise HTTPException(status_code=400, detail="Uploaded image file is empty.")
        
    # Compress image to keep memory consumption under 20MB
    image_bytes, mime_type = compress_image_bytes(raw_bytes)

    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    data = {}

    try:
        image_part = types.Part.from_bytes(
            data=image_bytes,
            mime_type=mime_type
        )
        
        prompt = """You are an expert OCR product scanner and data extractor for retail stores.
Analyze this product packaging image directly and extract label details.

Return ONLY a valid raw JSON object with no markdown code blocks or extra text:
{
  "product_name": "Product Name or description (string or null)",
  "batch_number": "Batch/Lot number (string or null)",
  "mrp": 123.45 (numeric float or null),
  "mfg_date": "YYYY-MM-DD or null",
  "expiry_date": "YYYY-MM-DD or null"
}
"""
        response = None
        for model_name in ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-flash-latest']:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=[prompt, image_part]
                )
                if response and response.text:
                    break
            except Exception:
                continue

        if response and response.text:
            text = response.text.strip()
            json_match = re.search(r'\{.*\}', text, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group(0))
    except Exception as vision_err:
        print(f"Gemini Vision extraction error: {vision_err}")

    if not isinstance(data, dict):
        data = {}

    product_name = data.get("product_name")
    batch_number = data.get("batch_number")
    mrp = data.get("mrp")
    if mrp is not None:
        try:
            mrp = float(mrp)
        except (ValueError, TypeError):
            mrp = None

    mfg_date = data.get("mfg_date")
    expiry_date = data.get("expiry_date")

    # Calculate days remaining and category
    days_remaining, category = calculate_expiry(expiry_date)

    # Save to database
    db = get_database()
    col = db["ocr_results"]
    
    now = datetime.utcnow().isoformat()
    doc = {
        "store_id": current_user.store_id,
        "product_name": product_name or "Scanned Item",
        "batch_number": batch_number,
        "mrp": mrp,
        "mfg_date": mfg_date,
        "expiry_date": expiry_date,
        "days_remaining": days_remaining,
        "category": category,
        "created_at": now
    }
    
    res = await col.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    
    return doc

@router.get("/history", response_model=list[OCRExtractResponse])
async def get_ocr_history(
    current_user: UserResponse = Depends(get_current_user)
):
    db = get_database()
    col = db["ocr_results"]
    
    cursor = col.find({"store_id": current_user.store_id}).sort("created_at", -1).limit(50)
    scans = await cursor.to_list(50)
    
    results = []
    for doc in scans:
        doc["id"] = str(doc["_id"])
        results.append(doc)
        
    return results
