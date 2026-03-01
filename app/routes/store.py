from __future__ import annotations

import asyncio
from uuid import uuid4
from typing import Any, Dict, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query, Request, status
from fastapi import Path as ApiPath

from app.config import Config, logger
from app.database import DatabaseManager
from app.dependencies import (
    get_cart_service,
    get_current_active_user,
    get_db,
    get_order_service,
    get_product_service,
    get_email_service,
)
from app.services.cart import CartService
from app.services.logging_service import log_action
from app.services.order import OrderService
from app.services.product import ProductService
from app.services.email import EmailService
from app.services.admin_control import AdminControlService
from app.schemas import CartItemAdd, CartItemUpdate, OrderCreate

router = APIRouter(tags=["Store"])
control_service = AdminControlService()


def ensure_store_available(
    require_checkout: bool = False,
    require_custom_requests: bool = False,
) -> None:
    """Enforce runtime store controls configured by admins."""
    settings = control_service.get_settings()
    store_settings = settings.get("store", {})

    if not store_settings.get("enabled", True):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=store_settings.get("maintenance_message")
            or "Store access is currently disabled by admin",
        )

    if require_checkout and not store_settings.get("allow_checkout", True):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Checkout is currently disabled by admin",
        )

    if require_custom_requests and not store_settings.get("allow_custom_requests", True):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Custom fabrication requests are currently disabled by admin",
        )

# STORE ENDPOINTS
# ============================================================================

