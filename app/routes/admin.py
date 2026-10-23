from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from fastapi import Path as ApiPath

from app.config import logger
from app.database import DatabaseManager
from app.dependencies import (
    get_current_admin_user,
    get_db,
    get_order_service,
    get_product_service,
    get_user_service,
)
from app.services.order import OrderService
from app.services.product import ProductService
from app.services.user import UserService
from app.schemas import ProductCreate, ProductUpdate

router = APIRouter(tags=["Admin"])

# ADMIN ENDPOINTS
# ============================================================================

@router.get(
    "/api/admin/dashboard/stats",
    response_model=Dict[str, Any],
    tags=["Admin"],
    summary="Get admin statistics"
)
async def get_admin_stats(
    db: DatabaseManager = Depends(get_db),
    admin_user: Dict[str, Any] = Depends(get_current_admin_user)
):
    """Get admin dashboard statistics"""
    try:
        # Total users
        total_users = db.execute_query(
            "SELECT COUNT(*) as count FROM users",
            fetch_one=True
        )['count']
        
        # Active users (logged in last 30 days)
        active_users = db.execute_query(
            "SELECT COUNT(*) as count FROM users WHERE last_login >= DATE_SUB(NOW(), INTERVAL 30 DAY)",
            fetch_one=True
        )['count']
        
        # Total products
        total_products = db.execute_query(
            "SELECT COUNT(*) as count FROM products",
            fetch_one=True
        )['count']
        
        # Total orders
        total_orders = db.execute_query(
            "SELECT COUNT(*) as count FROM orders",
            fetch_one=True
        )['count']
        
        # Pending orders
        pending_orders = db.execute_query(
            "SELECT COUNT(*) as count FROM orders WHERE status = 'pending'",
            fetch_one=True
        )['count']
        
        # Today's revenue
        revenue_today = db.execute_query(
            "SELECT COALESCE(SUM(total), 0) as revenue FROM orders WHERE DATE(created_at) = CURDATE()",
            fetch_one=True
        )['revenue']
        
        # This week's revenue
        revenue_week = db.execute_query(
            "SELECT COALESCE(SUM(total), 0) as revenue FROM orders WHERE YEARWEEK(created_at) = YEARWEEK(NOW())",
            fetch_one=True
        )['revenue']
        
        # This month's revenue
        revenue_month = db.execute_query(
            "SELECT COALESCE(SUM(total), 0) as revenue FROM orders WHERE MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())",
            fetch_one=True
        )['revenue']
        
        # Low stock products (less than 5)
        low_stock_products = db.execute_query(
            "SELECT COUNT(*) as count FROM products WHERE stock < 5 AND stock > 0",
            fetch_one=True
        )['count']
        
        # Fabrication queue
        fabrication_queue = db.execute_query(
            "SELECT COUNT(*) as count FROM fabrication_queue WHERE status IN ('pending', 'in_progress')",
            fetch_one=True
        )['count']
        
        return {
            "success": True,
            "stats": {
                "total_users": total_users,
                "active_users": active_users,
                "total_products": total_products,
                "total_orders": total_orders,
                "pending_orders": pending_orders,
                "revenue_today": float(revenue_today or 0),
                "revenue_week": float(revenue_week or 0),
                "revenue_month": float(revenue_month or 0),
                "low_stock_products": low_stock_products,
                "fabrication_queue": fabrication_queue
            }
        }
        
    except Exception as e:
        logger.error(f"Get admin stats error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get statistics"
        )

