from fastapi import APIRouter
from app.api.v1.endpoints import health, auth, store, sales, products, shelf, ocr, notifications, analytics, chat

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(store.router, prefix="/store", tags=["Store Profile"])
api_router.include_router(products.router, prefix="/products", tags=["Product Management"])
api_router.include_router(sales.router, prefix="/sales", tags=["Sales Tracking"])
api_router.include_router(shelf.router, prefix="/shelf", tags=["Shelf Monitoring"])
api_router.include_router(ocr.router, prefix="/ocr", tags=["OCR Extraction"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(chat.router, prefix="/chat", tags=["AI Chat"])
