from __future__ import annotations

import re
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, ConfigDict, validator
from pydantic.networks import EmailStr

from app.config import Config, ENVIRONMENT

# DATABASE MODELS (Pydantic Models for Validation)
# ============================================================================

class UserBase(BaseModel):
    """Base User model"""
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50, pattern="^[a-zA-Z0-9_]+$")
    
    @validator('name')
    def validate_name(cls, v):
        v = v.strip()
        if not v:
            raise ValueError('Name cannot be empty')
        return v
    
    @validator('username')
    def validate_username(cls, v):
        v = v.lower().strip()
        if not v:
            raise ValueError('Username cannot be empty')
        return v
    
    model_config = ConfigDict(from_attributes=True)

class UserCreate(UserBase):
    """User registration model"""
    password: str = Field(..., min_length=8, max_length=100)
    confirm_password: Optional[str] = None
    access_code: Optional[str] = None
    
    @validator('password')
    def validate_password(cls, v):
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain at least one number')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character')
        return v
    
    @validator('confirm_password')
    def passwords_match(cls, v, values, **kwargs):
        if 'password' in values and v != values['password']:
            raise ValueError('Passwords do not match')
        return v

class UserLogin(BaseModel):
    """User login model"""
    identifier: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=8, max_length=100)

class UserResponse(BaseModel):
    """User response model"""
    id: str
    name: str
    email: EmailStr
    username: str
    clearance_level: int
    balance: Decimal
    is_active: bool
    is_verified: bool
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True, json_encoders={
        Decimal: str,
        datetime: lambda v: v.isoformat()
    })

class UserProfileUpdate(BaseModel):
    """User profile update model"""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    
    @validator('name')
    def validate_name(cls, v):
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError('Name cannot be empty')
        return v

class UserPasswordChange(BaseModel):
    """User password change model"""
    current_password: str = Field(..., min_length=8, max_length=100)
    new_password: str = Field(..., min_length=8, max_length=100)
    confirm_password: str = Field(..., min_length=8, max_length=100)
    
    @validator('new_password')
    def validate_password(cls, v):
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain at least one number')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character')
        return v
    
    @validator('confirm_password')
    def passwords_match(cls, v, values, **kwargs):
        if 'new_password' in values and v != values['new_password']:
            raise ValueError('Passwords do not match')
        return v

# ============================================================================
# PRODUCT MODELS
# ============================================================================

class ProductBase(BaseModel):
    """Base Product model"""
    name: str = Field(..., min_length=2, max_length=255)
    category: str = Field(..., pattern="^[a-z_]+$")
    price: Decimal = Field(..., ge=0, decimal_places=2)
    description: str = Field(default="", max_length=5000)
    stock: int = Field(default=0, ge=0)
    status: str = Field(default="draft", pattern="^[a-z_]+$")
    requires_clearance: bool = False
    fabrication_progress: int = Field(default=0, ge=0, le=100)
    image_url: Optional[str] = Field(None, max_length=500)
    image_gallery: Optional[List[str]] = None
    features: Optional[List[str]] = None
    specifications: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    detailed_description: Optional[str] = Field(None, max_length=10000)
    is_featured: bool = False
    weight_kg: Optional[Decimal] = Field(None, ge=0, decimal_places=3)
    sort_order: int = Field(default=999, ge=0)
    
    @validator('category')
    def validate_category(cls, v):
        if v not in Config.PRODUCT_CATEGORIES:
            raise ValueError(f"Category must be one of: {', '.join(Config.PRODUCT_CATEGORIES)}")
        return v
    
    @validator('status')
    def validate_status(cls, v):
        valid_statuses = ['draft', 'in_stock', 'limited', 'fabricating', 'preorder', 'out_of_stock', 'discontinued', 'restricted']
        if v not in valid_statuses:
            raise ValueError(f"Status must be one of: {', '.join(valid_statuses)}")
        return v
    
    model_config = ConfigDict(from_attributes=True)

