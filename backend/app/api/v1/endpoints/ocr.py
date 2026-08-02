from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from datetime import datetime
import json
import io
import re
from PIL import Image
try:
    from dateutil import parser as date_parser
except ImportError:
    date_parser = None

from google import genai
from google.genai import types

from app.core.config import settings
from app.core.database import get_database
from app.models.schemas import UserResponse, OCRExtractResponse
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()

def parse_any_date(date_str: str) -> tuple[datetime | None, str | None]:
    """
    Parses date_str in multiple common Indian/global date formats.
    Returns (datetime_object, formatted_YYYY_MM_DD_string).
    """
    if not date_str or not isinstance(date_str, str):
        return None, None
        
    date_str = date_str.strip()
    
    try:
        # 1. YYYY-MM-DD
        match_iso = re.search(r'(\d{4})[/\.-](\d{1,2})[/\.-](\d{1,2})', date_str)
        if match_iso:
            y, m, d = int(match_iso.group(1)), int(match_iso.group(2)), int(match_iso.group(3))
            if 1 <= m <= 12 and 1 <= d <= 31:
                dt = datetime(y, m, d)
                return dt, dt.strftime("%Y-%m-%d")

        # 2. DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
        match_dmY = re.search(r'(\d{1,2})[/\.-](\d{1,2})[/\.-](\d{4})', date_str)
        if match_dmY:
            d, m, y = int(match_dmY.group(1)), int(match_dmY.group(2)), int(match_dmY.group(3))
            if 1 <= m <= 12 and 1 <= d <= 31:
                dt = datetime(y, m, d)
                return dt, dt.strftime("%Y-%m-%d")

        # 3. MM/YY or MM/YYYY
        match_my = re.search(r'(\d{1,2})[/\.-](\d{2,4})', date_str)
        if match_my:
            m, y = int(match_my.group(1)), int(match_my.group(2))
            if y < 100:
                y += 2000
            if 1 <= m <= 12:
                # Default to end of month for expiry date estimation
                dt = datetime(y, m, 28)
                return dt, dt.strftime("%Y-%m-%d")

        # 4. Fallback: Fuzzy parse with dateutil if installed
        if date_parser:
            dt = date_parser.parse(date_str, fuzzy=True)
            return dt, dt.strftime("%Y-%m-%d")
            
        return None, date_str
    except Exception:
        return None, date_str

def calculate_expiry(expiry_date_str: str):
    """
    Tries to parse expiry_date_str and calculate days remaining.
    Returns (days_remaining, category).
    """
    if not expiry_date_str:
        return None, "Safe"
        
    dt, _ = parse_any_date(expiry_date_str)
    if dt:
        delta = (dt - datetime.utcnow()).days
        if delta < 0:
            return delta, "Expired"
        elif delta <= 30:
            return delta, "Near Expiry"
        else:
            return delta, "Safe"
            
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
        
        prompt = """You are an expert OCR product scanner for retail products and packaging.
Analyze this product packaging image carefully and extract all product details.

IMPORTANT DATE EXTRACTION RULES:
1. "mfg_date": Look for "MFG DATE", "PKD", "PACKED ON", or "MANUFACTURED DATE". Format as YYYY-MM-DD (e.g. "2026-01-15").
2. "expiry_date": Look for "EXP DATE", "EXPIRY DATE", "USE BY", "BEST BEFORE".
   - If an explicit Expiry/Use By Date is printed, return it formatted as YYYY-MM-DD.
   - If the label says "Best before X months from MFG / PKD", calculate the actual expiry date by adding X months to mfg_date (e.g. Mfg 2026-01-15 + 6 months = 2026-07-15).
   - If only Month/Year is printed (e.g. "EXP 07/26"), format it as YYYY-MM-DD (e.g. "2026-07-31").
   - Do NOT confuse Mfg Date with Expiry Date! Ensure expiry_date is AFTER mfg_date.

Return ONLY a valid raw JSON object with no markdown code blocks or extra text:
{
  "product_name": "Full Product Name with weight/brand (string or null)",
  "batch_number": "Batch / Lot / B.No (string or null)",
  "mrp": 123.45 (numeric MRP/Price in Rupees as float or null),
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

    raw_mfg = data.get("mfg_date")
    raw_exp = data.get("expiry_date")

    _, formatted_mfg = parse_any_date(raw_mfg)
    _, formatted_exp = parse_any_date(raw_exp)

    mfg_date = formatted_mfg or raw_mfg
    expiry_date = formatted_exp or raw_exp

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
