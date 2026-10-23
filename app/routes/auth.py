from __future__ import annotations

import asyncio
from datetime import datetime
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status

from app.config import Config, logger
from app.database import DatabaseManager
from app.dependencies import (
    get_auth_service,
    get_current_active_user,
    get_current_user,
    get_db,
    get_email_service,
    get_user_service,
)
from app.rate_limit import limiter
from app.schemas import TokenResponse, UserCreate, UserLogin, UserPasswordChange, UserProfileUpdate
from app.services.auth import AuthService
from app.services.email import EmailService
from app.services.logging_service import log_action
from app.services.user import UserService

router = APIRouter(tags=["Authentication"])

# AUTHENTICATION ENDPOINTS
# ============================================================================


def db_is_ready(db: DatabaseManager) -> bool:
    try:
        return db.check_connection()
    except Exception:
        return False


def dev_user_dict() -> Dict[str, Any]:
    return {
        "id": Config.DEV_AUTH_USER_ID,
        "name": "Developer Mode",
        "email": Config.DEV_AUTH_EMAIL,
        "username": Config.DEV_AUTH_USERNAME,
        "clearance_level": Config.DEV_AUTH_CLEARANCE,
        "balance": 1500.00,
        "is_active": True,
        "is_verified": True,
        "last_login": datetime.now(),
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
    }

@router.post(
    "/api/auth/register",
    response_model=Dict[str, Any],
    tags=["Authentication"],
    summary="Register new user",
    response_description="User registration confirmation"
)
@limiter.limit(Config.RATE_LIMIT_AUTH if Config.ENABLE_RATE_LIMITING else "1000/minute")
async def register(
    request: Request,
    user_data: UserCreate,
    db: DatabaseManager = Depends(get_db),
    user_service: UserService = Depends(get_user_service),
    auth_service: AuthService = Depends(get_auth_service),
    email_service: EmailService = Depends(get_email_service)
):
    """Register a new user account"""
    try:
        if not db_is_ready(db):
            detail = "Database unavailable; registration requires MySQL"
            if Config.DEV_AUTH_ENABLED and not db.check_connection():
                diagnostics = db.get_connection_diagnostics()
                error = diagnostics.get("error")
                if error:
                    detail = f"{detail}. {error}"
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=detail
            )
        # Create user
        user = user_service.create_user(db, user_data)
        
        # Create access token
        access_token, expires_at = auth_service.create_access_token(
            user['id'],
            user['username'],
            user['clearance_level']
        )
        
        # Store token in database
        db.execute_query(
            """
            INSERT INTO tokens (user_id, token, token_type, expires_at)
            VALUES (%s, %s, 'access', %s)
            """,
            (user['id'], access_token, expires_at),
            commit=True
        )
        
        # Send welcome email (async)
        if Config.ENABLE_EMAIL:
            asyncio.create_task(
                email_service.send_welcome_email(user['email'], user['username'])
            )
        
        # Log registration
        log_action(
            db,
            "info",
            "auth",
            "register",
            user['id'],
            {
                "email": user['email'],
                "username": user['username'],
                "clearance_level": user['clearance_level']
            },
            request.client.host,
            request.headers.get("user-agent")
        )
        
        return {
            "success": True,
            "message": "Registration successful",
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user['id'],
                "name": user['name'],
                "email": user['email'],
                "username": user['username'],
                "clearance_level": user['clearance_level'],
                "balance": float(user['balance'])
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )

