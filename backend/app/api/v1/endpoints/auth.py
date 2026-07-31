from datetime import datetime
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from bson import ObjectId
from app.core.database import get_database
from app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token
from app.models.schemas import RegisterOwner, UserLogin, UserResponse, Token

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserResponse:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    db = get_database()
    users_col = db["users"]
    
    try:
        user = await users_col.find_one({"_id": ObjectId(user_id)})
    except Exception:
        # Fallback to string _id for MockDatabase
        user = await users_col.find_one({"_id": user_id})
        
    if user is None:
        # Check by email as fallback
        user = await users_col.find_one({"email": user_id})
    if user is None:
        raise credentials_exception
        
    stores_col = db["stores"]
    store = None
    if user.get("store_id"):
        try:
            store = await stores_col.find_one({"_id": ObjectId(user.get("store_id"))})
        except Exception:
            pass
            
    store_name = store.get("name", "Kirana Store") if store else user.get("store_name", "Kirana Store")
    
    return UserResponse(
        id=str(user["_id"]),
        email=user["email"],
        full_name=user["full_name"],
        role=user.get("role", "Owner"),
        store_id=user.get("store_id", ""),
        store_name=store_name,
        phone=user.get("phone"),
        created_at=user.get("created_at", str(datetime.utcnow()))
    )

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterOwner) -> Any:
    db = get_database()
    users_col = db["users"]
    stores_col = db["stores"]
    
    user_in = payload.user
    store_in = payload.store
    
    existing = await users_col.find_one({"email": user_in.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    now = datetime.utcnow().isoformat()
    
    # Create Store First
    store_doc = {
        "name": store_in.name,
        "address": store_in.address,
        "gst_number": store_in.gst_number,
        "contact_number": store_in.contact_number,
        "created_at": now
    }
    store_res = await stores_col.insert_one(store_doc)
    store_id = str(store_res.inserted_id)
    
    # Create User linked to Store
    hashed_pwd = get_password_hash(user_in.password)
    user_doc = {
        "email": user_in.email,
        "hashed_password": hashed_pwd,
        "full_name": user_in.full_name,
        "phone": user_in.phone,
        "role": "Owner",
        "store_id": store_id,
        "created_at": now
    }
    
    result = await users_col.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    access_token = create_access_token(subject=user_id)
    
    user_res = UserResponse(
        id=user_id,
        email=user_in.email,
        full_name=user_in.full_name,
        role="Owner",
        store_id=store_id,
        store_name=store_in.name,
        phone=user_in.phone,
        created_at=now
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_res)

@router.post("/login", response_model=Token)
async def login(login_in: UserLogin) -> Any:
    db = get_database()
    users_col = db["users"]
    stores_col = db["stores"]
    
    user = await users_col.find_one({"email": login_in.email})
    if not user or not verify_password(login_in.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    user_id = str(user["_id"])
    store_id = user.get("store_id", "")
    
    store = None
    if store_id:
        try:
            store = await stores_col.find_one({"_id": ObjectId(store_id)})
        except Exception:
            pass
            
    store_name = store.get("name", "Kirana Store") if store else user.get("store_name", "Kirana Store")
    
    access_token = create_access_token(subject=user_id)
    
    user_res = UserResponse(
        id=user_id,
        email=user["email"],
        full_name=user["full_name"],
        role=user.get("role", "Owner"),
        store_id=store_id,
        store_name=store_name,
        phone=user.get("phone"),
        created_at=user.get("created_at", str(datetime.utcnow()))
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_res)

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: UserResponse = Depends(get_current_user)):
    return current_user
