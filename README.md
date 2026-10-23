# Vikash Portfolio

A FastAPI-backed portfolio and hardware storefront with a browser terminal, product catalog, checkout flow, admin console, and MySQL persistence.

## What is in this repo

- `public/`: portfolio site, storefront, admin UI, service worker, and browser terminal logic
- `app/`: FastAPI application, route handlers, services, schemas, and configuration
- `database/setup_mysql.sql`: database schema
- `scripts/`: database bootstrap helpers
- `tests/`: unit tests for config, schemas, services, API registration, and database helpers
- `start.bat`: Windows launcher for the backend, standalone frontend, health checks, and runtime backups

## Current architecture

- Frontend pages:
  - `public/index.html`: main portfolio and browser terminal
  - `public/store.html`: storefront and checkout flow
  - `public/admin.html`: admin console for products, orders, users, and runtime controls
- Backend routes:
  - `app/routes/auth.py`: authentication and profile endpoints
  - `app/routes/store.py`: catalog, cart, orders, and custom requests
  - `app/routes/admin.py`: product, order, and user administration
  - `app/routes/admin_control.py`: runtime settings and admin account governance
  - `app/routes/db_admin.py`: database admin actions
  - `app/routes/health.py`: health and status endpoints
  - `app/routes/system.py`: system information endpoints
- Persistence:
  - MySQL for users, products, carts, orders, tokens, and logs
  - `data/admin_runtime_settings.json` for runtime visibility flags
  - `data/products.json` as the catalog seed/source data

## Run locally

### Full app on Windows

```bat
start.bat
```

Useful options:

```bat
start.bat --quick
start.bat --dev
start.bat --standalone
start.bat --no-browser
```

### Manual backend start

```bash
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python server.py --host 127.0.0.1 --port 8000
```

Backend URL: `http://127.0.0.1:8000`

### Standalone frontend

```bash
.venv\Scripts\python -m http.server 8080 --bind 127.0.0.1 --directory public
```

Frontend URL: `http://127.0.0.1:8080/index.html`

## Database setup

Initialize MySQL with either of these:

```bash
python scripts/setup_mysql.py
```

or apply:

```bash
database/setup_mysql.sql
```

Then update `.env` with the MySQL connection values the app expects.

## Runtime controls

Runtime settings are managed from the admin console and persisted in `data/admin_runtime_settings.json`.

Available control groups:

- `webpage.enabled`
- `store.enabled`
- `store.allow_checkout`
- `store.allow_custom_requests`

Public runtime state is exposed at:

```text
GET /api/public/runtime
```

## API summary

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/profile`
- `PUT /api/auth/profile`
- `POST /api/auth/change-password`

### Store

- `GET /api/store/products`
- `GET /api/store/products/{id}`
- `GET /api/store/cart`
- `POST /api/store/cart`
- `PUT /api/store/cart/{product_id}`
- `DELETE /api/store/cart/{product_id}`
- `POST /api/store/orders`
- `GET /api/store/orders`
- `GET /api/store/orders/{order_id}`
- `POST /api/store/custom-request`

### Admin

- `GET /api/admin/dashboard/stats`
- `GET /api/admin/products`
- `POST /api/admin/products`
- `PUT /api/admin/products/{id}`
- `DELETE /api/admin/products/{id}`
- `GET /api/admin/orders`
- `PUT /api/admin/orders/{order_id}/status`
- `GET /api/admin/users`

### Admin control

- `GET /api/admin/control/overview`
- `GET /api/admin/control/settings`
- `PUT /api/admin/control/settings`
- `GET /api/admin/control/admins`
- `POST /api/admin/control/admins`
- `PATCH /api/admin/control/admins/{admin_id}`
- `DELETE /api/admin/control/admins/{admin_id}`

### Health and system

- `GET /health`
- `GET /health/system_status`
- `GET /system/info`
- `GET /system/features`

## Optional terminal bridge

`app/request_bridge.py` provides a small middleware for validating browser terminal POST traffic. It is documented in `app/REQUEST_BRIDGE_README.md` and is separate from the main router setup.

## Tests

Run the focused suite with:

```bash
pytest tests/test_config.py tests/test_schemas.py tests/test_services.py tests/test_api.py tests/test_database.py
```
