from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from datetime import datetime
import json
import io
import re
from google import genai
from google.genai import types

from app.core.config import settings
from app.core.database import get_database
from app.models.schemas import UserResponse, OCRExtractResponse
from app.api.v1.endpoints.auth import get_current_user

# Lazy load easyocr to avoid slow startup if not used
reader = None

router = APIRouter()

def get_ocr_reader():
    global reader
    if reader is None:
        import easyocr
        reader = easyocr.Reader(['en'])
    return reader

def calculate_expiry(expiry_date_str: str):
    """
    Tries to parse expiry_date_str and calculate days remaining.
    Returns (days_remaining, category).
    """
    if not expiry_date_str:
        return None, "Safe"
        
    # Attempt to parse YYYY-MM-DD
    try:
        # Just simple regex for YYYY-MM-DD
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

@router.post("/extract", response_model=OCRExtractResponse, status_code=status.HTTP_201_CREATED)
async def extract_ocr(
    file: UploadFile = File(...),
    current_user: UserResponse = Depends(get_current_user)
):
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured on server")
        
    try:
        # Read file bytes
        image_bytes = await file.read()
        
        # 1. Run EasyOCR
        r = get_ocr_reader()
        # EasyOCR needs bytes or path
        ocr_results = r.readtext(image_bytes, detail=0)
        raw_text = "\n".join(ocr_results)
        
        # 2. Ask Gemini to structure the raw text
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        
        prompt = f"""
You are an expert data extractor. I have used OCR to extract text from a product packaging image.
The OCR text is messy. Your job is to extract the following fields and return ONLY a valid JSON object.

Extract:
- "product_name" (string or null)
- "batch_number" (string or null)
- "mrp" (float or null)
- "mfg_date" (string as YYYY-MM-DD or null)
- "expiry_date" (string as YYYY-MM-DD or null)

Raw OCR Text:
{raw_text}
"""
        response = client.models.generate_content(
            model='gemini-flash-latest',
            contents=[prompt]
        )
        
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
            
        data = json.loads(text)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process OCR: {str(e)}")
        
    # Calculate days remaining and category
    days_remaining, category = calculate_expiry(data.get("expiry_date"))
    
    # Save to database
    db = get_database()
    col = db["ocr_results"]
    
    now = datetime.utcnow().isoformat()
    doc = {
        "store_id": current_user.store_id,
        "product_name": data.get("product_name"),
        "batch_number": data.get("batch_number"),
        "mrp": data.get("mrp"),
        "mfg_date": data.get("mfg_date"),
        "expiry_date": data.get("expiry_date"),
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
