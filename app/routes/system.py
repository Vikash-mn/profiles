from __future__ import annotations

import json
import platform
import sys
from datetime import datetime
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.config import Config, ENVIRONMENT, __build__
from app.database import DatabaseManager
from app.dependencies import get_current_admin_user, get_current_user, get_db
from app.services.logging_service import log_action

router = APIRouter(tags=["System"])

# SYSTEM ENDPOINTS
# ============================================================================

@router.get(
    "/api/system/info",
    response_model=Dict[str, Any],
    tags=["System"],
    summary="Get system information"
)
async def get_system_info(
    db: DatabaseManager = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get system information (requires authentication)"""
    system_info = {
        "application": {
            "name": Config.APP_NAME,
            "version": Config.APP_VERSION,
            "build": __build__,
            "environment": ENVIRONMENT.value
        },
        "server": {
            "host": Config.HOST,
            "port": Config.PORT,
            "python_version": sys.version,
            "platform": platform.platform()
        },
        "features": {
            "email": Config.ENABLE_EMAIL,
            "cache": Config.ENABLE_CACHE,
            "rate_limiting": Config.ENABLE_RATE_LIMITING,
            "ai": Config.ENABLE_AI,
            "uploads": Config.ENABLE_UPLOADS,
            "monitoring": Config.ENABLE_MONITORING
        },
        "timestamp": datetime.now().isoformat()
    }
    
    # Add database info for admin users
    if current_user['clearance_level'] >= Config.ADMIN_CLEARANCE_LEVEL:
        system_info["database"] = db.get_database_info()
    
    return {
        "success": True,
        "system": system_info
    }

@router.get(
    "/api/system/logs",
    response_model=Dict[str, Any],
    tags=["System"],
    summary="Get system logs"
)
async def get_system_logs(
    limit: int = Query(100, ge=1, le=1000, description="Number of logs"),
    level: Optional[str] = Query(None, description="Filter by log level"),
    module: Optional[str] = Query(None, description="Filter by module"),
    db: DatabaseManager = Depends(get_db),
    admin_user: Dict[str, Any] = Depends(get_current_admin_user)
):
    """Get system logs (admin only)"""
    try:
        query = "SELECT * FROM system_logs WHERE 1=1"
        params = []
        
        if level:
            query += " AND level = %s"
            params.append(level)
        
        if module:
            query += " AND module = %s"
            params.append(module)
        
        query += " ORDER BY created_at DESC LIMIT %s"
        params.append(limit)
        
        logs = db.execute_query(query, tuple(params), fetch_all=True)
        
        # Parse JSON details
        for log in logs:
            if log.get('details'):
                try:
                    log['details'] = json.loads(log['details'])
                except:
                    log['details'] = {}
        
        return {
            "success": True,
            "logs": logs,
            "count": len(logs)
        }
        
    except Exception as e:
        logger.error(f"Get system logs error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get system logs"
        )

# ============================================================================
