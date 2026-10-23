#!/usr/bin/env python3
"""
Database setup script for Vikash Store (Hybrid JSON/SQL Architecture)
"""

import argparse
import getpass
import os
import sys
from pathlib import Path

import mysql.connector
from dotenv import load_dotenv
from mysql.connector import Error


ROOT_DIR = Path(__file__).resolve().parents[1]
load_dotenv(ROOT_DIR / ".env")

def prompt_required(label: str, default: str = "") -> str:
    while True:
        value = input(f"{label}{f' [{default}]' if default else ''}: ").strip() or default
        if value:
            return value
        print(f"Error: {label} is required")

def prompt_required_password(label: str) -> str:
    while True:
        value = getpass.getpass(f"{label}: ")
        if value:
            return value
        print(f"Error: {label} is required")

def env_or_default(name: str, default: str = "") -> str:
    return os.getenv(name, default)


def env_first(*names: str, default: str = "") -> str:
    for name in names:
        value = os.getenv(name)
        if value not in (None, ""):
            return value
    return default


def setup_database():
    parser = argparse.ArgumentParser(description="Initialize Vikash Store MySQL schema")
    parser.add_argument("--noninteractive", action="store_true", help="Use env/flags instead of prompts")
    parser.add_argument("--host", default=env_first("VIKASH_DB_HOST", "DB_HOST", default="localhost"))
    parser.add_argument("--port", type=int, default=int(env_first("VIKASH_DB_PORT", "DB_PORT", default="3306")))
    parser.add_argument("--db-name", default=env_first("VIKASH_DB_NAME", "DB_NAME", default="vikash_store"))
    parser.add_argument("--root-user", default=env_first("DB_ROOT_USER", default="root"))
    parser.add_argument("--root-password", default=env_first("DB_ROOT_PASSWORD", default=""))
    parser.add_argument("--app-user", default=env_first("VIKASH_DB_USER", "APP_DB_USER", default="vikash_user"))
    parser.add_argument("--app-password", default=env_first("VIKASH_DB_PASSWORD", "APP_DB_PASSWORD", default=""))
    parser.add_argument("--drop-first", action="store_true", help="Drop existing vikash_store database before creating")
    args = parser.parse_args()

    noninteractive = args.noninteractive or os.getenv("SETUP_MYSQL_NONINTERACTIVE") == "1"

    print("=" * 60)
    print("VIKASH STORE - HYBRID DATABASE SETUP")
    print("=" * 60)
    print("Architecture: JSON (Product Details) + MySQL (Inventory State)")
    print(f"Config source: {ROOT_DIR / '.env'}")
    print("=" * 60)
    
    if noninteractive:
        root_user = args.root_user
        root_password = args.root_password
        app_db_user = args.app_user
        app_db_password = args.app_password
        if not app_db_password:
            print("Error: APP_DB_PASSWORD is required in non-interactive mode.")
            print("Set VIKASH_DB_PASSWORD in .env or pass --app-password explicitly.")
            sys.exit(1)
    else:
        # Get MySQL root credentials
        print("\nEnter MySQL root credentials (to create database and user):")
        root_user = prompt_required("Root username", args.root_user)
        root_password = prompt_required_password("Root password")
        
        print("\nConfigure application database user:")
        app_db_user = prompt_required("App DB username", args.app_user)
        app_db_password = prompt_required_password("App DB password")
    
    try:
        # Connect to MySQL
        print("\nConnecting to MySQL...")
        conn = mysql.connector.connect(
            host=args.host,
            port=args.port,
            user=root_user,
            password=root_password
        )
        cursor = conn.cursor()
        
        if args.drop_first:
            print(f"Dropping database '{args.db_name}'...")
            cursor.execute(f"DROP DATABASE IF EXISTS `{args.db_name}`")

        # Create database
        print(f"Creating database '{args.db_name}'...")
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{args.db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        
        # Create app database user
        print(f"Creating database user '{app_db_user}'...")
        cursor.execute(f"DROP USER IF EXISTS `{app_db_user}`@'localhost'")
        cursor.execute(f"CREATE USER `{app_db_user}`@'localhost' IDENTIFIED BY %s", (app_db_password,))
        
        # Grant privileges
        print("Granting privileges...")
        cursor.execute(f"GRANT ALL PRIVILEGES ON `{args.db_name}`.* TO `{app_db_user}`@'localhost'")
        cursor.execute("FLUSH PRIVILEGES")
        
        # Use the new database
        cursor.execute(f"USE `{args.db_name}`")
        
        # Create tables
        print("Creating tables...")
        
        # 1. Users Table
        cursor.execute("""
            CREATE TABLE users (
                id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                username VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                clearance_level INT DEFAULT 3,
                balance DECIMAL(10, 2) DEFAULT 1500.00,
                is_active BOOLEAN DEFAULT TRUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_email (email),
                INDEX idx_username (username)
            )
        """)
        
        # 2. Products Table (MINIMAL - only state)
        # Note: Name, Price, Description are now in JSON products.json, not here.
        cursor.execute("""
            CREATE TABLE products (
                id VARCHAR(50) PRIMARY KEY,
                stock INT DEFAULT 0,
                reserved_stock INT DEFAULT 0,
                status ENUM('draft', 'in_stock', 'limited', 'fabricating', 'preorder', 'out_of_stock', 'discontinued', 'restricted') DEFAULT 'draft',
                requires_clearance BOOLEAN DEFAULT FALSE,
                fabrication_progress INT DEFAULT 0,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_status (status),
                INDEX idx_requires_clearance (requires_clearance)
            )
        """)
        
        # 3. Carts Table
        cursor.execute("""
            CREATE TABLE carts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                product_id VARCHAR(50) NOT NULL,
                quantity INT NOT NULL DEFAULT 1,
                added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                UNIQUE KEY unique_cart_item (user_id, product_id)
            )
        """)
        
        # 4. Orders Table
        cursor.execute("""
            CREATE TABLE orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_number VARCHAR(50) UNIQUE NOT NULL,
                user_id VARCHAR(36) NOT NULL,
                status ENUM('pending', 'processing', 'confirmed', 'fabricating', 'shipped', 'delivered', 'cancelled', 'refunded') DEFAULT 'pending',
                total DECIMAL(10, 2) NOT NULL,
                subtotal DECIMAL(10, 2) NOT NULL,
                tax DECIMAL(10, 2) DEFAULT 0,
                shipping DECIMAL(10, 2) DEFAULT 0,
                discount DECIMAL(10, 2) DEFAULT 0,
                shipping_address TEXT,
                billing_address TEXT,
                contact_number VARCHAR(50),
                email VARCHAR(255),
                payment_method VARCHAR(50),
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
                INDEX idx_status (status)
            )
        """)
        
        # 5. Order Items
        # We snapshot the price/name here because JSON might change later
        cursor.execute("""
            CREATE TABLE order_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT NOT NULL,
                product_id VARCHAR(50) NOT NULL,
                product_name VARCHAR(255) NOT NULL,
                product_price DECIMAL(10, 2) NOT NULL,
                quantity INT NOT NULL DEFAULT 1,
                total DECIMAL(10, 2) NOT NULL,
                specifications JSON,
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
            )
        """)
        
        # 6. Tokens Table
        cursor.execute("""
            CREATE TABLE tokens (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                token VARCHAR(255) UNIQUE NOT NULL,
                token_type ENUM('access', 'refresh', 'reset') DEFAULT 'access',
                expires_at DATETIME NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_token (token),
                INDEX idx_user_id (user_id)
            )
        """)
        
        # 7. System Logs Table
        cursor.execute("""
            CREATE TABLE system_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                level ENUM('info', 'warning', 'error', 'security') DEFAULT 'info',
                module VARCHAR(100),
                action VARCHAR(100),
                user_id VARCHAR(36),
                ip_address VARCHAR(45),
                user_agent VARCHAR(500),
                details JSON,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # 8. Fabrication Queue Table
        cursor.execute("""
            CREATE TABLE fabrication_queue (
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
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
            )
        """)
        
        # Create a default admin user (admin / admin123) for testing
        # Hash for 'admin123'
        admin_hash = "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWrn96pzwLOx/u788NM96W/7.g9yUy" 
        cursor.execute("""
            INSERT INTO users (id, name, email, username, password_hash, clearance_level)
            VALUES ('admin-id', 'System Admin', 'admin@vikash.dev', 'admin', %s, 10)
        """, (admin_hash,))
        
        conn.commit()
        
        print("\n" + "=" * 60)
        print("DATABASE SETUP COMPLETE (Hybrid Mode)!")
        print("=" * 60)
        print("\nConnection Details:")
        print(f"Database: {args.db_name}")
        print(f"Username: {app_db_user}")
        print(f"Host: {args.host}:{args.port}")
        print("\nIMPORTANT:")
        print("- Product details (name, price, description) are stored in products.json")
        print("- MySQL only handles inventory state (stock, status, orders)")
        print("\nDefault Admin Account:")
        print("Username: admin")
        print("Password: admin123")
        
    except Error as e:
        print(f"\nError: {e}")
        sys.exit(1)
    finally:
        if 'conn' in locals() and conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == "__main__":
    setup_database()
