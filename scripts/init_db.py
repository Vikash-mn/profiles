#!/usr/bin/env python3
"""
Database Initialization Script for Hardware Warehouse
Run this script to initialize the database with tables and seed data.

Usage:
    python init_db.py [--force]

Options:
    --force    Drop and recreate all tables ( WARNING: data loss! )
"""

import sys
import argparse
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

# Database configuration
DATABASE_URL = "mysql+pymysql://vikash_user:secure_password_123@localhost:3306/vikash_system"

# Default products to seed
PRODUCT_CATALOG = [
    {
        "id": "ec001",
        "name": "ESP32 DevKitC",
        "category": "components",
        "price": 19.99,
        "description": "Dual-core WiFi/Bluetooth dev board with hardware crypto accelerator.",
        "stock": 42,
        "status": "in_stock",
        "requires_clearance": False,
        "fabrication_progress": 100,
        "image_url": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
        "features": ["Dual-core Xtensa LX6 @ 240MHz", "Integrated WiFi + Bluetooth LE", "Hardware AES/RSA accelerator", "USB-C programming interface"],
        "specifications": {"flash": "4MB", "connectivity": "2.4GHz WiFi / BLE 4.2", "gpio": 30, "power": "5V USB-C"}
    },
    {
        "id": "ec002",
        "name": "Raspberry Pi 5 (8GB)",
        "category": "components",
        "price": 129.00,
        "description": "Next-gen SBC with PCIe 2.0 lane exposed for high-speed peripherals.",
        "stock": 18,
        "status": "limited",
        "requires_clearance": False,
        "fabrication_progress": 100,
        "image_url": "https://images.unsplash.com/photo-1582719478248-54e9f2af4cf4?auto=format&fit=crop&w=800&q=80",
        "features": ["2.4GHz quad-core 64-bit SoC", "8GB LPDDR4X RAM", "Dual micro-HDMI 4K60", "PCIe 2.0 x1 on FFC"],
        "specifications": {"cpu": "Broadcom BCM2712", "ram": "8GB", "storage": "microSD / PCIe", "power": "USB-C PD"}
    },
    {
        "id": "ec003",
        "name": "Secure LoRaWAN Node",
        "category": "components",
        "price": 59.00,
        "description": "Long-range encrypted sensor node with secure boot and OTA updates.",
        "stock": 25,
        "status": "fabricating",
        "requires_clearance": False,
        "fabrication_progress": 68,
        "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
        "features": ["SX1276 LoRa transceiver", "Secure element (ATECC608)", "Solar input + LiPo charger", "Low-power deep sleep"],
        "specifications": {"frequency": "868/915 MHz", "range": "10-15 km LOS", "encryption": "AES-256 w/ hardware key store", "battery": "18650 / LiPo"}
    },
    {
        "id": "pj001",
        "name": "Custom PCB Design Sprint",
        "category": "projects",
        "price": 349.00,
        "description": "One-week turnaround for 4-layer PCBs with DFM checks and gerber review.",
        "stock": 5,
        "status": "in_progress",
        "requires_clearance": False,
        "fabrication_progress": 45,
        "image_url": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
        "features": ["Schematic capture + layout", "Impedance controlled routing", "DFM/DFT review", "BOM optimization"],
        "specifications": {"layers": "Up to 6", "stackup": "Controlled impedance", "deliverables": "Gerbers, BoM, Pick-and-place", "timeline": "5 business days"}
    },
    {
        "id": "pj002",
        "name": "Firmware Hardening Package",
        "category": "projects",
        "price": 499.00,
        "description": "Secure boot, signed updates, and memory safety review for embedded targets.",
        "stock": 7,
        "status": "in_progress",
        "requires_clearance": False,
        "fabrication_progress": 52,
        "image_url": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
        "features": ["Threat modeling workshop", "Secure boot enablement", "Signed OTA pipeline", "Static analysis + fuzzing"],
        "specifications": {"targets": "ARM Cortex-M / A", "artifacts": "Security report + patch set", "duration": "10 days", "compliance": "OWASP MAS / IoT"}
    },
    {
        "id": "pj003",
        "name": "Red Team Assessment",
        "category": "projects",
        "price": 899.00,
        "description": "Adversarial simulation covering cloud, firmware, and RF attack surfaces.",
        "stock": 3,
        "status": "available",
        "requires_clearance": False,
        "fabrication_progress": 100,
        "image_url": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
        "features": ["Cloud posture review", "Firmware binary analysis", "RF/ble threat emulation", "Executive summary + fixes"],
        "specifications": {"duration": "2 weeks", "reporting": "Daily findings channel", "team": "2 operators + 1 lead", "scope": "Web, cloud, embedded"}
    },
    {
        "id": "r001",
        "name": "Zero-Day Research Pack",
        "category": "restricted",
        "price": 1999.00,
        "description": "Private exploit proofs-of-concept with sanitized write-ups.",
        "stock": 2,
        "status": "restricted",
        "requires_clearance": True,
        "fabrication_progress": 80,
        "image_url": "https://images.unsplash.com/photo-1527434006472-52ae3e175c8a?auto=format&fit=crop&w=800&q=80",
        "features": ["2x recent CVE weaponized PoCs", "Reproduction environment scripts", "Mitigation guidance", "Weekly threat feed drop"],
        "specifications": {"delivery": "Encrypted archive", "targets": "Windows / Linux mix", "update_cycle": "Weekly", "nda": "Required"}
    },
    {
        "id": "r002",
        "name": "Portable RF Jammer",
        "category": "restricted",
        "price": 399.00,
        "description": "Configurable jammer covering 400-2500 MHz with directional antenna option.",
        "stock": 4,
        "status": "restricted",
        "requires_clearance": True,
        "fabrication_progress": 55,
        "image_url": "https://images.unsplash.com/photo-1505740106531-4243f3831c78?auto=format&fit=crop&w=800&q=80",
        "features": ["Programmable bands", "Swappable antenna system", "Thermal protection", "Pelican-grade enclosure"],
        "specifications": {"bands": "400-2500 MHz", "power": "60W peak", "runtime": "90 minutes", "compliance": "Export controlled"}
    },
    {
        "id": "r003",
        "name": "Quantum Entropy Generator",
        "category": "restricted",
        "price": 1299.00,
        "description": "Hardware quantum RNG with PCIe edge connector and keystore.",
        "stock": 1,
        "status": "preorder",
        "requires_clearance": True,
        "fabrication_progress": 35,
        "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
        "features": ["True quantum noise source", "Onboard HSM-backed key store", "Deterministic seeding API", "FIPS 140-3 test vectors"],
        "specifications": {"throughput": "1 Gbit/s entropy", "interface": "PCIe x1 + USB-C", "drivers": "Linux kernel module", "lead_time": "4 weeks"}
    }
]


