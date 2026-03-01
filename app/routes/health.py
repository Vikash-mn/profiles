from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends

from app.config import Config, ENVIRONMENT, PSUTIL_AVAILABLE
from app.database import DatabaseManager
from app.dependencies import get_db

router = APIRouter(tags=["Health"])


@router.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": Config.APP_NAME,
        "version": Config.APP_VERSION,
        "environment": ENVIRONMENT.value,
        "status": "operational",
        "timestamp": datetime.now().isoformat(),
    }


@router.get("/system_status")
async def system_status():
    """System status - also used by neural frontend"""
    return {
        "status": "operational",
        "version": Config.APP_VERSION,
        "backend": "online",
        "timestamp": datetime.now().isoformat(),
    }


@router.get("/health")
async def health_check(db: DatabaseManager = Depends(get_db)):
    """Health check endpoint"""
    db_status = "connected" if db.check_connection() else "disconnected"

    system_info = {}
    if PSUTIL_AVAILABLE:
        import psutil

        system_info = {
            "cpu_percent": psutil.cpu_percent(interval=0.1),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_percent": psutil.disk_usage("/").percent,
        }

    db_info = db.get_database_info() if db.check_connection() else {}

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "timestamp": datetime.now().isoformat(),
        "version": Config.APP_VERSION,
        "environment": ENVIRONMENT.value,
        "database": {"status": db_status, **db_info},
        "system": system_info,
    }

