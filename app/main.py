from __future__ import annotations

import argparse
import logging

import uvicorn

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import (
    Config,
    ENVIRONMENT,
    IS_PRODUCTION,
    logger,
)
from app.database import DatabaseManager
from app.rate_limit import RateLimitExceeded, _rate_limit_exceeded_handler, limiter
from app.routes import (
    admin,
    admin_control,
    auth,
    db_admin,
    health,
    store,
    system,
)
from app.services.logging_service import log_action

RELOAD_EXCLUDES = [
    "logs/*",
    "*.log",
    "__pycache__/*",
    ".venv/*",
    "mysql_data_new/*",
    "uploads/*",
]


def _browser_urls(host: str, port: int) -> list[str]:
    if host in {"0.0.0.0", "::", "[::]"}:
        return [f"http://127.0.0.1:{port}", f"http://localhost:{port}"]
    return [f"http://{host}:{port}"]


def create_app() -> FastAPI:
    app = FastAPI(
        title=Config.APP_NAME,
        description=Config.APP_DESCRIPTION,
        version=Config.APP_VERSION,
        docs_url="/api/docs" if not IS_PRODUCTION else None,
        redoc_url="/api/redoc" if not IS_PRODUCTION else None,
        openapi_url="/api/openapi.json" if not IS_PRODUCTION else None,
        contact={"name": Config.APP_CONTACT_NAME, "email": Config.APP_CONTACT_EMAIL},
        license_info={"name": Config.APP_LICENSE},
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=Config.CORS_ORIGINS,
        allow_origin_regex=Config.CORS_ALLOW_ORIGIN_REGEX or None,
        allow_credentials=Config.CORS_ALLOW_CREDENTIALS,
        allow_methods=Config.CORS_ALLOW_METHODS,
        allow_headers=Config.CORS_ALLOW_HEADERS,
    )

    app.add_middleware(GZipMiddleware, minimum_size=1000)

    if IS_PRODUCTION:
        app.add_middleware(
            TrustedHostMiddleware,
            allowed_hosts=Config.TRUSTED_HOSTS,
        )

    if Config.ENABLE_RATE_LIMITING and _rate_limit_exceeded_handler:
        app.state.limiter = limiter
        app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        errors = []
        for error in exc.errors():
            error_loc = " -> ".join([str(loc) for loc in error["loc"]])
            errors.append(f"{error_loc}: {error['msg']}")

        logger.warning(f"Validation error: {errors}")

        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "success": False,
                "detail": "Validation error",
                "errors": errors,
            },
        )

    @app.exception_handler(HTTPException)
    async def custom_http_exception_handler(request: Request, exc: HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"success": False, "detail": exc.detail},
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled exception: {exc}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "detail": "An internal server error occurred"
                if IS_PRODUCTION
                else str(exc),
            },
        )

    @app.on_event("startup")
    async def startup_event():
        logger.info("=" * 80)
        logger.info(f"{Config.APP_NAME} v{Config.APP_VERSION}")
        logger.info(f"Environment: {ENVIRONMENT.value}")
        logger.info(f"Host: {Config.HOST}:{Config.PORT}")
        logger.info("=" * 80)

        config_issues = Config.validate()
        if config_issues:
            logger.warning("Configuration issues found:")
            for issue in config_issues:
                logger.warning("  - %s", issue)

        try:
            db = DatabaseManager()
            if db.check_connection():
                init_result = db.initialize_database()
                logger.info(
                    "Tables created/verified: %s", len(init_result["tables_created"])
                )
                logger.info("Users created: %s", init_result["users_created"])
                logger.info("Products created: %s", init_result["products_created"])
            else:
                logger.error("Database connection failed; run setup_mysql.py first")
        except Exception as exc:  # pragma: no cover - startup safety
            logger.error("Startup error: %s", exc)

        try:
            db = DatabaseManager()
            if db.check_connection():
                log_action(
                    db,
                    "info",
                    "system",
                    "startup",
                    None,
                    {
                        "version": Config.APP_VERSION,
                        "environment": ENVIRONMENT.value,
                        "host": Config.HOST,
                        "port": Config.PORT,
                    },
                )
        except Exception:
            pass

        logger.info("Server bind address: http://%s:%s", Config.HOST, Config.PORT)
        for browser_url in _browser_urls(Config.HOST, Config.PORT):
            logger.info("Open in browser: %s", browser_url)
        if not IS_PRODUCTION:
            logger.info("Docs: %s/api/docs", _browser_urls(Config.HOST, Config.PORT)[0])

    @app.on_event("shutdown")
    async def shutdown_event():
        logger.info("Shutting down server...")
        try:
            db = DatabaseManager()
            if db.check_connection():
                log_action(db, "info", "system", "shutdown", None)
        except Exception:
            pass
        logger.info("Server shutdown complete")

    # Static files for CSS, JS, images (mounted first)
    if Config.PUBLIC_DIR.exists():
        app.mount(
            "/css",
            StaticFiles(directory=str(Config.PUBLIC_DIR / "css")),
            name="css",
        )
        app.mount(
            "/js",
            StaticFiles(directory=str(Config.PUBLIC_DIR / "js")),
            name="js",
        )
        app.mount(
            "/assets",
            StaticFiles(directory=str(Config.PUBLIC_DIR / "assets")),
            name="assets",
        )

    # Product and avatar static files
    Config.PRODUCT_IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    Config.USER_AVATAR_DIR.mkdir(parents=True, exist_ok=True)

    if Config.PRODUCT_IMAGE_DIR.exists():
        app.mount(
            "/static/products",
            StaticFiles(directory=str(Config.PRODUCT_IMAGE_DIR)),
            name="product_images",
        )

    if Config.USER_AVATAR_DIR.exists():
        app.mount(
            "/static/avatars",
            StaticFiles(directory=str(Config.USER_AVATAR_DIR)),
            name="user_avatars",
        )

    # API Routers - Include existing routers (they have their own prefixes)
    app.include_router(health.router)
    app.include_router(auth.router)
    app.include_router(store.router)
    app.include_router(admin.router)
    app.include_router(admin_control.router)
    app.include_router(db_admin.router)
    app.include_router(system.router)

    # Static file routes
    @app.get("/manifest.json")
    async def serve_manifest():
        return FileResponse(str(Config.PUBLIC_DIR / "manifest.json"))

    @app.get("/sw.js")
    async def serve_service_worker():
        return FileResponse(
            str(Config.PUBLIC_DIR / "sw.js"),
            media_type="application/javascript",
            headers={"Cache-Control": "no-cache"},
        )

    @app.get("/favicon.svg")
    async def serve_favicon():
        return FileResponse(str(Config.PUBLIC_DIR / "favicon.svg"), media_type="image/svg+xml")

    @app.get("/favicon.ico")
    async def serve_favicon_ico():
        return FileResponse(
            str(Config.PUBLIC_DIR / "favicon.ico"),
            media_type="image/vnd.microsoft.icon",
        )

    # HTML page routes - serve specific HTML files
    @app.get("/")
    async def serve_index():
        return FileResponse(str(Config.PUBLIC_DIR / "index.html"))

    @app.get("/store.html")
    async def serve_store():
        return FileResponse(str(Config.PUBLIC_DIR / "store.html"))

    @app.get("/admin.html")
    async def serve_admin():
        return FileResponse(str(Config.PUBLIC_DIR / "admin.html"))

    @app.get("/privacy.html")
    @app.get("/privacy")
    async def serve_privacy():
        return FileResponse(str(Config.PUBLIC_DIR / "privacy.html"))

    @app.get("/terms.html")
    @app.get("/terms")
    async def serve_terms():
        return FileResponse(str(Config.PUBLIC_DIR / "terms.html"))

    return app


app = create_app()


def main():
    parser = argparse.ArgumentParser(description=f"{Config.APP_NAME} Server")
    parser.add_argument("--host", type=str, default=Config.HOST, help="Host to bind to")
    parser.add_argument("--port", type=int, default=Config.PORT, help="Port to bind to")
    parser.add_argument(
        "--reload", action="store_true", default=Config.RELOAD, help="Enable auto-reload"
    )
    parser.add_argument(
        "--workers", type=int, default=Config.WORKERS, help="Number of workers"
    )

    args = parser.parse_args()

    Config.HOST = args.host
    Config.PORT = args.port

    logging.getLogger().setLevel(
        logging.WARNING if IS_PRODUCTION else logging.INFO
    )

    uvicorn.run(
        "app.main:app",
        host=Config.HOST,
        port=Config.PORT,
        reload=args.reload,
        reload_excludes=RELOAD_EXCLUDES,
        workers=args.workers if not args.reload else 1,
        log_level="info" if not IS_PRODUCTION else "warning",
        access_log=not IS_PRODUCTION,
    )


if __name__ == "__main__":
    main()
