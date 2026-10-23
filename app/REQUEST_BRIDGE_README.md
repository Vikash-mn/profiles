# Request Bridge

`app/request_bridge.py` contains an optional middleware that validates browser terminal POST requests before they reach the application handlers.

## What it does

- limits interception to configured prefixes such as `/api/terminal/`
- requires `POST` requests with JSON payloads
- enforces a request body size limit
- applies a simple per-IP sliding window rate limit
- optionally validates allowed origins, session IDs, and `X-Terminal-Token`
- stores parsed terminal data on `request.state`

## Configuration

`TerminalBridgeConfig` exposes the main controls:

- `allowed_prefixes`
- `max_body_bytes`
- `rate_limit_per_minute`
- `enforce_json_content_type`
- `enforce_origin`
- `require_session_id`
- `session_header`
- `token_header`
- `token_value`
- `allowed_origins`

## Integration

This middleware is not mounted by default in `app/main.py`.

To enable it:

```python
from app.request_bridge import create_terminal_bridge

app.add_middleware(create_terminal_bridge)
```

Downstream handlers can then read:

- `request.state.terminal_command`
- `request.state.terminal_payload`
- `request.state.terminal_session`
