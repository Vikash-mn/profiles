from __future__ import annotations

import json
from typing import Any, Dict, Optional

from app.config import logger
from app.database import DatabaseManager

# LOGGING SERVICE
# ============================================================================

def log_action(
    db: DatabaseManager,
    level: str,
    module: str,
    action: str,
    user_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> int:
    """Log a system action"""
    try:
        query = """
            INSERT INTO system_logs (level, module, action, user_id, ip_address, user_agent, details)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        
        log_id = db.execute_query(
            query,
            (
                level,
                module,
                action,
                user_id,
                ip_address,
                user_agent,
                json.dumps(details or {})
            ),
            commit=True
        )
        
        return log_id
        
    except Exception as e:
        logger.error(f"Failed to log action: {e}")
        return 0

# ============================================================================
