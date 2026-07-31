import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import db_manager
from app.api.v1.router import api_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("kiranapulse.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing KiranaPulse Backend Engine...")
    await db_manager.connect_to_database()
    yield
    logger.info("Shutting down KiranaPulse Backend Engine...")
    await db_manager.close_database_connection()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Set up CORS middleware
origins = settings.ALLOW_CORS_ORIGINS
if isinstance(origins, str):
    origins = [origins]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if "*" not in origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "message": "Welcome to KiranaPulse – AI Smart Inventory & Shelf Monitoring System API",
        "health_check": f"{settings.API_V1_STR}/health",
        "docs": "/docs"
    }
