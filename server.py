"""Thin compatibility wrapper for the modular FastAPI application."""

from app.main import app, main

__all__ = ["app", "main"]

if __name__ == "__main__":
    main()
