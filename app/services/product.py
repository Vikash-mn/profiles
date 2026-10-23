from __future__ import annotations

import secrets
import threading
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import HTTPException

from app.config import logger
from app.database import DatabaseManager
from app.utils.product_loader import find_products_file, load_products, save_products

# PRODUCT SERVICE
# ============================================================================

# ============================================================================
# JSON-BASED PRODUCT SERVICE
# ============================================================================


class ProductService:
    """Product management service using JSON file storage"""
    
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self._products_file = find_products_file()
        self._products = []
        self._load_products()
    
    def _load_products(self):
        """Load products from JSON file"""
        try:
            self._products, resolved_path = load_products(self._products_file)
            self._products_file = resolved_path
            if self._products:
                logger.info(f"Loaded {len(self._products)} products from JSON file {resolved_path}")
            else:
                logger.warning(f"Products file missing or empty: {resolved_path}")
        except Exception as e:
            logger.error(f"Error loading products: {e}")
            self._products = []
    
    def _save_products(self):
        """Save products to JSON file"""
        try:
            self._products_file = save_products(self._products, self._products_file)
            logger.info(f"Saved {len(self._products)} products to JSON file {self._products_file}")
        except Exception as e:
            logger.error(f"Error saving products: {e}")
    
    def _ensure_products_loaded(self):
        """Ensure products are loaded from file"""
        if not self._products:
            self._load_products()
    
    def generate_product_id(self, category: str) -> str:
        """Generate a unique product ID"""
        prefix_map = {
            'microcontrollers': 'MCU',
            'sbc': 'SBC',
            'sensors': 'SEN',
            'iot': 'IOT',
            'rf': 'RF',
            'tools': 'TL',
            'services': 'SVC',
            'restricted': 'RST'
        }
        
        prefix = prefix_map.get(category, 'PRD')
        timestamp = datetime.now().strftime("%y%m")
        random_part = secrets.token_hex(2).upper()
        
        return f"{prefix}-{timestamp}-{random_part}"
    
    def get_products(
        self,
        category: Optional[str] = None,
        status: Optional[str] = None,
        featured: Optional[bool] = None,
        search: Optional[str] = None,
        include_discontinued: bool = False,
        limit: int = 100,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Get products from JSON and merge live state from MySQL."""
        self._ensure_products_loaded()
        
        products = [dict(product) for product in self._products]
        
        try:
            db = DatabaseManager()
            if db.check_connection():
                live_states = db.execute_query(
                    """
                    SELECT id, stock, status, requires_clearance, fabrication_progress
                    FROM products
                    """,
                    fetch_all=True
                )
                state_map = {state['id']: state for state in live_states}
                for product in products:
                    live_state = state_map.get(product.get('id'))
                    if live_state:
                        product.update(live_state)
        except Exception as e:
            logger.error(f"Could not merge MySQL state in get_products: {e}")
        
        # Apply filters
        if category and category != 'all':
            if category == 'restricted':
                products = [p for p in products if p.get('requires_clearance', False)]
            else:
                products = [p for p in products if p.get('category') == category]
        
        if status:
            products = [p for p in products if p.get('status') == status]
        
        if featured is not None:
            products = [p for p in products if p.get('is_featured', False) == featured]
        
        if search:
            search_lower = search.lower()
            products = [
                p for p in products
                if search_lower in p.get('name', '').lower() or
                   search_lower in p.get('description', '').lower() or
                   search_lower in p.get('id', '').lower()
            ]
        
        # Hide draft and (by default) discontinued products from public listings.
        products = [p for p in products if p.get('status') != 'draft']
        if not include_discontinued and status is None:
            products = [p for p in products if p.get('status') != 'discontinued']
        
        # Sort by sort_order, then by name
        products.sort(key=lambda x: (x.get('sort_order', 999), x.get('name', '')))
        
        # Get total count before pagination
        total = len(products)
        
        # Apply pagination
        products = products[offset:offset + limit]
        
        return {
            "products": products,
            "total": total,
            "limit": limit,
            "offset": offset
        }
    
    def get_product(self, product_id: str) -> Optional[Dict[str, Any]]:
        """Get product by ID from JSON and merge live state from MySQL."""
        self._ensure_products_loaded()
        
        for product in self._products:
            if product.get('id') == product_id:
                merged = dict(product)
                
                try:
                    db = DatabaseManager()
                    if db.check_connection():
                        live_state = db.execute_query(
                            """
                            SELECT stock, status, requires_clearance, fabrication_progress
                            FROM products
                            WHERE id = %s
                            """,
                            (product_id,),
                            fetch_one=True
                        )
                        if live_state:
                            merged.update(live_state)
                except Exception as e:
                    logger.error(f"Could not merge MySQL state for {product_id}: {e}")
                
                return merged
        
        return None
    
    def create_product(
        self,
        product_data,
        created_by: str
    ) -> str:
        """Create a new product and save to JSON"""
        self._ensure_products_loaded()
        
        product_id = product_data.id or self.generate_product_id(product_data.category)
        
        # Check if ID exists
        existing = self.get_product(product_id)
        if existing:
            raise HTTPException(status_code=400, detail="Product ID already exists")
        
        # Create new product dict
        new_product = {
            'id': product_id,
            'name': product_data.name,
            'category': product_data.category,
            'price': float(product_data.price) if product_data.price else 0,
            'description': product_data.description or '',
            'stock': product_data.stock or 0,
            'status': product_data.status or 'draft',
            'requires_clearance': product_data.requires_clearance or False,
            'is_featured': product_data.is_featured or False,
            'fabrication_progress': product_data.fabrication_progress,
            'image_url': product_data.image_url or '',
            'image_gallery': product_data.image_gallery or [],
            'features': product_data.features or [],
            'specifications': product_data.specifications or {},
            'tags': product_data.tags or [],
            'weight_kg': float(product_data.weight_kg) if product_data.weight_kg else 0,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat(),
            'created_by': created_by,
            'sort_order': product_data.sort_order or 999,
            'published_at': None
        }
        
        # Add to products list
        self._products.append(new_product)
        
        # Save to JSON file
        self._save_products()
        
        # Persist live state in MySQL inventory table.
        try:
            db = DatabaseManager()
            if db.check_connection():
                db.execute_query(
                    """
                    INSERT INTO products (id, stock, status, requires_clearance, fabrication_progress)
                    VALUES (%s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE
                        stock = VALUES(stock),
                        status = VALUES(status),
                        requires_clearance = VALUES(requires_clearance),
                        fabrication_progress = VALUES(fabrication_progress)
                    """,
                    (
                        new_product['id'],
                        new_product['stock'],
                        new_product['status'],
                        new_product['requires_clearance'],
                        new_product['fabrication_progress']
                    ),
                    commit=True
                )
        except Exception as e:
            logger.error(f"Failed to sync product state to MySQL for {product_id}: {e}")
        
        return product_id
    
    def update_product(
        self,
        product_id: str,
        product_data
    ) -> bool:
        """Update a product and save to JSON"""
        self._ensure_products_loaded()
        
        # Find product index
        product_index = None
        for i, product in enumerate(self._products):
            if product.get('id') == product_id:
                product_index = i
                break
        
        if product_index is None:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Update product fields
        if product_data.name is not None:
            self._products[product_index]['name'] = product_data.name
        
        if product_data.category is not None:
            self._products[product_index]['category'] = product_data.category
        
        if product_data.price is not None:
            self._products[product_index]['price'] = float(product_data.price)
        
        if product_data.description is not None:
            self._products[product_index]['description'] = product_data.description
        
        if product_data.stock is not None:
            self._products[product_index]['stock'] = product_data.stock
        
        if product_data.status is not None:
            self._products[product_index]['status'] = product_data.status
            # If publishing, set published_at
            if product_data.status not in ['draft', 'out_of_stock']:
                self._products[product_index]['published_at'] = datetime.now().isoformat()
        
        if product_data.requires_clearance is not None:
            self._products[product_index]['requires_clearance'] = product_data.requires_clearance
        
        if product_data.is_featured is not None:
            self._products[product_index]['is_featured'] = product_data.is_featured
        
        if product_data.fabrication_progress is not None:
            self._products[product_index]['fabrication_progress'] = product_data.fabrication_progress
        
        if product_data.image_url is not None:
            self._products[product_index]['image_url'] = product_data.image_url
        
        if product_data.image_gallery is not None:
            self._products[product_index]['image_gallery'] = product_data.image_gallery
        
        if product_data.features is not None:
            self._products[product_index]['features'] = product_data.features
        
        if product_data.specifications is not None:
            self._products[product_index]['specifications'] = product_data.specifications
        
        if product_data.tags is not None:
            self._products[product_index]['tags'] = product_data.tags
        
        if product_data.weight_kg is not None:
            self._products[product_index]['weight_kg'] = float(product_data.weight_kg)
        
        if product_data.sort_order is not None:
            self._products[product_index]['sort_order'] = product_data.sort_order
        
        # Always update updated_at
        self._products[product_index]['updated_at'] = datetime.now().isoformat()
        
        # Save to JSON file
        self._save_products()
        
        # Persist live state updates in MySQL inventory table.
        try:
            db = DatabaseManager()
            if db.check_connection():
                db.execute_query(
                    """
                    INSERT INTO products (id, stock, status, requires_clearance, fabrication_progress)
                    VALUES (%s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE
                        stock = VALUES(stock),
                        status = VALUES(status),
                        requires_clearance = VALUES(requires_clearance),
                        fabrication_progress = VALUES(fabrication_progress)
                    """,
                    (
                        self._products[product_index]['id'],
                        self._products[product_index].get('stock', 0),
                        self._products[product_index].get('status', 'draft'),
                        self._products[product_index].get('requires_clearance', False),
                        self._products[product_index].get('fabrication_progress', 0)
                    ),
                    commit=True
                )
        except Exception as e:
            logger.error(f"Failed to sync updated product state to MySQL for {product_id}: {e}")
        
        return True
    
    def delete_product(self, product_id: str) -> bool:
        """Delete a product from JSON"""
        self._ensure_products_loaded()
        
        # Find product index
        product_index = None
        for i, product in enumerate(self._products):
            if product.get('id') == product_id:
                product_index = i
                break
        
        if product_index is None:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Instead of deleting, mark as discontinued
        self._products[product_index]['status'] = 'discontinued'
        self._products[product_index]['stock'] = 0
        self._products[product_index]['updated_at'] = datetime.now().isoformat()
        
        # Save to JSON file
        self._save_products()
        
        # Keep MySQL live state aligned with the discontinued record.
        try:
            db = DatabaseManager()
            if db.check_connection():
                db.execute_query(
                    """
                    INSERT INTO products (id, stock, status, requires_clearance, fabrication_progress)
                    VALUES (%s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE
                        stock = VALUES(stock),
                        status = VALUES(status),
                        requires_clearance = VALUES(requires_clearance),
                        fabrication_progress = VALUES(fabrication_progress)
                    """,
                    (
                        self._products[product_index]['id'],
                        self._products[product_index].get('stock', 0),
                        self._products[product_index].get('status', 'discontinued'),
                        self._products[product_index].get('requires_clearance', False),
                        self._products[product_index].get('fabrication_progress', 0)
                    ),
                    commit=True
                )
        except Exception as e:
            logger.error(f"Failed to sync discontinued product state to MySQL for {product_id}: {e}")
        
        return False  # Not actually deleted, just discontinued
    
    def update_stock(self, product_id: str, quantity_change: int) -> int:
        """Update product stock in JSON"""
        self._ensure_products_loaded()
        
        for product in self._products:
            if product.get('id') == product_id:
                new_stock = (product.get('stock', 0) or 0) + quantity_change
                product['stock'] = max(0, new_stock)
                product['updated_at'] = datetime.now().isoformat()
                self._save_products()
                return product['stock']
        
        return 0
    
    def search_products(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search products from JSON"""
        self._ensure_products_loaded()
        
        search_lower = query.lower()
        results = []
        
        for product in self._products:
            if product.get('status') == 'draft':
                continue
            
            # Simple text search
            if (search_lower in product.get('name', '').lower() or
                search_lower in product.get('description', '').lower()):
                results.append(product)
                if len(results) >= limit:
                    break
        
        return results
    
    def get_all_categories(self) -> List[Dict[str, Any]]:
        """Get all product categories with counts"""
        self._ensure_products_loaded()
        
        categories = {}
        for product in self._products:
            if product.get('status') == 'draft':
                continue
            
            cat = product.get('category', 'other')
            if cat not in categories:
                categories[cat] = {
                    'id': cat,
                    'name': cat.replace('_', ' ').title(),
                    'count': 0,
                    'products': []
                }
            categories[cat]['count'] += 1
        
        return list(categories.values())

# ============================================================================
