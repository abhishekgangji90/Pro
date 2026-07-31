from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from datetime import datetime
from app.core.database import get_database
from app.models.schemas import UserResponse
from app.api.v1.endpoints.auth import get_current_user
from app.services.ai_assistant import process_chat_message

router = APIRouter()

class ChatMessage(BaseModel):
    message: str

@router.get("/history", response_model=List[dict])
async def get_chat_history(current_user: UserResponse = Depends(get_current_user)):
    db = get_database()
    col = db["chat_sessions"]
    
    # We use a single session per store for simplicity in this MVP
    session = await col.find_one({"store_id": current_user.store_id})
    if not session:
        return []
        
    return session.get("messages", [])

@router.post("/message", response_model=dict)
async def send_chat_message(
    payload: ChatMessage,
    current_user: UserResponse = Depends(get_current_user)
):
    db = get_database()
    col = db["chat_sessions"]
    
    # Fetch existing session or create new
    session = await col.find_one({"store_id": current_user.store_id})
    
    if not session:
        session = {
            "store_id": current_user.store_id,
            "messages": [],
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        await col.insert_one(session)
        
    history = session.get("messages", [])
    
    # Append user message
    user_msg = {
        "id": str(datetime.utcnow().timestamp()),
        "role": "user",
        "content": payload.message,
        "timestamp": datetime.utcnow().isoformat()
    }
    history.append(user_msg)
    
    # Process with AI
    ai_response_text = await process_chat_message(current_user.store_id, payload.message, history[:-1])
    
    # Append AI message
    ai_msg = {
        "id": str(datetime.utcnow().timestamp() + 1),
        "role": "ai",
        "content": ai_response_text,
        "timestamp": datetime.utcnow().isoformat()
    }
    history.append(ai_msg)
    
    # Update DB
    await col.update_one(
        {"store_id": current_user.store_id},
        {"$set": {"messages": history, "updated_at": datetime.utcnow().isoformat()}}
    )
    
    return ai_msg
