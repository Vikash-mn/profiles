#!/usr/bin/env python3
"""
VIKASH HARDWARE STORE - COMPLETE PRODUCTION SERVER
MySQL Database Backend with Full Admin API
Copyright (c) 2024 Vikash Hardware Store
"""

from __future__ import annotations

import os
import sys
import json
import re
import time
import secrets
import hashlib
import logging
import asyncio
import uuid
import hmac
import base64
import socket
import platform
import argparse
import threading
import queue
import datetime
import decimal
import collections
import functools
import itertools
import operator
import inspect
import traceback
import warnings
import contextlib
import dataclasses
import enum
import typing
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Optional, List, Dict, Any, Union, Tuple, Callable, Generator, AsyncGenerator, Set, FrozenSet, Sequence, Mapping, Iterable, Iterator
try:
    from typing_extensions import TypedDict, Literal, Protocol, runtime_checkable
except ImportError:
    from typing import TypedDict, Literal, Protocol, runtime_checkable
from contextlib import contextmanager, asynccontextmanager
from datetime import datetime, timedelta, date, timezone
from decimal import Decimal
from uuid import UUID, uuid4
from functools import wraps, lru_cache, reduce
from collections import defaultdict, OrderedDict, deque, Counter
from collections.abc import MutableMapping
from dataclasses import dataclass, field, asdict
from enum import Enum, IntEnum, auto
from urllib.parse import urlparse, parse_qs, quote, unquote
from dotenv import load_dotenv

# Load environment variables from a local .env file if present
# (does nothing if variables are already set in the environment)
load_dotenv()

# ============================================================================
# EXTERNAL DEPENDENCIES - CHECK AND INSTALL
# ============================================================================

try:
    # Web Framework
    import uvicorn
    from uvicorn import Config, Server
    
    # FastAPI Core
    import fastapi
    from fastapi import FastAPI, HTTPException, Depends, Header, Body, Query, Path as ApiPath, Form, File, UploadFile, Request, Response, status
    from fastapi.responses import JSONResponse, HTMLResponse, RedirectResponse, PlainTextResponse, StreamingResponse, FileResponse
    from fastapi.middleware import Middleware
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.middleware.trustedhost import TrustedHostMiddleware
    from fastapi.middleware.gzip import GZipMiddleware
    from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
    from fastapi.exception_handlers import http_exception_handler, request_validation_exception_handler
    from fastapi.exceptions import RequestValidationError, HTTPException as FastAPIHTTPException
    from fastapi.concurrency import run_in_threadpool, iterate_in_threadpool
    from fastapi.encoders import jsonable_encoder
    from fastapi.openapi.utils import get_openapi
    from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html
    from fastapi.staticfiles import StaticFiles
    from fastapi.templating import Jinja2Templates
    from fastapi.websockets import WebSocket, WebSocketDisconnect, WebSocketState
    
    # Pydantic Validation
    import pydantic
    from pydantic import BaseModel, Field, validator, root_validator, create_model, ConfigDict
    from pydantic import ValidationError as PydanticValidationError
    from pydantic.networks import EmailStr, HttpUrl, IPvAnyAddress
    from pydantic.types import PositiveInt, NegativeInt, NonNegativeInt, NonPositiveInt, PositiveFloat, NegativeFloat, NonNegativeFloat, NonPositiveFloat, conint, confloat, condecimal, constr
    
    # Database - MySQL (optional for JSON-based storage)
    MYSQL_AVAILABLE = False
    try:
        import mysql.connector
        from mysql.connector import Error, MySQLConnection, pooling
        from mysql.connector.abstracts import MySQLConnectionAbstract, MySQLCursorAbstract
        from mysql.connector.cursor import MySQLCursor, MySQLCursorDict, MySQLCursorPrepared
        from mysql.connector.pooling import MySQLConnectionPool
        from mysql.connector.constants import ClientFlag, CharacterSet, SQLMode, FieldType
        from mysql.connector.dbapi import BINARY, DATETIME, NUMBER, ROWID, STRING
        from mysql.connector.errorcode import ER_ACCESS_DENIED_ERROR, ER_BAD_DB_ERROR, ER_DB_CREATE_EXISTS, ER_TABLE_EXISTS_ERROR
        MYSQL_AVAILABLE = True
    except ImportError:
        mysql = None
        Error = Exception
        MySQLConnection = None
        pooling = None
        MySQLConnectionAbstract = None
        MySQLCursorAbstract = None
        MySQLCursor = None
        MySQLCursorDict = None
        MySQLCursorPrepared = None
        MySQLConnectionPool = None
        ClientFlag = None
        CharacterSet = None
        SQLMode = None
        FieldType = None
        BINARY = None
        DATETIME = None
        NUMBER = None
        ROWID = None
        STRING = None
        ER_ACCESS_DENIED_ERROR = None
        ER_BAD_DB_ERROR = None
        ER_DB_CREATE_EXISTS = None
        ER_TABLE_EXISTS_ERROR = None
    
    # Security (optional)
    try:
        import bcrypt
        from passlib.context import CryptContext
        from passlib.hash import bcrypt as bcrypt_hash
        from passlib.exc import UnknownHashError
        BCRYPT_AVAILABLE = True
    except ImportError:
        bcrypt = None
        CryptContext = None
        bcrypt_hash = None
        UnknownHashError = Exception
        BCRYPT_AVAILABLE = False
    
    # JWT
    try:
        import jwt
        from jwt import PyJWTError, encode, decode
        from jwt.algorithms import get_default_algorithms
        JWT_AVAILABLE = True
    except ImportError:
        jwt = None
        PyJWTError = Exception
        encode = None
        decode = None
        get_default_algorithms = None
        JWT_AVAILABLE = False
    
    # Email (Optional)
    try:
        import aiosmtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        EMAIL_AVAILABLE = True
    except ImportError:
        EMAIL_AVAILABLE = False
    
    # Caching
    try:
        import aioredis
        from aioredis import Redis
        REDIS_AVAILABLE = False  # Set to True if Redis is configured
    except Exception:
        REDIS_AVAILABLE = False
    
    # Background Tasks
    try:
        from celery import Celery
        from celery.result import AsyncResult
        CELERY_AVAILABLE = False  # Set to True if Celery is configured
    except ImportError:
        CELERY_AVAILABLE = False
    
    # Monitoring
    try:
        import psutil
        PSUTIL_AVAILABLE = True
    except ImportError:
        PSUTIL_AVAILABLE = False
    
    # Image Processing (Optional)
    try:
        from PIL import Image
        from io import BytesIO
        PIL_AVAILABLE = True
    except ImportError:
        PIL_AVAILABLE = False
    
    # Rate Limiting
    try:
        import slowapi
        from slowapi import Limiter, _rate_limit_exceeded_handler
        from slowapi.util import get_remote_address
        from slowapi.errors import RateLimitExceeded
        SLOWAPI_AVAILABLE = True
    except ImportError:
        SLOWAPI_AVAILABLE = False
    
    DEPENDENCIES_MET = True
    
