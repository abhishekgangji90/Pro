from datetime import datetime
from typing import List
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.database import get_database
from app.models.schemas import SaleCreate, SaleResponse, UserResponse
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()

@router.post("", response_model=SaleResponse, status_code=status.HTTP_201_CREATED)
async def record_sale(
    sale_in: SaleCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    if current_user.role not in ["Owner", "Manager", "Staff"]:
        raise HTTPException(status_code=403, detail="Not authorized to record sales")
        
    db = get_database()
    col = db["sales"]
    products_col = db["products"]
    
    # Process inventory deductions
    for item in sale_in.items:
        try:
            prod_id = ObjectId(item.product_id)
        except Exception:
            # Fallback for mock storage mode
            prod_id = item.product_id
            
        product = await products_col.find_one({"_id": prod_id, "store_id": current_user.store_id})
        
        if product:
            new_qty = max(0, product.get("quantity", 0) - item.quantity)
            min_stock = product.get("min_stock", 5)
            
            # Determine new status
            new_status = "Active"
            if new_qty <= 0:
                new_status = "Out of Stock"
            elif new_qty <= min_stock:
                new_status = "Low Stock"
                
            await products_col.update_one(
                {"_id": prod_id},
                {"$set": {"quantity": new_qty, "status": new_status}}
            )

    now = datetime.utcnow().isoformat()
    doc = sale_in.model_dump()
    doc["store_id"] = current_user.store_id
    doc["created_at"] = now
    
    res = await col.insert_one(doc)
    
    return SaleResponse(
        id=str(res.inserted_id),
        store_id=current_user.store_id,
        amount=sale_in.amount,
        items_count=sale_in.items_count,
        payment_method=sale_in.payment_method,
        items=sale_in.items,
        created_at=now
    )

@router.get("/today", response_model=dict)
async def get_todays_sales(
    current_user: UserResponse = Depends(get_current_user)
):
    db = get_database()
    col = db["sales"]
    
    today_prefix = datetime.utcnow().isoformat()[:10]  # yyyy-mm-dd
    
    query = {
        "store_id": current_user.store_id,
        "created_at": {"$regex": f"^{today_prefix}"}
    }
    
    sales = await col.find(query).to_list(1000)
    
    total_amount = sum([s.get("amount", 0.0) for s in sales])
    total_transactions = len(sales)
    
    return {
        "total_amount": total_amount,
        "total_transactions": total_transactions,
        "date": today_prefix
    }
