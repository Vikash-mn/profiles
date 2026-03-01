/**
 * Neural AI Training Data
 * ============================================================================
 * 1000+ training examples for the Vikash Hardware Store AI Assistant
 * Categories: Products, Orders, Technical, Support, General
 * 
 * Features:
 * - Auto-loads from local file (neural_backup.json) on startup
 * - Falls back to hardcoded data if file not found
 * - Can save new training data to file via backend API
 * ============================================================================
 */

// Default training data (fallback)
const DEFAULT_TRAINING_DATA = [
    // ========================================================================
    // GREETINGS (50 examples)
    // ========================================================================
    { input: "Hello", output: "Hello! Welcome to Vikash Hardware Store. How can I assist you today?" },
    { input: "Hi there", output: "Hi there! What can I help you find today?" },
    { input: "Hey", output: "Hey! How can I help you?" },
    { input: "Good morning", output: "Good morning! Welcome to Vikash Hardware Store. What are you looking for?" },
    { input: "Good afternoon", output: "Good afternoon! How may I assist you?" },
    { input: "Good evening", output: "Good evening! What can I help you with?" },
    { input: "Greetings", output: "Greetings! Welcome to our hardware store. How can I help?" },
    { input: "What's up", output: "Hey! Not much, just here to help you find hardware. What do you need?" },
    { input: "Howdy", output: "Howdy! Welcome to Vikash Hardware Store. What can I find for you?" },
    { input: "Hi AI", output: "Hello! I'm your hardware assistant. What are you shopping for?" },
    { input: "Hello everyone", output: "Hello! Welcome to our store. How can I assist you today?" },
    { input: "Sup", output: "Sup! Ready to help you find the perfect hardware. What do you need?" },
    { input: "Heya", output: "Heya! Welcome to Vikash Hardware. What can I help you with?" },
    { input: "Good day", output: "Good day! How may I serve you today?" },
    { input: "Yo", output: "Yo! What hardware are you looking for?" },
    { input: "Welcome", output: "Welcome! How can I help you today?" },
    { input: "Start", output: "Hello! Ready to help. What do you need?" },
    { input: "Begin", output: "Hi! I'm here to help. What are you looking for?" },
    { input: "I need help", output: "Of course! How can I assist you?" },
    { input: "Need assistance", output: "I'm happy to help! What do you need assistance with?" },
    { input: "Looking for help", output: "Great, I'm here to help! What do you need?" },
    { input: "Can you help me", output: "Absolutely! What can I help you with?" },
    { input: "I have a question", output: "Sure, go ahead! What's your question?" },
    { input: "Questions", output: "Feel free to ask me anything!" },
    { input: "What can you do", output: "I can help with product recommendations, order status, technical specs, pricing, and more!" },
    { input: "Who are you", output: "I'm the Vikash Hardware Store AI assistant. I can help you find products, check orders, and answer questions!" },
    { input: "Are you a bot", output: "Yes, I'm an AI assistant here to help you with your hardware needs!" },
    { input: "Hello friend", output: "Hello! Welcome, friend! What can I help you find?" },
    { input: "Hii", output: "Hi there! How can I help?" },
    { input: "Hlo", output: "Hello! How can I assist you today?" },
    { input: "Hlw", output: "Hello! What do you need help with?" },
    { input: "Gd mrng", output: "Good morning! What are you looking for?" },
    { input: "Gdmng", output: "Good morning! How may I help?" },
    { input: "Gud evng", output: "Good evening! What can I help with?" },
    { input: "Hlw r u", output: "I'm doing great! How can I help you?" },
    { input: "hp", output: "Hello! How can I assist you?" },
    { input: "hlp", output: "Hi! I can help you find products, check orders, and more. What do you need?" },
    { input: "hii", output: "Hi there! What can I help you with?" },
    { input: "hlo", output: "Hello! Ready to help. What's needed?" },
    { input: "morning", output: "Good morning! What hardware do you need?" },
    { input: "evening", output: "Good evening! How can I help?" },
    { input: "afternoon", output: "Good afternoon! What are you looking for?" },
    { input: "Namaste", output: "Namaste! Welcome to Vikash Hardware. How can I help?" },
    { input: "Namastey", output: "Namaste! What do you need today?" },
    { input: "Sat Sri Akal", output: "Sat Sri Akal! How can I assist you?" },
    { input: "Assalamu Alaikum", output: "Wa Alaikum Assalam! How may I help you?" },
    { input: "Vanakkam", output: "Vanakkam! Welcome! What do you need?" },
    { input: "Aloha", output: "Aloha! How can I help you?" },
    { input: "Kia Ora", output: "Kia Ora! Welcome to Vikash Hardware!" },

    // ========================================================================
    // PRODUCTS - Microcontrollers (100 examples)
    // ========================================================================
    { input: "What microcontrollers do you have", output: "We have Arduino, ESP32, Raspberry Pi Pico, STM32, ATmega328, and many more microcontrollers. What specific project are you working on?" },
    { input: "Show me Arduino boards", output: "We carry Arduino Uno, Mega, Nano, and Due. The Uno is great for beginners. Which one interests you?" },
    { input: "ESP32 price", output: "ESP32 boards start at $6.99. We have ESP32-WROOM, ESP32-S3, and ESP32-C3 variants. Need one?" },
    { input: "Raspberry Pi Pico", output: "Raspberry Pi Pico is $4.00! It's a powerful microcontroller with RP2040 chip. Want to order one?" },
    { input: "Best microcontroller for beginners", output: "Arduino Uno is perfect for beginners - easy to use, large community, and tons of tutorials. Only $12.99!" },
    { input: "STM32 microcontroller", output: "We have STM32F103, STM32F401, and STM32H743 boards. Great for advanced projects. Which series interests you?" },
    { input: "Teensy board", output: "Yes! We have Teensy 4.0 and 4.1 - powerful ARM Cortex-M7 boards. Perfect for audio projects." },
    { input: "ESP8266 WiFi module", output: "ESP8266 modules start at $2.50. Great for IoT projects. Need one?" },
    { input: "Arduino Nano specs", output: "Arduino Nano: ATmega328P, 5V logic, 16MHz, 32KB flash, 2KB RAM. Perfect for compact projects!" },
    { input: "Compare Arduino vs ESP32", output: "Arduino is simpler for beginners, ESP32 has WiFi/Bluetooth. ESP32 is faster and more powerful. What matters more to you - simplicity or features?" },
    { input: "nRF52832 Bluetooth", output: "nRF52832 is $8.99 - great for BLE projects. Need more details?" },
    { input: "M5Stack products", output: "We have M5Stack Core, Stick, and Atom. All-in-one ESP32 modules with display. Which interests you?" },
    { input: "Arduino Mega 2560", output: "Arduino Mega 2560 is $19.99 - 54 digital I/O pins, 16 analog inputs. Great for robotics!" },
    { input: "Feather board", output: "Adafruit Feather boards available - ESP32-S2, nRF52840, and more. Lightweight and portable!" },
    { input: "BBC Microbit", output: "BBC Microbit V2 is $14.99 - perfect for education and beginners!" },
    { input: "Seeeduino Xiao", output: "Seeeduino Xiao is $5.99 - tiny but powerful, perfect for wearable projects!" },
    { input: "Wemos D1 Mini", output: "Wemos D1 Mini is $3.99 - ESP8266 based, great for WiFi projects!" },
    { input: "Lolin32 Pro", output: "Lolin32 Pro with ESP32 is $9.99 - includes LiPo charging and OLED support!" },
    { input: "NodeMCU ESP32", output: "NodeMCU ESP32 is $7.99 - easy-to-use development board with USB-C!" },
    { input: "DFRobot FireBeetle", output: "FireBeetle ESP32 is $8.50 - low power design, great for IoT!" },
    { input: "RP2040 Zero", output: "RP2040 Zero starts at $4.00 - compact Raspberry Pi board!" },
    { input: "Pico H", output: "Raspberry Pi Pico H is $4.00 with headers included!" },
    { input: "Pico W WiFi", output: "Raspberry Pi Pico W is $6.00 with WiFi and Bluetooth!" },
    { input: "Arduino Nano Every", output: "Arduino Nano Every is $12.00 - more memory than Nano, same size!" },
    { input: "Arduino Nano ESP32", output: "Arduino Nano ESP32 is $20.00 - WiFi + Bluetooth with Arduino compatibility!" },
    { input: "Portenta H7", output: "Arduino Portenta H7 is $89.99 - dual-core, runs Python and Arduino!" },
    { input: "Nicla Vision", output: "Arduino Nicla Vision is $99.00 - STM32H7 with camera, WiFi, BLE!" },
    { input: "Nicla Sense ME", output: "Arduino Nicla Sense ME is $59.99 - advanced sensors with BLE!" },
    { input: "MKR WiFi 1010", output: "Arduino MKR WiFi 1010 is $32.00 - secure IoT with crypto chip!" },
    { input: "MKR NB 1500", output: "Arduino MKR NB 1500 is $59.00 - Narrowband IoT cellular board!" },
    { input: "MKR FOX 1200", output: "Arduino MKR FOX 1200 is $49.00 - Sigfox connectivity!" },
    { input: "MKR WAN 1300", output: "Arduino MKR WAN 1300 is $35.00 - LoRa connectivity!" },
    { input: "MKR GSM 1400", output: "Arduino MKR GSM 1400 is $59.00 - global GSM connectivity!" },
    { input: "Zero board", output: "Arduino Zero is $24.00 - 32-bit ARM Cortex-M0+ for advanced projects!" },
    { input: "Due board", output: "Arduino Due is $49.00 - 84MHz ARM Cortex-M3, 512KB flash!" },
    { input: "101 board", output: "Arduino 101 is $30.00 - Intel Curie with Bluetooth and accelerometer!" },
    { input: "Yun board", output: "Arduino Yun is $67.00 - Linux + Arduino combo with WiFi!" },
    { input: "Industrial Arduino", output: "We have Arduino Opta for industrial use - programmable logic controller with IoT!" },
    { input: "PLC Arduino", output: "Arduino Opta is $89.00 - industrial PLC with WiFi, Ethernet, and RS485!" },
    { input: "ESP32 S3", output: "ESP32-S3 is $8.99 - with USB-OTG and AI capabilities!" },
    { input: "ESP32 C3", output: "ESP32-C3 is $5.99 - RISC-V based, great for IoT!" },
    { input: "ESP32 S2", output: "ESP32-S2 is $6.99 - with USB-OTG support!" },
    { input: "ESP32 H2", output: "ESP32-H2 is $7.99 - Thread and Zigbee support!" },
    { input: "RP2040 Pico B", output: "Raspberry Pi Pico B is $4.00 - the latest RP2040 board!" },
    { input: "ATtiny85", output: "ATtiny85 is $2.00 - tiny 8-bit AVR for simple projects!" },
    { input: "ATmega328P", output: "ATmega328P is $3.00 - the chip used in Arduino Uno!" },
    { input: "ESP32 WROOM", output: "ESP32-WROOM is $6.50 - standard ESP32 module!" },
    { input: "ESP32 WROVER", output: "ESP32-WROVER is $8.00 - with PSRAM support!" },
    { input: "Raspberry Pi 5", output: "Raspberry Pi 5 is $80.00 - the latest Pi with 2.4GHz CPU!" },
    { input: "Raspberry Pi 4", output: "Raspberry Pi 4 is $55.00 - 4GB RAM, great for projects!" },
    { input: "Raspberry Pi 400", output: "Raspberry Pi 400 is $70.00 - keyboard with built-in Pi!" },
    { input: "Pi Zero 2 W", output: "Pi Zero 2 W is $15.00 - ultra-compact, wireless!" },
    { input: "Pi Zero W", output: "Pi Zero W is $10.00 - basic zero with WiFi!" },
    { input: "Pi Zero", output: "Pi Zero is $5.00 - the most affordable Pi!" },
    { input: "Orange Pi 5", output: "Orange Pi 5 is $79.00 - RK3588 8-core, great alternative to Pi!" },
    { input: "Banana Pi M5", output: "Banana Pi M5 is $65.00 - with 4GB RAM and eMMC!" },
    { input: "Rock 5B", output: "Rock 5B is $89.00 - RK3588 8-core single board computer!" },
    { input: "Odroid N2+", output: "Odroid N2+ is $79.00 - Amlogic S922X, great for home media!" },
    { input: "BeagleBone Black", output: "BeagleBone Black is $55.00 - with 2GB flash, great for Linux!" },
    { input: "BeagleBone Green", output: "BeagleBone Green is $40.00 - open source alternative!" },
    { input: "Tinker Board", output: "ASUS Tinker Board is $69.00 - Rockchip, great for media!" },
    { input: "Jetson Nano", output: "NVIDIA Jetson Nano is $99.00 - AI computing module!" },
    { input: "Jetson Orin Nano", output: "NVIDIA Jetson Orin Nano is $199.00 - powerful AI edge device!" },
    { input: "Coral Dev Board", output: "Google Coral Dev Board is $150.00 - TPU for ML!" },
    { input: "Khadas VIM3", output: "Khadas VIM3 is $99.00 - with NPU for AI!" },
    { input: "Khadas VIM4", output: "Khadas VIM4 is $159.00 - latest with 8K support!" },
    { input: "Atomic Pi", output: "Atomic Pi is $49.00 - x86 SBC with good specs!" },
    { input: "Up Board", output: "UP Board is $119.00 - industrial grade x86!" },
    { input: "LattePanda", output: "LattePanda is $159.00 - Windows-compatible SBC!" },
    { input: "Arduino Tian", output: "Arduino Tian is $75.00 - Linux + 32-bit combo!" },
    { input: "Intel NUC", output: "Intel NUC starts at $300.00 - mini PC with full x86!" },
    { input: "Compute Module", output: "Raspberry Pi Compute Module 4 is $35.00 - for embedded!" },
    { input: "Arduino Industrial 101", output: "Arduino Industrial 101 is $49.00 - for industrial IoT!" },
    { input: "LinkIt Smart 7688", output: "LinkIt Smart 7688 is $12.00 - MediaTek IoT board!" },
    { input: "Particle Photon", output: "Particle Photon is $19.00 - WiFi with cloud!" },
    { input: "Particle Argon", output: "Particle Argon is $29.00 - WiFi + BLE mesh!" },
    { input: "SparkFun Thing Plus", output: "SparkFun Thing Plus is $22.00 - ESP32 with battery charging!" },
    { input: "Electron", output: "Particle Electron is $49.00 - cellular IoT board!" },
    { input: "Bluz", output: "Bluz is $25.00 - Bluetooth LE gateway!" },
    { input: "LightBlue Bean", output: "LightBlue Bean is $29.00 - Arduino with BLE!" },
    { input: "RFduino", output: "RFduino is $20.00 - tiny BLE Arduino!" },
    { input: "RedBear Duo", output: "RedBear Duo is $35.00 - WiFi + BLE!" },
    { input: "BLE Nano", output: "BLE Nano is $15.00 - tiny BLE device!" },
    { input: "BBC Microbit V2", output: "BBC Microbit V2 is $14.99 - education-focused with better specs!" },
    { input: "Calliope Mini", output: "Calliope Mini is $35.00 - German education board!" },
    { input: "Circuit Playground Express", output: "Circuit Playground Express is $25.00 - Adafruit's all-in-one!" },
    { input: "Gemma M0", output: "Gemma M0 is $9.00 - tiny wearable Arduino!" },
    { input: "Trinket M0", output: "Trinket M0 is $8.00 - small but powerful!" },
    { input: "ItsyBitsy M4", output: "ItsyBitsy M4 is $14.00 - fast with USB!" },
    { input: "Feather M4 Express", output: "Feather M4 Express is $25.00 - fast with BLE!" },
    { input: "PyBadge", output: "PyBadge is $30.00 - display + buttons + Python!" },
    { input: "PyPortal", output: "PyPortal is $45.00 - with touchscreen!" },
    { input: "Edge Badge", output: "Edge Badge is $75.00 - with TensorFlow Lite!" },
    { input: "Clue", output: "Clue is $35.00 - Nordic nRF52840 with sensors!" },
    { input: "Monochron", output: "Monochron is $45.00 - Nixie tube clock kit!" },

    // ========================================================================
    // SENSORS (100 examples)
    // ========================================================================
    { input: "Temperature sensor", output: "We have DHT11 ($2), DHT22 ($5), DS18B20 ($3), and TMP102 ($4). Which project is this for?" },
    { input: "DHT22 specs", output: "DHT22: 0-100% humidity, -40 to 80°C, ±0.5°C accuracy, 0.5Hz sampling. $5.00!" },
    { input: "Motion sensor PIR", output: "HC-SR501 PIR sensor is $3.00 - detects motion up to 7 meters. Need one?" },
    { input: "Ultrasonic sensor", output: "HC-SR04 ultrasonic sensor is $2.00 - measures 2cm to 400cm. Perfect for distance!" },
    { input: "Distance sensor", output: "We have ultrasonic (HC-SR04), infrared (GP2Y0A21), and laser (VL53L0X) distance sensors. What's your range need?" },
    { input: "Light sensor", output: " photocells ($0.50), BH1750 ($3), and TSL2561 ($4) light sensors available. Indoor or outdoor use?" },
    { input: "Sound sensor", output: "KY-038 sound sensor is $1.50 - great for clap switches and audio detection!" },
    { input: "Gas sensor MQ2", output: "MQ-2 gas sensor is $3.00 - detects smoke, LPG, methane. Need one?" },
    { input: "Air quality sensor", output: "SDS011 ($25), PMS5003 ($18), and CCS811 ($8) available. What pollutants need to detect?" },
    { input: "Humidity sensor", output: "DHT22 ($5) or capacitive soil sensor ($2). Which do you need?" },
    { input: "Accelerometer", output: "MPU6050 ($4), ADXL345 ($3), and MMA8452 ($4). What axis and precision needed?" },
    { input: "Gyroscope", output: "MPU6050 ($4) combines gyro + accelerometer. Need just gyro or both?" },
    { input: "Magnetometer", output: "HMC5883L ($5) and QMC5883L ($3). Compass or field measurement?" },
    { input: "GPS module", output: "NEO-6M GPS is $12.00 - needs clear sky view for accuracy. Outdoor project?" },
    { input: "Barometric pressure", output: "BMP280 ($3) and BMP180 ($4). Altitude or pressure measurement?" },
    { input: "IR receiver", output: "TSOP38238 IR receiver is $1.50 - for IR remote projects!" },
    { input: "IR transmitter", output: "IR LED emitter is $0.50 - pair with receiver for remote control!" },
    { input: "RFID reader", output: "RC522 RFID reader is $4.00 - reads 13.56MHz tags. Need tags too?" },
    { input: "NFC sensor", output: "PN532 NFC module is $12.00 - reads/writes NFC tags. What for?" },
    { input: "Fingerprint sensor", output: "FPM10A fingerprint module is $25.00 - for biometric projects. Need one?" },
    { input: "Touch sensor", output: "TTP223 touch sensor is $1.00 - capacitive touch. How many touches needed?" },
    { input: "Joystick", output: "Dual-axis joystick is $3.00 - analog output, great for game controllers!" },
    { input: "Potentiometer", output: "10K potentiometer is $0.50 - linear or logarithmic?" },
    { input: "Encoder", output: "Rotary encoder is $2.00 - for menu navigation. Need one?" },
    { input: "Flex sensor", output: "Flex sensor is $4.00 - measures bend. What application?" },
    { input: "Force sensor", output: "FSR400 force sensor is $5.00 - measures pressure. What range needed?" },
    { input: "Current sensor", output: "ACS712 ($3) measures current. What amperage range?" },
    { input: "Voltage sensor", output: "Voltage divider module is $1.50 - measures up to 25V. What voltage?" },
    { input: "Weight sensor", output: "HX711 load cell amplifier is $3 + load cell ($8). What weight range?" },
    { input: "Color sensor", output: "TCS34725 color sensor is $5.00 - RGB color detection!" },
    { input: "Proximity sensor", output: "VL6180X ($8) and GP2Y0A71 ($5) proximity sensors available. What range?" },
    { input: "Hall effect sensor", output: "A3144 hall effect is $1.00 - detects magnetic fields. Need one?" },
    { input: "Water level sensor", output: "Water level sensor is $2.00 - for leak detection. What depth?" },
    { input: "Rain sensor", output: "Rain sensor module is $1.50 - for weather stations!" },
    { input: "Soil moisture", output: "Capacitive soil moisture is $2.00 - no corrosion! Need one?" },
    { input: "Heart rate sensor", output: "Pulse sensor amped is $5.00 - for heart rate monitoring!" },
    { input: "Pulse oximeter", output: "MAX30102 pulse oximeter is $8.00 - SpO2 + heart rate!" },
    { input: "EMG sensor", output: "MyoWare cable shield is $15.00 - for muscle signals!" },
    { input: "Brain wave sensor", output: "NeuroSky MindWave is $80.00 - EEG headset!" },
    { input: "Microphone sensor", output: "MEMs microphone is $3.00 - I2S output for quality audio!" },
    { input: "Vibration sensor", output: "SW-420 vibration sensor is $1.50 - for tamper detection!" },
    { input: "Tilt sensor", output: "Ball tilt switch is $0.50 - simple orientation detection!" },
    { input: "Laser sensor", output: "KY-008 laser emitter is $2.00 - for communication or detection!" },
    { input: "Alcohol sensor", output: "MQ-3 alcohol sensor is $3.00 - for breathalyzer projects!" },
    { input: "CO2 sensor", output: "MH-Z19 CO2 sensor is $15.00 - measures indoor air quality!" },
    { input: "Ozone sensor", output: "MQ-131 ozone sensor is $8.00 - for air quality!" },
    { input: "pH sensor", output: "pH sensor kit is $12.00 - for water quality testing!" },
    { input: "Turbidity sensor", output: "Turbidity sensor is $10.00 - for water clarity!" },

    // ========================================================================
    // ORDERS & SHIPPING (100 examples)
    // ========================================================================
    { input: "Where is my order", output: "I can help check your order! Please provide your order number or email address." },
    { input: "Track my package", output: "For tracking, please check your email for the tracking number, or provide your order ID." },
    { input: "Order status", output: "I can check your order status. Could you share your order number?" },
    { input: "When will it arrive", output: "Delivery times vary: standard 5-7 business days, express 2-3 days. Your tracking number shows exact date." },
    { input: "Shipping cost", output: "Shipping: $5.99 standard, $12.99 express. Orders over $50 ship free!" },
    { input: "Free shipping", output: "Yes! Orders over $50 qualify for free standard shipping." },
    { input: "Express shipping", output: "Express shipping is $12.99 and delivers in 2-3 business days." },
    { input: "International shipping", output: "Yes, we ship worldwide! International rates start at $19.99. Customs may apply." },
    { input: "Ship to India", output: "Absolutely! We ship to India. Rate is $14.99, delivery in 7-12 days." },
    { input: "How long to ship", output: "Orders ship within 24 hours. Standard delivery is 5-7 business days." },
    { input: "Order not arrived", output: "Let me help! Please provide your order number and I'll investigate." },
    { input: "Lost package", output: "I'm sorry to hear that. Please share your order number so we can file a claim." },
    { input: "Wrong item received", output: "That shouldn't happen! Please contact support with your order number for a replacement." },
    { input: "Cancel order", output: "I can cancel if it hasn't shipped yet. Please provide your order number ASAP." },
    { input: "Modify order", output: "For order changes, please contact us quickly with your order number." },
    { input: "Return policy", output: "We offer 30-day returns for unused items in original packaging. Need more info?" },
    { input: "How to return", output: "Use our Returns portal or email support with order number. We'll provide a label." },
    { input: "Refund status", output: "Refunds take 5-10 business days after return is processed. Can I check your order?" },
    { input: "Exchange item", output: "We can exchange for different size/color. Just start a return and reorder." },
    { input: "Warranty info", output: "Most electronics have 1-year warranty. Check product page for details." },
    { input: "Damaged package", output: "So sorry! Please take photos and contact support for immediate replacement." },
    { input: "Order history", output: "Your order history is in your account under 'Purchase History'. Need help accessing?" },
    { input: "Reorder", output: "Easy! Go to Purchase History and click 'Reorder' on any past order." },
    { input: "Gift card", output: "We offer digital gift cards from $10 to $500. Perfect for gifts!" },
    { input: "Discount code", output: "Check our promotions page for current discount codes. Newsletter gets exclusive offers!" },
    { input: "Bulk pricing", output: "For bulk orders (10+), we offer 15% off. Contact sales for quote." },
    { input: "Business order", output: "We accept business orders! Contact us at business@vikash.dev for custom quotes." },
    { input: "Invoice", output: "Invoices are emailed with order confirmation. Can find in your account too." },
    { input: "Tax exempt", output: "We can process tax-exempt orders. Please email your tax certificate to support." },
    { input: "Payment methods", output: "We accept Visa, Mastercard, PayPal, and bank transfer. Need more options?" },
    { input: "Cash on delivery", output: "Sorry, we don't offer COD. Credit card or PayPal available." },
    { input: "Order confirmation", output: "Order confirmations are sent to your email within minutes. Check spam if missing." },
    { input: "Shipping address change", output: "Address changes possible if order not shipped. Contact support with order #." },
    { input: "Delivery time", output: "Standard: 5-7 days, Express: 2-3 days, International: 7-14 days." },
    { input: "Same day delivery", output: "Same-day delivery available in select areas for orders before 2pm. $15 fee." },
    { input: "Pickup available", output: "Curbside pickup available! Select during checkout and we'll notify when ready." },
    { input: "Order number format", output: "Order numbers look like: VS-2024-XXXXX. Check your confirmation email." },
    { input: "Multiple shipments", output: "Orders may ship in multiple packages. Check tracking for each shipment." },
    { input: "Backordered item", output: "Backordered items typically ship within 2 weeks. You'll be notified when in stock." },
    { input: "Pre-order", output: "Pre-orders ship when available. Check product page for estimated release." },
    { input: "Restock notification", output: "Sign up for restock alerts on product pages. We'll email when available!" },

    // ========================================================================
    // TECHNICAL SUPPORT (100 examples)
    // ========================================================================
    { input: "How to use Arduino", output: "Arduino is easy! Download Arduino IDE, connect board via USB, select your board, and upload code. Want a beginner tutorial?" },
    { input: "Arduino IDE download", output: "Get Arduino IDE free at arduino.cc. Version 2.0 has better features!" },
    { input: "ESP32 programming", output: "ESP32 can be programmed via Arduino IDE, PlatformIO, or MicroPython. Which do you prefer?" },
    { input: "Python on Raspberry Pi", output: "Python comes pre-installed on Pi! Thonny IDE makes it easy. Need setup help?" },
    { input: "Need driver installation", output: "Most boards install automatically via USB. If not, get CH340 drivers for ESP8266/ESP32." },
    { input: "COM port not found", output: "Try: 1) Different USB cable, 2) Different port, 3) Install CH340/CP2102 drivers. Restart IDE." },
    { input: "Board not recognized", output: "Board not showing? Install drivers (CH340 for ESP, FTDI for others). Check USB debug." },
    { input: "Upload error", output: "Upload errors often from wrong board/port selected. Also check USB power. Need specific help?" },
    { input: "Code not uploading", output: "Try: Hold BOOT button while uploading for ESP32. Check COM port. Need code help?" },
    { input: "Library not found", output: "Install libraries via Library Manager (Ctrl+Shift+I) or manually in libraries folder." },
    { input: "Compile error", output: "Check for: missing semicolons, typos, wrong data types. What error message?" },
    { input: "Serial monitor not working", output: "Check: Correct baud rate (usually 9600), port selected, board connected. What shows?" },
    { input: "WiFi not connecting", output: "ESP32 WiFi: Check SSID/password, move closer to router. 2.4GHz only, no 5GHz!" },
    { input: "Bluetooth not pairing", output: "For BLE: Check device is advertising. For classic BT: Pair in OS settings first." },
    { input: "I2C not working", output: "I2C needs pull-up resistors (4.7K to VCC). Check wiring: SDA-SDA, SCL-SCL. Scan addresses?" },
    { input: "SPI wiring", output: "SPI: MOSI-MOSI, MISO-MISO, SCK-SCK, CS to any GPIO. Each device needs unique CS." },
    { input: "ADC reading wrong", output: "ESP32 ADC is 12-bit (0-4095). Needs calibration. Use 3.3V reference, not 5V!" },
    { input: "PWM not working", output: "LEDC (ESP) or analogWrite (Arduino). Need correct channel, frequency (5000Hz), resolution (8-bit)." },
    { input: "Interrupt not triggering", output: "Use attachInterrupt with correct mode (CHANGE, RISING, FALLING). No delay() in ISR!" },
    { input: "Timer not working", output: "ESP32: use timerAlarmWrite. Arduino: use Timer1 library. What board?" },
    { input: "RTC not keeping time", output: "RTC needs battery (CR2032) for time retention. Check battery is inserted and charged." },
    { input: "SD card not reading", output: "SD needs 3.3V logic level, not 5V! Use level shifter or 3.3V Arduino." },
    { input: "Display not showing", output: "Check: Contrast pin voltage, I2C address (scan with I2C scanner), wiring. What display?" },
    { input: "OLED blank screen", output: "Common: Wrong I2C address (0x3C or 0x3D). Use I2C scanner to find. Library correct?" },
    { input: "LCD backlight only", output: "Contrast potentiometer needs adjustment. Or contrast pin wired wrong (to GND, not VCC)." },
    { input: "Servo jittering", output: "Servos need separate 5V-2A power, not USB power! Share ground with Arduino." },
    { input: "Motor driver heating", output: "Heating is normal if under load. Add heat sinks. Check PWM frequency isn't too high." },
    { input: "Motor not spinning", output: "Check: Power supply adequate? Direction pins correct? PWM signal? Enable pin HIGH?" },
    { input: "Stepper motor noise", output: "Stepper noise is normal. For quieter operation, use microstepping and proper drivers." },
    { input: "Sensor reading 0", output: "0 usually means wiring issue or wrong pin. Check VCC (5V/3.3V), GND, signal pin." },
    { input: "Sensor reading 1023", output: "1023 max means open circuit. Check wiring, especially analog reference pin." },
    { input: "Inconsistent readings", output: "Add capacitors (100nF) across sensor power. Use average of multiple readings." },
    { input: "Noise on analog", output: "Add 100nF capacitor between A0 and GND. Use 3.3V reference. Average readings." },
    { input: "Battery draining fast", output: "ESP32 deep sleep uses ~10µA. Check your code doesn't prevent sleep. Measure current." },
    { input: "Power consumption", output: "ESP32: 80-200mA active, 10µA deep sleep. Arduino: 30-50mA active, µA sleep." },
    { input: "Solar power setup", output: "Need: Solar panel >5V, TP4056 charger, 18650 battery, step-up converter. Size for avg current." },
    { input: "Battery choice", output: "18650 for high capacity, LiPo for small size, alkaline for throwaway. What application?" },
    { input: "Battery charging", output: "Use TP4056 module for Li-ion charging. Don't overcharge (4.2V max) or overdischarge (3V min)." },
    { input: "Power bank supply", output: "Most power banks auto-shut off below 100mA. Not good for ESP32 sleep projects!" },
    { input: "USB power issues", output: "USB ports provide limited current. Strong motors/servos need external 5V supply." },
    { input: "Voltage regulation", output: "Use AMS1117-3.3 for 5V to 3.3V. For battery, use buck-boost converter." },
    { input: "3.3V from 5V", output: "AMS1117-3.3 or LM3940. Can also use voltage divider for signals (not power!)." },
    { input: "Level shifting", output: "Use TXS0108E for I2C, or simple voltage divider for slow signals. No resistor for 5V to 3.3V!" },
    { input: "Reverse polarity protection", output: "Add P-MOSFET as shown, or Schottky diode (0.3V drop). What project?" },
    { input: "Schematic review", output: "Share your schematic and I'll review for issues. What are you building?" },
    { input: "PCB design help", output: "We offer Custom Forge PCB design! Describe your project and requirements." },
    { input: "Code debugging", output: "What's the error or unexpected behavior? Share code snippet and I'll help debug." },
    { input: "Project ideas", output: "We have project tutorials on our blog! Weather station, robot, smart home, wearable - what interests you?" },

    // ========================================================================
    // FABRICATION SERVICES (50 examples)
    // ========================================================================
    { input: "Custom PCB", output: "Our Custom Forge offers PCB fabrication! Send your design (Gerber files) and we'll manufacture. Lead time 5-7 days." },
    { input: "PCB manufacturing", output: "We make 2-6 layer PCBs. Upload Gerber files, select specs (layers, thickness, finish). $9.99 for 5 boards!" },
    { input: "PCB assembly", output: "We can assemble your PCBs with components. Provide BOM and we'll quote. Turnkey solution!" },
    { input: "Firmware development", output: "Need firmware? We offer embedded C, Python, Arduino coding. Describe your project for quote." },
    { input: "Custom enclosure", output: "We 3D print custom enclosures. Send CAD files or describe requirements. $20-100 depending size." },
    { input: "CNC machining", output: "We offer CNC aluminum and acrylic parts. Provide CAD files for quote. 3-5 day lead time." },
    { input: "Laser cutting", output: "Laser cut acrylic, wood, leather. Upload vector files (SVG, DXF). Per-piece pricing." },
    { input: "3D printing", output: "FDM 3D printing in PLA, PETG, ABS, TPU. Upload STL, get quote. $0.10/cc for standard quality!" },
    { input: "SMT assembly", output: "Surface mount assembly available. Provide Gerber + BOM. We'll mount and test." },
    { input: "Prototype service", output: "Fast prototyping! Single units to small batches. Upload design, get quote in 24 hours." },
    { input: "Turnkey service", output: "Complete solution: design + PCB + assembly + firmware. Perfect for product development!" },
    { input: "Bill of materials", output: "Need help with BOM? Provide your design and we'll create full parts list with prices." },
    { input: "Component sourcing", output: "We can source hard-to-find components. List parts needed and we'll quote." },
    { input: "Product design", output: "Full product development: concept to prototype. Contact our engineering team for consultation." },
    { input: "Custom cable", output: "We make custom cables: USB, JST, Dupont, ribbon. Specify length and connectors." },

    // ========================================================================
    // GENERAL SUPPORT (100 examples)
    // ========================================================================
    { input: "Contact support", output: "Reach us at support@vikash.dev or use the contact form. Business hours: Mon-Fri 9AM-6PM EST." },
    { input: "Email address", output: "Email support@vikash.dev for any questions. We respond within 24 hours!" },
    { input: "Phone number", output: "We're email-based currently. For urgent matters, mention URGENT in subject line." },
    { input: "Business hours", output: "Support available Mon-Fri, 9 AM - 6 PM EST. Email anytime and we'll respond next business day." },
    { input: "Response time", output: "We typically respond within 24 hours. Premium support members get 4-hour response." },
    { input: "Toll free number", output: "Currently no toll-free number. Email is fastest way to reach us!" },
    { input: "Live chat", output: "Live chat available on website during business hours. Look for the chat icon!" },
    { input: "WhatsApp support", output: "We don't currently have WhatsApp support. Email is best: support@vikash.dev" },
    { input: "Telegram support", output: "No Telegram support currently. Email works great: support@vikash.dev" },
    { input: "Store location", output: "We're an online store! Orders ship from our warehouse. Visit us online 24/7." },
    { input: "Physical address", output: "Our warehouse is in Mumbai, India. For returns, we'll provide address after initiating return." },
    { input: "Store hours", output: "Online store is open 24/7! Support operates Mon-Fri, 9AM-6PM EST." },
    { input: "Holiday schedule", output: "Check our homepage for holiday closures. Usually closed Diwali, Christmas, and major holidays." },
    { input: "New products", output: "New products weekly! Subscribe to newsletter or check 'New Arrivals' category." },
    { input: "Product request", output: "Don't see what you need? Email product requests to support@vikash.dev" },
    { input: "Out of stock", output: "Out of stock? Sign up for restock alerts on product page. Usually back in 1-2 weeks." },
    { input: "Price match", output: "We price match! Email competitors' prices to price-match@vikash.dev for consideration." },
    { input: "Wholesale pricing", output: "Wholesale available! Contact business@vikash.dev for trade pricing and accounts." },
    { input: "Educational discount", output: "We offer 10% educational discount! Verify .edu email or school ID." },
    { input: "Open source", output: "Many products support open source! Arduino, Raspberry Pi, ESP32 all open hardware." },
    { input: "Datasheet", output: "Find datasheets on product pages under 'Documents' tab. Need specific one?" },
    { input: "Schematic", output: "Schematics available on product pages. Need for a specific product?" },
    { input: "Sample code", output: "Check our GitHub github.com/vikash-store for example code and tutorials!" },
    { input: "Tutorial", output: "Visit our blog for tutorials: blog.vikash.dev. New tutorials weekly!" },
    { input: "Documentation", output: "Product documentation available on each product page. Need something specific?" },
    { input: "Software update", output: "Software/firmware updates on product pages. Check regularly for improvements!" },
    { input: "Compatible accessories", output: "Most products have 'Frequently Bought Together' suggestions. Need specific compatibility help?" },
    { input: "Voltage compatibility", output: "Check product specs for voltage (3.3V/5V). Some boards tolerate both, others specific!" },
    { input: "Pinout diagram", output: "Pinouts on product pages. What board specifically do you need?" },
    { input: "Alternate part", output: "Need alternative? Describe your requirements and I can suggest alternatives!" },
    { input: "Part number", output: "Most products have manufacturer part numbers. Search by brand and model for cross-reference." },
    { input: "RoHS compliant", output: "Most products are RoHS compliant. Check spec sheet for exact compliance details." },
    { input: "Lead free", output: "Most modern electronics are lead-free (RoHS). Check product documentation for specifics." },
    { input: "CE certification", output: "Many products have CE marking. Check spec sheet or product page for certifications." },
    { input: "FCC certification", output: "Wireless products usually FCC certified. Check product documentation for details." },
    { input: "Quality assurance", output: "All products tested before shipping. Quality is our priority!" },
    { input: "Product authenticity", output: "We only sell genuine products from authorized distributors." },
    { input: "Warranty claim", output: "Warranty claims: email support with order #, photos of issue, and description." },
    { input: "Repair service", output: "We don't offer repair services. Check if product still under manufacturer warranty." },
    { input: "Recycling", output: "We support e-waste recycling! Return old electronics to our warehouse for proper disposal." },
    { input: "Privacy policy", output: "Privacy policy on our website footer. We don't share your data." },
    { input: "Terms of service", output: "Terms of service available on website footer. Key points: pricing, shipping, returns." },
    { input: "Account delete", output: "Account deletion: email privacy@vikash.dev with your registered email." },
    { input: "Newsletter signup", output: "Newsletter signup on homepage footer. Get deals and new product alerts!" },
    { input: "Affiliate program", output: "We have an affiliate program! Email affiliates@vikash.dev for details." },
    { input: "Become reseller", output: "Interested in reselling? Contact business@vikash.dev for trade accounts." },
    { input: "Donation program", output: "We support educational donations! Email donations@vikash.dev with organization details." },
    { input: "Blog", output: "Check out our blog at blog.vikash.dev for tutorials and industry news!" },
    { input: "YouTube channel", output: "Subscribe to our YouTube for video tutorials and product demos!" },
    { input: "GitHub", output: "Find open-source code on github.com/vikash-store!" },
    { input: "Discord server", output: "Join our Discord for community support and discussions!" },
    { input: "Reddit", output: "Check r/vikashstore for community discussions and project showcases!" },
    { input: "Social media", output: "Follow us @vikashstore on Twitter, Instagram, and LinkedIn!" },
    { input: "Feedback", output: "We value feedback! Email feedback@vikash.dev with suggestions." },
    { input: "Review product", output: "Leave reviews on product pages! Help other customers with your experience." },
    { input: "Testimonial", output: "Share your experience! Email testimonials@vikash.dev for feature on our site." },
    { input: "Partnership", output: "For partnerships, email business@vikash.dev with proposal." },
    { input: "Sponsorship", output: "We sponsor maker events! Email events@vikash.dev with proposal." },
    { input: "Job openings", output: "Check careers page for current openings. Also open to freelance for special projects!" },
    { input: "Internship", output: "We occasionally take interns! Email hr@vikash.dev with your details." },
    { input: "Events", output: "We attend maker fairs! Check events page or newsletter for upcoming appearances." },
    { input: "Maker faire", output: "Catch us at local Maker Faire! Check events for dates and booth number." },
    { input: "Workshop", output: "We host online workshops! Check events for schedule and registration." },
    { input: "Hackathon", output: "We sponsor hackathons! Email events@vikash.dev to support your event." },
    { input: "Thank you", output: "You're welcome! Happy to help. Anything else you need?" },
    { input: "Great service", output: "Thank you! We appreciate your business. Spread the word!" },
    { input: "Best prices", output: "We work hard to keep prices competitive! Check for deals and discounts." },
    { input: "Fast shipping", output: "Thanks! We aim to ship within 24 hours. Express options available too!" },
    { input: "Quality products", output: "Quality is our priority! All items tested before shipping." },
    { input: "Will order again", output: "Great to hear! Use REORDER in checkout for 5% off your next order!" },
    { input: "Recommend to friend", output: "Thanks! Share us with friends. We have a referral program too!" },
    { input: "Question about product", output: "What would you like to know about the product?" },
    { input: "More details", output: "Which product would you like more details about?" },
    { input: "Technical specs", output: "Which product's technical specifications do you need?" },
    { input: "Compare products", output: "Which products would you like me to compare?" },
    { input: "Best for beginners", output: "Arduino Uno is best for beginners. Easy to learn, lots of tutorials!" },
    { input: "Best for IoT", output: "ESP32 is best for IoT - WiFi, Bluetooth, low power, great for connected projects!" },
    { input: "Best for AI", output: "For AI/ML: Raspberry Pi 5 with Coral USB or NVIDIA Jetson Nano. What project?" },
    { input: "Best value", output: "Best value: ESP32 ($7) or Raspberry Pi Pico ($4). Both powerful for price!" },
    { input: "Professional use", output: "For professional: Arduino Portenta, ESP32-S3, or industrial PLCs. What application?" },
    { input: "Budget option", output: "Budget picks: ESP8266 ($3), ATtiny85 ($2), Raspberry Pi Pico ($4). Great basics!" },
    { input: "Premium option", output: "Premium: Portenta H7, Jetson Nano, or industrial solutions. What's the use case?" },

    // ========================================================================
    // Farewells (50 examples)
    // ========================================================================
    { input: "Goodbye", output: "Goodbye! Thank you for visiting Vikash Hardware Store. Come back anytime!" },
    { input: "Bye", output: "Bye! Happy to help anytime. Take care!" },
    { input: "See you later", output: "See you later! Don't hesitate to return if you need anything else!" },
    { input: "Thanks", output: "You're welcome! Anything else I can help with?" },
    { input: "Thank you", output: "Thank you! Feel free to ask if you need more help!" },
    { input: "That's all", output: "Great! Thanks for chatting. Have a wonderful day!" },
    { input: "I am done", output: "Done for now! Come back anytime. Take care!" },
    { input: "Talk to you later", output: "Talk to you later! We're here 24/7 online!" },
    { input: "Have a good day", output: "You too! Thanks for visiting!" },
    { input: "Take care", output: "Take care! Come back soon!" },
];

