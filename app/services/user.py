from __future__ import annotations

from decimal import Decimal
from uuid import uuid4
from typing import Any, Dict, List, Optional

from fastapi import HTTPException

from app.config import Config
from app.database import DatabaseManager
from app.schemas import UserCreate

# USER SERVICE
# ============================================================================

class UserService:
    """User management service"""
    
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
    
    def get_user_by_id(self, db: DatabaseManager, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        query = """
            SELECT 
                id, name, email, username, clearance_level, balance,
                is_active, is_verified, last_login, created_at, updated_at
            FROM users
            WHERE id = %s
        """
        user = db.execute_query(query, (user_id,), fetch_one=True)
        
        if user:
            user['balance'] = Decimal(str(user['balance'])) if user['balance'] else Decimal('0')
        
        return user
    
    def get_user_by_identifier(self, db: DatabaseManager, identifier: str) -> Optional[Dict[str, Any]]:
        """Get user by email or username"""
        query = """
            SELECT *
            FROM users
            WHERE email = %s OR username = %s
        """
        user = db.execute_query(query, (identifier, identifier), fetch_one=True)
        
        if user:
            user['balance'] = Decimal(str(user['balance'])) if user['balance'] else Decimal('0')
        
        return user
    
    def create_user(
        self,
        db: DatabaseManager,
        user_data: UserCreate
    ) -> Dict[str, Any]:
        """Create a new user"""
        # Check if user exists
        existing = self.get_user_by_identifier(db, user_data.email) or \
                   self.get_user_by_identifier(db, user_data.username)
        
        if existing:
            raise HTTPException(status_code=400, detail="User already exists")
        
        # Determine clearance level
        clearance_level = Config.DEFAULT_CLEARANCE_LEVEL
        if user_data.access_code:
            if user_data.access_code == Config.MASTER_ACCESS_CODE:
                clearance_level = Config.SUPER_ADMIN_CLEARANCE_LEVEL
            elif user_data.access_code == Config.ADMIN_ACCESS_CODE:
                clearance_level = Config.ADMIN_CLEARANCE_LEVEL
        
        # Create user
        user_id = str(uuid4())
        password_hash = Config.get_password_hash(user_data.password)
        
        query = """
            INSERT INTO users (
                id, name, email, username, password_hash,
                clearance_level, balance, is_verified
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        db.execute_query(
            query,
            (
                user_id,
                user_data.name,
                user_data.email,
                user_data.username,
                password_hash,
                clearance_level,
                Config.STARTING_BALANCE,
                True  # Auto-verify for now
            ),
            commit=True
        )
        
        # Get created user
        user = self.get_user_by_id(db, user_id)
        
        return user
    
    def update_user(
        self,
        db: DatabaseManager,
        user_id: str,
        update_data: Dict[str, Any]
    ) -> bool:
        """Update user information"""
        # Build update query
        update_fields = []
        params = []
        
        allowed_fields = ['name', 'email', 'username', 'balance', 'is_active', 'is_verified', 'clearance_level']
        
        for field in allowed_fields:
            if field in update_data and update_data[field] is not None:
                update_fields.append(f"{field} = %s")
                params.append(update_data[field])
        
        if not update_fields:
            return False
        
        # Always update updated_at
        update_fields.append("updated_at = %s")
        params.append(datetime.now())
        
        # Add user_id to params
        params.append(user_id)
        
        # Execute update
        query = f"UPDATE users SET {', '.join(update_fields)} WHERE id = %s"
        db.execute_query(query, tuple(params), commit=True)
        
        return True
    
    def change_password(
        self,
        db: DatabaseManager,
        user_id: str,
        current_password: str,
        new_password: str
    ) -> bool:
        """Change user password"""
        # Get user with password hash
        query = "SELECT * FROM users WHERE id = %s"
        user = db.execute_query(query, (user_id,), fetch_one=True)
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Verify current password
        if not Config.verify_password(current_password, user['password_hash']):
            raise HTTPException(status_code=401, detail="Current password is incorrect")
        
        # Update password
        new_password_hash = Config.get_password_hash(new_password)
        
        query = "UPDATE users SET password_hash = %s, updated_at = %s WHERE id = %s"
        db.execute_query(query, (new_password_hash, datetime.now(), user_id), commit=True)
        
        return True
    
    def update_balance(
        self,
        db: DatabaseManager,
        user_id: str,
        amount_change: Decimal
    ) -> Decimal:
        """Update user balance (positive = add, negative = subtract)"""
        query = "UPDATE users SET balance = balance + %s WHERE id = %s"
        db.execute_query(query, (amount_change, user_id), commit=True)
        
        # Get new balance
        result = db.execute_query(
            "SELECT balance FROM users WHERE id = %s",
            (user_id,),
            fetch_one=True
        )
        
        return Decimal(str(result['balance'])) if result else Decimal('0')
    
    def get_users(
        self,
        db: DatabaseManager,
        limit: int = 100,
        offset: int = 0,
        search: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get users with pagination"""
        query = """
            SELECT 
                id, name, email, username, clearance_level, balance,
                is_active, is_verified, last_login, created_at, updated_at
            FROM users
            WHERE 1=1
        """
        params = []
        
        if search:
            query += " AND (name LIKE %s OR email LIKE %s OR username LIKE %s)"
            search_term = f"%{search}%"
            params.extend([search_term, search_term, search_term])
        
        # Get total count
        count_query = f"SELECT COUNT(*) as count FROM users WHERE 1=1"
        if search:
            count_query += " AND (name LIKE %s OR email LIKE %s OR username LIKE %s)"
        
        total = db.execute_query(
            count_query,
            tuple(params) if search else (),
            fetch_one=True
        )['count']
        
        # Add ordering and pagination
        query += " ORDER BY created_at DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        users = db.execute_query(query, tuple(params), fetch_all=True)
        
        for user in users:
            user['balance'] = float(user['balance']) if user['balance'] else 0
        
        return {
            "users": users,
            "total": total,
            "limit": limit,
            "offset": offset
        }

# ============================================================================
