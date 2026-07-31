from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field

# Health Schema
class HealthCheck(BaseModel):
    status: str
    version: str
    database_status: str
    database_type: str
    timestamp: str

# Store Schemas
class StoreBase(BaseModel):
    name: str
    address: Optional[str] = None
    gst_number: Optional[str] = None
    contact_number: Optional[str] = None

class StoreCreate(StoreBase):
    pass

class StoreUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    gst_number: Optional[str] = None
    contact_number: Optional[str] = None

class StoreResponse(StoreBase):
    id: str
    created_at: str

# Auth / User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class RegisterOwner(BaseModel):
    user: UserCreate
    store: StoreCreate

class EmployeeCreate(UserCreate):
    role: str = Field(..., description="Role must be Manager or Staff")

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: str
    role: str
    store_id: str
    store_name: Optional[str] = None  # Kept for frontend compatibility
    created_at: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenPayload(BaseModel):
    sub: Optional[str] = None

# Product Schemas
class ProductBase(BaseModel):
    name: str
    category: str
    sku: str
    barcode: Optional[str] = None
    qrcode: Optional[str] = None
    batch_number: Optional[str] = None
    mfg_date: Optional[str] = None
    expiry_date: Optional[str] = None
    supplier_name: Optional[str] = None
    supplier_contact: Optional[str] = None
    purchase_price: float = Field(default=0.0, ge=0.0)
    selling_price: float = Field(default=0.0, ge=0.0)
    quantity: int = Field(default=0, ge=0)
    min_stock: int = Field(default=5, ge=0)
    unit: str = "Pcs"
    shelf_location: Optional[str] = "Shelf A"
    image_url: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    sku: Optional[str] = None
    barcode: Optional[str] = None
    qrcode: Optional[str] = None
    batch_number: Optional[str] = None
    mfg_date: Optional[str] = None
    expiry_date: Optional[str] = None
    supplier_name: Optional[str] = None
    supplier_contact: Optional[str] = None
    purchase_price: Optional[float] = None
    selling_price: Optional[float] = None
    quantity: Optional[int] = None
    min_stock: Optional[int] = None
    unit: Optional[str] = None
    shelf_location: Optional[str] = None
    image_url: Optional[str] = None

class ProductResponse(ProductBase):
    id: str
    store_id: str
    status: str
    created_at: str

# Sales Schemas
class SaleItem(BaseModel):
    product_id: str
    name: str
    quantity: int
    price: float
    discount: float = 0.0
    gst: float = 0.0
    subtotal: float

class SaleCreate(BaseModel):
    amount: float = Field(..., gt=0.0)
    items_count: int = Field(default=1, gt=0)
    payment_method: str = "Cash"
    items: List[SaleItem] = []

class SaleResponse(BaseModel):
    id: str
    store_id: str
    amount: float
    items_count: int
    payment_method: str
    items: List[SaleItem] = []
    created_at: str
    
# Shelf Monitoring Schemas
class ShelfItemAnalysis(BaseModel):
    name: str
    status: str = Field(..., description="Status such as: missing, damaged, misplaced, expired, okay")
    notes: Optional[str] = None

class ShelfScanResponse(BaseModel):
    id: str
    store_id: str
    health_score: int
    missing_products: List[ShelfItemAnalysis] = []
    low_stock: List[ShelfItemAnalysis] = []
    expired_products: List[ShelfItemAnalysis] = []
    damaged_items: List[ShelfItemAnalysis] = []
    misplaced_items: List[ShelfItemAnalysis] = []
    empty_shelves_detected: bool = False
    created_at: str

# OCR Schemas
class OCRExtractResponse(BaseModel):
    id: str
    store_id: str
    product_name: Optional[str] = None
    batch_number: Optional[str] = None
    mrp: Optional[float] = None
    mfg_date: Optional[str] = None
    expiry_date: Optional[str] = None
    days_remaining: Optional[int] = None
    category: str = Field(..., description="Safe, Near Expiry, or Expired")
    created_at: str

# Notification Schemas
class NotificationBase(BaseModel):
    title: str
    message: str
    type: str = Field(..., description="ALERT, SUMMARY, INFO")
    severity: str = Field(..., description="INFO, WARNING, CRITICAL")
    is_read: bool = False

class NotificationCreate(NotificationBase):
    pass

class NotificationResponse(NotificationBase):
    id: str
    store_id: str
    created_at: str