@router.get(
    "/api/admin/users",
    response_model=Dict[str, Any],
    tags=["Admin"],
    summary="Get all users"
)
async def get_admin_users(
    limit: int = Query(100, ge=1, le=1000, description="Results per page"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    search: Optional[str] = Query(None, description="Search term"),
    db: DatabaseManager = Depends(get_db),
    user_service: UserService = Depends(get_user_service),
    admin_user: Dict[str, Any] = Depends(get_current_admin_user)
):
    """Get all users with pagination"""
    try:
        result = user_service.get_users(db, limit, offset, search)
        
        return {
            "success": True,
            "users": result["users"],
            "total": result["total"],
            "limit": result["limit"],
            "offset": result["offset"]
        }
        
    except Exception as e:
        logger.error(f"Get admin users error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get users"
        )

@router.get(
    "/api/admin/orders",
    response_model=Dict[str, Any],
    tags=["Admin"],
    summary="Get all orders"
)
async def get_admin_orders(
    limit: int = Query(100, ge=1, le=1000, description="Results per page"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    status: Optional[str] = Query(None, description="Filter by status"),
    db: DatabaseManager = Depends(get_db),
    admin_user: Dict[str, Any] = Depends(get_current_admin_user)
):
    """Get all orders with pagination"""
    try:
        query = """
            SELECT o.*, u.email as user_email, u.name as user_name,
                   COUNT(oi.id) as item_count,
                   SUM(oi.quantity) as total_items
            FROM orders o
            JOIN users u ON o.user_id = u.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE 1=1
        """
        params = []
        
        if status:
            query += " AND o.status = %s"
            params.append(status)
        
        # Get total count
        count_query = f"""
            SELECT COUNT(DISTINCT o.id) as count
            FROM orders o
            WHERE 1=1
        """
        if status:
            count_query += " AND o.status = %s"
        
        total = db.execute_query(
            count_query,
            tuple(params) if status else (),
            fetch_one=True
        )['count']
        
        # Add grouping, ordering and pagination
        query += " GROUP BY o.id ORDER BY o.created_at DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        orders = db.execute_query(query, tuple(params), fetch_all=True)
        
        # Get order items for each order
        for order in orders:
            query = "SELECT * FROM order_items WHERE order_id = %s"
            items = db.execute_query(query, (order['id'],), fetch_all=True)
            
            for item in items:
                item['product_price'] = float(item['product_price'])
                item['total'] = float(item['total'])
            
            order['items'] = items
            order['total'] = float(order['total'])
            order['subtotal'] = float(order['subtotal'])
            order['tax'] = float(order['tax']) if order['tax'] else 0
            order['shipping'] = float(order['shipping']) if order['shipping'] else 0
            order['discount'] = float(order['discount']) if order['discount'] else 0
        
        return {
            "success": True,
            "orders": orders,
            "total": total,
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        logger.error(f"Get admin orders error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get orders"
        )

@router.get(
    "/api/admin/products",
    response_model=Dict[str, Any],
    tags=["Admin"],
    summary="Get all products"
)
async def get_admin_products(
    limit: int = Query(100, ge=1, le=1000, description="Results per page"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    category: Optional[str] = Query(None, description="Filter by category"),
    status: Optional[str] = Query(None, description="Filter by status"),
    product_service: ProductService = Depends(get_product_service),
    admin_user: Dict[str, Any] = Depends(get_current_admin_user)
):
    """Get all products for admin from JSON"""
    try:
        result = product_service.get_products(
            category=category,
            status=status,
            include_discontinued=True,
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
        
    except Exception as e:
        logger.error(f"Get admin products error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get products"
        )

@router.post(
    "/api/admin/products",
    response_model=Dict[str, Any],
    tags=["Admin"],
    summary="Create product"
)
async def admin_create_product(
    product_data: ProductCreate,
    product_service: ProductService = Depends(get_product_service),
    admin_user: Dict[str, Any] = Depends(get_current_admin_user)
):
    """Create a new product in JSON"""
    try:
        product_id = product_service.create_product(product_data, admin_user['id'])
        
        return {
            "success": True,
            "message": "Product created successfully",
            "product_id": product_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create product error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create product"
        )

@router.put(
    "/api/admin/products/{product_id}",
    response_model=Dict[str, Any],
    tags=["Admin"],
    summary="Update product"
)
async def admin_update_product(
    product_id: str = ApiPath(..., description="Product ID"),
    product_data: ProductUpdate = Body(...),
    product_service: ProductService = Depends(get_product_service),
    admin_user: Dict[str, Any] = Depends(get_current_admin_user)
):
    """Update an existing product in JSON"""
    try:
        product_service.update_product(product_id, product_data)
        
        return {
            "success": True,
            "message": "Product updated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update product error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update product"
        )

@router.delete(
    "/api/admin/products/{product_id}",
    response_model=Dict[str, Any],
    tags=["Admin"],
    summary="Delete product"
)
async def admin_delete_product(
    product_id: str = ApiPath(..., description="Product ID"),
    product_service: ProductService = Depends(get_product_service),
    admin_user: Dict[str, Any] = Depends(get_current_admin_user)
):
    """Delete or discontinue a product in JSON"""
    try:
        deleted = product_service.delete_product(product_id)
        
        if deleted:
            message = "Product deleted successfully"
        else:
            message = "Product discontinued"
        
        return {
            "success": True,
            "message": message,
            "deleted": deleted
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete product error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete product"
        )
    except Exception as e:
        logger.error(f"Delete product error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete product"
        )

@router.put(
    "/api/admin/orders/{order_id}/status",
    response_model=Dict[str, Any],
    tags=["Admin"],
    summary="Update order status"
)
async def admin_update_order_status(
    order_id: int = ApiPath(..., description="Order ID"),
    status: str = Body(..., embed=True, description="New order status"),
    db: DatabaseManager = Depends(get_db),
    order_service: OrderService = Depends(get_order_service),
    admin_user: Dict[str, Any] = Depends(get_current_admin_user)
):
    """Update order status"""
    try:
        result = order_service.update_order_status(db, order_id, status, admin_user['id'])
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update order status error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update order status"
        )

# ============================================================================