except ImportError as e:
    print(f"\nERROR: Missing dependency: {e}")
    print("\nPlease install all required dependencies:")
    print("pip install -r requirements.txt")
    print("\nRequirements.txt content:")
    print("""
    fastapi==0.104.1
    uvicorn[standard]==0.24.0
    mysql-connector-python==8.1.0
    pydantic==2.4.2
    pydantic[email]
    python-multipart==0.0.6
    bcrypt==4.0.1
    passlib[bcrypt]==1.7.4
    PyJWT==2.8.0
    python-jose[cryptography]==3.3.0
    email-validator==2.1.0
    aiosmtplib==3.0.1
    redis==5.0.1
    aioredis==2.0.1
    celery==5.3.4
    Pillow==10.1.0
    psutil==5.9.6
    slowapi==0.1.9
    typing-extensions==4.8.0
    python-dateutil==2.8.2
    pytz==2023.3.post1
    jinja2==3.1.2
    aiofiles==23.2.1
    httpx==0.25.1
    python-dotenv==1.0.0
    alembic==1.12.1
    """)
    sys.exit(1)

# ============================================================================
# VERSION INFORMATION
# ============================================================================

__version__ = "VA.0"
__build__ = "VA.0.001"
__author__ = "Vikash Hardware Store"
__copyright__ = "Copyright 2024 Vikash Hardware Store"
__license__ = "Proprietary"
__status__ = "Production"

# ============================================================================
# LOGGING CONFIGURATION
# ============================================================================

# Create logs directory if it doesn't exist
LOG_DIR = Path("logs")
LOG_DIR.mkdir(exist_ok=True)

# Configure logging format
LOG_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)-30s | %(filename)s:%(lineno)-4d | %(message)s"
LOG_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

