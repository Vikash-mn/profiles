from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status

from app.config import logger
from app.database import DatabaseManager
from app.dependencies import get_current_admin_user, get_current_super_admin_user, get_db

router = APIRouter(tags=["Admin"])

# DATABASE ADMIN ENDPOINTS
# ============================================================================

@router.post(
    "/api/admin/db/init",
    response_model=Dict[str, Any],
    tags=["Admin"],
    summary="Initialize database"
)
async def admin_init_database(
    db: DatabaseManager = Depends(get_db),
    admin_user: Dict[str, Any] = Depends(get_current_super_admin_user)
):
    """Initialize database tables and seed data"""
    try:
        result = db.initialize_database()
        
        return {
            "success": True,
            "message": "Database initialized successfully",
            "tables_created": result["tables_created"],
            "users_created": result["users_created"],
            "products_created": result["products_created"],
            "errors": result["errors"][:10] if result["errors"] else []
        }
        
    except Exception as e:
        logger.error(f"Database initialization error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database initialization failed"
        )

@router.get(
    "/api/admin/db/status",
    response_model=Dict[str, Any],
    tags=["Admin"],
    summary="Get database status"
)
async def admin_db_status(
    db: DatabaseManager = Depends(get_db),
    admin_user: Dict[str, Any] = Depends(get_current_admin_user)
):
    """Get database connection status and information"""
    try:
        db_info = db.get_database_info()
        
        return {
            "success": True,
            **db_info
        }
        
    except Exception as e:
        logger.error(f"Database status error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get database status"
        )

@router.post(
    "/api/admin/db/backup",
    response_model=Dict[str, Any],
    tags=["Admin"],
    summary="Backup database"
)
async def admin_backup_database(
    db: DatabaseManager = Depends(get_db),
    admin_user: Dict[str, Any] = Depends(get_current_super_admin_user)
):
    """Create a database backup"""
    try:
        backup_path = db.backup_database()
        
        # Log action
        log_action(
            db,
            "info",
            "admin",
            "database_backup",
            admin_user['id'],
            {"backup_path": str(backup_path)}
        )
        
        return {
            "success": True,
            "message": "Database backup created successfully",
            "backup_path": str(backup_path),
            "backup_size": backup_path.stat().st_size
        }
        
    except Exception as e:
        logger.error(f"Database backup error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database backup failed: {str(e)}"
        )

# ============================================================================
