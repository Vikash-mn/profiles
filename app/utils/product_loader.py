from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Tuple

# Centralized loader for product metadata stored in JSON.
# Supports both {"products": [...]} and plain list formats and
# falls back to the data/ folder if the root copy is missing.

PROJECT_ROOT = Path(__file__).resolve().parents[2]
PRODUCT_JSON_CANDIDATES = (
    PROJECT_ROOT / "data" / "products.json",
    PROJECT_ROOT / "products.json",
)


def find_products_file() -> Path:
    """Return the first existing products.json path, defaulting to data/."""
    for path in PRODUCT_JSON_CANDIDATES:
        if path.exists():
            return path
    return PRODUCT_JSON_CANDIDATES[0]


def _normalize(raw: Any) -> List[Dict[str, Any]]:
    """Convert raw JSON payload into a list of product dicts."""
    if isinstance(raw, dict):
        products = raw.get("products") or []
    elif isinstance(raw, list):
        products = raw
    else:
        products = []
    # Keep only dict entries to avoid surprises downstream.
    return [p for p in products if isinstance(p, dict)]


def load_products(path: Path | None = None) -> Tuple[List[Dict[str, Any]], Path]:
    """Load products from JSON; return (products, resolved_path)."""
    target = path or find_products_file()
    try:
        raw = json.loads(target.read_text(encoding="utf-8"))
        products = _normalize(raw)
    except FileNotFoundError:
        products = []
    except Exception:
        products = []
    return products, target


def save_products(products: List[Dict[str, Any]], path: Path | None = None) -> Path:
    """Persist products to JSON using the {"products": [...]} shape."""
    target = path or find_products_file()
    target.parent.mkdir(parents=True, exist_ok=True)
    payload = {"products": products}
    target.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    return target

