from __future__ import annotations

from app.config import Config, SLOWAPI_AVAILABLE

if Config.ENABLE_RATE_LIMITING and SLOWAPI_AVAILABLE:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.errors import RateLimitExceeded
    from slowapi.util import get_remote_address

    limiter = Limiter(key_func=get_remote_address)
else:
    _rate_limit_exceeded_handler = None
    RateLimitExceeded = Exception

    class DummyLimiter:
        def limit(self, *args, **kwargs):
            def decorator(func):
                return func

            return decorator

    limiter = DummyLimiter()