# Create formatter
formatter = logging.Formatter(LOG_FORMAT, LOG_DATE_FORMAT)

# File handlers
info_handler = logging.FileHandler(LOG_DIR / "vikash_store.log", encoding="utf-8")
info_handler.setLevel(logging.INFO)
info_handler.setFormatter(formatter)

error_handler = logging.FileHandler(LOG_DIR / "vikash_store_error.log", encoding="utf-8")
error_handler.setLevel(logging.ERROR)
error_handler.setFormatter(formatter)

debug_handler = logging.FileHandler(LOG_DIR / "vikash_store_debug.log", encoding="utf-8")
debug_handler.setLevel(logging.DEBUG)
debug_handler.setFormatter(formatter)

# Console handler
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setLevel(logging.INFO)
console_handler.setFormatter(formatter)

# Configure root logger
root_logger = logging.getLogger()
root_logger.setLevel(logging.DEBUG)
root_logger.addHandler(info_handler)
root_logger.addHandler(error_handler)
root_logger.addHandler(debug_handler)
root_logger.addHandler(console_handler)

# Create logger for this module
logger = logging.getLogger("vikash_store")

# Suppress verbose logging from other libraries
logging.getLogger("uvicorn").setLevel(logging.WARNING)
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
logging.getLogger("fastapi").setLevel(logging.WARNING)
logging.getLogger("watchfiles").setLevel(logging.WARNING)
logging.getLogger("watchfiles.main").setLevel(logging.WARNING)
logging.getLogger("mysql.connector").setLevel(logging.WARNING)
logging.getLogger("passlib").setLevel(logging.WARNING)
logging.getLogger("jwt").setLevel(logging.WARNING)

# ============================================================================
# ENVIRONMENT CONFIGURATION
# ============================================================================

class Environment(str, Enum):
    """Application environment enumeration"""
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"
    TESTING = "testing"

# Detect environment
ENVIRONMENT = Environment(os.getenv("VIKASH_ENV", "development").lower())
IS_DEVELOPMENT = ENVIRONMENT == Environment.DEVELOPMENT
IS_STAGING = ENVIRONMENT == Environment.STAGING
IS_PRODUCTION = ENVIRONMENT == Environment.PRODUCTION
IS_TESTING = ENVIRONMENT == Environment.TESTING

logger.info(f"Running in {ENVIRONMENT.value} environment")

# ============================================================================
# CONFIGURATION CLASS
# ============================================================================

