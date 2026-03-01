from __future__ import annotations

import json
import threading
import time
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Dict, Generator, List, Optional, Tuple, Union

from app.config import (
    Config,
    IS_PRODUCTION,
    MYSQL_AVAILABLE,
    mysql,
    MySQLConnection,
    MySQLCursor,
    ClientFlag,
    ER_ACCESS_DENIED_ERROR,
    ER_BAD_DB_ERROR,
    HTTPException,
    logger,
)

# DATABASE MANAGER - COMPLETE IMPLEMENTATION
# ============================================================================

class DatabaseManager:
    """
    Complete MySQL database manager with connection pooling, transactions,
    and comprehensive error handling
    """
    
    _instance = None
    _pool = None
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
        self._pool = None
        self._connection_count = 0
        self._query_count = 0
        self._error_count = 0
        self._start_time = time.time()
        
        if not MYSQL_AVAILABLE:
            logger.warning("mysql-connector-python is not available; database-backed features are disabled.")
            self._connection_pool_config = {}
            return
        
        self._connection_pool_config = {
            "pool_name": "vikash_pool",
            "pool_size": Config.DB_POOL_SIZE,
            "pool_reset_session": True,
            "host": Config.DB_HOST,
            "port": Config.DB_PORT,
            "database": Config.DB_NAME,
            "user": Config.DB_USER,
            "password": Config.DB_PASSWORD,
            "charset": Config.DB_CHARSET,
            "collation": Config.DB_COLLATION,
            "use_unicode": True,
            "autocommit": False,
            "buffered": True,
            "raise_on_warnings": False,
            "connection_timeout": Config.DB_POOL_TIMEOUT,
            "get_warnings": True,
            "consume_results": True,
            "allow_local_infile": False,
            "allow_local_infile_in_path": "",
            "client_flags": self._build_client_flags()
        }
        
        # Initialize connection pool
        self._initialize_pool()

    def _build_client_flags(self) -> List[int]:
        """Build client flags defensively across mysql-connector versions."""
        if not ClientFlag:
            return []
        
        flag_names = [
            "MULTI_STATEMENTS",
            "PROTOCOL_41",
            "TRANSACTIONS",
            "SECURE_CONNECTION",
            "MULTI_RESULTS",
            "PS_MULTI_RESULTS",
            "PLUGIN_AUTH",
            "CONNECT_ARGS",
            "FOUND_ROWS",
            "LONG_FLAG"
        ]
        flags: List[int] = []
        for flag_name in flag_names:
            flag_value = getattr(ClientFlag, flag_name, None)
            if flag_value is not None:
                flags.append(flag_value)
        
        return flags
    
    def _initialize_pool(self):
        """Initialize the connection pool"""
        try:
            logger.info(f"Initializing MySQL connection pool to {Config.DB_HOST}:{Config.DB_PORT}/{Config.DB_NAME}")
            
            # Test connection first
            test_conn = mysql.connector.connect(
                host=Config.DB_HOST,
                port=Config.DB_PORT,
                user=Config.DB_USER,
                password=Config.DB_PASSWORD,
                database=Config.DB_NAME,
                connection_timeout=10
            )
            test_conn.close()
            
            # Create pool
            self._pool = mysql.connector.pooling.MySQLConnectionPool(**self._connection_pool_config)
            
            logger.info(f"MySQL connection pool created successfully with size {Config.DB_POOL_SIZE}")
            return True
            
        except mysql.connector.Error as e:
            log_fn = logger.critical if IS_PRODUCTION else logger.warning
            log_fn(f"Failed to create MySQL connection pool: {e}")
            if e.errno == ER_ACCESS_DENIED_ERROR:
                log_fn("Access denied. Check username and password.")
            elif e.errno == ER_BAD_DB_ERROR:
                log_fn(f"Database '{Config.DB_NAME}' does not exist. Run setup_mysql.py first.")
            elif e.errno == 2003:
                log_fn(f"Cannot connect to MySQL server on {Config.DB_HOST}:{Config.DB_PORT}")
            self._pool = None
            return False
        except Exception as e:
            log_fn = logger.critical if IS_PRODUCTION else logger.warning
            log_fn(f"Unexpected error creating connection pool: {e}")
            self._pool = None
            return False
    
    def get_connection(self) -> MySQLConnection:
        """Get a database connection from the pool"""
        if not self._pool:
            raise HTTPException(
                status_code=503,
                detail="Database connection pool not available"
            )
        
        try:
            conn = self._pool.get_connection()
            self._connection_count += 1
            return conn
        except mysql.connector.PoolError as e:
            logger.error(f"Pool exhausted: {e}")
            raise HTTPException(
                status_code=503,
                detail="Database connection pool exhausted. Try again later."
            )
        except mysql.connector.Error as e:
            logger.error(f"Failed to get connection from pool: {e}")
            raise HTTPException(
                status_code=503,
                detail="Database connection error"
            )
    
    @contextmanager
    def connection(self) -> Generator[MySQLConnection, None, None]:
        """Context manager for database connections"""
        conn = None
        try:
            conn = self.get_connection()
            yield conn
        finally:
            if conn:
                conn.close()
                self._connection_count -= 1
    
    @contextmanager
    def cursor(self, dictionary: bool = True, prepared: bool = False) -> Generator[MySQLCursor, None, None]:
        """Context manager for database cursors"""
        with self.connection() as conn:
            cursor = None
            try:
                cursor = conn.cursor(
                    dictionary=dictionary,
                    prepared=prepared,
                    buffered=True
                )
                yield cursor
                conn.commit()
            except Exception as e:
                conn.rollback()
                self._error_count += 1
                raise e
            finally:
                if cursor:
                    cursor.close()
                self._query_count += 1
    
    def execute_query(
        self,
        query: str,
        params: Optional[Union[Tuple, Dict, List]] = None,
        fetch_one: bool = False,
        fetch_all: bool = False,
        fetch_many: Optional[int] = None,
        commit: bool = True
    ) -> Any:
        """Execute a SQL query with parameters"""
        start_time = time.time()
        
        with self.cursor(dictionary=True) as cursor:
            try:
                # Execute query
                if params:
                    if isinstance(params, (list, tuple)):
                        cursor.execute(query, params)
                    elif isinstance(params, dict):
                        cursor.execute(query, params)
                    else:
                        cursor.execute(query, (params,))
                else:
                    cursor.execute(query)
                
                # Get results
                if fetch_one:
                    result = cursor.fetchone()
                elif fetch_all:
                    result = cursor.fetchall()
                elif fetch_many:
                    result = cursor.fetchmany(fetch_many)
                else:
                    result = cursor.lastrowid
                
                execution_time = (time.time() - start_time) * 1000
                
                # Log slow queries
                if execution_time > 1000:  # 1 second
                    logger.warning(f"Slow query ({execution_time:.0f}ms): {query[:200]}...")
                
                return result
                
            except mysql.connector.Error as e:
                logger.error(f"MySQL error {e.errno}: {e.msg}")
                logger.debug(f"Query: {query}")
                logger.debug(f"Params: {params}")
                
                if e.errno == 1062:  # Duplicate entry
                    raise HTTPException(status_code=400, detail="Duplicate entry")
                elif e.errno == 1451:  # Foreign key constraint
                    raise HTTPException(status_code=400, detail="Cannot delete: record is in use")
                elif e.errno == 1452:  # Cannot add or update child row
                    raise HTTPException(status_code=400, detail="Referenced record does not exist")
                elif e.errno == 1406:  # Data too long
                    raise HTTPException(status_code=400, detail="Data too long for column")
                elif e.errno == 1048:  # Column cannot be null
                    raise HTTPException(status_code=400, detail="Required field is null")
                elif e.errno == 1064:  # SQL syntax error
                    logger.error(f"SQL syntax error: {e.msg}")
                    raise HTTPException(status_code=500, detail="Database query error")
                else:
                    raise HTTPException(status_code=500, detail=f"Database error: {e.msg}")
                    
            except Exception as e:
                logger.error(f"Unexpected database error: {e}")
                raise HTTPException(status_code=500, detail="Unexpected database error")
    
    def execute_transaction(self, queries: List[Tuple[str, Optional[Union[Tuple, Dict, List]]]]) -> List[Any]:
        """Execute multiple queries in a transaction"""
        results = []
        
        with self.connection() as conn:
            try:
                conn.start_transaction()
                cursor = conn.cursor(dictionary=True)
                
                for query, params in queries:
                    if params:
                        if isinstance(params, (list, tuple)):
                            cursor.execute(query, params)
                        elif isinstance(params, dict):
                            cursor.execute(query, params)
                        else:
                            cursor.execute(query, (params,))
                    else:
                        cursor.execute(query)
                    
                    if cursor.with_rows:
                        results.append(cursor.fetchall())
                    else:
                        results.append(cursor.lastrowid)
                
                conn.commit()
                return results
                
            except Exception as e:
                conn.rollback()
                logger.error(f"Transaction failed: {e}")
                raise e
            finally:
                cursor.close()
    
    def execute_batch(self, query: str, params_list: List[Union[Tuple, Dict, List]]) -> int:
        """Execute a batch of queries"""
        affected_rows = 0
        
        with self.connection() as conn:
            try:
                conn.start_transaction()
                cursor = conn.cursor(dictionary=True)
                
                cursor.executemany(query, params_list)
                affected_rows = cursor.rowcount
                
                conn.commit()
                
            except Exception as e:
                conn.rollback()
                logger.error(f"Batch execute failed: {e}")
                raise e
            finally:
                cursor.close()
        
        return affected_rows
    
    def call_procedure(self, procedure_name: str, args: Optional[List] = None) -> Any:
        """Call a stored procedure"""
        with self.cursor(dictionary=True) as cursor:
            try:
                cursor.callproc(procedure_name, args or [])
                
                # Get results
                results = []
                for result in cursor.stored_results():
                    results.extend(result.fetchall())
                
                return results
                
            except mysql.connector.Error as e:
                logger.error(f"Procedure call failed: {e}")
                raise HTTPException(status_code=500, detail="Stored procedure execution failed")
    
    # ========================================================================
    # DATABASE INITIALIZATION AND MIGRATION
    # ========================================================================
    
    def initialize_database(self) -> Dict[str, Any]:
        """Initialize database schema and seed data"""
        results = {
            "tables_created": [],
            "users_created": 0,
            "products_created": 0,
            "errors": []
        }
        
        # SQL for creating tables
        create_tables_sql = {
            "users": """
                CREATE TABLE IF NOT EXISTS users (
                    id VARCHAR(36) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    username VARCHAR(100) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    clearance_level INT DEFAULT 3,
                    balance DECIMAL(10, 2) DEFAULT 1500.00,
                    is_active BOOLEAN DEFAULT TRUE,
                    is_verified BOOLEAN DEFAULT FALSE,
                    last_login DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_email (email),
                    INDEX idx_username (username),
                    INDEX idx_clearance (clearance_level),
                    INDEX idx_created_at (created_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """,
            
            "tokens": """
                CREATE TABLE IF NOT EXISTS tokens (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id VARCHAR(36) NOT NULL,
                    token VARCHAR(512) UNIQUE NOT NULL,
                    token_type ENUM('access', 'refresh', 'reset') DEFAULT 'access',
                    expires_at DATETIME NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    INDEX idx_token (token),
                    INDEX idx_user_id (user_id),
                    INDEX idx_expires_at (expires_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """,
            
            "products": """
                CREATE TABLE IF NOT EXISTS products (
                    id VARCHAR(50) PRIMARY KEY,
                    stock INT DEFAULT 0,
                    reserved_stock INT DEFAULT 0,
                    status ENUM('draft', 'in_stock', 'limited', 'fabricating', 'preorder', 'out_of_stock', 'discontinued', 'restricted') DEFAULT 'draft',
                    requires_clearance BOOLEAN DEFAULT FALSE,
                    fabrication_progress INT DEFAULT 0,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_status (status),
                    INDEX idx_requires_clearance (requires_clearance)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """,
            
            "carts": """
                CREATE TABLE IF NOT EXISTS carts (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id VARCHAR(36) NOT NULL,
                    product_id VARCHAR(50) NOT NULL,
                    quantity INT NOT NULL DEFAULT 1,
                    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                    UNIQUE KEY unique_cart_item (user_id, product_id),
                    INDEX idx_user_id (user_id),
                    INDEX idx_product_id (product_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """,
            
            "orders": """
                CREATE TABLE IF NOT EXISTS orders (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    order_number VARCHAR(50) UNIQUE NOT NULL,
                    user_id VARCHAR(36) NOT NULL,
                    status ENUM('pending', 'processing', 'confirmed', 'fabricating', 'shipped', 'delivered', 'cancelled', 'refunded') DEFAULT 'pending',
                    total DECIMAL(10, 2) NOT NULL,
                    subtotal DECIMAL(10, 2) NOT NULL,
                    tax DECIMAL(10, 2) DEFAULT 0,
                    shipping DECIMAL(10, 2) DEFAULT 0,
                    discount DECIMAL(10, 2) DEFAULT 0,
                    shipping_address TEXT NOT NULL,
                    billing_address TEXT,
                    contact_number VARCHAR(50) NOT NULL,
                    email VARCHAR(255),
                    payment_method VARCHAR(50) NOT NULL,
                    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
                    payment_id VARCHAR(255),
                    notes TEXT,
                    tracking_number VARCHAR(100),
                    estimated_delivery DATETIME,
                    actual_delivery DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    INDEX idx_order_number (order_number),
                    INDEX idx_user_id (user_id),
                    INDEX idx_status (status),
                    INDEX idx_payment_status (payment_status),
                    INDEX idx_created_at (created_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """,
            
            "order_items": """
                CREATE TABLE IF NOT EXISTS order_items (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    order_id INT NOT NULL,
                    product_id VARCHAR(50) NOT NULL,
                    product_name VARCHAR(255) NOT NULL,
                    product_price DECIMAL(10, 2) NOT NULL,
                    quantity INT NOT NULL DEFAULT 1,
                    total DECIMAL(10, 2) NOT NULL,
                    specifications JSON,
                    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
                    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                    INDEX idx_order_id (order_id),
                    INDEX idx_product_id (product_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """,
            
            "system_logs": """
                CREATE TABLE IF NOT EXISTS system_logs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    level ENUM('info', 'warning', 'error', 'security') DEFAULT 'info',
                    module VARCHAR(100),
                    action VARCHAR(100),
                    user_id VARCHAR(36),
                    ip_address VARCHAR(45),
                    user_agent VARCHAR(500),
                    details JSON,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                    INDEX idx_level (level),
                    INDEX idx_user_id (user_id),
                    INDEX idx_created_at (created_at),
                    INDEX idx_module (module)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """,
            
            "fabrication_queue": """
                CREATE TABLE IF NOT EXISTS fabrication_queue (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    product_id VARCHAR(50) NOT NULL,
                    order_id INT,
                    stage ENUM('design', 'pcb', 'assembly', 'testing', 'packaging', 'completed') DEFAULT 'design',
                    status ENUM('pending', 'in_progress', 'completed', 'failed') DEFAULT 'pending',
                    assigned_to VARCHAR(36),
                    priority INT DEFAULT 1,
                    notes TEXT,
                    started_at DATETIME,
                    completed_at DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
                    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
                    INDEX idx_product_id (product_id),
                    INDEX idx_order_id (order_id),
                    INDEX idx_status (status),
                    INDEX idx_stage (stage)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """
        }
        
        try:
            # Create tables in order
            for table_name, create_sql in create_tables_sql.items():
                try:
                    self.execute_query(create_sql, commit=True)
                    results["tables_created"].append(table_name)
                    logger.info(f"Table '{table_name}' created/verified")
                except Exception as e:
                    results["errors"].append(f"Failed to create {table_name}: {e}")
                    logger.error(f"Failed to create table {table_name}: {e}")

            # Apply lightweight schema migrations for existing installations.
            try:
                token_col = self.execute_query(
                    """
                    SELECT CHARACTER_MAXIMUM_LENGTH AS max_len
                    FROM information_schema.COLUMNS
                    WHERE TABLE_SCHEMA = %s
                      AND TABLE_NAME = 'tokens'
                      AND COLUMN_NAME = 'token'
                    """,
                    (Config.DB_NAME,),
                    fetch_one=True
                )
                max_len = token_col.get("max_len") if token_col else None
                if max_len is not None and max_len < 512:
                    self.execute_query(
                        "ALTER TABLE tokens MODIFY COLUMN token VARCHAR(512) NOT NULL",
                        commit=True
                    )
                    logger.info(
                        "Migrated tokens.token from VARCHAR(%s) to VARCHAR(512)",
                        max_len
                    )
            except Exception as e:
                results["errors"].append(f"Schema migration warning (tokens.token): {e}")
                logger.warning(f"Schema migration warning (tokens.token): {e}")
             
            # Seed sample products if none exist
            product_count = self.execute_query(
                "SELECT COUNT(*) as count FROM products",
                fetch_one=True
            )['count']
            
            if product_count == 0:
                sample_products = [
                    {
                        'id': 'ESP32-001',
                        'name': 'ESP32 Development Board',
                        'category': 'microcontrollers',
                        'price': 24.99,
                        'description': 'ESP32-WROOM-32 module with dual-core processor, integrated WiFi and Bluetooth LE.',
                        'stock': 50,
                        'status': 'in_stock',
                        'requires_clearance': False,
                        'fabrication_progress': 100,
                        'image_url': 'https://images.unsplash.com/photo-1518770660439-4636190af475',
                        'features': json.dumps(['WiFi', 'Bluetooth', 'Dual-core 240MHz', '4MB Flash', 'USB-C']),
                        'specifications': json.dumps({
                            'processor': 'ESP32-D0WDQ6',
                            'flash': '4MB',
                            'ram': '520KB',
                            'gpio': 34,
                            'voltage': '3.3V',
                            'dimensions': '5.5 x 2.8 x 0.8 cm'
                        }),
                        'weight_kg': 0.05,
                        'dimensions': '5.5x2.8x0.8',
                        'shipping_class': 'standard',
                        'is_featured': True,
                        'sort_order': 1
                    },
                    {
                        'id': 'RPI5-8GB',
                        'name': 'Raspberry Pi 5 (8GB)',
                        'category': 'sbc',
                        'price': 89.00,
                        'description': 'Latest Raspberry Pi 5 with 8GB RAM, quad-core Cortex-A76 CPU, and dual 4K display output.',
                        'stock': 25,
                        'status': 'in_stock',
                        'requires_clearance': False,
                        'fabrication_progress': 100,
                        'image_url': 'https://images.unsplash.com/photo-1582719478257-5e9ab8d7c0c4',
                        'features': json.dumps(['Quad-core 2.4GHz', '8GB LPDDR4X', 'Dual 4K HDMI', 'PCIe 2.0', 'USB 3.0']),
                        'specifications': json.dumps({
                            'soc': 'BCM2712',
                            'cpu': 'Cortex-A76 @ 2.4GHz',
                            'ram': '8GB LPDDR4X',
                            'gpu': 'VideoCore VII',
                            'usb': '2x USB 3.0, 2x USB 2.0',
                            'dimensions': '8.5 x 5.6 x 1.7 cm'
                        }),
                        'weight_kg': 0.1,
                        'dimensions': '8.5x5.6x1.7',
                        'shipping_class': 'standard',
                        'is_featured': True,
                        'sort_order': 2
                    },
                    {
                        'id': 'LORA-001',
                        'name': 'Secure LoRaWAN Node',
                        'category': 'iot',
                        'price': 59.00,
                        'description': 'Long-range encrypted sensor node with secure element, solar charging, and deep sleep mode.',
                        'stock': 15,
                        'status': 'fabricating',
                        'requires_clearance': True,
                        'fabrication_progress': 68,
                        'image_url': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
                        'features': json.dumps(['SX1276 LoRa', 'ATECC608 Secure Element', 'Solar Charging', 'Deep Sleep', 'AES-256']),
                        'specifications': json.dumps({
                            'frequency': '868/915 MHz',
                            'range': '10-15 km LOS',
                            'encryption': 'AES-256',
                            'battery': '18650/LiPo',
                            'power': '3.3V',
                            'dimensions': '6.2 x 3.5 x 1.8 cm'
                        }),
                        'weight_kg': 0.08,
                        'dimensions': '6.2x3.5x1.8',
                        'shipping_class': 'standard',
                        'is_featured': False,
                        'sort_order': 3
                    },
                    {
                        'id': 'PCB-001',
                        'name': 'Custom PCB Design Service',
                        'category': 'services',
                        'price': 349.00,
                        'description': 'Professional PCB design service including schematic capture, layout, DFM review, and manufacturing files.',
                        'stock': 10,
                        'status': 'in_stock',
                        'requires_clearance': False,
                        'fabrication_progress': 100,
                        'image_url': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31',
                        'features': json.dumps(['Schematic Design', '4/6 Layer Layout', 'Impedance Control', 'DFM Review', 'Gerber Generation']),
                        'specifications': json.dumps({
                            'layers': 'Up to 6',
                            'turnaround': '5-7 business days',
                            'deliverables': 'Gerbers, BoM, Pick-n-Place',
                            'stackup': 'Controlled impedance',
                            'review': 'Included'
                        }),
                        'weight_kg': 0,
                        'dimensions': 'N/A',
                        'shipping_class': 'digital',
                        'is_featured': True,
                        'sort_order': 4
                    }
                ]
                
                for product in sample_products:
                    try:
                        self.execute_query(
                            """
                            INSERT INTO products 
                            (id, stock, status, requires_clearance, fabrication_progress)
                            VALUES (%s, %s, %s, %s, %s)
                            """,
                            (
                                product['id'],
                                product['stock'],
                                product['status'],
                                product['requires_clearance'],
                                product['fabrication_progress']
                            ),
                            commit=True
                        )
                        results["products_created"] += 1
                    except Exception as e:
                        results["errors"].append(f"Failed to seed product {product['id']}: {e}")
                
                logger.info(f"Seeded {results['products_created']} sample products")
            
            return results
            
        except Exception as e:
            logger.error(f"Database initialization failed: {e}")
            results["errors"].append(str(e))
            return results
    
    def check_connection(self) -> bool:
        """Check if database connection is available"""
        try:
            self.execute_query("SELECT 1", fetch_one=True)
            return True
        except Exception:
            return False
    
    def get_database_info(self) -> Dict[str, Any]:
        """Get database information and statistics"""
        info = {
            "connected": self.check_connection(),
            "pool_size": Config.DB_POOL_SIZE,
            "active_connections": self._connection_count,
            "total_queries": self._query_count,
            "error_count": self._error_count,
            "uptime_seconds": int(time.time() - self._start_time)
        }
        
        if info["connected"]:
            # Get table counts
            tables = ["users", "products", "orders", "carts", "tokens", "system_logs", "fabrication_queue"]
            for table in tables:
                try:
                    result = self.execute_query(f"SELECT COUNT(*) as count FROM {table}", fetch_one=True)
                    info[f"{table}_count"] = result['count']
                except:
                    info[f"{table}_count"] = -1
            
            # Get database size
            try:
                result = self.execute_query(
                    """
                    SELECT 
                        SUM(data_length + index_length) as size_bytes
                    FROM information_schema.tables
                    WHERE table_schema = %s
                    """,
                    (Config.DB_NAME,),
                    fetch_one=True
                )
                info["database_size_bytes"] = result['size_bytes'] or 0
                info["database_size_mb"] = round(info["database_size_bytes"] / (1024 * 1024), 2)
            except:
                info["database_size_bytes"] = 0
                info["database_size_mb"] = 0
        
        return info
    
    def backup_database(self, backup_path: Optional[Path] = None) -> Path:
        """Create a database backup"""
        if not backup_path:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_path = Path("backups") / f"vikash_store_backup_{timestamp}.sql"
        
        backup_path.parent.mkdir(parents=True, exist_ok=True)
        
        try:
            import subprocess
            import shutil
            
            # Check if mysqldump is available
            mysqldump_path = shutil.which("mysqldump")
            if not mysqldump_path:
                raise Exception("mysqldump not found in PATH")
            
            # Build command
            cmd = [
                mysqldump_path,
                "--host", Config.DB_HOST,
                "--port", str(Config.DB_PORT),
                "--user", Config.DB_USER,
                f"--password={Config.DB_PASSWORD}",
                "--routines",
                "--triggers",
                "--events",
                "--single-transaction",
                "--quick",
                "--compress",
                Config.DB_NAME
            ]
            
            # Execute backup
            with open(backup_path, 'w', encoding='utf-8') as f:
                process = subprocess.Popen(cmd, stdout=f, stderr=subprocess.PIPE)
                _, stderr = process.communicate()
                
                if process.returncode != 0:
                    raise Exception(f"mysqldump failed: {stderr.decode()}")
            
            # Compress backup
            import gzip
            with open(backup_path, 'rb') as f_in:
                with gzip.open(f"{backup_path}.gz", 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)
            
            # Remove uncompressed file
            backup_path.unlink()
            
            logger.info(f"Database backup created: {backup_path}.gz")
            return Path(f"{backup_path}.gz")
            
        except Exception as e:
            logger.error(f"Database backup failed: {e}")
            raise HTTPException(status_code=500, detail=f"Database backup failed: {str(e)}")
    
    def restore_database(self, backup_path: Path) -> bool:
        """Restore database from backup"""
        try:
            import subprocess
            import shutil
            import gzip
            
            # Check if mysql is available
            mysql_path = shutil.which("mysql")
            if not mysql_path:
                raise Exception("mysql client not found in PATH")
            
            # Decompress if needed
            if str(backup_path).endswith('.gz'):
                decompressed_path = backup_path.with_suffix('')
                with gzip.open(backup_path, 'rb') as f_in:
                    with open(decompressed_path, 'wb') as f_out:
                        shutil.copyfileobj(f_in, f_out)
                backup_path = decompressed_path
            
            # Build command
            cmd = [
                mysql_path,
                "--host", Config.DB_HOST,
                "--port", str(Config.DB_PORT),
                "--user", Config.DB_USER,
                f"--password={Config.DB_PASSWORD}",
                Config.DB_NAME
            ]
            
            # Execute restore
            with open(backup_path, 'r', encoding='utf-8') as f:
                process = subprocess.Popen(cmd, stdin=f, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                _, stderr = process.communicate()
                
                if process.returncode != 0:
                    raise Exception(f"mysql restore failed: {stderr.decode()}")
            
            # Clean up decompressed file
            if str(backup_path).endswith('.sql') and not str(backup_path).endswith('.gz'):
                backup_path.unlink()
            
            logger.info(f"Database restored from: {backup_path}")
            return True
            
        except Exception as e:
            logger.error(f"Database restore failed: {e}")
            raise HTTPException(status_code=500, detail=f"Database restore failed: {str(e)}")

# ============================================================================