class ProductCreate(ProductBase):
    """Product creation model"""
    id: Optional[str] = Field(None, max_length=50, pattern="^[A-Z0-9_-]+$")
    
    @validator('id')
    def validate_id(cls, v):
        if v is not None:
            v = v.strip().upper()
            if not v:
                raise ValueError('Product ID cannot be empty')
        return v

class ProductUpdate(BaseModel):
    """Product update model"""
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    category: Optional[str] = Field(None, pattern="^[a-z_]+$")
    price: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    description: Optional[str] = Field(None, max_length=5000)
    stock: Optional[int] = Field(None, ge=0)
    status: Optional[str] = Field(None, pattern="^[a-z_]+$")
    requires_clearance: Optional[bool] = None
    fabrication_progress: Optional[int] = Field(None, ge=0, le=100)
    image_url: Optional[str] = Field(None, max_length=500)
    image_gallery: Optional[List[str]] = None
    features: Optional[List[str]] = None
    specifications: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    detailed_description: Optional[str] = Field(None, max_length=10000)
    is_featured: Optional[bool] = None
    weight_kg: Optional[Decimal] = Field(None, ge=0, decimal_places=3)
    sort_order: Optional[int] = Field(None, ge=0)
    
    @validator('category')
    def validate_category(cls, v):
        if v is not None and v not in Config.PRODUCT_CATEGORIES:
            raise ValueError(f"Category must be one of: {', '.join(Config.PRODUCT_CATEGORIES)}")
        return v
    
    @validator('status')
    def validate_status(cls, v):
        if v is not None:
            valid_statuses = ['draft', 'in_stock', 'limited', 'fabricating', 'preorder', 'out_of_stock', 'discontinued', 'restricted']
            if v not in valid_statuses:
                raise ValueError(f"Status must be one of: {', '.join(valid_statuses)}")
        return v

class ProductResponse(ProductBase):
    """Product response model"""
    id: str
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True, json_encoders={
        Decimal: str,
        datetime: lambda v: v.isoformat()
    })

# ============================================================================
# CART MODELS
# ============================================================================

class CartItemAdd(BaseModel):
    """Add item to cart model"""
    product_id: str = Field(..., min_length=1, max_length=50)
    quantity: int = Field(default=1, ge=1, le=Config.MAX_ORDER_QUANTITY)

class CartItemUpdate(BaseModel):
    """Update cart item model"""
    quantity: int = Field(..., ge=1, le=Config.MAX_ORDER_QUANTITY)

class CartItemResponse(BaseModel):
    """Cart item response model"""
    product_id: str
    name: str
    price: Decimal
    quantity: int
    total: Decimal
    image_url: Optional[str] = None
    description: Optional[str] = None
    stock: int
    
    model_config = ConfigDict(json_encoders={Decimal: str})

# ============================================================================
# ORDER MODELS
# ============================================================================

class OrderCreate(BaseModel):
    """Order creation model"""
    shipping_address: str = Field(..., min_length=10, max_length=1000)
    billing_address: Optional[str] = Field(None, min_length=10, max_length=1000)
    contact_number: str = Field(..., min_length=8, max_length=20)
    email: Optional[EmailStr] = None
    payment_method: str = Field(..., pattern="^[a-z_]+$")
    notes: Optional[str] = Field(None, max_length=1000)
    discount_code: Optional[str] = Field(None, min_length=3, max_length=50)
    
    @validator('payment_method')
    def validate_payment_method(cls, v):
        if v not in Config.PAYMENT_METHODS:
            raise ValueError(f"Payment method must be one of: {', '.join(Config.PAYMENT_METHODS)}")
        return v
    
    @validator('contact_number')
    def validate_contact_number(cls, v):
        v = re.sub(r'[\s\-\(\)]', '', v)
        if not v.isdigit():
            raise ValueError('Contact number must contain only digits')
        return v