def create_tables(engine, force=False):
    """Create database tables"""
    print("Creating database tables...")
    
    if force:
        print("WARNING: Dropping existing tables!")
        with engine.connect() as conn:
            conn.execute(text("DROP TABLE IF EXISTS orders"))
            conn.execute(text("DROP TABLE IF EXISTS user_carts"))
            conn.execute(text("DROP TABLE IF EXISTS auth_tokens"))
            conn.execute(text("DROP TABLE IF EXISTS store_users"))
            conn.execute(text("DROP TABLE IF EXISTS store_products"))
            conn.commit()
    
    # Create tables using SQL statements
    with engine.connect() as conn:
        # Store products table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS store_products (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(50) NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                description TEXT,
                stock INT DEFAULT 0,
                status VARCHAR(30) DEFAULT 'in_stock',
                requires_clearance BOOLEAN DEFAULT FALSE,
                fabrication_progress INT DEFAULT 100,
                image_url VARCHAR(500),
                features JSON,
                specifications JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_category (category),
                INDEX idx_status (status),
                INDEX idx_clearance (requires_clearance)
            )
        """))
        
        # Store users table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS store_users (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                username VARCHAR(100) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                clearance_level INT DEFAULT 3,
                balance DECIMAL(10, 2) DEFAULT 1500.00,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_email (email),
                INDEX idx_username (username)
            )
        """))
        
        # Auth tokens table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS auth_tokens (
                token VARCHAR(100) PRIMARY KEY,
                user_id VARCHAR(50) NOT NULL,
                issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL 24 HOUR),
                INDEX idx_user_id (user_id),
                INDEX idx_expires (expires_at)
            )
        """))
        
        # User carts table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS user_carts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(50) NOT NULL,
                product_id VARCHAR(50) NOT NULL,
                quantity INT NOT NULL DEFAULT 1,
                added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uk_user_product (user_id, product_id),
                INDEX idx_user_id (user_id)
            )
        """))
        
        # Orders table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_number VARCHAR(50) NOT NULL UNIQUE,
                user_id VARCHAR(50) NOT NULL,
                status VARCHAR(30) DEFAULT 'processing',
                total DECIMAL(10, 2) NOT NULL,
                shipping_address TEXT,
                contact_number VARCHAR(50),
                payment_method VARCHAR(50),
                notes TEXT,
                items JSON NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_user_id (user_id),
                INDEX idx_order_number (order_number),
                INDEX idx_status (status)
            )
        """))
        
        conn.commit()
    
    print("Tables created successfully!")


def seed_products(engine):
    """Seed products into database"""
    print("Checking existing products...")
    
    with engine.connect() as conn:
        result = conn.execute(text("SELECT COUNT(*) FROM store_products"))
        count = result.scalar()
        
        if count > 0:
            print(f"Database already contains {count} products. Skipping seed.")
            return count
        
        print(f"Seeding {len(PRODUCT_CATALOG)} products...")
        
        for product in PRODUCT_CATALOG:
            conn.execute(text("""
                INSERT INTO store_products 
                (id, name, category, price, description, stock, status, requires_clearance, 
                 fabrication_progress, image_url, features, specifications)
                VALUES 
                (:id, :name, :category, :price, :description, :stock, :status, :requires_clearance,
                 :fabrication_progress, :image_url, :features, :specifications)
            """), {
                "id": product["id"],
                "name": product["name"],
                "category": product["category"],
                "price": product["price"],
                "description": product["description"],
                "stock": product["stock"],
                "status": product["status"],
                "requires_clearance": 1 if product.get("requires_clearance") else 0,
                "fabrication_progress": product.get("fabrication_progress", 100),
                "image_url": product.get("image_url"),
                "features": str(product.get("features", [])),
                "specifications": str(product.get("specifications", {}))
            })
        
        conn.commit()
    
    print(f"Successfully seeded {len(PRODUCT_CATALOG)} products!")
    return len(PRODUCT_CATALOG)


def verify_database(engine):
    """Verify database setup"""
    print("\n=== Database Verification ===")
    
    with engine.connect() as conn:
        # Check tables exist
        tables = ["store_products", "store_users", "auth_tokens", "user_carts", "orders"]
        for table in tables:
            result = conn.execute(text(f"SHOW TABLES LIKE '{table}'"))
            exists = result.scalar() is not None
            print(f"  [{'✓' if exists else '✗'}] {table}")
        
        # Count records
        print("\n=== Record Counts ===")
        result = conn.execute(text("SELECT COUNT(*) FROM store_products"))
        print(f"  Products: {result.scalar()}")
        
        result = conn.execute(text("SELECT COUNT(*) FROM store_users"))
        print(f"  Users: {result.scalar()}")
        
        result = conn.execute(text("SELECT COUNT(*) FROM orders"))
        print(f"  Orders: {result.scalar()}")


def main():
    parser = argparse.ArgumentParser(description="Initialize the database")
    parser.add_argument("--force", action="store_true", help="Force recreation of tables (WARNING: data loss!)")
    args = parser.parse_args()
    
    print("=" * 50)
    print("Hardware Warehouse Database Initialization")
    print("=" * 50)
    
    try:
        # Create engine
        print("\nConnecting to database...")
        engine = create_engine(DATABASE_URL, pool_pre_ping=True)
        
        # Test connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("Database connection successful!")
        
        # Create tables
        create_tables(engine, force=args.force)
        
        # Seed products
        product_count = seed_products(engine)
        
        # Verify
        verify_database(engine)
        
        print("\n" + "=" * 50)
        print("Database initialization completed successfully!")
        print(f"Loaded {product_count} products.")
        print("=" * 50)
        
        return 0
        
    except SQLAlchemyError as e:
        print(f"\nDatabase error: {e}")
        print("\nMake sure MySQL is running and credentials are correct.")
        print("You can start MySQL using: docker-compose up -d mysql")
        return 1
    except Exception as e:
        print(f"\nError: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
