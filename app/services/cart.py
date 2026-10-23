from __future__ import annotations

from decimal import Decimal
from typing import Any, Dict, List

from fastapi import HTTPException

from app.config import Config
from app.database import DatabaseManager
from app.services.product import ProductService

# CART SERVICE
# ============================================================================

class CartService:
    """Cart management service"""
    
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
    
    def get_cart(self, db: DatabaseManager, user_id: str) -> List[Dict[str, Any]]:
        """Get user's cart with product details merged from JSON."""
        query = """
            SELECT 
                c.*,
                p.stock,
                p.requires_clearance,
                p.status,
                p.fabrication_progress
            FROM carts c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = %s
            ORDER BY c.added_at DESC
        """
        
        cart_items = db.execute_query(query, (user_id,), fetch_all=True)
        
        # Enrich dynamic state with static product metadata from JSON.
        product_service = ProductService()
        enriched_items = []
        for item in cart_items:
            product_details = product_service.get_product(item['product_id'])
            if not product_details:
                continue
            
            item['name'] = product_details.get('name', 'Unknown')
            item['price'] = Decimal(str(product_details.get('price', 0)))
            item['image_url'] = product_details.get('image_url', '')
            item['description'] = product_details.get('description', '')
            item['total'] = item['price'] * item['quantity']
            enriched_items.append(item)
        
        return enriched_items
    
    def add_to_cart(
        self,
        db: DatabaseManager,
        user_id: str,
        product_id: str,
        quantity: int = 1
    ) -> Dict[str, Any]:
        """Add item to cart"""
        # Check if product exists and has stock
        query = """
            SELECT * FROM products 
            WHERE id = %s AND status != 'out_of_stock' AND status != 'discontinued'
        """
        product = db.execute_query(query, (product_id,), fetch_one=True)
        
        if not product:
            raise HTTPException(status_code=404, detail="Product not found or not available")
        
        # Check if already in cart
        query = "SELECT * FROM carts WHERE user_id = %s AND product_id = %s"
        existing = db.execute_query(query, (user_id, product_id), fetch_one=True)
        
        if existing:
            # Check cart size limit
            if existing['quantity'] + quantity > Config.MAX_ORDER_QUANTITY:
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot add more than {Config.MAX_ORDER_QUANTITY} of this item"
                )
            
            # Update quantity
            new_quantity = existing['quantity'] + quantity
            query = "UPDATE carts SET quantity = %s WHERE user_id = %s AND product_id = %s"
            db.execute_query(query, (new_quantity, user_id, product_id), commit=True)
            message = f"Updated quantity to {new_quantity}"
        else:
            # Check cart total items limit
            cart_count = db.execute_query(
                "SELECT COUNT(*) as count FROM carts WHERE user_id = %s",
                (user_id,),
                fetch_one=True
            )['count']
            
            if cart_count >= Config.MAX_CART_ITEMS:
                raise HTTPException(
                    status_code=400,
                    detail=f"Cart cannot have more than {Config.MAX_CART_ITEMS} items"
                )
            
            # Add new item
            query = "INSERT INTO carts (user_id, product_id, quantity) VALUES (%s, %s, %s)"
            db.execute_query(query, (user_id, product_id, quantity), commit=True)
            message = "Added to cart"
        
        return {
            "success": True,
            "message": message,
            "product_id": product_id,
            "quantity": existing['quantity'] + quantity if existing else quantity
        }
    
    def update_cart_item(
        self,
        db: DatabaseManager,
        user_id: str,
        product_id: str,
        quantity: int
    ) -> Dict[str, Any]:
        """Update cart item quantity"""
        # Check if item exists in cart
        query = "SELECT * FROM carts WHERE user_id = %s AND product_id = %s"
        existing = db.execute_query(query, (user_id, product_id), fetch_one=True)
        
        if not existing:
            raise HTTPException(status_code=404, detail="Item not found in cart")
        
        # Update quantity
        query = "UPDATE carts SET quantity = %s WHERE user_id = %s AND product_id = %s"
        db.execute_query(query, (quantity, user_id, product_id), commit=True)
        
        return {
            "success": True,
            "message": "Cart updated",
            "product_id": product_id,
            "quantity": quantity
        }
    
    def remove_from_cart(
        self,
        db: DatabaseManager,
        user_id: str,
        product_id: str
    ) -> Dict[str, Any]:
        """Remove item from cart"""
        query = "DELETE FROM carts WHERE user_id = %s AND product_id = %s"
        db.execute_query(query, (user_id, product_id), commit=True)
        
        return {
            "success": True,
            "message": "Removed from cart",
            "product_id": product_id
        }
    
    def clear_cart(self, db: DatabaseManager, user_id: str) -> Dict[str, Any]:
        """Clear user's cart"""
        query = "DELETE FROM carts WHERE user_id = %s"
        db.execute_query(query, (user_id,), commit=True)
        
        return {
            "success": True,
            "message": "Cart cleared"
        }
    
    def get_cart_total(self, db: DatabaseManager, user_id: str) -> Decimal:
        """Calculate cart total"""
        cart = self.get_cart(db, user_id)
        total = sum(item['total'] for item in cart)
        return total
    
    def validate_cart(self, db: DatabaseManager, user_id: str) -> List[str]:
        """Validate cart items (stock, clearance, etc.)"""
        errors = []
        cart = self.get_cart(db, user_id)
        
        for item in cart:
            # Check stock
            if item['quantity'] > item['stock']:
                errors.append(f"Insufficient stock for {item['name']} (available: {item['stock']})")
            
            # Check clearance
            if item['requires_clearance']:
                user = db.execute_query(
                    "SELECT clearance_level FROM users WHERE id = %s",
                    (user_id,),
                    fetch_one=True
                )
                if user and user['clearance_level'] < 4:
                    errors.append(f"Clearance required for {item['name']}")
            
            # Check status
            if item['status'] not in ['in_stock', 'limited', 'preorder']:
                errors.append(f"{item['name']} is not available for purchase")
        
        return errors

# ============================================================================