@router.get(
    "/api/store/products",
    response_model=Dict[str, Any],
    tags=["Store"],
    summary="Get products"
)
async def get_products(
    request: Request,
    category: str = Query("all", description="Product category filter"),
    search: Optional[str] = Query(None, description="Search term"),
    featured: Optional[bool] = Query(None, description="Filter featured products"),
    limit: int = Query(50, ge=1, le=100, description="Results per page"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    product_service: ProductService = Depends(get_product_service)
):
    """Get products with filtering and pagination from JSON"""
    try:
        ensure_store_available()
        result = product_service.get_products(
            category=category,
            search=search,
            featured=featured,
            limit=limit,
            offset=offset
        )
        
        return {
            "success": True,
            "products": result["products"],
            "total": result["total"],
            "limit": result["limit"],
            "offset": result["offset"]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get products error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get products"
        )

@router.get(
    "/api/store/products/{product_id}",
    response_model=Dict[str, Any],
    tags=["Store"],
    summary="Get product details"
)
async def get_product(
    product_id: str = ApiPath(..., description="Product ID"),
    product_service: ProductService = Depends(get_product_service),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """Get detailed information about a specific product from JSON"""
    try:
        ensure_store_available()
        product = product_service.get_product(product_id)
        
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        # Check clearance
        if product['requires_clearance'] and current_user['clearance_level'] < 4:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Clearance level 4 required to view this product"
            )
        
        return {
            "success": True,
            "product": product
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get product error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get product"
        )

@router.get(
    "/api/store/cart",
    response_model=Dict[str, Any],
    tags=["Store"],
    summary="Get cart"
)
async def get_cart(
    db: DatabaseManager = Depends(get_db),
    cart_service: CartService = Depends(get_cart_service),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """Get current user's shopping cart"""
    try:
        ensure_store_available()
        cart = cart_service.get_cart(db, current_user['id'])
        total = cart_service.get_cart_total(db, current_user['id'])
        
        return {
            "success": True,
            "cart": cart,
            "total": float(total),
            "item_count": len(cart)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get cart error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get cart"
        )

@router.post(
    "/api/store/cart",
    response_model=Dict[str, Any],
    tags=["Store"],
    summary="Add to cart"
)
async def add_to_cart(
    product_id: str = Query(..., description="Product ID"),
    quantity: int = Query(1, ge=1, le=Config.MAX_ORDER_QUANTITY, description="Quantity"),
    db: DatabaseManager = Depends(get_db),
    cart_service: CartService = Depends(get_cart_service),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """Add item to cart"""
    try:
        ensure_store_available()
        result = cart_service.add_to_cart(db, current_user['id'], product_id, quantity)
        
        return {
            "success": True,
            "message": result["message"],
            "product_id": result["product_id"],
            "quantity": result["quantity"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Add to cart error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add to cart"
        )

@router.put(
    "/api/store/cart/{product_id}",
    response_model=Dict[str, Any],
    tags=["Store"],
    summary="Update cart item"
)
async def update_cart_item(
    product_id: str = ApiPath(..., description="Product ID"),
    quantity: Optional[int] = Query(
        None,
        ge=1,
        le=Config.MAX_ORDER_QUANTITY,
        description="New quantity (query param)",
    ),
    cart_item: Optional[CartItemUpdate] = Body(
        None,
        description="New quantity (JSON body)",
    ),
    db: DatabaseManager = Depends(get_db),
    cart_service: CartService = Depends(get_cart_service),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """Update cart item quantity"""
    try:
        ensure_store_available()
        resolved_quantity = quantity
        if resolved_quantity is None and cart_item is not None:
            resolved_quantity = cart_item.quantity

        if resolved_quantity is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Quantity is required in query string or JSON body",
            )

        if resolved_quantity < 1 or resolved_quantity > Config.MAX_ORDER_QUANTITY:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Quantity must be between 1 and {Config.MAX_ORDER_QUANTITY}",
            )

        result = cart_service.update_cart_item(
            db, current_user['id'], product_id, resolved_quantity
        )
        
        return {
            "success": True,
            "message": result["message"],
            "product_id": result["product_id"],
            "quantity": result["quantity"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update cart error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update cart"
        )

@router.delete(
    "/api/store/cart/{product_id}",
    response_model=Dict[str, Any],
    tags=["Store"],
    summary="Remove from cart"
)
async def remove_from_cart(
    product_id: str = ApiPath(..., description="Product ID"),
    db: DatabaseManager = Depends(get_db),
    cart_service: CartService = Depends(get_cart_service),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """Remove item from cart"""
    try:
        ensure_store_available()
        result = cart_service.remove_from_cart(db, current_user['id'], product_id)
        
        return {
            "success": True,
            "message": result["message"],
            "product_id": result["product_id"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Remove from cart error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove from cart"
        )

@router.post(
    "/api/store/orders",
    response_model=Dict[str, Any],
    tags=["Store"],
    summary="Create order"
)
async def create_order(
    order_data: OrderCreate,
    db: DatabaseManager = Depends(get_db),
    order_service: OrderService = Depends(get_order_service),
    cart_service: CartService = Depends(get_cart_service),
    email_service: EmailService = Depends(get_email_service),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """Create new order from cart"""
    try:
        ensure_store_available(require_checkout=True)
        # Validate cart
        errors = cart_service.validate_cart(db, current_user['id'])
        if errors:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="; ".join(errors)
            )
        
        # Create order
        result = order_service.create_order(
            db,
            current_user['id'],
            current_user['email'],
            order_data
        )
        
        # Send order confirmation email
        if Config.ENABLE_EMAIL:
            asyncio.create_task(
                email_service.send_order_confirmation(
                    current_user['email'],
                    result['order_number'],
                    result['total']
                )
            )
        
        return {
            "success": True,
            "message": "Order created successfully",
            "order_number": result['order_number'],
            "order_id": result['order_id'],
            "total": float(result['total']),
            "status": result['status'],
            "created_at": result['created_at'].isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create order error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create order"
        )

@router.get(
    "/api/store/orders",
    response_model=Dict[str, Any],
    tags=["Store"],
    summary="Get orders"
)
async def get_orders(
    limit: int = Query(50, ge=1, le=100, description="Orders per page"),
    db: DatabaseManager = Depends(get_db),
    order_service: OrderService = Depends(get_order_service),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """Get current user's orders"""
    try:
        ensure_store_available()
        orders = order_service.get_user_orders(db, current_user['id'], limit)
        
        return {
            "success": True,
            "orders": orders,
            "count": len(orders)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get orders error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get orders"
        )

@router.get(
    "/api/store/orders/{order_id}",
    response_model=Dict[str, Any],
    tags=["Store"],
    summary="Get order details"
)
async def get_order(
    order_id: int = ApiPath(..., description="Order ID"),
    db: DatabaseManager = Depends(get_db),
    order_service: OrderService = Depends(get_order_service),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """Get detailed information about a specific order"""
    try:
        ensure_store_available()
        order = order_service.get_order(db, order_id, current_user['id'])
        
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        return {
            "success": True,
            "order": order
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get order error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get order"
        )

@router.post(
    "/api/store/custom-request",
    response_model=Dict[str, Any],
    tags=["Store"],
    summary="Submit custom fabrication request"
)
async def create_custom_request(
    request: Request,
    project_data: Dict[str, Any] = Body(...),
    db: DatabaseManager = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """Submit a custom fabrication/service request"""
    try:
        ensure_store_available(require_custom_requests=True)
        request_id = str(uuid4())
        
        log_action(
            db,
            "info",
            "custom",
            "request_created",
            current_user['id'],
            {
                "request_id": request_id,
                "project": project_data
            },
            request.client.host if request and request.client else None,
            request.headers.get("user-agent")
        )
        
        return {
            "success": True,
            "message": "Custom request received",
            "request_id": request_id,
            "estimated_response": "48 hours"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Custom request error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit custom request"
        )

# ============================================================================
