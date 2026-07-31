from datetime import datetime
from fastapi import APIRouter
from app.core.config import settings
from app.core.database import db_manager
from app.models.schemas import HealthCheck

router = APIRouter()

@router.get("/health", response_model=HealthCheck)
async def check_health():
    db_type = "Mock Storage (Dev Mode)" if db_manager.is_mock else "MongoDB (Live)"
    db_status = "Healthy"
    
    return HealthCheck(
        status="online",
        version=settings.VERSION,
        database_status=db_status,
        database_type=db_type,
        timestamp=datetime.utcnow().isoformat()
    )
