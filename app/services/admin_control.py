from __future__ import annotations

import copy
import json
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional
from uuid import uuid4

from fastapi import HTTPException, status

from app.config import Config, logger
from app.database import DatabaseManager


DEFAULT_RUNTIME_SETTINGS: Dict[str, Any] = {
    "webpage": {
        "enabled": True,
        "maintenance_message": "Website is currently in maintenance mode.",
    },
    "store": {
        "enabled": True,
        "allow_checkout": True,
        "allow_custom_requests": True,
        "maintenance_message": "Store access is temporarily disabled by admin.",
    },
    "ai": {
        "enabled": True,
        "allow_fastpath": True,
        "maintenance_message": "AI assistant is temporarily disabled by admin.",
    },
    "updated_at": None,
    "updated_by": None,
}


class AdminControlService:
    """Runtime admin controls and super-admin account management."""

    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self._initialized = True
        self._file_lock = threading.Lock()
        self._settings_path = Path("data") / "admin_runtime_settings.json"
        self._ensure_settings_file()

    def _default_settings(self) -> Dict[str, Any]:
        return copy.deepcopy(DEFAULT_RUNTIME_SETTINGS)

    def _merge_settings(self, target: Dict[str, Any], source: Dict[str, Any]) -> Dict[str, Any]:
        for key, value in source.items():
            if (
                key in target
                and isinstance(target[key], dict)
                and isinstance(value, dict)
            ):
                self._merge_settings(target[key], value)
            else:
                target[key] = value
        return target

    def _normalize_settings(self, raw_settings: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        settings = self._default_settings()
        if isinstance(raw_settings, dict):
            self._merge_settings(settings, raw_settings)
        return settings

    def _ensure_settings_file(self) -> None:
        self._settings_path.parent.mkdir(parents=True, exist_ok=True)
        if not self._settings_path.exists():
            self._write_settings(self._default_settings())
            return

        # Normalize existing file in case new keys are added in future versions.
        current = self._read_settings()
        self._write_settings(current)

    def _read_settings(self) -> Dict[str, Any]:
        with self._file_lock:
            try:
                if not self._settings_path.exists():
                    settings = self._default_settings()
                    self._settings_path.write_text(
                        json.dumps(settings, indent=2),
                        encoding="utf-8",
                    )
                    return settings

                raw = self._settings_path.read_text(encoding="utf-8").strip()
                parsed = json.loads(raw) if raw else {}
                return self._normalize_settings(parsed)
            except Exception as exc:
                logger.error("Failed to read runtime settings: %s", exc)
                fallback = self._default_settings()
                self._settings_path.write_text(
                    json.dumps(fallback, indent=2),
                    encoding="utf-8",
                )
                return fallback

    def _write_settings(self, settings: Dict[str, Any]) -> None:
        normalized = self._normalize_settings(settings)
        with self._file_lock:
            self._settings_path.write_text(
                json.dumps(normalized, indent=2),
                encoding="utf-8",
            )

    def get_settings(self) -> Dict[str, Any]:
        return self._read_settings()

    def get_public_settings(self) -> Dict[str, Any]:
        settings = self.get_settings()
        return {
            "webpage": settings["webpage"],
            "store": {
                "enabled": settings["store"]["enabled"],
                "maintenance_message": settings["store"]["maintenance_message"],
            },
            "updated_at": settings.get("updated_at"),
            "updated_by": settings.get("updated_by"),
        }

    def update_settings(
        self,
        update_data: Dict[str, Any],
        updated_by: str,
    ) -> Dict[str, Any]:
        settings = self.get_settings()

        allowed_keys = {
            "webpage": {"enabled", "maintenance_message"},
            "store": {
                "enabled",
                "allow_checkout",
                "allow_custom_requests",
                "maintenance_message",
            },
            "ai": {"enabled", "allow_fastpath", "maintenance_message"},
        }

        for section, values in update_data.items():
            if section not in allowed_keys or not isinstance(values, dict):
                continue

            for key, value in values.items():
                if key in allowed_keys[section] and value is not None:
                    settings[section][key] = value

        settings["updated_at"] = datetime.now(timezone.utc).isoformat()
        settings["updated_by"] = updated_by
        self._write_settings(settings)
        return settings

    def list_admins(
        self,
        db: DatabaseManager,
        limit: int = 100,
        offset: int = 0,
        search: Optional[str] = None,
    ) -> Dict[str, Any]:
        query = """
            SELECT
                id, name, email, username, clearance_level, is_active, is_verified,
                last_login, created_at, updated_at
            FROM users
            WHERE clearance_level >= %s
        """
        params = [Config.ADMIN_CLEARANCE_LEVEL]

        if search:
            query += " AND (name LIKE %s OR email LIKE %s OR username LIKE %s)"
            term = f"%{search}%"
            params.extend([term, term, term])

        count_query = "SELECT COUNT(*) AS count FROM users WHERE clearance_level >= %s"
        count_params = [Config.ADMIN_CLEARANCE_LEVEL]
        if search:
            count_query += " AND (name LIKE %s OR email LIKE %s OR username LIKE %s)"
            term = f"%{search}%"
            count_params.extend([term, term, term])

        total = db.execute_query(
            count_query,
            tuple(count_params),
            fetch_one=True,
        )["count"]

        query += " ORDER BY clearance_level DESC, created_at DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])

        admins = db.execute_query(query, tuple(params), fetch_all=True)
        return {
            "admins": admins,
            "total": total,
            "limit": limit,
            "offset": offset,
        }

    def _get_admin_user(self, db: DatabaseManager, user_id: str) -> Optional[Dict[str, Any]]:
        return db.execute_query(
            """
            SELECT
                id, name, email, username, clearance_level, is_active, is_verified,
                last_login, created_at, updated_at
            FROM users
            WHERE id = %s
            """,
            (user_id,),
            fetch_one=True,
        )

    def _count_super_admins(self, db: DatabaseManager) -> int:
        result = db.execute_query(
            "SELECT COUNT(*) AS count FROM users WHERE clearance_level >= %s",
            (Config.SUPER_ADMIN_CLEARANCE_LEVEL,),
            fetch_one=True,
        )
        return result["count"]

    def create_admin(
        self,
        db: DatabaseManager,
        admin_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        clearance_level = int(admin_data.get("clearance_level", Config.ADMIN_CLEARANCE_LEVEL))
        if clearance_level < Config.ADMIN_CLEARANCE_LEVEL:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"clearance_level must be >= {Config.ADMIN_CLEARANCE_LEVEL}",
            )
        if clearance_level > Config.SUPER_ADMIN_CLEARANCE_LEVEL:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"clearance_level must be <= {Config.SUPER_ADMIN_CLEARANCE_LEVEL}",
            )

        existing = db.execute_query(
            "SELECT id FROM users WHERE email = %s OR username = %s",
            (admin_data["email"], admin_data["username"]),
            fetch_one=True,
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Admin user with this email or username already exists",
            )

        user_id = str(uuid4())
        password_hash = Config.get_password_hash(admin_data["password"])

        db.execute_query(
            """
            INSERT INTO users (
                id, name, email, username, password_hash,
                clearance_level, balance, is_active, is_verified
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                user_id,
                admin_data["name"],
                admin_data["email"],
                admin_data["username"],
                password_hash,
                clearance_level,
                Config.STARTING_BALANCE,
                True,
                True,
            ),
            commit=True,
        )

        created = self._get_admin_user(db, user_id)
        if not created:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to load created admin user",
            )
        return created

    def update_admin(
        self,
        db: DatabaseManager,
        admin_id: str,
        acting_user: Dict[str, Any],
        update_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        target = self._get_admin_user(db, admin_id)
        if not target:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Admin user not found",
            )

        if target["clearance_level"] < Config.ADMIN_CLEARANCE_LEVEL:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Target user is not an admin",
            )

        new_clearance = update_data.get("clearance_level")
        if new_clearance is not None:
            new_clearance = int(new_clearance)
            if new_clearance < Config.ADMIN_CLEARANCE_LEVEL:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"clearance_level must be >= {Config.ADMIN_CLEARANCE_LEVEL}",
                )
            if new_clearance > Config.SUPER_ADMIN_CLEARANCE_LEVEL:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"clearance_level must be <= {Config.SUPER_ADMIN_CLEARANCE_LEVEL}",
                )

            if (
                target["clearance_level"] >= Config.SUPER_ADMIN_CLEARANCE_LEVEL
                and new_clearance < Config.SUPER_ADMIN_CLEARANCE_LEVEL
                and self._count_super_admins(db) <= 1
            ):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot demote the last super admin",
                )

            if (
                admin_id == acting_user["id"]
                and target["clearance_level"] >= Config.SUPER_ADMIN_CLEARANCE_LEVEL
                and new_clearance < Config.SUPER_ADMIN_CLEARANCE_LEVEL
            ):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="You cannot self-demote from super admin",
                )

        new_is_active = update_data.get("is_active")
        if new_is_active is not None:
            new_is_active = bool(new_is_active)
            if admin_id == acting_user["id"] and not new_is_active:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="You cannot deactivate your own account",
                )
            if (
                target["clearance_level"] >= Config.SUPER_ADMIN_CLEARANCE_LEVEL
                and not new_is_active
                and self._count_super_admins(db) <= 1
            ):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot deactivate the last super admin",
                )

        updates = []
        params = []

        if new_clearance is not None:
            updates.append("clearance_level = %s")
            params.append(new_clearance)

        if new_is_active is not None:
            updates.append("is_active = %s")
            params.append(new_is_active)

        if not updates:
            return target

        updates.append("updated_at = %s")
        params.append(datetime.now())
        params.append(admin_id)

        db.execute_query(
            f"UPDATE users SET {', '.join(updates)} WHERE id = %s",
            tuple(params),
            commit=True,
        )

        updated = self._get_admin_user(db, admin_id)
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to load updated admin user",
            )
        return updated

    def delete_admin(
        self,
        db: DatabaseManager,
        admin_id: str,
        acting_user: Dict[str, Any],
    ) -> None:
        target = self._get_admin_user(db, admin_id)
        if not target:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Admin user not found",
            )

        if target["clearance_level"] < Config.ADMIN_CLEARANCE_LEVEL:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Target user is not an admin",
            )

        if acting_user["id"] == admin_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot delete your own account",
            )

        if (
            target["clearance_level"] >= Config.SUPER_ADMIN_CLEARANCE_LEVEL
            and self._count_super_admins(db) <= 1
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete the last super admin",
            )

        db.execute_query(
            "DELETE FROM users WHERE id = %s",
            (admin_id,),
            commit=True,
        )
