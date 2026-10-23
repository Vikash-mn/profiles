from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Tuple
from uuid import uuid4

import jwt

from app.config import Config, logger

# AUTHENTICATION SERVICE
# ============================================================================

class AuthService:
    """Authentication service for JWT tokens"""
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
    
    def create_access_token(self, user_id: str, username: str, clearance_level: int) -> Tuple[str, datetime]:
        """Create a JWT access token"""
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=Config.ACCESS_TOKEN_EXPIRE_MINUTES)
        
        payload = {
            "sub": user_id,
            "username": username,
            "clearance_level": clearance_level,
            "type": "access",
            "exp": expires_at,
            "iat": datetime.now(timezone.utc),
            "iss": Config.APP_NAME,
            "jti": str(uuid4())
        }
        
        token = jwt.encode(
            payload,
            Config.SECRET_KEY,
            algorithm=Config.JWT_ALGORITHM
        )
        
        return token, expires_at
    
    def create_refresh_token(self, user_id: str) -> Tuple[str, datetime]:
        """Create a refresh token"""
        expires_at = datetime.now(timezone.utc) + timedelta(days=Config.REFRESH_TOKEN_EXPIRE_DAYS)
        
        payload = {
            "sub": user_id,
            "type": "refresh",
            "exp": expires_at,
            "iat": datetime.now(timezone.utc),
            "iss": Config.APP_NAME,
            "jti": str(uuid4())
        }
        
        token = jwt.encode(
            payload,
            Config.SECRET_KEY,
            algorithm=Config.JWT_ALGORITHM
        )
        
        return token, expires_at
    
    def create_reset_token(self, user_id: str) -> Tuple[str, datetime]:
        """Create a password reset token"""
        expires_at = datetime.now(timezone.utc) + timedelta(hours=Config.RESET_TOKEN_EXPIRE_HOURS)
        
        payload = {
            "sub": user_id,
            "type": "reset",
            "exp": expires_at,
            "iat": datetime.now(timezone.utc),
            "iss": Config.APP_NAME,
            "jti": str(uuid4())
        }
        
        token = jwt.encode(
            payload,
            Config.SECRET_KEY,
            algorithm=Config.JWT_ALGORITHM
        )
        
        return token, expires_at
    
    def verify_token(self, token: str, token_type: str = "access") -> Optional[Dict[str, Any]]:
        """Verify a JWT token"""
        try:
            payload = jwt.decode(
                token,
                Config.SECRET_KEY,
                algorithms=[Config.JWT_ALGORITHM]
            )
            
            if payload.get("type") != token_type:
                logger.warning(f"Token type mismatch: expected {token_type}, got {payload.get('type')}")
                return None
            
            return payload
            
        except jwt.ExpiredSignatureError:
            logger.debug("Token has expired")
            return None
        except jwt.InvalidTokenError as e:
            logger.debug(f"Invalid token: {e}")
            return None
        except Exception as e:
            logger.error(f"Token verification error: {e}")
            return None

# ============================================================================