class Config:
    """
    Centralized configuration management for Vikash Hardware Store
    All settings are loaded from environment variables with sensible defaults
    """
    
    # ========================================================================
    # APPLICATION CONFIGURATION
    # ========================================================================
    
    APP_NAME: str = "Vikash Hardware Store"
    APP_VERSION: str = __version__
    APP_DESCRIPTION: str = "Full-featured hardware store with MySQL backend and Admin API"
    APP_CONTACT_NAME: str = "Vikash Support"
    APP_CONTACT_EMAIL: str = "support@vikash.dev"
    APP_LICENSE: str = "Proprietary"
    
    # Server Configuration
    HOST: str = os.getenv("VIKASH_HOST", "127.0.0.1")
    PORT: int = int(os.getenv("VIKASH_PORT", "8016"))
    WORKERS: int = int(os.getenv("VIKASH_WORKERS", "4"))
    RELOAD: bool = IS_DEVELOPMENT
    
    # ========================================================================
    # DATABASE CONFIGURATION
    # ========================================================================
    
    # MySQL Configuration
    DB_HOST: str = os.getenv("VIKASH_DB_HOST", "localhost")
    DB_PORT: int = int(os.getenv("VIKASH_DB_PORT", "3306"))
    DB_NAME: str = os.getenv("VIKASH_DB_NAME", "vikash_store")
    DB_USER: str = os.getenv("VIKASH_DB_USER", "vikash_user")
    DB_PASSWORD: str = os.getenv("VIKASH_DB_PASSWORD", "")  # REQUIRED - must be set via environment variable
    DB_POOL_SIZE: int = int(os.getenv("VIKASH_DB_POOL_SIZE", "10"))
    DB_MAX_OVERFLOW: int = int(os.getenv("VIKASH_DB_MAX_OVERFLOW", "20"))
    DB_POOL_RECYCLE: int = int(os.getenv("VIKASH_DB_POOL_RECYCLE", "3600"))
    DB_POOL_TIMEOUT: int = int(os.getenv("VIKASH_DB_POOL_TIMEOUT", "30"))
    DB_CHARSET: str = os.getenv("VIKASH_DB_CHARSET", "utf8mb4")
    DB_COLLATION: str = os.getenv("VIKASH_DB_COLLATION", "utf8mb4_unicode_ci")
    
    # Database Connection String (for SQLAlchemy compatibility)
    DATABASE_URL: str = f"mysql+mysqlconnector://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    
    # ========================================================================
    # SECURITY CONFIGURATION
    # ========================================================================
    
    # JWT Configuration
    # SECRET_KEY is REQUIRED - must be set via VIKASH_SECRET_KEY environment variable
    # Generate with: python -c "import secrets; print(secrets.token_hex(32))"
    SECRET_KEY: str = os.getenv("VIKASH_SECRET_KEY", "")
    JWT_ALGORITHM: str = os.getenv("VIKASH_JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("VIKASH_ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("VIKASH_REFRESH_TOKEN_EXPIRE_DAYS", "30"))
    RESET_TOKEN_EXPIRE_HOURS: int = int(os.getenv("VIKASH_RESET_TOKEN_EXPIRE_HOURS", "24"))
    
    # Password Hashing
    BCRYPT_ROUNDS: int = int(os.getenv("VIKASH_BCRYPT_ROUNDS", "12"))
    if BCRYPT_AVAILABLE:
        pwd_context = CryptContext(
            schemes=["bcrypt", "argon2"],
            deprecated="auto",
            bcrypt__rounds=BCRYPT_ROUNDS,
            argon2__time_cost=2,
            argon2__memory_cost=102400,
            argon2__parallelism=8,
            argon2__hash_len=32
        )
    else:
        pwd_context = None
    
    # Access Codes - MUST be set via environment variables for security
    # Leave empty to disable admin registration via web interface
    ADMIN_ACCESS_CODE: str = os.getenv("VIKASH_ADMIN_ACCESS_CODE", "")
    MASTER_ACCESS_CODE: str = os.getenv("VIKASH_MASTER_ACCESS_CODE", "")

    # Dev auth fallback (used when MySQL is unavailable in development)
    DEV_AUTH_ENABLED: bool = IS_DEVELOPMENT and os.getenv("DEV_AUTH_ENABLED", "true").lower() == "true"
    DEV_AUTH_USERNAME: str = os.getenv("DEV_AUTH_USERNAME", "dev")
    DEV_AUTH_EMAIL: str = os.getenv("DEV_AUTH_EMAIL", "dev@local")
    DEV_AUTH_PASSWORD: str = os.getenv("DEV_AUTH_PASSWORD", "devpass")
    DEV_AUTH_CLEARANCE: int = int(os.getenv("DEV_AUTH_CLEARANCE", "10"))
    DEV_AUTH_USER_ID: str = os.getenv("DEV_AUTH_USER_ID", "dev-user")
    
    # Clearance Levels
    DEFAULT_CLEARANCE_LEVEL: int = 3
    ADMIN_CLEARANCE_LEVEL: int = 5
    SUPER_ADMIN_CLEARANCE_LEVEL: int = 10
    
    # CORS Configuration
    # Production host names must be supplied for the actual deployment domain.
    TRUSTED_HOSTS: List[str] = [
        host.strip()
        for host in os.getenv("VIKASH_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
        if host.strip()
    ]
    CORS_ORIGINS: List[str] = [
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:8001",
        "http://127.0.0.1:8001",
        "http://localhost:8015",
        "http://127.0.0.1:8015",
        "http://localhost:8016",
        "http://127.0.0.1:8016",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "null",  # allow file:// origins used during local previews
    ]
    CORS_ALLOW_ORIGIN_REGEX: str = os.getenv("VIKASH_CORS_ALLOW_ORIGIN_REGEX", "")
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: List[str] = ["*"]
    CORS_ALLOW_HEADERS: List[str] = ["*"]
    
    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = IS_PRODUCTION
    RATE_LIMIT_DEFAULT: str = "100/minute"
    RATE_LIMIT_AUTH: str = "10/minute"
    RATE_LIMIT_ADMIN: str = "30/minute"
    
    # ========================================================================
    # STORE CONFIGURATION
    # ========================================================================
    
    STARTING_BALANCE: Decimal = Decimal(os.getenv("VIKASH_STARTING_BALANCE", "1500.00"))
    MINIMUM_BALANCE: Decimal = Decimal(os.getenv("VIKASH_MINIMUM_BALANCE", "0.00"))
    MAX_CART_ITEMS: int = int(os.getenv("VIKASH_MAX_CART_ITEMS", "50"))
    MAX_ORDER_QUANTITY: int = int(os.getenv("VIKASH_MAX_ORDER_QUANTITY", "10"))
    
    # Product Categories
    PRODUCT_CATEGORIES: List[str] = [
        "microcontrollers",
        "sbc",
        "sensors",
        "iot",
        "rf",
        "tools",
        "services",
        "restricted"
    ]
    
    # Order Status
    ORDER_STATUSES: List[str] = [
        "pending",
        "processing",
        "confirmed",
        "fabricating",
        "shipped",
        "delivered",
        "cancelled",
        "refunded"
    ]
    
    # Payment Methods
    PAYMENT_METHODS: List[str] = [
        "crypto",
        "paypal",
        "wire",
        "invoice",
        "credit_card"
    ]
    
    # ========================================================================
    # FILE UPLOAD CONFIGURATION
    # ========================================================================
    
    MAX_UPLOAD_SIZE: int = int(os.getenv("VIKASH_MAX_UPLOAD_SIZE", "10485760"))  # 10MB
    ALLOWED_IMAGE_EXTENSIONS: Set[str] = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"}
    ALLOWED_DOCUMENT_EXTENSIONS: Set[str] = {".pdf", ".txt", ".md", ".json", ".csv"}
    UPLOAD_DIR: Path = Path("uploads")
    PUBLIC_DIR: Path = Path("public")
    PRODUCT_IMAGE_DIR: Path = UPLOAD_DIR / "products"
    USER_AVATAR_DIR: Path = UPLOAD_DIR / "avatars"
    
    # ========================================================================
    # EMAIL CONFIGURATION
    # ========================================================================
    
    SMTP_HOST: str = os.getenv("VIKASH_SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("VIKASH_SMTP_PORT", "587"))
    SMTP_USERNAME: str = os.getenv("VIKASH_SMTP_USERNAME", "")
    SMTP_PASSWORD: str = os.getenv("VIKASH_SMTP_PASSWORD", "")
    SMTP_USE_TLS: bool = os.getenv("VIKASH_SMTP_USE_TLS", "true").lower() == "true"
    SMTP_FROM_EMAIL: str = os.getenv("VIKASH_SMTP_FROM_EMAIL", "")
    SMTP_FROM_NAME: str = os.getenv("VIKASH_SMTP_FROM_NAME", "Vikash")
    PUBLIC_SITE_URL: str = os.getenv("VIKASH_PUBLIC_URL", "").rstrip("/")
    
    # ========================================================================
    # REDIS/CACHE CONFIGURATION
    # ========================================================================
    
    REDIS_HOST: str = os.getenv("VIKASH_REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("VIKASH_REDIS_PORT", "6379"))
    REDIS_DB: int = int(os.getenv("VIKASH_REDIS_DB", "0"))
    REDIS_PASSWORD: str = os.getenv("VIKASH_REDIS_PASSWORD", "")
    REDIS_URL: str = f"redis://{':' + REDIS_PASSWORD + '@' if REDIS_PASSWORD else ''}{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}"
    
    CACHE_TTL: int = int(os.getenv("VIKASH_CACHE_TTL", "300"))  # 5 minutes
    SESSION_TTL: int = int(os.getenv("VIKASH_SESSION_TTL", "86400"))  # 24 hours
    
    # ========================================================================
    # LOGGING CONFIGURATION
    # ========================================================================
    
    LOG_LEVEL: str = os.getenv("VIKASH_LOG_LEVEL", "INFO" if IS_PRODUCTION else "DEBUG")
    LOG_FORMAT: str = LOG_FORMAT
    LOG_DATE_FORMAT: str = LOG_DATE_FORMAT
    LOG_MAX_BYTES: int = int(os.getenv("VIKASH_LOG_MAX_BYTES", "10485760"))  # 10MB
    LOG_BACKUP_COUNT: int = int(os.getenv("VIKASH_LOG_BACKUP_COUNT", "5"))
    
    # ========================================================================
    # FEATURE FLAGS
    # ========================================================================
    
    ENABLE_REGISTRATION: bool = True
    ENABLE_ORDERS: bool = True
    ENABLE_PAYMENTS: bool = IS_PRODUCTION
    ENABLE_EMAIL: bool = bool(SMTP_USERNAME and SMTP_PASSWORD and SMTP_FROM_EMAIL)
    ENABLE_CACHE: bool = REDIS_AVAILABLE
    ENABLE_RATE_LIMITING: bool = RATE_LIMIT_ENABLED and SLOWAPI_AVAILABLE
    ENABLE_UPLOADS: bool = PIL_AVAILABLE
    ENABLE_MONITORING: bool = PSUTIL_AVAILABLE
    
    # ========================================================================
    # CLASS METHODS
    # ========================================================================
    
    @classmethod
    def get_database_url(cls) -> str:
        """Get formatted database URL"""
        return f"mysql+mysqlconnector://{cls.DB_USER}:{cls.DB_PASSWORD}@{cls.DB_HOST}:{cls.DB_PORT}/{cls.DB_NAME}"
    
    @classmethod
    def get_redis_url(cls) -> str:
        """Get formatted Redis URL"""
        if cls.REDIS_PASSWORD:
            return f"redis://:{cls.REDIS_PASSWORD}@{cls.REDIS_HOST}:{cls.REDIS_PORT}/{cls.REDIS_DB}"
        return f"redis://{cls.REDIS_HOST}:{cls.REDIS_PORT}/{cls.REDIS_DB}"
    
    @classmethod
    def verify_password(cls, plain_password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        try:
            return cls.pwd_context.verify(plain_password, hashed_password)
        except Exception as e:
            logger.error(f"Password verification error: {e}")
            return False
    
    @classmethod
    def get_password_hash(cls, password: str) -> str:
        """Hash password"""
        try:
            return cls.pwd_context.hash(password)
        except Exception as e:
            logger.error(f"Password hashing error: {e}")
            raise HTTPException(status_code=500, detail="Password hashing failed")
    
    @classmethod
    def to_dict(cls) -> Dict[str, Any]:
        """Convert configuration to dictionary (exclude secrets)"""
        config_dict = {}
        for key in dir(cls):
            if key.isupper() and not key.startswith('_'):
                value = getattr(cls, key)
                # Exclude sensitive keys
                if any(secret in key.lower() for secret in ['password', 'secret', 'key', 'token', 'code']):
                    value = '********' if value else None
                config_dict[key] = value
        return config_dict
    
    @classmethod
    def validate(cls) -> List[str]:
        """Validate configuration and return list of issues"""
        issues = []
        
        # Check required settings for production
        if IS_PRODUCTION:
            # SECRET_KEY is REQUIRED in production - no default allowed
            if not cls.SECRET_KEY:
                issues.append("SECRET_KEY must be set via VIKASH_SECRET_KEY environment variable in production")
            
            # DB_PASSWORD is REQUIRED in production
            if not cls.DB_PASSWORD:
                issues.append("DB_PASSWORD must be set via VIKASH_DB_PASSWORD environment variable in production")
            
            # Access codes should be set if admin registration via web is needed
            # Empty is acceptable (disables web admin registration)
            if not cls.ADMIN_ACCESS_CODE:
                logger.warning("ADMIN_ACCESS_CODE not set - admin registration via web is disabled")
            if not cls.MASTER_ACCESS_CODE:
                logger.warning("MASTER_ACCESS_CODE not set - super admin registration via web is disabled")
        
        # Check database configuration (always required)
        if not cls.DB_HOST:
            issues.append("DB_HOST is not set")
        if not cls.DB_NAME:
            issues.append("DB_NAME is not set")
        if not cls.DB_USER:
            issues.append("DB_USER is not set")
        if not cls.DB_PASSWORD:
            issues.append("DB_PASSWORD must be set via VIKASH_DB_PASSWORD environment variable")
        
        # SECRET_KEY is always required for JWT tokens
        if not cls.SECRET_KEY:
            issues.append("SECRET_KEY must be set via VIKASH_SECRET_KEY environment variable")
        
        # Check email configuration if enabled
        if cls.ENABLE_EMAIL:
            if not cls.SMTP_HOST:
                issues.append("SMTP_HOST is required when email is enabled")
            if not cls.SMTP_USERNAME:
                issues.append("SMTP_USERNAME is required when email is enabled")
            if not cls.SMTP_PASSWORD:
                issues.append("SMTP_PASSWORD is required when email is enabled")
        
        return issues

# ============================================================================
