from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from bson import ObjectId
from app.core.database import get_database
from app.models.schemas import UserResponse, NotificationResponse
from app.api.v1.endpoints.auth import get_current_user
from app.services.notifier import analyze_store_inventory

router = APIRouter()

@router.get("", response_model=List[dict])
async def get_notifications(
    limit: int = 20,
    current_user: UserResponse = Depends(get_current_user)
):
    db = get_database()
    col = db["notifications"]
    
    query = {"store_id": current_user.store_id}
    docs = await col.find(query).sort("created_at", -1).limit(limit).to_list(limit)
    
    for doc in docs:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        
    return docs

@router.put("/{notif_id}/read", response_model=dict)
async def mark_notification_read(
    notif_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    db = get_database()
    col = db["notifications"]
    
    try:
        obj_id = ObjectId(notif_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")
        
    res = await col.update_one(
        {"_id": obj_id, "store_id": current_user.store_id},
        {"$set": {"is_read": True}}
    )
    
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    return {"status": "success"}

@router.post("/trigger-analysis", response_model=dict)
async def trigger_analysis(
    current_user: UserResponse = Depends(get_current_user)
):
    if current_user.role not in ["Owner", "Manager"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    res = await analyze_store_inventory(current_user.store_id, current_user.email, current_user.phone)
    return res