@router.post(
    "/api/auth/login",
    response_model=Dict[str, Any],
    tags=["Authentication"],
    summary="Login user",
    response_description="Access token and user information"
)
@limiter.limit(Config.RATE_LIMIT_AUTH if Config.ENABLE_RATE_LIMITING else "1000/minute")
async def login(
    request: Request,
    login_data: UserLogin,
    db: DatabaseManager = Depends(get_db),
    user_service: UserService = Depends(get_user_service),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Login with email/username and password"""
    try:
        db_ready = db_is_ready(db)

        if not db_ready and Config.DEV_AUTH_ENABLED:
            if login_data.identifier in (Config.DEV_AUTH_USERNAME, Config.DEV_AUTH_EMAIL) and login_data.password == Config.DEV_AUTH_PASSWORD:
                user = dev_user_dict()
                access_token, expires_at = auth_service.create_access_token(
                    user['id'],
                    user['username'],
                    user['clearance_level']
                )
                
                return {
                    "success": True,
                    "message": "Login successful (dev fallback; MySQL unavailable)",
                    "access_token": access_token,
                    "token_type": "bearer",
                    "expires_in": Config.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                    "user": {
                        "id": user['id'],
                        "name": user['name'],
                        "email": user['email'],
                        "username": user['username'],
                        "clearance_level": user['clearance_level'],
                        "balance": float(user['balance'])
                    }
                }
            else:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Database unavailable and dev fallback credentials did not match"
                )

        # Get user
        user = user_service.get_user_by_identifier(db, login_data.identifier)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        # Get full user with password hash
        user_full = db.execute_query(
            "SELECT * FROM users WHERE id = %s",
            (user['id'],),
            fetch_one=True
        )
        
        # Verify password
        if not Config.verify_password(login_data.password, user_full['password_hash']):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        if not user['is_active']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive"
            )
        
        # Create access token
        access_token, expires_at = auth_service.create_access_token(
            user['id'],
            user['username'],
            user['clearance_level']
        )
        
        # Store token in database (replace old token)
        db.execute_query(
            """
            INSERT INTO tokens (user_id, token, token_type, expires_at)
            VALUES (%s, %s, 'access', %s)
            ON DUPLICATE KEY UPDATE
                token = VALUES(token),
                expires_at = VALUES(expires_at)
            """,
            (user['id'], access_token, expires_at),
            commit=True
        )
        
        # Update last login
        db.execute_query(
            "UPDATE users SET last_login = %s WHERE id = %s",
            (datetime.now(), user['id']),
            commit=True
        )
        
        # Log login
        log_action(
            db,
            "info",
            "auth",
            "login",
            user['id'],
            {"identifier": login_data.identifier},
            request.client.host,
            request.headers.get("user-agent")
        )
        
        return {
            "success": True,
            "message": "Login successful",
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": Config.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "user": {
                "id": user['id'],
                "name": user['name'],
                "email": user['email'],
                "username": user['username'],
                "clearance_level": user['clearance_level'],
                "balance": float(user['balance'])
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        if Config.DEV_AUTH_ENABLED and not db_is_ready(db):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database unavailable; enable dev fallback with DEV_AUTH_* env vars"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )

@router.post(
    "/api/auth/logout",
    response_model=Dict[str, Any],
    tags=["Authentication"],
    summary="Logout user"
)
async def logout(
    request: Request,
    authorization: Optional[str] = Header(None),
    db: DatabaseManager = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Logout current user"""
    try:
        if Config.DEV_AUTH_ENABLED and current_user.get("id") == Config.DEV_AUTH_USER_ID and not db_is_ready(db):
            return {
                "success": True,
                "message": "Logged out (dev fallback)"
            }
        # Extract token
        token = None
        if authorization and authorization.startswith("Bearer "):
            token = authorization.replace("Bearer ", "")
        
        if token:
            # Delete token from database
            db.execute_query(
                "DELETE FROM tokens WHERE token = %s",
                (token,),
                commit=True
            )
        
        # Log logout
        log_action(
            db,
            "info",
            "auth",
            "logout",
            current_user['id'],
            None,
            request.client.host,
            request.headers.get("user-agent")
        )
        
        return {
            "success": True,
            "message": "Logged out successfully"
        }
        
    except Exception as e:
        logger.error(f"Logout error: {e}")
        return {
            "success": False,
            "message": "Logout failed"
        }

@router.get(
    "/api/auth/profile",
    response_model=Dict[str, Any],
    tags=["Authentication"],
    summary="Get user profile"
)
async def get_profile(
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """Get current user's profile"""
    return {
        "success": True,
        "user": {
            "id": current_user['id'],
            "name": current_user['name'],
            "email": current_user['email'],
            "username": current_user['username'],
            "clearance_level": current_user['clearance_level'],
            "balance": float(current_user['balance']),
            "is_active": current_user['is_active'],
            "is_verified": current_user['is_verified'],
            "last_login": current_user['last_login'].isoformat() if current_user['last_login'] else None,
            "created_at": current_user['created_at'].isoformat() if current_user['created_at'] else None,
            "updated_at": current_user['updated_at'].isoformat() if current_user['updated_at'] else None
        }
    }

@router.put(
    "/api/auth/profile",
    response_model=Dict[str, Any],
    tags=["Authentication"],
    summary="Update user profile"
)
async def update_profile(
    profile_data: UserProfileUpdate,
    db: DatabaseManager = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_active_user),
    user_service: UserService = Depends(get_user_service)
):
    """Update current user's profile"""
    try:
        # Update user
        update_data = profile_data.dict(exclude_unset=True)
        
        if update_data:
            user_service.update_user(db, current_user['id'], update_data)
        
        # Get updated user
        updated_user = user_service.get_user_by_id(db, current_user['id'])
        
        return {
            "success": True,
            "message": "Profile updated successfully",
            "user": {
                "id": updated_user['id'],
                "name": updated_user['name'],
                "email": updated_user['email'],
                "username": updated_user['username'],
                "clearance_level": updated_user['clearance_level'],
                "balance": float(updated_user['balance'])
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Profile update error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Profile update failed"
        )

@router.post(
    "/api/auth/change-password",
    response_model=Dict[str, Any],
    tags=["Authentication"],
    summary="Change password"
)
async def change_password(
    password_data: UserPasswordChange,
    db: DatabaseManager = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_active_user),
    user_service: UserService = Depends(get_user_service)
):
    """Change current user's password"""
    try:
        # Change password
        user_service.change_password(
            db,
            current_user['id'],
            password_data.current_password,
            password_data.new_password
        )
        
        # Delete all tokens for this user
        db.execute_query(
            "DELETE FROM tokens WHERE user_id = %s",
            (current_user['id'],),
            commit=True
        )
        
        return {
            "success": True,
            "message": "Password changed successfully. Please login again."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Password change error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password change failed"
        )

# ============================================================================