class OrderUpdate(BaseModel):
    """Order update model"""
    status: Optional[str] = Field(None, pattern="^[a-z_]+$")
    tracking_number: Optional[str] = Field(None, min_length=5, max_length=100)
    payment_status: Optional[str] = Field(None, pattern="^(pending|paid|failed|refunded)$")
    payment_id: Optional[str] = Field(None, min_length=5, max_length=255)
    estimated_delivery: Optional[datetime] = None
    notes: Optional[str] = Field(None, max_length=1000)
    
    @validator('status')
    def validate_status(cls, v):
        if v is not None and v not in Config.ORDER_STATUSES:
            raise ValueError(f"Status must be one of: {', '.join(Config.ORDER_STATUSES)}")
        return v

class OrderItemResponse(BaseModel):
    """Order item response model"""
    product_id: str
    product_name: str
    product_price: Decimal
    quantity: int
    total: Decimal
    specifications: Optional[Dict[str, Any]] = None
    
    model_config = ConfigDict(json_encoders={Decimal: str})

class OrderResponse(BaseModel):
    """Order response model"""
    id: int
    order_number: str
    user_id: str
    status: str
    total: Decimal
    subtotal: Decimal
    tax: Decimal
    shipping: Decimal
    discount: Decimal
    shipping_address: str
    billing_address: Optional[str]
    contact_number: str
    email: Optional[str]
    payment_method: str
    payment_status: str
    payment_id: Optional[str]
    notes: Optional[str]
    tracking_number: Optional[str]
    estimated_delivery: Optional[datetime]
    actual_delivery: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse]
    
    model_config = ConfigDict(from_attributes=True, json_encoders={
        Decimal: str,
        datetime: lambda v: v.isoformat()
    })

# ============================================================================
# ADMIN MODELS
# ============================================================================

class AdminStatsResponse(BaseModel):
    """Admin statistics response model"""
    total_users: int
    active_users: int
    total_products: int
    total_orders: int
    revenue_today: Decimal
    revenue_week: Decimal
    revenue_month: Decimal
    pending_orders: int
    low_stock_products: int
    fabrication_queue: int
    
    model_config = ConfigDict(json_encoders={Decimal: str})


class WebpageControlUpdate(BaseModel):
    """Runtime webpage control settings"""

    enabled: Optional[bool] = None
    maintenance_message: Optional[str] = Field(None, max_length=500)


class StoreControlUpdate(BaseModel):
    """Runtime store control settings"""

    enabled: Optional[bool] = None
    allow_checkout: Optional[bool] = None
    allow_custom_requests: Optional[bool] = None
    maintenance_message: Optional[str] = Field(None, max_length=500)


class AdminControlUpdate(BaseModel):
    """Runtime control update payload"""

    webpage: Optional[WebpageControlUpdate] = None
    store: Optional[StoreControlUpdate] = None


class AdminCreateRequest(BaseModel):
    """Create a new admin account (super admin only)."""

    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50, pattern="^[a-zA-Z0-9_]+$")
    password: str = Field(..., min_length=8, max_length=100)
    clearance_level: int = Field(
        default=Config.ADMIN_CLEARANCE_LEVEL,
        ge=Config.ADMIN_CLEARANCE_LEVEL,
        le=Config.SUPER_ADMIN_CLEARANCE_LEVEL,
    )

    @validator("name")
    def validate_name(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("Name cannot be empty")
        return v

    @validator("username")
    def validate_username(cls, v):
        v = v.lower().strip()
        if not v:
            raise ValueError("Username cannot be empty")
        return v

    @validator("password")
    def validate_password(cls, v):
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one number")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError("Password must contain at least one special character")
        return v


class AdminUpdateRequest(BaseModel):
    """Update an admin account (super admin only)."""

    clearance_level: Optional[int] = Field(
        None,
        ge=Config.ADMIN_CLEARANCE_LEVEL,
        le=Config.SUPER_ADMIN_CLEARANCE_LEVEL,
    )
    is_active: Optional[bool] = None

# ============================================================================
# TOKEN MODELS
# ============================================================================

class TokenResponse(BaseModel):
    """Token response model"""
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: int

class TokenData(BaseModel):
    """Token data model"""
    user_id: str
    username: str
    clearance_level: int
    exp: datetime

# ============================================================================
