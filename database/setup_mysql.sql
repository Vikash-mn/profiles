-- Create database
CREATE DATABASE IF NOT EXISTS vikash_system
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Create user (adjust password as needed)
CREATE USER IF NOT EXISTS 'vikash_user'@'localhost' 
IDENTIFIED BY 'secure_password_123';

-- Grant privileges
GRANT ALL PRIVILEGES ON vikash_system.* 
TO 'vikash_user'@'localhost';

-- Apply privileges
FLUSH PRIVILEGES;

-- Use the database
USE vikash_system;

-- ============================================
-- STORE PRODUCTS TABLE
-- ============================================
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
);

-- ============================================
-- STORE USERS TABLE
-- ============================================
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
);

-- ============================================
-- AUTH TOKENS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS auth_tokens (
    token VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL 24 HOUR),
    INDEX idx_user_id (user_id),
    INDEX idx_expires (expires_at)
);

-- ============================================
-- USER CART TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_carts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    product_id VARCHAR(50) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_product (user_id, product_id),
    INDEX idx_user_id (user_id)
);

-- ============================================
-- ORDERS TABLE
-- ============================================
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
);

-- ============================================
-- INSERT DEFAULT PRODUCTS
-- ============================================
INSERT INTO store_products (id, name, category, price, description, stock, status, requires_clearance, fabrication_progress, image_url, features, specifications) VALUES
('ec001', 'ESP32 DevKitC', 'components', 19.99, 'Dual-core WiFi/Bluetooth dev board with hardware crypto accelerator.', 42, 'in_stock', FALSE, 100, 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80', '["Dual-core Xtensa LX6 @ 240MHz", "Integrated WiFi + Bluetooth LE", "Hardware AES/RSA accelerator", "USB-C programming interface"]', '{"flash": "4MB", "connectivity": "2.4GHz WiFi / BLE 4.2", "gpio": 30, "power": "5V USB-C"}'),
('ec002', 'Raspberry Pi 5 (8GB)', 'components', 129.00, 'Next-gen SBC with PCIe 2.0 lane exposed for high-speed peripherals.', 18, 'limited', FALSE, 100, 'https://images.unsplash.com/photo-1582719478248-54e9f2af4cf4?auto=format&fit=crop&w=800&q=80', '["2.4GHz quad-core 64-bit SoC", "8GB LPDDR4X RAM", "Dual micro-HDMI 4K60", "PCIe 2.0 x1 on FFC"]', '{"cpu": "Broadcom BCM2712", "ram": "8GB", "storage": "microSD / PCIe", "power": "USB-C PD"}'),
('ec003', 'Secure LoRaWAN Node', 'components', 59.00, 'Long-range encrypted sensor node with secure boot and OTA updates.', 25, 'fabricating', FALSE, 68, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80', '["SX1276 LoRa transceiver", "Secure element (ATECC608)", "Solar input + LiPo charger", "Low-power deep sleep"]', '{"frequency": "868/915 MHz", "range": "10-15 km LOS", "encryption": "AES-256 w/ hardware key store", "battery": "18650 / LiPo"}'),
('pj001', 'Custom PCB Design Sprint', 'projects', 349.00, 'One-week turnaround for 4-layer PCBs with DFM checks and gerber review.', 5, 'in_progress', FALSE, 45, 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80', '["Schematic capture + layout", "Impedance controlled routing", "DFM/DFT review", "BOM optimization"]', '{"layers": "Up to 6", "stackup": "Controlled impedance", "deliverables": "Gerbers, BoM, Pick-and-place", "timeline": "5 business days"}'),
('pj002', 'Firmware Hardening Package', 'projects', 499.00, 'Secure boot, signed updates, and memory safety review for embedded targets.', 7, 'in_progress', FALSE, 52, 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80', '["Threat modeling workshop", "Secure boot enablement", "Signed OTA pipeline", "Static analysis + fuzzing"]', '{"targets": "ARM Cortex-M / A", "artifacts": "Security report + patch set", "duration": "10 days", "compliance": "OWASP MAS / IoT"}'),
('pj003', 'Red Team Assessment', 'projects', 899.00, 'Adversarial simulation covering cloud, firmware, and RF attack surfaces.', 3, 'available', FALSE, 100, 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80', '["Cloud posture review", "Firmware binary analysis", "RF/ble threat emulation", "Executive summary + fixes"]', '{"duration": "2 weeks", "reporting": "Daily findings channel", "team": "2 operators + 1 lead", "scope": "Web, cloud, embedded"}'),
('r001', 'Zero-Day Research Pack', 'restricted', 1999.00, 'Private exploit proofs-of-concept with sanitized write-ups.', 2, 'restricted', TRUE, 80, 'https://images.unsplash.com/photo-1527434006472-52ae3e175c8a?auto=format&fit=crop&w=800&q=80', '["2x recent CVE weaponized PoCs", "Reproduction environment scripts", "Mitigation guidance", "Weekly threat feed drop"]', '{"delivery": "Encrypted archive", "targets": "Windows / Linux mix", "update_cycle": "Weekly", "nda": "Required"}'),
('r002', 'Portable RF Jammer', 'restricted', 399.00, 'Configurable jammer covering 400-2500 MHz with directional antenna option.', 4, 'restricted', TRUE, 55, 'https://images.unsplash.com/photo-1505740106531-4243f3831c78?auto=format&fit=crop&w=800&q=80', '["Programmable bands", "Swappable antenna system", "Thermal protection", "Pelican-grade enclosure"]', '{"bands": "400-2500 MHz", "power": "60W peak", "runtime": "90 minutes", "compliance": "Export controlled"}'),
('r003', 'Quantum Entropy Generator', 'restricted', 1299.00, 'Hardware quantum RNG with PCIe edge connector and keystore.', 1, 'preorder', TRUE, 35, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80', '["True quantum noise source", "Onboard HSM-backed key store", "Deterministic seeding API", "FIPS 140-3 test vectors"]', '{"throughput": "1 Gbit/s entropy", "interface": "PCIe x1 + USB-C", "drivers": "Linux kernel module", "lead_time": "4 weeks"}');

-- No default application users are inserted here.
-- Create users via the application registration flow or directly in the database.