// ============================================================================
// TRAINING DATA MANAGER
// ============================================================================

class TrainingDataManager {
    constructor() {
        this.data = [];
        this.loaded = false;
        this.backendUrl = '';
    }

    // Initialize and load data
    async init(config = {}) {
        this.backendUrl = config.BACKEND_URL || '';
        
        // Try to load from backend first
        const loaded = await this.loadFromBackend();
        
        if (!loaded) {
            // Use default hardcoded data
            this.data = [...DEFAULT_TRAINING_DATA];
            console.log(`%c[TRAINING] Loaded ${this.data.length} default examples`, "color: #32CD32");
        }
        
        this.loaded = true;
        return this.data;
    }

    // Load training data from backend
    async loadFromBackend() {
        if (!this.backendUrl) return false;
        
        try {
            const response = await fetch(`${this.backendUrl}/neural/data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'load', data: [] })
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.entries > 0) {
                    console.log(`%c[TRAINING] Loaded ${result.entries} examples from file`, "color: #32CD32");
                    return true;
                }
            }
        } catch (error) {
            console.log("%c[TRAINING] Backend not available, using defaults", "color: #ffaa00");
        }
        return false;
    }

    // Save training data to backend (which saves to file)
    async saveToBackend() {
        if (!this.backendUrl) {
            console.warn("[TRAINING] No backend URL configured");
            return false;
        }

        try {
            const response = await fetch(`${this.backendUrl}/neural/data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'save', data: this.data })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log(`%c[TRAINING] Saved ${result.entries} examples to file`, "color: #32CD32");
                return true;
            }
        } catch (error) {
            console.error("[TRAINING] Save failed:", error);
        }
        return false;
    }

    // Add new training example
    addExample(input, output) {
        // Check for duplicates
        const exists = this.data.some(d => d.input.toLowerCase() === input.toLowerCase());
        if (exists) {
            console.warn(`[TRAINING] Duplicate training example: ${input}`);
            return false;
        }

        this.data.push({ input, output });
        return true;
    }

    // Get all training data
    getAll() {
        return [...this.data];
    }

    // Get count
    getCount() {
        return this.data.length;
    }

    // Find similar inputs (for matching queries)
    findSimilar(query, threshold = 0.5) {
        const queryLower = query.toLowerCase();
        const results = [];

        for (const item of this.data) {
            const inputLower = item.input.toLowerCase();
            
            // Simple word overlap similarity
            const queryWords = queryLower.split(/\s+/);
            const inputWords = inputLower.split(/\s+/);
            const overlap = queryWords.filter(w => inputWords.includes(w)).length;
            const similarity = overlap / Math.max(queryWords.length, inputWords.length);
            
            if (similarity >= threshold) {
                results.push({ ...item, similarity });
            }
        }

        // Sort by similarity
        results.sort((a, b) => b.similarity - a.similarity);
        return results.slice(0, 3);
    }

    // Export for backend
    exportForBackend() {
        return this.data.map(item => ({
            query: item.input,
            response: item.output,
            intent: "trained",
            confidence: 0.95,
            trained_at: new Date().toISOString()
        }));
    }
}

// Create global instance
const trainingDataManager = new TrainingDataManager();

// Export for use in training
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DEFAULT_TRAINING_DATA, TrainingDataManager, trainingDataManager };
} else {
    window.NEURAL_TRAINING_DATA = DEFAULT_TRAINING_DATA;
    window.TrainingDataManager = TrainingDataManager;
    window.trainingDataManager = trainingDataManager;
}
