from __future__ import annotations

import secrets
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional

from fastapi import HTTPException

from app.config import Config, logger
from app.database import DatabaseManager
from app.schemas import OrderCreate, OrderUpdate
from app.services.cart import CartService
from app.services.product import ProductService

# ORDER SERVICE
# ============================================================================

class OrderService:
    """Order management service"""
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
    
    def generate_order_number(self) -> str:
        """Generate a unique order number"""
        timestamp = datetime.now().strftime("%Y%m%d")
        random_part = secrets.token_hex(3).upper()
        return f"ORD-{timestamp}-{random_part}"
    
    def create_order(
        self,
        db: DatabaseManager,
        user_id: str,
        user_email: str,
        order_data: OrderCreate
    ) -> Dict[str, Any]:
        """Create a new order"""
        # Get cart items
        cart_service = CartService()
        cart_items = cart_service.get_cart(db, user_id)
        
        if not cart_items:
            raise HTTPException(status_code=400, detail="Cart is empty")
        
        # Validate cart
        errors = cart_service.validate_cart(db, user_id)
        if errors:
            raise HTTPException(status_code=400, detail="; ".join(errors))
        
        # Calculate totals
        subtotal = sum(item['total'] for item in cart_items)
        tax = subtotal * Decimal('0.1')  # 10% tax
        shipping = Decimal('10.00')  # Flat shipping rate
        discount = Decimal('0.00')
        
        # Apply discount if code provided
        if order_data.discount_code:
            # TODO: Implement discount logic
            pass
        
        total = subtotal + tax + shipping - discount
        
        # Generate order number
        order_number = self.generate_order_number()
        
        # Start transaction
        queries = []
        
        # Insert order
        queries.append((
            """
            INSERT INTO orders (
                order_number, user_id, status, total, subtotal, tax, shipping, discount,
                shipping_address, billing_address, contact_number, email,
                payment_method, notes, estimated_delivery
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                order_number, user_id, 'pending', total, subtotal, tax, shipping, discount,
                order_data.shipping_address,
                order_data.billing_address or order_data.shipping_address,
                order_data.contact_number,
                order_data.email or user_email,
                order_data.payment_method,
                order_data.notes,
                datetime.now() + timedelta(days=5)  # Estimated delivery in 5 days
            )
        ))
        
        # Get the last insert ID
        order_id = db.execute_query(queries[0][0], queries[0][1], commit=True)
        
        # Insert order items
        for item in cart_items:
            queries.append((
                """
                INSERT INTO order_items (
                    order_id, product_id, product_name, product_price, quantity, total, specifications
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    order_id,
                    item['product_id'],
                    item['name'],
                    item['price'],
                    item['quantity'],
                    item['total'],
                    json.dumps({})  # No specifications from cart
                )
            ))
        
        # Update product stock
        for item in cart_items:
            queries.append((
                "UPDATE products SET stock = stock - %s WHERE id = %s",
                (item['quantity'], item['product_id'])
            ))
        
        # Clear cart
        queries.append((
            "DELETE FROM carts WHERE user_id = %s",
            (user_id,)
        ))
        
        # Execute transaction
        try:
            db.execute_transaction(queries)
        except Exception as e:
            logger.error(f"Order creation failed: {e}")
            raise HTTPException(status_code=500, detail="Failed to create order")
        
        # Check if product needs fabrication
        for item in cart_items:
            if item['status'] == 'fabricating' or item.get('fabrication_progress', 100) < 100:
                # Add to fabrication queue
                self.add_to_fabrication_queue(db, item['product_id'], order_id)
        
        return {
            "order_id": order_id,
            "order_number": order_number,
            "total": total,
            "status": "pending",
            "created_at": datetime.now()
        }
    
    def get_order(self, db: DatabaseManager, order_id: int, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Get order by ID"""
        if user_id:
            query = """
                SELECT o.*, u.email as user_email, u.name as user_name
                FROM orders o
                JOIN users u ON o.user_id = u.id
                WHERE o.id = %s AND o.user_id = %s
            """
            order = db.execute_query(query, (order_id, user_id), fetch_one=True)
        else:
            query = """
                SELECT o.*, u.email as user_email, u.name as user_name
                FROM orders o
                JOIN users u ON o.user_id = u.id
                WHERE o.id = %s
            """
            order = db.execute_query(query, (order_id,), fetch_one=True)
        
        if order:
            # Get order items
            query = "SELECT * FROM order_items WHERE order_id = %s"
            items = db.execute_query(query, (order_id,), fetch_all=True)
            order['items'] = items
            
            # Format decimal fields
            for field in ['total', 'subtotal', 'tax', 'shipping', 'discount']:
                if order.get(field):
                    order[field] = Decimal(str(order[field]))
            
            for item in items:
                item['product_price'] = Decimal(str(item['product_price']))
                item['total'] = Decimal(str(item['total']))
        
        return order
    
    def get_user_orders(self, db: DatabaseManager, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get user's orders"""
        query = """
            SELECT o.*, 
                   COUNT(oi.id) as item_count,
                   SUM(oi.quantity) as total_items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.user_id = %s
            GROUP BY o.id
            ORDER BY o.created_at DESC
            LIMIT %s
        """
        
        orders = db.execute_query(query, (user_id, limit), fetch_all=True)
        
        for order in orders:
            order['total'] = Decimal(str(order['total']))
            
            # Get order items
            query = "SELECT * FROM order_items WHERE order_id = %s"
            items = db.execute_query(query, (order['id']), fetch_all=True)
            
            for item in items:
                item['product_price'] = Decimal(str(item['product_price']))
                item['total'] = Decimal(str(item['total']))
            
            order['items'] = items
        
        return orders
    
    def update_order_status(
        self,
        db: DatabaseManager,
        order_id: int,
        status: str,
        admin_user_id: str
    ) -> Dict[str, Any]:
        """Update order status"""
        # Check if order exists
        order = self.get_order(db, order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Update status
        query = "UPDATE orders SET status = %s, updated_at = %s WHERE id = %s"
        db.execute_query(query, (status, datetime.now(), order_id), commit=True)
        
        # Log action
        log_action(
            db,
            "info",
            "orders",
            "update_status",
            admin_user_id,
            {"order_id": order_id, "order_number": order['order_number'], "status": status}
        )
        
        # If status is cancelled, restore stock
        if status == "cancelled":
            query = "SELECT * FROM order_items WHERE order_id = %s"
            items = db.execute_query(query, (order_id,), fetch_all=True)
            
            for item in items:
                query = "UPDATE products SET stock = stock + %s WHERE id = %s"
                db.execute_query(query, (item['quantity'], item['product_id']), commit=True)
        
        return {
            "success": True,
            "message": f"Order status updated to {status}",
            "order_id": order_id,
            "status": status
        }
    
    def add_to_fabrication_queue(
        self,
        db: DatabaseManager,
        product_id: str,
        order_id: Optional[int] = None
    ) -> int:
        """Add product to fabrication queue"""
        query = """
            INSERT INTO fabrication_queue (product_id, order_id, status, stage)
            VALUES (%s, %s, 'pending', 'design')
        """
        
        queue_id = db.execute_query(query, (product_id, order_id), commit=True)
        
        return queue_id
    
    def get_fabrication_queue(self, db: DatabaseManager) -> List[Dict[str, Any]]:
        """Get fabrication queue and enrich with JSON product metadata."""
        query = """
            SELECT 
                fq.*,
                o.order_number
            FROM fabrication_queue fq
            LEFT JOIN orders o ON fq.order_id = o.id
            ORDER BY fq.priority DESC, fq.created_at ASC
        """
        
        queue = db.execute_query(query, fetch_all=True)
        
        product_service = ProductService()
        for item in queue:
            product = product_service.get_product(item['product_id'])
            item['product_name'] = product.get('name', 'Unknown') if product else 'Unknown'
            item['product_category'] = product.get('category', 'Unknown') if product else 'Unknown'
        
        return queue

# ============================================================================
