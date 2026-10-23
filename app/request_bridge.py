"""Simplified terminal request bridge."""

from __future__ import annotations

import json
import logging
import os
import re
import time
import uuid
from collections import defaultdict, deque
from dataclasses import dataclass
from typing import Any, Callable, Deque, Dict, Optional, Tuple
from urllib.parse import urlparse

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from app.config import Config

logger = logging.getLogger("vikash_store.request_bridge")

_SESSION_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{4,64}$")
_DEFAULT_ALLOWED_PREFIXES = ("/api/terminal/", "/terminal/")
_DEFAULT_ALLOWED_ORIGINS = tuple(Config.CORS_ORIGINS or [])


@dataclass(frozen=True)
class TerminalBridgeConfig:
    """Configuration for the terminal request bridge."""

    allowed_prefixes: Tuple[str, ...] = _DEFAULT_ALLOWED_PREFIXES
    max_body_bytes: int = 8192
    rate_limit_per_minute: int = 90
    enforce_json_content_type: bool = True
    enforce_origin: bool = True
    require_session_id: bool = False
    session_header: str = "x-terminal-session"
    token_header: str = "x-terminal-token"
    token_value: str = os.getenv("VIKASH_TERMINAL_TOKEN", "").strip()
    allowed_origins: Tuple[str, ...] = _DEFAULT_ALLOWED_ORIGINS


class SimpleRateLimiter:
    """Tiny sliding-window limiter keyed by client fingerprint."""

    def __init__(self, limit: int, window_seconds: int = 60) -> None:
        self.limit = max(1, limit)
        self.window = max(1, window_seconds)
        self._buckets: Dict[str, Deque[float]] = defaultdict(deque)

    def allow(self, key: str) -> bool:
        now = time.monotonic()
        bucket = self._buckets[key]
        threshold = now - self.window
        while bucket and bucket[0] <= threshold:
            bucket.popleft()
        if len(bucket) >= self.limit:
            return False
        bucket.append(now)
        return True


class TerminalRequestBridge(BaseHTTPMiddleware):
    """Middleware that keeps terminal command requests simple and secure."""

    def __init__(self, app: ASGIApp, config: Optional[TerminalBridgeConfig] = None) -> None:
        super().__init__(app)
        self.config = config or TerminalBridgeConfig()
        self._rate_limiter = SimpleRateLimiter(
            limit=self.config.rate_limit_per_minute,
            window_seconds=60,
        )
        self._normalized_origins = {origin.lower() for origin in self.config.allowed_origins if origin}

    async def dispatch(self, request: Request, call_next: Callable[[Request], Any]) -> Response:
        if not self._path_matches(request.url.path):
            return await call_next(request)

        request_id = str(uuid.uuid4())[:8]
        request.state.bridge_request_id = request_id

        validation = await self._validate_request(request)
        if validation is not None:
            return validation

        response = await call_next(request)
        response.headers.setdefault("X-Request-ID", request_id)
        response.headers.setdefault("X-Terminal-Status", "accept")
        return response

    def _path_matches(self, path: str) -> bool:
        return any(path.startswith(prefix) for prefix in self.config.allowed_prefixes)

    async def _validate_request(self, request: Request) -> Optional[Response]:
        if request.method.upper() != "POST":
            return self._error("Method not allowed", 405)

        if self.config.enforce_json_content_type:
            content_type = (request.headers.get("content-type") or "").lower()
            if "application/json" not in content_type:
                return self._error("Content type must be application/json", 415)

        body = await request.body()
        if self.config.max_body_bytes and len(body) > self.config.max_body_bytes:
            return self._error("Payload too large", 413)

        payload = self._parse_payload(body)
        if payload is None:
            return self._error("Invalid JSON payload", 400)

        command = payload.get("command")
        if not isinstance(command, str) or not command.strip():
            return self._error("Command is required", 400)

        session_id = (
            payload.get("session") or request.headers.get(self.config.session_header) or ""
        ).strip()
        if self.config.require_session_id and not _SESSION_ID_PATTERN.fullmatch(session_id):
            return self._error("Valid session is required", 403)

        if self.config.token_value:
            token = request.headers.get(self.config.token_header, "").strip()
            if token != self.config.token_value:
                return self._error("Invalid terminal token", 401)

        if self.config.enforce_origin and not self._origin_allowed(request):
            return self._error("Origin not allowed", 403)

        ip_key = self._client_ip(request)
        if not self._rate_limiter.allow(ip_key):
            return self._error("Rate limit exceeded", 429)

        request.state.terminal_payload = payload
        request.state.terminal_command = command.strip()
        if session_id:
            request.state.terminal_session = session_id
        return None

    def _parse_payload(self, raw_body: bytes) -> Optional[Dict[str, Any]]:
        if not raw_body:
            return {}
        try:
            data = json.loads(raw_body)
        except json.JSONDecodeError:
            return None
        if not isinstance(data, dict):
            return None
        return data

    def _client_ip(self, request: Request) -> str:
        client = request.client
        if client and client.host:
            return client.host
        forward = request.headers.get("x-forwarded-for")
        if forward:
            return forward.split(",", 1)[0].strip()
        return "unknown"

    def _origin_allowed(self, request: Request) -> bool:
        origin = (request.headers.get("origin") or request.headers.get("referer") or "").strip()
        if not origin:
            return True
        if origin.lower() in self._normalized_origins:
            return True
        try:
            parsed = urlparse(origin)
        except ValueError:
            return False
        if not parsed.scheme or not parsed.hostname:
            return False
        normalized = f"{parsed.scheme.lower()}://{parsed.hostname.lower()}"
        if parsed.port:
            normalized = f"{normalized}:{parsed.port}"
        return normalized in self._normalized_origins

    def _error(self, message: str, status: int) -> JSONResponse:
        logger.warning("[TERMINAL-BRIDGE] %s (status=%s)", message, status)
        return JSONResponse(status_code=status, content={"success": False, "detail": message})


def create_terminal_bridge(app: ASGIApp, config: Optional[TerminalBridgeConfig] = None) -> TerminalRequestBridge:
    """Convenience factory that mirrors the previous bridge factory."""
    return TerminalRequestBridge(app, config=config)
