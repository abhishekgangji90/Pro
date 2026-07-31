from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File
from bson import ObjectId
from google import genai
from google.genai import types
import json
from app.core.config import settings
from app.core.database import get_database
from app.models.schemas import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductBase,
    UserResponse
)
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()

def compute_item_status(quantity: int, min_stock: int, expiry_date_str: Optional[str]) -> str:
    """Helper to derive real-time status derived from stock levels & expiry date."""
    if quantity <= 0:
        return "Out of Stock"
    
    if expiry_date_str:
        try:
            exp_date = datetime.strptime(expiry_date_str[:10], "%Y-%m-%d").date()
            days_until_exp = (exp_date - date.today()).days
            if days_until_exp < 0:
                return "Expired Items"
            if days_until_exp <= 7:
                return "Near Expiry"
        except Exception:
            pass
            
    if quantity <= min_stock:
        return "Low Stock"
        
    return "In Stock"

@router.get("", response_model=List[ProductResponse])
async def list_products(
    search: Optional[str] = Query(None, description="Search by name, SKU, or Barcode"),
    category: Optional[str] = Query(None, description="Filter by category"),
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    current_user: UserResponse = Depends(get_current_user)
):
    db = get_database()
    col = db["products"]
    
    # Filter by user's store_id
    query = {"store_id": current_user.store_id} if current_user.store_id else {}
    
    raw_items = await col.find(query).to_list(1000)
    results = []
    
    for item in raw_items:
        computed_status = compute_item_status(
            item.get("quantity", 0),
            item.get("min_stock", 5),
            item.get("expiry_date")
        )
        
        item_obj = ProductResponse(
            id=str(item["_id"]),
            store_id=item.get("store_id", current_user.store_id),
            name=item.get("name", ""),
            category=item.get("category", "General"),
            sku=item.get("sku", ""),
            barcode=item.get("barcode"),
            qrcode=item.get("qrcode"),
            batch_number=item.get("batch_number"),
            mfg_date=item.get("mfg_date"),
            expiry_date=item.get("expiry_date"),
            supplier_name=item.get("supplier_name"),
            supplier_contact=item.get("supplier_contact"),
            purchase_price=item.get("purchase_price", 0.0),
            selling_price=item.get("selling_price", 0.0),
            quantity=item.get("quantity", 0),
            min_stock=item.get("min_stock", 5),
            unit=item.get("unit", "Pcs"),
            shelf_location=item.get("shelf_location", "Shelf A"),
            image_url=item.get("image_url"),
            status=computed_status,
            created_at=item.get("created_at", datetime.utcnow().isoformat())
        )
        
        # Apply filters
        if search:
            s_lower = search.lower()
            barcode_str = (item_obj.barcode or "").lower()
            if s_lower not in item_obj.name.lower() and s_lower not in item_obj.sku.lower() and s_lower not in barcode_str:
                continue
                
        if category and category != "All":
            if item_obj.category != category:
                continue
                
        if status_filter and status_filter != "All":
            if item_obj.status != status_filter:
                continue
                
        results.append(item_obj)
        
    return results

@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    item_in: ProductCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    if current_user.role not in ["Owner", "Manager", "Staff"]:
        raise HTTPException(status_code=403, detail="Not authorized to create items")
        
    db = get_database()
    col = db["products"]
    
    now = datetime.utcnow().isoformat()
    doc = item_in.model_dump()
    doc["store_id"] = current_user.store_id
    doc["created_at"] = now
    
    computed_status = compute_item_status(doc["quantity"], doc["min_stock"], doc.get("expiry_date"))
    doc["status"] = computed_status
    
    res = await col.insert_one(doc)
    doc_id = str(res.inserted_id)
    
    return ProductResponse(
        id=doc_id,
        store_id=current_user.store_id,
        **item_in.model_dump(),
        status=computed_status,
        created_at=now
    )

