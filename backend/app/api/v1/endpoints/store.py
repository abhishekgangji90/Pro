from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from app.core.database import get_database
from app.core.security import get_password_hash
from app.models.schemas import StoreUpdate, StoreResponse, EmployeeCreate, UserResponse
from app.api.v1.endpoints.auth import get_current_user
from datetime import datetime

router = APIRouter()

@router.get("/me", response_model=StoreResponse)
async def get_my_store(current_user: UserResponse = Depends(get_current_user)):
    db = get_database()
    stores_col = db["stores"]
    
    try:
        obj_id = ObjectId(current_user.store_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid store ID format")
        
    store = await stores_col.find_one({"_id": obj_id})
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
        
    return StoreResponse(
        id=str(store["_id"]),
        name=store.get("name", ""),
        address=store.get("address", ""),
        gst_number=store.get("gst_number", ""),
        contact_number=store.get("contact_number", ""),
        created_at=store.get("created_at", "")
    )

@router.put("/me", response_model=StoreResponse)
async def update_my_store(
    store_in: StoreUpdate,
    current_user: UserResponse = Depends(get_current_user)
):
    if current_user.role != "Owner":
        raise HTTPException(status_code=403, detail="Only Owner can update Store Profile")
        
    db = get_database()
    stores_col = db["stores"]
    
    try:
        obj_id = ObjectId(current_user.store_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid store ID format")
    
    update_data = store_in.model_dump(exclude_unset=True)
    if update_data:
        await stores_col.update_one({"_id": obj_id}, {"$set": update_data})
        
    store = await stores_col.find_one({"_id": obj_id})
    return StoreResponse(
        id=str(store["_id"]),
        name=store.get("name", ""),
        address=store.get("address", ""),
        gst_number=store.get("gst_number", ""),
        contact_number=store.get("contact_number", ""),
        created_at=store.get("created_at", "")
    )

@router.post("/employees", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_employee(
    emp_in: EmployeeCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    if current_user.role not in ["Owner", "Manager"]:
        raise HTTPException(status_code=403, detail="Only Owner or Manager can add employees")
    if current_user.role == "Manager" and emp_in.role == "Manager":
        raise HTTPException(status_code=403, detail="Managers cannot create other Managers")
        
    db = get_database()
    users_col = db["users"]
    
    existing = await users_col.find_one({"email": emp_in.email})
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")
        
    now = datetime.utcnow().isoformat()
    hashed_pwd = get_password_hash(emp_in.password)
    user_doc = {
        "email": emp_in.email,
        "hashed_password": hashed_pwd,
        "full_name": emp_in.full_name,
        "phone": emp_in.phone,
        "role": emp_in.role,
        "store_id": current_user.store_id,
        "created_at": now
    }
    
    result = await users_col.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    return UserResponse(
        id=user_id,
        email=emp_in.email,
        full_name=emp_in.full_name,
        role=emp_in.role,
        store_id=current_user.store_id,
        store_name=current_user.store_name,
        phone=emp_in.phone,
        created_at=now
    )
