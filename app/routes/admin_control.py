from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from app.config import Config, logger
from app.database import DatabaseManager
from app.dependencies import (
    get_current_admin_user,
    get_current_super_admin_user,
    get_db,
)
from app.schemas import AdminControlUpdate, AdminCreateRequest, AdminUpdateRequest
from app.services.admin_control import AdminControlService
from app.services.logging_service import log_action

router = APIRouter(tags=["Admin Control"])
control_service = AdminControlService()


@router.get(
    "/api/public/runtime",
    response_model=Dict[str, Any],
    tags=["Public"],
    summary="Get public runtime settings",
)
async def get_public_runtime_settings():
    """Get non-sensitive runtime settings for public pages."""
    settings = control_service.get_public_settings()
    return {"success": True, "settings": settings}


@router.get(
    "/api/admin/control/overview",
    response_model=Dict[str, Any],
    tags=["Admin Control"],
    summary="Get admin control overview",
)
async def get_admin_control_overview(
    db: DatabaseManager = Depends(get_db),
    admin_user: Dict[str, Any] = Depends(get_current_admin_user),
):
    """Return runtime settings and key admin-control capabilities."""
    try:
        settings = control_service.get_settings()
        admin_count = db.execute_query(
            "SELECT COUNT(*) AS count FROM users WHERE clearance_level >= %s",
            (Config.ADMIN_CLEARANCE_LEVEL,),
            fetch_one=True,
        )["count"]
        super_admin_count = db.execute_query(
            "SELECT COUNT(*) AS count FROM users WHERE clearance_level >= %s",
            (Config.SUPER_ADMIN_CLEARANCE_LEVEL,),
            fetch_one=True,
        )["count"]

        return {
            "success": True,
            "overview": {
                "settings": settings,
                "database_connected": db.check_connection(),
                "admin_count": admin_count,
                "super_admin_count": super_admin_count,
                "can_manage_admins": admin_user["clearance_level"]
                >= Config.SUPER_ADMIN_CLEARANCE_LEVEL,
            },
        }
    except Exception as exc:
        logger.error("Get admin control overview error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load admin control overview",
        )


@router.get(
    "/api/admin/control/settings",
    response_model=Dict[str, Any],
    tags=["Admin Control"],
    summary="Get runtime control settings",
)
async def get_control_settings(
    admin_user: Dict[str, Any] = Depends(get_current_admin_user),
):
    """Get runtime settings for webpage/store/AI controls."""
    settings = control_service.get_settings()
    return {
        "success": True,
        "settings": settings,
        "is_super_admin": admin_user["clearance_level"] >= Config.SUPER_ADMIN_CLEARANCE_LEVEL,
    }


@router.put(
    "/api/admin/control/settings",
    response_model=Dict[str, Any],
    tags=["Admin Control"],
    summary="Update runtime control settings",
)
async def update_control_settings(
    request: Request,
    payload: AdminControlUpdate,
    db: DatabaseManager = Depends(get_db),
    admin_user: Dict[str, Any] = Depends(get_current_admin_user),
):
    """Update runtime settings controlling webpage, store, and AI access."""
    try:
        settings = control_service.update_settings(
            payload.dict(exclude_none=True),
            admin_user["id"],
        )

        log_action(
            db,
            "security",
            "admin_control",
            "settings_updated",
            admin_user["id"],
            payload.dict(exclude_none=True),
            request.client.host if request and request.client else None,
            request.headers.get("user-agent"),
        )

        return {
            "success": True,
            "message": "Runtime settings updated",
            "settings": settings,
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Update runtime control settings error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update runtime settings",
        )


@router.get(
    "/api/admin/control/admins",
    response_model=Dict[str, Any],
    tags=["Admin Control"],
    summary="List admin users",
)
async def list_admin_users(
    limit: int = Query(100, ge=1, le=1000, description="Results per page"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    search: Optional[str] = Query(None, description="Search term"),
    db: DatabaseManager = Depends(get_db),
    admin_user: Dict[str, Any] = Depends(get_current_admin_user),
):
    """List admin and super-admin users."""
    try:
        result = control_service.list_admins(db, limit=limit, offset=offset, search=search)
        return {
            "success": True,
            **result,
            "can_manage_admins": admin_user["clearance_level"]
            >= Config.SUPER_ADMIN_CLEARANCE_LEVEL,
        }
    except Exception as exc:
        logger.error("List admin users error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load admin users",
        )


@router.post(
    "/api/admin/control/admins",
    response_model=Dict[str, Any],
    tags=["Admin Control"],
    summary="Create admin user (super admin only)",
)
async def create_admin_user(
    request: Request,
    payload: AdminCreateRequest,
    db: DatabaseManager = Depends(get_db),
    super_admin_user: Dict[str, Any] = Depends(get_current_super_admin_user),
):
    """Create a new admin account. Super admin access required."""
    try:
        created = control_service.create_admin(db, payload.dict())

        log_action(
            db,
            "security",
            "admin_control",
            "admin_created",
            super_admin_user["id"],
            {
                "created_admin_id": created["id"],
                "created_admin_username": created["username"],
                "clearance_level": created["clearance_level"],
            },
            request.client.host if request and request.client else None,
            request.headers.get("user-agent"),
        )

        return {
            "success": True,
            "message": "Admin user created successfully",
            "admin": created,
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Create admin user error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create admin user",
        )


@router.patch(
    "/api/admin/control/admins/{admin_id}",
    response_model=Dict[str, Any],
    tags=["Admin Control"],
    summary="Update admin user (super admin only)",
)
async def update_admin_user(
    admin_id: str,
    request: Request,
    payload: AdminUpdateRequest,
    db: DatabaseManager = Depends(get_db),
    super_admin_user: Dict[str, Any] = Depends(get_current_super_admin_user),
):
    """Update admin clearance or activation state. Super admin access required."""
    try:
        updated = control_service.update_admin(
            db=db,
            admin_id=admin_id,
            acting_user=super_admin_user,
            update_data=payload.dict(exclude_none=True),
        )

        log_action(
            db,
            "security",
            "admin_control",
            "admin_updated",
            super_admin_user["id"],
            {
                "target_admin_id": admin_id,
                "updates": payload.dict(exclude_none=True),
            },
            request.client.host if request and request.client else None,
            request.headers.get("user-agent"),
        )

        return {
            "success": True,
            "message": "Admin user updated successfully",
            "admin": updated,
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Update admin user error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update admin user",
        )


@router.delete(
    "/api/admin/control/admins/{admin_id}",
    response_model=Dict[str, Any],
    tags=["Admin Control"],
    summary="Delete admin user (super admin only)",
)
async def delete_admin_user(
    admin_id: str,
    request: Request,
    db: DatabaseManager = Depends(get_db),
    super_admin_user: Dict[str, Any] = Depends(get_current_super_admin_user),
):
    """Delete an admin account. Super admin access required."""
    try:
        control_service.delete_admin(db, admin_id, super_admin_user)

        log_action(
            db,
            "security",
            "admin_control",
            "admin_deleted",
            super_admin_user["id"],
            {"deleted_admin_id": admin_id},
            request.client.host if request and request.client else None,
            request.headers.get("user-agent"),
        )

        return {
            "success": True,
            "message": "Admin user deleted successfully",
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Delete admin user error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete admin user",
        )