@router.put("/{item_id}", response_model=ProductResponse)
async def update_product(
    item_id: str,
    item_update: ProductUpdate,
    current_user: UserResponse = Depends(get_current_user)
):
    if current_user.role not in ["Owner", "Manager", "Staff"]:
        raise HTTPException(status_code=403, detail="Not authorized to update items")
        
    db = get_database()
    col = db["products"]
    
    try:
        obj_id = ObjectId(item_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid item ID format")
        
    existing = await col.find_one({"_id": obj_id, "store_id": current_user.store_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found or access denied")
        
    update_data = item_update.model_dump(exclude_unset=True)
    if not update_data:
        computed_status = compute_item_status(
            existing.get("quantity", 0),
            existing.get("min_stock", 5),
            existing.get("expiry_date")
        )
        return ProductResponse(
            id=str(existing["_id"]),
            store_id=current_user.store_id,
            **{k: existing.get(k) for k in ProductBase.model_fields.keys()},
            status=computed_status,
            created_at=existing.get("created_at", datetime.utcnow().isoformat())
        )
        
    merged_quantity = update_data.get("quantity", existing.get("quantity", 0))
    merged_min_stock = update_data.get("min_stock", existing.get("min_stock", 5))
    merged_expiry = update_data.get("expiry_date", existing.get("expiry_date"))
    
    computed_status = compute_item_status(merged_quantity, merged_min_stock, merged_expiry)
    update_data["status"] = computed_status
    
    await col.update_one({"_id": obj_id}, {"$set": update_data})
    
    updated = await col.find_one({"_id": obj_id})
    return ProductResponse(
        id=str(updated["_id"]),
        store_id=current_user.store_id,
        **{k: updated.get(k) for k in ProductBase.model_fields.keys()},
        status=computed_status,
        created_at=updated.get("created_at", datetime.utcnow().isoformat())
    )

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    item_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    if current_user.role not in ["Owner", "Manager"]:
        raise HTTPException(status_code=403, detail="Only Owner or Manager can delete items")
        
    db = get_database()
    col = db["products"]
    
    try:
        obj_id = ObjectId(item_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid item ID format")
        
    res = await col.delete_one({"_id": obj_id, "store_id": current_user.store_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return None

@router.post("/analyze-image")
async def analyze_image(
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
You are an AI assistant for a retail inventory management system.

Analyze the uploaded product image and extract as much information as possible from the product packaging.

Return ONLY valid JSON.

Rules:
- Read all visible text on the package.
- Detect the product name, brand, quantity, and category.
- Extract barcode if visible.
- Estimate purchase price and selling price only if printed; otherwise return null.
- Generate a SKU if not available using the format:
  BRAND-PRODUCT-SIZE
- Suggest a shelf location based on category.
- Set Qty to 0 by default.
- Set Min Alert to 10 by default.
- Unit should be one of:
  ["Pcs","Kg","g","L","ml","Pack","Box","Bottle","Can"]
- Batch Number, Mfg Date and Expiry Date should be extracted if visible; otherwise null.
- Supplier Name and Supplier Contact should be null unless clearly visible.
- Image URL should be null.
- QR Code should be extracted if visible.

Return JSON in this format:

{
  "product_name": "",
  "brand": "",
  "category": "",
  "barcode": "",
  "qr_code": "",
  "purchase_price": null,
  "selling_price": null,
  "qty": 0,
  "min_alert": 10,
  "unit": "",
  "sku": "",
  "shelf_location": "",
  "batch_number": null,
  "mfg_date": null,
  "expiry_date": null,
  "supplier_name": null,
  "supplier_contact": null,
  "image_url": null,
  "confidence": 0.0
}

Shelf location suggestions:
- Grocery → SHELF A
- Snacks → SHELF B
- Beverages → SHELF C
- Dairy → FRIDGE 1
- Frozen → FREEZER 1
- Personal Care → SHELF D
- Cleaning → SHELF E
- Medicine → MEDICINE RACK
- Stationery → SHELF F
- Others → STORE ROOM
"""
        response = client.models.generate_content(
            model='gemini-flash-latest',
            contents=[prompt, image_part]
        )
        
        # Clean the response to ensure it's valid JSON
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
            
        data = json.loads(text.strip())
        return data
        
    except Exception as e:
        print("Gemini Analysis Error:", e)
        raise HTTPException(status_code=500, detail=f"Failed to analyze image: {str(e)}")
