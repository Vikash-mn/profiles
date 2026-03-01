# Vikash's Portfolio - Synthetic Consciousness System

A cyberpunk-styled portfolio with neural interface, quantum processing simulation, distributed AI backend, and a dark web marketplace with CTF challenges.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Project Structure Overview](#project-structure-overview)
3. [File Descriptions](#file-descriptions)
   - [Root Level Files](#root-level-files)
   - [Frontend Files (public/)](#frontend-files-public)
   - [Backend Files (app/)](#backend-files-app)
   - [Scripts](#scripts)
   - [Database](#database)
   - [Extensions](#extensions)
4. [How The System Works](#how-the-system-works)
5. [API Endpoints](#api-endpoints)
6. [Features](#features)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Option 1: With Python Backend (Full Features)

**Windows (recommended):**
```bash
scripts\start.bat
```
Then choose option `[1]` for full auto-start or `[5]` to install dependencies first.

**Manual (cross-platform):**
1. Install dependencies:
   ```bash
   python -m pip install -r requirements.txt
   ```
2. Start the backend server:
   ```bash
   python server.py
   ```
   The server starts at `http://127.0.0.1:8016`
3. Serve the frontend (required for Service Worker support):
   ```bash
   python -m http.server 8080 -d public
   ```
   Then visit `http://localhost:8080`

### Option 2: Standalone Mode (No Backend)
The frontend works without the backend! When the server isn't running:
- The neural-core.js will detect offline mode
- The interface will show "Hybrid Mode" indicators
- All visual features will still work
- Chat functionality will show fallback responses

### Option 3: Fastpath CLI (Terminal Client)
- Build the optional native booster (requires g++/clang): `python -m extensions.neural_ext.build`
- Run the terminal client:  
  `python cli/neural_cli.py --backend http://127.0.0.1:8016/api/ai/fastpath`

---

## Project Structure Overview

```
v:/Portfolio/
|
|-- public/                    # Frontend HTML, CSS, JS files
|   |-- index.html            # Main portfolio/terminal interface
|   |-- store.html            # Store interface (dark web marketplace)
|   |-- admin.html            # Admin panel interface
|   |-- manifest.json        # PWA manifest
|   |-- sw.js                # Service Worker for offline support
|   |-- js/
|       |-- store_data.js    # Product catalog & store configuration
|       |-- neural-core.js   # Frontend neural/quantum simulation
|       |-- inline_script.js # Main frontend JavaScript
|       |-- admin_panel.js   # Separated admin console logic
|
|-- app/                       # Backend Python application
|   |-- main.py               # FastAPI app creation & configuration
|   |-- config.py             # Configuration & environment settings
|   |-- database.py           # MySQL database manager
|   |-- dependencies.py       # FastAPI dependency injection
|   |-- schemas.py            # Pydantic data models
|   |-- rate_limit.py        # Rate limiting configuration
|   |-- routes/               # API route handlers
|   |   |-- admin.py         # Admin panel endpoints
|   |   |-- admin_control.py # Runtime controls + admin account governance
|   |   |-- ai_chat.py       # AI chat endpoints
|   |   |-- auth.py          # Authentication endpoints
|   |   |-- store.py         # Store/product endpoints
|   |   |-- health.py        # Health check endpoints
|   |   |-- system.py        # System info endpoints
|   |   |-- neural.py        # Neural processing endpoints
|   |   |-- db_admin.py      # Database admin endpoints
|   |-- services/             # Business logic layer
|   |   |-- ai.py            # AI/ML service
|   |   |-- auth.py          # Authentication service
|   |   |-- cart.py          # Shopping cart service
|   |   |-- order.py         # Order processing service
|   |   |-- product.py       # Product management service
|   |   |-- user.py          # User management service
|   |   |-- email.py         # Email service
|   |   |-- logging_service.py # Logging service
|   |   |-- admin_control.py # Runtime settings + super-admin account management
|
|-- scripts/                   # Utility scripts
|   |-- start.bat            # Windows startup menu
|   |-- setup_mysql.py       # Database setup script
|   |-- init_db.py           # Database initialization
|
|-- cli/                       # Command-line tools
|   |-- neural_cli.py        # Terminal AI client
|
|-- database/                  # SQL schemas
|   |-- setup_mysql.sql      # Database schema definition
|
|-- data/                     # Application data
|   |-- products.json        # Product catalog backup
|   |-- admin_runtime_settings.json # Runtime webpage/store/AI control state
|
|-- extensions/               # Native extensions
|   |-- neural_ext/          # C++ neural boost module
|       |-- __init__.py      # Python bindings
|       |-- build.py         # Build script
|       |-- neural_boost.cpp # C++ source
|       |-- neural_boost.dll # Compiled Windows DLL
|
|-- uploads/                  # User uploads
|   |-- avatars/             # User profile images
|   |-- products/            # Product images
|
|-- logs/                     # Application logs
|
|-- server.py                 # Backend entry point
|-- requirements.txt          # Python dependencies
|-- docker-compose.yml        # Docker configuration
|-- Dockerfile               # Docker image definition
|-- .env                     # Environment variables
|-- README.md                # This file
```

---

## File Descriptions

### Root Level Files

| File | Description |
|------|-------------|
| [`server.py`](server.py) | Thin wrapper that imports and runs the FastAPI app from `app/main.py`. Entry point: `python server.py` |
| [`requirements.txt`](requirements.txt) | Python package dependencies (FastAPI, uvicorn, mysql-connector, etc.) |
| [`docker-compose.yml`](docker-compose.yml) | Docker Compose configuration for MySQL + backend containerized deployment |
| [`Dockerfile`](Dockerfile) | Docker image definition for the Python backend |
| [`.env`](.env) | Environment variables (database credentials, API keys, secrets) |
| [`README.md`](README.md) | This documentation file |

---

### Frontend Files (`public/`)

#### HTML Files

| File | Description |
|------|-------------|
| [`public/index.html`](public/index.html) | **Main Portfolio Interface** - The primary entry point featuring: <br>- Terminal emulator (XTerm.js) for neural interface<br>- Theme switcher (4 cyberpunk themes)<br>- Quantum processing visualization<br>- CTF challenge section<br>- Navigation to store/admin |
| [`public/store.html`](public/store.html) | **Dark Web Marketplace** - E-commerce interface with:<br>- Product catalog (electronic components, projects)<br>- Shopping cart functionality<br>- Order management<br>- Restricted inventory (unlockable via CTF)<br>- Clearance level system |
| [`public/admin.html`](public/admin.html) | **Admin Console (Separated UI)** - Dedicated admin page for clearance level ≥5 with tabs for dashboard, products, orders, users, runtime controls (web/store/AI), and super-admin account governance. |

#### JavaScript Files

| File | Description |
|------|-------------|
| [`public/js/store_data.js`](public/js/store_data.js) | **Product Catalog** - Auto-generated JavaScript containing:<br>- `storeConfig` object with currency settings<br>- `electronicComponents` array with microcontrollers<br>- `projects` array with services<br>- `restricted` array with locked products<br>Each product has: id, name, price, description, features, specs, image URLs |
| [`public/js/neural-core.js`](public/js/neural-core.js) | **Neural/Quantum Simulation** - Frontend AI visualization:<br>- Quantum state representation (16-qubit simulator)<br>- Quantum gate operations (H, X, Y, Z, CNOT)<br>- Qubit entanglement demonstration<br>- Neural network visualization<br>- Emotion/personality system |
| [`public/js/inline_script.js`](public/js/inline_script.js) | **Main Application Logic** - Core frontend functionality:<br>- Advanced terminal engine (command parser, aliases, history recall, completion)<br>- Store/CTF command handlers (`catalog`, `inspect`, `buy`, `sudo`)<br>- Theme and visual controls (`theme`, `visual`, `scanlines`)<br>- Backend AI bridge (`/api/ai/fastpath` and `/api/ai/chat`) with local fallback<br>- Dashboard metrics, modals, voice command glue, local storage state |
| [`public/js/admin_panel.js`](public/js/admin_panel.js) | **Admin Console Logic** - Fully separated admin behavior:<br>- Auth/session handling for admin users<br>- CRUD actions for products and order status changes<br>- Runtime control updates (`webpage`, `store`, `ai`)<br>- Super-admin-only admin user create/update/delete |
| [`public/sw.js`](public/sw.js) | **Service Worker** - PWA offline support:<br>- Cache static assets<br>- Handle offline requests<br>- Background sync capabilities |

#### Configuration Files

| File | Description |
|------|-------------|
| [`public/manifest.json`](public/manifest.json) | **PWA Manifest** - Defines app name, icons, theme color, display mode for installable web app |

---

### Backend Files (`app/`)

#### Core Application Files

| File | Description |
|------|-------------|
| [`app/main.py`](app/main.py) | **FastAPI Application Factory** - Creates and configures the web app:<br>- Initializes FastAPI with metadata<br>- Adds CORS, GZip, TrustedHost middleware<br>- Sets up rate limiting<br>- Registers all API routers<br>- Mounts static file directories<br>- Handles startup/shutdown events<br>- Connects to database on startup |
| [`app/config.py`](app/config.py) | **Configuration Manager** - Centralized settings:<br>- Environment variables loading (.env)<br>- Database configuration<br>- CORS settings<br>- Rate limiting config<br>- Paths for uploads, logs<br>- App metadata (name, version, etc.)<br>- External dependency imports |
| [`app/database.py`](app/database.py) | **MySQL Database Manager** - Singleton pattern connection pool:<br>- Connection pooling for performance<br>- Query execution methods<br>- Transaction support<br>- Database initialization/tables creation<br>- Automatic schema updates |
| [`app/dependencies.py`](app/dependencies.py) | **Dependency Injection** - FastAPI dependency providers:<br>- `get_db()` - Database instance<br>- `get_current_user()` - Authenticated user<br>- `get_current_admin_user()` - Admin verification<br>- Service factories (cart, order, product, etc.) |
| [`app/schemas.py`](app/schemas.py) | **Pydantic Data Models** - Request/response validation:<br>- User models (create, login, update)<br>- Product models<br>- Order models<br>- Cart models<br>- Chat message models<br>- Token response models |
| [`app/rate_limit.py`](app/rate_limit.py) | **Rate Limiting** - API request throttling using SlowAPI |

#### API Routes (`app/routes/`)

| File | Endpoint Prefix | Description |
|------|----------------|-------------|
| [`app/routes/health.py`](app/routes/health.py) | `/health` | Health check endpoints for monitoring |
| [`app/routes/auth.py`](app/routes/auth.py) | `/api/auth` | Authentication endpoints:<br>- `POST /api/auth/register` - User registration<br>- `POST /api/auth/login` - User login<br>- `POST /api/auth/logout` - User logout<br>- `GET /api/auth/profile` - Current user profile<br>- `PUT /api/auth/profile` - Update profile<br>- `POST /api/auth/change-password` - Change password |
| [`app/routes/store.py`](app/routes/store.py) | `/api/store` | Store endpoints (runtime-controlled):<br>- `GET /api/store/products` - List products<br>- `GET /api/store/products/{id}` - Get product<br>- `GET /api/store/cart` - Get cart<br>- `POST /api/store/cart` - Add to cart<br>- `PUT /api/store/cart/{product_id}` - Update cart item<br>- `DELETE /api/store/cart/{product_id}` - Remove cart item<br>- `POST /api/store/orders` - Create order<br>- `GET /api/store/orders` - List orders<br>- `GET /api/store/orders/{order_id}` - Order details<br>- `POST /api/store/custom-request` - Custom fabrication request |
| [`app/routes/admin.py`](app/routes/admin.py) | `/api/admin` | Admin endpoints (requires clearance ≥5):<br>- `GET /api/admin/dashboard/stats` - Dashboard stats<br>- `GET /api/admin/products` - List all products<br>- `POST /api/admin/products` - Create product<br>- `PUT /api/admin/products/{id}` - Update product<br>- `DELETE /api/admin/products/{id}` - Delete/discontinue product<br>- `GET /api/admin/orders` - List orders<br>- `PUT /api/admin/orders/{order_id}/status` - Update order status<br>- `GET /api/admin/users` - List users |
| [`app/routes/admin_control.py`](app/routes/admin_control.py) | `/api/admin/control` | Runtime control and governance endpoints:<br>- `GET /api/public/runtime` - Public runtime status<br>- `GET /api/admin/control/overview` - Admin overview<br>- `GET /api/admin/control/settings` - Get runtime settings<br>- `PUT /api/admin/control/settings` - Update runtime settings<br>- `GET /api/admin/control/admins` - List admin users<br>- `POST/PATCH/DELETE /api/admin/control/admins` - Super-admin admin management |
| [`app/routes/ai_chat.py`](app/routes/ai_chat.py) | `/api/ai` | AI Chat endpoints:<br>- `POST /api/ai/chat` - Standard chat<br>- `POST /api/ai/fastpath` - Fast path with C++ accelerator |
| [`app/routes/system.py`](app/routes/system.py) | `/system` | System information endpoints |
| [`app/routes/neural.py`](app/routes/neural.py) | `/api/neural` | Neural processing endpoints |
| [`app/routes/db_admin.py`](app/routes/db_admin.py) | `/api/admin/db` | Database administration endpoints |

#### Business Logic Services (`app/services/`)

| File | Description |
|------|-------------|
| [`app/services/ai.py`](app/services/ai.py) | **AI Service** - Core AI functionality:<br>- Message processing pipeline<br>- Retrieval-augmented generation<br>- Product knowledge base integration<br>- Profile/background knowledge<br>- Intent classification<br>- Response generation |
| [`app/services/auth.py`](app/services/auth.py) | **Authentication Service** - JWT token management, password hashing (bcrypt), token validation |
| [`app/services/user.py`](app/services/user.py) | **User Service** - User CRUD operations, profile management, balance handling |
| [`app/services/product.py`](app/services/product.py) | **Product Service** - Product catalog management, category filtering, search functionality |
| [`app/services/cart.py`](app/services/cart.py) | **Cart Service** - Shopping cart operations, quantity management, price calculations |
| [`app/services/order.py`](app/services/order.py) | **Order Service** - Order creation, status tracking, order history |
| [`app/services/email.py`](app/services/email.py) | **Email Service** - Order confirmations, password resets using aiosmtplib |
| [`app/services/logging_service.py`](app/services/logging_service.py) | **Logging Service** - Centralized logging to database |
| [`app/services/admin_control.py`](app/services/admin_control.py) | **Admin Control Service** - Runtime setting persistence (`data/admin_runtime_settings.json`) and super-admin account safety checks (cannot delete/demote last super admin) |

---

### Scripts (`scripts/`)

| File | Description |
|------|-------------|
| [`scripts/start.bat`](scripts/start.bat) | **Windows Quick Start** - Menu-driven startup script with options:<br>- `[1]` Full Auto: deps + backend + frontend<br>- `[2]` Backend + Frontend only<br>- `[3]` Backend only<br>- `[4]` Frontend only<br>- `[5]` Install dependencies<br>- `[6]` Run CLI<br>- `[7]` Build C++ accelerator<br>- `[8]` Dev mode with auto-reload<br>- `[9]` Initialize/repair database<br>- `[10]` Health check |
| [`scripts/setup_mysql.py`](scripts/setup_mysql.py) | **Database Setup** - Initializes MySQL database:<br>- Creates database if not exists<br>- Creates all required tables<br>- Creates default admin user<br>- Populates initial products |
| [`scripts/init_db.py`](scripts/init_db.py) | **Database Initialization** - Alternative init script with additional setup tasks |

---

### CLI (`cli/`)

| File | Description |
|------|-------------|
| [`cli/neural_cli.py`](cli/neural_cli.py) | **Terminal AI Client** - Command-line interface to the AI:<br>- Connects to backend API (`/api/ai/fastpath`)<br>- Falls back to offline mode with local knowledge<br>- Uses C++ neural accelerator if available<br>- Interactive chat interface |

---

### Database (`database/`)

| File | Description |
|------|-------------|
| [`database/setup_mysql.sql`](database/setup_mysql.sql) | **SQL Schema** - Complete database schema:<br>- `users` table (id, name, email, username, password_hash, clearance_level, balance, etc.)<br>- `products` table (id, name, category, price, description, status, etc.)<br>- `orders` table (id, user_id, status, total, created_at, etc.)<br>- `order_items` table (id, order_id, product_id, quantity, price)<br>- `carts` table (id, user_id, product_id, quantity)<br>- `tokens` table (id, user_id, token, expires_at)<br>- `system_logs` table (id, level, category, action, user_id, details)<br>- `fabrication_queue` table (id, product_id, progress, estimated_completion) |

---

### Extensions (`extensions/`)

| File | Description |
|------|-------------|
| [`extensions/neural_ext/__init__.py`](extensions/neural_ext/__init__.py) | **Python Bindings** - C++ extension wrapper with `NeuralAccelerator` class |
| [`extensions/neural_ext/build.py`](extensions/neural_ext/build.py) | **Build Script** - Compiles the C++ extension |
| [`extensions/neural_ext/neural_boost.cpp`](extensions/neural_ext/neural_boost.cpp) | **C++ Source** - Native neural processing acceleration code |
| [`extensions/neural_ext/neural_boost.dll`](extensions/neural_ext/neural_boost.dll) | **Compiled DLL** - Windows binary for neural acceleration |

---

### Data Files

| File | Description |
|------|-------------|
| [`data/products.json`](data/products.json) | **Product Data Backup** - JSON backup of product catalog used for initialization |
| [`data/admin_runtime_settings.json`](data/admin_runtime_settings.json) | **Runtime Control State** - Persistent flags for webpage/store/AI availability and maintenance messages |

---

## How The System Works

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │ index.html   │  │ store.html   │  │ admin.html           │ │
│  │ (Terminal)   │  │ (Marketplace)│  │ (Product Management) │ │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘ │
│         │                  │                      │             │
│         └──────────────────┼──────────────────────┘             │
│                            │                                    │
│                   ┌────────▼────────┐                          │
│                   │ neural-core.js │ ← Quantum/Neural Sim       │
│                   │ inline_script  │ ← Main Logic              │
│                   │ store_data.js  │ ← Products                │
│                   └────────┬────────┘                          │
│                            │                                    │
│                   ┌────────▼────────┐                          │
│                   │  Service Worker │ ← Offline Support        │
│                   │     (sw.js)    │                          │
│                   └─────────────────┘                          │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/WebSocket
┌────────────────────────────▼────────────────────────────────────┐
│                      BACKEND (FastAPI)                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                     API Routes (app/routes/)                │ │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────────┐ ┌─────────┐  │ │
│  │  │ auth   │ │ store  │ │ admin  │ │ admin_control│ │ ai_chat │  │ │
│  │  └────────┘ └────────┘ └────────┘ └──────────────┘ └─────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                            │                                    │
│  ┌─────────────────────────▼─────────────────────────────────┐ │
│  │                  Services (app/services/)                  │ │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────┐ │ │
│  │  │ AI   │ │ Auth │ │User  │ │Order │ │Cart  │ │Product   │ │ │
│  │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────────┘ │ │
│  │  ┌────────────────────┐                                      │ │
│  │  │ AdminControl       │                                      │ │
│  │  └────────────────────┘                                      │ │
│  └───────────────────────────────────────────────────────────┘ │
│                            │                                    │
│  ┌─────────────────────────▼─────────────────────────────────┐ │
│  │              Database Manager (app/database.py)           │ │
│  │           MySQL Connection Pool + Queries                │ │
│  └───────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      DATABASE (MySQL)                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │  users  │ │ products │ │  orders  │ │ system_logs     │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Request Flow Examples

#### 1. User Registration
```
User → index.html form 
     → POST /api/auth/register 
     → auth.py validates schema 
     → AuthService hashes password 
     → UserService creates user in MySQL 
     → Returns JWT token
```

#### 2. Product Browsing
```
User → store.html 
     → GET /api/store/products?category=microcontrollers 
     → store.py router 
     → ProductService loads products from JSON + merges live state from MySQL
     → Returns product JSON
```

#### 3. AI Chat
```
User → Terminal (index.html) 
     → POST /api/ai/chat {"message": "..."}
     → ai_chat.py router 
     → AIService processes message:
        1. Load product knowledge base
        2. Load profile knowledge
        3. Classify intent
        4. Generate response
     → Returns AI response
```

#### 4. Admin Product Update
```
Admin → admin.html 
      → PUT /api/admin/products/{id}
      → admin.py verifies clearance ≥5
      → ProductService updates products.json and syncs live MySQL state
      → CartService syncs updates
      → Returns success
```

#### 5. Runtime Governance Update (Web/Store/AI)
```
Admin/SuperAdmin → admin.html (controls tab)
               → PUT /api/admin/control/settings
               → admin_control.py verifies clearance ≥5
               → AdminControlService writes data/admin_runtime_settings.json
               → store.py / ai_chat.py enforce new runtime flags immediately
```

---

## API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get JWT |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/profile` | Get current user profile |
| PUT | `/api/auth/profile` | Update current user profile |
| POST | `/api/auth/change-password` | Change current user password |

### Store (`/api/store`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/store/products` | List products |
| GET | `/api/store/products/{id}` | Get product details |
| GET | `/api/store/cart` | Get user's cart |
| POST | `/api/store/cart` | Add item to cart |
| PUT | `/api/store/cart/{product_id}` | Update cart item quantity |
| DELETE | `/api/store/cart/{product_id}` | Remove item from cart |
| POST | `/api/store/orders` | Create order |
| GET | `/api/store/orders` | List current user's orders |
| GET | `/api/store/orders/{order_id}` | Get order details |
| POST | `/api/store/custom-request` | Create custom fabrication request |

### Admin (`/api/admin`) - Requires clearance ≥5
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard/stats` | Dashboard statistics |
| GET | `/api/admin/users` | List users |
| GET | `/api/admin/orders` | List orders |
| GET | `/api/admin/products` | List all products |
| POST | `/api/admin/products` | Create product |
| PUT | `/api/admin/products/{id}` | Update product |
| DELETE | `/api/admin/products/{id}` | Delete product |
| PUT | `/api/admin/orders/{order_id}/status` | Update order status |

### Admin Control (`/api/admin/control`) - Runtime Governance
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/public/runtime` | Public runtime state for webpage/store visibility |
| GET | `/api/admin/control/overview` | Runtime settings + admin governance overview |
| GET | `/api/admin/control/settings` | Get current webpage/store/AI settings |
| PUT | `/api/admin/control/settings` | Update webpage/store/AI runtime controls |
| GET | `/api/admin/control/admins` | List admin and super-admin accounts |
| POST | `/api/admin/control/admins` | Create admin account (super admin only) |
| PATCH | `/api/admin/control/admins/{admin_id}` | Update admin clearance/active status (super admin only) |
| DELETE | `/api/admin/control/admins/{admin_id}` | Delete admin account (super admin only) |

### Database Admin (`/api/admin/db`) - Admin/Super Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/db/status` | Database status/metrics |
| POST | `/api/admin/db/init` | Initialize database (super admin only) |
| POST | `/api/admin/db/backup` | Backup database (super admin only) |

### AI Chat (`/api/ai`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/chat` | Standard AI chat |
| POST | `/api/ai/fastpath` | Fast path with C++ accelerator |

### Health (`/health`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Basic health check |
| GET | `/` | Root status/version endpoint |

---

## Features

### Neural Interface
- Terminal-style interactions with Linux-like commands
- AI-powered contextual conversations
- Quantum personality with evolving emotional states
- Conversation memory across sessions

### Advanced Terminal Engine (VA.1)
- Robust command parser with quoted args and escaped characters (example: `grep "secure system" notes.md`)
- Alias expansion support (`alias ll='ls -l'`, `unalias ll`)
- Command history navigation + replay (`ArrowUp/ArrowDown`, `!!`, `!12`, `history`, `history clear`)
- Tab completion for commands, aliases, and current directory entries
- Interrupt support (`Ctrl+C`) for in-progress terminal actions
- Virtual filesystem path traversal with relative and absolute paths (`cd ..`, `cd ~/projects`, `cat ~/projects/readme.txt`)

### Terminal Command Reference

#### Core
- `help` - Show full help screen
- `man [command]` - Show command-specific usage help
- `ls [-a] [-l] [dir]` - List files/directories
- `cd [dir|..|~]` - Change directory
- `pwd` - Print current directory
- `cat [file]` - Read a file
- `tree [maxDepth]` - Show recursive directory tree
- `echo [text]` - Print text (supports env-style vars like `$PWD`)
- `clear` - Clear terminal

#### Search / Utility
- `grep [-i] [pattern] [file]` - Search text in file(s)
- `find [name]` - Recursively find files/directories by name
- `calc [expression]` - Arithmetic evaluator (`+ - * / % ()`)
- `run [file]` - Simulated file execution preview
- `date` - Current date/time
- `uptime` - Terminal session uptime
- `ifconfig` - Simulated network info

#### Identity / AI
- `whoami`, `bio`, `skills`, `projects`, `experience`, `contact`
- `education`, `interests`, `philosophy`, `funfact`, `stats`, `resume`
- `ask [question]` - AI answer pipeline (fastpath -> deterministic backend -> local fallback)
- `search [query]` - Knowledge search (when advanced neural interface is available)
- `neural-status` - Neural metrics/personality diagnostics

#### Store / CTF
- `catalog` - Show product catalog
- `inspect [id]` - Show product details
- `buy [id]` - Open order flow for product
- `ctf` - CTF instructions
- `sudo login root` - Restricted inventory unlock path

#### Visual / Theme
- `theme [default|matrix|synthwave|ocean]`
- `visual [on|off]` - Reduce/restore canvas-heavy effects
- `scanlines [on|off]` - Toggle scanline overlay

#### Interactive
- `quantum`, `matrix`, `simulate [mode]`, `evolve`, `dream`, `paradox`, `hack`, `open [section]`

### Runtime State and Persistence
- `restricted_access`, `ctf_completed` - Restricted inventory access state
- `portfolio-theme` - Active UI theme
- `scanlines_enabled` - Scanline overlay preference
- `visual_mode` - Visual effect intensity mode
- `neural_backend_url` - Optional backend endpoint override for terminal AI routing

### Admin Console and Runtime Governance (New)
- Admin panel is now fully separated into `public/admin.html` + `public/js/admin_panel.js`
- Runtime controls for:
  - `webpage.enabled`
  - `store.enabled`, `store.allow_checkout`, `store.allow_custom_requests`
  - `ai.enabled`, `ai.allow_fastpath`
- Settings persist in `data/admin_runtime_settings.json`
- Store and AI APIs enforce runtime settings and return `503` when disabled
- Super-admin-only admin account lifecycle:
  - Create admin
  - Update admin clearance/active status
  - Delete admin
  - Guardrails prevent removing/demoting the last super admin

### Dark Web Marketplace
- **Electronic Components**: Arduino, ESP32, Raspberry Pi, etc.
- **Projects & Services**: PCB design, firmware development, security assessments
- **Restricted Inventory**: Unlockable via CTF challenge

### Quantum Processing
- 16-qubit quantum simulator
- Visual quantum gate operations
- Qubit entanglement demonstration

### Theme System
- Default (green/cyan)
- Matrix (green monochrome)
- Synthwave (purple/pink)
- Ocean (cyan/blue)

### PWA Features
- Installable web app
- Offline support via Service Worker
- Background sync

---

## Troubleshooting

### Backend won't start?
- Make sure port 8016 isn't already in use
- Install dependencies: `python -m pip install -r requirements.txt`
- Or run: `scripts\start.bat` → `[5]`

### Service Worker errors?
- The SW only works when served over HTTP/HTTPS (not file://)
- Use: `python -m http.server 8080 -d public`

### Store not loading?
- Ensure `public/js/store_data.js` exists
- Check browser console for errors
- Check runtime control status: `GET /api/public/runtime` (store can be disabled by admin)

### AI API returning 503?
- AI may be disabled by admin runtime controls
- Verify via admin panel or `GET /api/admin/control/settings`
- Re-enable `ai.enabled` and optionally `ai.allow_fastpath`

### Restricted inventory not unlocking?
- Complete CTF: `cd projects`, `cat ctf_flag.txt`
- Flag: `V1K45H_{cyb3r_53cur1ty_r0cks}`
- Or use: `sudo login root` (password hint in source)

### Terminal changes not visible?
- Hard refresh the page (`Ctrl+Shift+R`) to bypass cached JS
- Confirm `public/index.html` loads `js/inline_script.js?v=VA.1`
- Open browser console and check for script errors before retrying commands

### Database connection errors?
- Run: `python scripts/setup_mysql.py`
- Ensure MySQL is running

---

## Admin Panel Access

Access levels:
- **Admin (clearance ≥5)**:
  - Dashboard, products, orders, users
  - Runtime controls for webpage/store/AI
- **Super Admin (clearance ≥10)**:
  - Everything above
  - Add/update/delete admin accounts via `/api/admin/control/admins/*`

Registration access codes are controlled by environment variables:
- `VIKASH_ADMIN_ACCESS_CODE` → creates admin-level accounts
- `VIKASH_MASTER_ACCESS_CODE` → creates super-admin accounts

---

**Version:** VA.1  
**Last Updated:** February 24, 2026
