from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import Depends, Header, HTTPException, status

from app.config import Config
from app.database import DatabaseManager
from app.services.auth import AuthService
from app.services.cart import CartService
from app.services.email import EmailService
from app.services.order import OrderService
from app.services.product import ProductService
from app.services.user import UserService

# DEPENDENCY INJECTION
# ============================================================================

async def get_db() -> DatabaseManager:
    """Dependency to get database manager"""
    return DatabaseManager()

async def get_auth_service() -> AuthService:
    """Dependency to get auth service"""
    return AuthService()

async def get_user_service() -> UserService:
    """Dependency to get user service"""
    return UserService()

async def get_product_service() -> ProductService:
    """Dependency to get product service"""
    return ProductService()

async def get_cart_service() -> CartService:
    """Dependency to get cart service"""
    return CartService()

async def get_order_service() -> OrderService:
    """Dependency to get order service"""
    return OrderService()

async def get_email_service() -> EmailService:
    """Dependency to get email service"""
    return EmailService()

# ============================================================================
# AUTHENTICATION DEPENDENCIES
# ============================================================================

async def get_current_user(
    authorization: Optional[str] = Header(None, description="JWT token"),
    x_token: Optional[str] = Header(None, description="Alternative token"),
    db: DatabaseManager = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service),
    user_service: UserService = Depends(get_user_service)
) -> Dict[str, Any]:
    """Get current user from token"""
    # Extract token
    token = None
    
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "")
    elif x_token:
        token = x_token
    elif authorization:
        token = authorization
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Verify JWT token
    payload = auth_service.verify_token(token, "access")
    
    if not payload:
        # Check if token is stored in database
        try:
            token_record = db.execute_query(
                """
                SELECT t.*, u.*
                FROM tokens t
                JOIN users u ON t.user_id = u.id
                WHERE t.token = %s AND t.token_type = 'access' AND t.expires_at > NOW()
                """,
                (token,),
                fetch_one=True
            )
        except Exception:
            token_record = None
        
        if token_record:
            user_id = token_record['user_id']
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"}
            )
    else:
        user_id = payload.get("sub")
    
    # Dev fallback: allow token-only auth without DB when using dev auth user
    if Config.DEV_AUTH_ENABLED and user_id == Config.DEV_AUTH_USER_ID:
        return {
            "id": Config.DEV_AUTH_USER_ID,
            "name": "Developer Mode",
            "email": Config.DEV_AUTH_EMAIL,
            "username": Config.DEV_AUTH_USERNAME,
            "clearance_level": Config.DEV_AUTH_CLEARANCE,
            "balance": 1500.00,
            "is_active": True,
            "is_verified": True,
            "last_login": None,
            "created_at": None,
            "updated_at": None
        }
    
    # Get user from database
    user = user_service.get_user_by_id(db, user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    if not user['is_active']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )
    
    return user

async def get_optional_user(
    authorization: Optional[str] = Header(None, description="JWT token"),
    x_token: Optional[str] = Header(None, description="Alternative token"),
    db: DatabaseManager = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service),
    user_service: UserService = Depends(get_user_service)
) -> Optional[Dict[str, Any]]:
    """
    Best-effort user resolution.
    Returns None when the token is missing/invalid instead of raising 401.
    """
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "")
    elif x_token:
        token = x_token
    elif authorization:
        token = authorization

    if not token:
        return None

    user_id = None
    payload = auth_service.verify_token(token, "access")
    if payload:
        user_id = payload.get("sub")
    else:
        try:
            token_record = db.execute_query(
                """
                SELECT t.user_id
                FROM tokens t
                WHERE t.token = %s AND t.token_type = 'access' AND t.expires_at > NOW()
                """,
                (token,),
                fetch_one=True
            )
            if token_record:
                user_id = token_record.get("user_id")
        except Exception:
            return None

    if not user_id:
        return None

    if Config.DEV_AUTH_ENABLED and user_id == Config.DEV_AUTH_USER_ID:
        return {
            "id": Config.DEV_AUTH_USER_ID,
            "name": "Developer Mode",
            "email": Config.DEV_AUTH_EMAIL,
            "username": Config.DEV_AUTH_USERNAME,
            "clearance_level": Config.DEV_AUTH_CLEARANCE,
            "balance": 1500.00,
            "is_active": True,
            "is_verified": True,
            "last_login": None,
            "created_at": None,
            "updated_at": None
        }

    user = user_service.get_user_by_id(db, user_id)
    if not user or not user.get("is_active", False):
        return None
    return user

async def get_current_active_user(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get current active user"""
    if not current_user['is_active']:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

async def get_current_admin_user(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get current admin user"""
    if current_user['clearance_level'] < Config.ADMIN_CLEARANCE_LEVEL:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

async def get_current_super_admin_user(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get current super admin user"""
    if current_user['clearance_level'] < Config.SUPER_ADMIN_CLEARANCE_LEVEL:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    return current_user

# ============================================================================
