from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.config import Config, logger
from app.database import DatabaseManager
from app.dependencies import get_ai_service, get_db
from app.rate_limit import limiter
from app.schemas import ChatMessage
from app.services.admin_control import AdminControlService
from app.services.ai import AIService

router = APIRouter(tags=["AI"])
control_service = AdminControlService()


def ensure_ai_available(require_fastpath: bool = False) -> None:
    """Enforce runtime AI controls configured by admins."""
    settings = control_service.get_settings()
    ai_settings = settings.get("ai", {})

    if not ai_settings.get("enabled", True):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=ai_settings.get("maintenance_message")
            or "AI assistant is currently disabled by admin",
        )

    if require_fastpath and not ai_settings.get("allow_fastpath", True):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI fastpath endpoint is disabled by admin",
        )

# AI CHAT ENDPOINTS
# ============================================================================

@router.post(
    "/api/ai/fastpath",
    response_model=Dict[str, Any],
    tags=["AI"],
    summary="Optimized AI chat (native accelerator if available)"
)
@limiter.limit("60/minute" if Config.ENABLE_RATE_LIMITING else "2000/minute")
async def ai_fastpath(
    request: Request,
    message: ChatMessage,
    db: DatabaseManager = Depends(get_db),
    ai_service: AIService = Depends(get_ai_service)
):
    """Fast-path AI response with retrieval and optional C++ accelerator."""
    try:
        ensure_ai_available(require_fastpath=True)
        response = await ai_service.process_message_fast(message.message, db)
        return {
            "success": True,
            "response": response
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI fastpath error: {e}")
        return {
            "success": True,
            "response": {
                "answer": "Temporary glitch on the accelerator path. Falling back to standard chat.",
                "intent": "error",
                "confidence": 0.0,
                "processing_time_ms": 0,
                "source": "fastpath"
            }
        }

@router.post(
    "/api/ai/chat",
    response_model=Dict[str, Any],
    tags=["AI"],
    summary="AI chat assistant"
)
@limiter.limit("30/minute" if Config.ENABLE_RATE_LIMITING else "1000/minute")
async def ai_chat(
    request: Request,
    message: ChatMessage,
    db: DatabaseManager = Depends(get_db),
    ai_service: AIService = Depends(get_ai_service)
):
    """Chat with the AI assistant"""
    try:
        ensure_ai_available()
        response = await ai_service.process_message(message.message, db)
        
        return {
            "success": True,
            "response": response
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI chat error: {e}")
        return {
            "success": True,  # Still return success to not break UI
            "response": {
                "answer": "I'm having trouble processing your request right now. Please try again later.",
                "intent": "error",
                "confidence": 0.0,
                "processing_time_ms": 0
            }
        }

# ============================================================================
