-- ============================================================
-- MESORA Tech Store — نظام قاعدة البيانات الداخلي
-- Database: MySQL 8.0+ | Charset: utf8mb4
-- ============================================================

CREATE DATABASE IF NOT EXISTS mesora_store
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE mesora_store;

-- ============================================================
-- 1. جدول المستخدمين (الأدمن والموظفين)
-- ============================================================
CREATE TABLE users (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username        VARCHAR(50) NOT NULL UNIQUE,
    email           VARCHAR(100) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(100) NOT NULL,
    role            ENUM('super_admin', 'admin', 'employee') DEFAULT 'employee',
    is_active       BOOLEAN DEFAULT TRUE,
    last_login_at   DATETIME NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
) ENGINE=InnoDB;

-- ============================================================
-- 2. جدول الفئات
-- ============================================================
CREATE TABLE categories (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name_ar         VARCHAR(100) NOT NULL,
    name_en         VARCHAR(100) NOT NULL,
    slug            VARCHAR(120) NOT NULL UNIQUE,
    icon            VARCHAR(50) DEFAULT NULL,          -- اسم أيقونة lucide
    image           VARCHAR(255) DEFAULT NULL,
    sort_order      INT DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_categories_slug (slug),
    INDEX idx_categories_active (is_active)
) ENGINE=InnoDB;

-- ============================================================
-- 3. جدول الماركات (Brands)
-- ============================================================
CREATE TABLE brands (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE,
    logo            VARCHAR(255) DEFAULT NULL,
    is_active       BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

-- ============================================================
-- 4. جدول المنتجات
-- ============================================================
CREATE TABLE products (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sku                 VARCHAR(50) NOT NULL UNIQUE,          -- رمز المنتج الداخلي
    name_ar             VARCHAR(200) NOT NULL,
    name_en             VARCHAR(200) DEFAULT NULL,
    description_ar      TEXT,
    description_en      TEXT,
    category_id         INT UNSIGNED NOT NULL,
    brand_id            INT UNSIGNED DEFAULT NULL,
    cost_price          DECIMAL(12,2) NOT NULL DEFAULT 0,     -- سعر الشراء (داخلي)
    selling_price       DECIMAL(12,2) NOT NULL,               -- سعر البيع
    discount_price      DECIMAL(12,2) DEFAULT NULL,           -- سعر بعد الخصم
    stock_quantity      INT NOT NULL DEFAULT 0,
    low_stock_threshold INT NOT NULL DEFAULT 5,               -- حد التنبيه لنقص المخزون
    condition_type      ENUM('new', 'used') DEFAULT 'new',
    warranty_months     INT DEFAULT 0,                        -- مدة الضمان بالشهور
    main_image          VARCHAR(255) DEFAULT NULL,
    is_featured         BOOLEAN DEFAULT FALSE,                -- منتج مميز في الصفحة الرئيسية
    is_active           BOOLEAN DEFAULT TRUE,
    rating_avg          DECIMAL(3,2) DEFAULT 0.00,            -- محسوب من reviews
    reviews_count       INT UNSIGNED DEFAULT 0,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL,
    INDEX idx_products_sku (sku),
    INDEX idx_products_category (category_id),
    INDEX idx_products_active (is_active),
    INDEX idx_products_featured (is_featured),
    INDEX idx_products_stock (stock_quantity)
) ENGINE=InnoDB;

-- صور المنتجات الإضافية
CREATE TABLE product_images (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id      INT UNSIGNED NOT NULL,
    image_path      VARCHAR(255) NOT NULL,
    sort_order      INT DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- مواصفات المنتجات (RAM: 16GB، Socket: AM5 ...)
CREATE TABLE product_specs (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id      INT UNSIGNED NOT NULL,
    spec_key        VARCHAR(100) NOT NULL,
    spec_value      VARCHAR(255) NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_specs_product (product_id)
) ENGINE=InnoDB;

-- ============================================================
-- 5. جدول العملاء
-- ============================================================
CREATE TABLE customers (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name       VARCHAR(150) NOT NULL,
    phone           VARCHAR(20) NOT NULL UNIQUE,
    email           VARCHAR(100) DEFAULT NULL,
    province        VARCHAR(80) DEFAULT NULL,                -- المحافظة
    address         TEXT,
    notes           TEXT,
    total_orders    INT UNSIGNED DEFAULT 0,                   -- محسوب
    total_spent     DECIMAL(14,2) DEFAULT 0,                  -- محسوب
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_customers_phone (phone)
) ENGINE=InnoDB;

-- ============================================================
-- 6. جدول الطلبات
-- ============================================================
CREATE TABLE orders (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_number        VARCHAR(30) NOT NULL UNIQUE,          -- MES-2026-00001
    customer_id         INT UNSIGNED NOT NULL,
    status              ENUM('pending', 'confirmed', 'assembling', 'shipping', 'delivered', 'cancelled', 'returned')
                        DEFAULT 'pending',
    order_source        ENUM('website', 'whatsapp', 'phone', 'in_store') DEFAULT 'whatsapp',
    subtotal            DECIMAL(14,2) NOT NULL DEFAULT 0,
    discount_amount     DECIMAL(14,2) DEFAULT 0,
    shipping_fee        DECIMAL(14,2) DEFAULT 0,
    total_amount        DECIMAL(14,2) NOT NULL DEFAULT 0,
    coupon_id           INT UNSIGNED DEFAULT NULL,
    payment_method      ENUM('cod', 'transfer', 'zaincash', 'fastpay') DEFAULT 'cod',
    payment_status      ENUM('unpaid', 'partial', 'paid') DEFAULT 'unpaid',
    shipping_address    TEXT,
    tracking_number     VARCHAR(100) DEFAULT NULL,
    admin_notes         TEXT,
    confirmed_by        INT UNSIGNED DEFAULT NULL,             -- الموظف الذي أكد الطلب
    delivered_at        DATETIME NULL,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (confirmed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_orders_number (order_number),
    INDEX idx_orders_status (status),
    INDEX idx_orders_created (created_at)
) ENGINE=InnoDB;

-- عناصر الطلب
CREATE TABLE order_items (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id        INT UNSIGNED NOT NULL,
    product_id      INT UNSIGNED NOT NULL,
    product_name    VARCHAR(200) NOT NULL,                    -- نسخة ثابتة للاسم وقت البيع
    unit_price      DECIMAL(12,2) NOT NULL,
    quantity        INT UNSIGNED NOT NULL DEFAULT 1,
    line_total      DECIMAL(14,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    INDEX idx_items_order (order_id)
) ENGINE=InnoDB;

-- سجل تغيير حالة الطلب (Timeline)
CREATE TABLE order_status_history (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id        INT UNSIGNED NOT NULL,
    old_status      VARCHAR(30),
    new_status      VARCHAR(30) NOT NULL,
    changed_by      INT UNSIGNED DEFAULT NULL,
    note            TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- 7. الكوبونات
-- ============================================================
CREATE TABLE coupons (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code            VARCHAR(30) NOT NULL UNIQUE,
    discount_type   ENUM('percent', 'flat', 'free_shipping') NOT NULL,
    discount_value  DECIMAL(12,2) DEFAULT 0,
    min_order_total DECIMAL(12,2) DEFAULT 0,
    max_uses        INT UNSIGNED DEFAULT NULL,               -- NULL = غير محدود
    used_count      INT UNSIGNED DEFAULT 0,
    starts_at       DATETIME DEFAULT NULL,
    expires_at      DATETIME DEFAULT NULL,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_coupons_code (code)
) ENGINE=InnoDB;

-- ============================================================
-- 8. التقييمات
-- ============================================================
CREATE TABLE reviews (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id      INT UNSIGNED DEFAULT NULL,               -- NULL = تقييم عام للمتجر
    customer_name   VARCHAR(100) NOT NULL,
    city            VARCHAR(80) DEFAULT NULL,
    rating          TINYINT UNSIGNED NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text     TEXT,
    is_approved     BOOLEAN DEFAULT FALSE,                   -- يظهر بعد موافقة الأدمن
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_reviews_product (product_id),
    INDEX idx_reviews_approved (is_approved)
) ENGINE=InnoDB;

-- ============================================================
-- 9. حركات المخزون (Inventory Log)
-- ============================================================
CREATE TABLE inventory_movements (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id      INT UNSIGNED NOT NULL,
    movement_type   ENUM('purchase', 'sale', 'return', 'adjustment', 'damage') NOT NULL,
    quantity_change INT NOT NULL,                             -- +إضافة / -خصم
    stock_after     INT NOT NULL,
    reference_id    INT UNSIGNED DEFAULT NULL,               -- رقم الطلب أو الفاتورة
    note            TEXT,
    created_by      INT UNSIGNED DEFAULT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_inv_product (product_id),
    INDEX idx_inv_date (created_at)
) ENGINE=InnoDB;

-- ============================================================
-- 10. المصروفات (للحسابات الداخلية)
-- ============================================================
CREATE TABLE expenses (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    expense_type    ENUM('rent', 'salary', 'shipping', 'purchase', 'utilities', 'other') NOT NULL,
    amount          DECIMAL(14,2) NOT NULL,
    description     TEXT,
    spent_at        DATE NOT NULL,
    created_by      INT UNSIGNED DEFAULT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- 11. سجل النشاطات (Audit Log)
-- ============================================================
CREATE TABLE activity_logs (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         INT UNSIGNED DEFAULT NULL,
    action          VARCHAR(100) NOT NULL,                   -- مثال: product.created, order.updated
    entity_type     VARCHAR(50),
    entity_id       INT UNSIGNED DEFAULT NULL,
    details         JSON,
    ip_address      VARCHAR(45),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_logs_user (user_id),
    INDEX idx_logs_date (created_at)
) ENGINE=InnoDB;

-- ============================================================
-- بيانات أولية (Seed Data)
-- ============================================================

-- الفئات
INSERT INTO categories (name_ar, name_en, slug, icon, sort_order) VALUES
('معالجات', 'Processors', 'cpu', 'cpu', 1),
('كروت شاشة', 'Graphics Cards', 'gpu', 'monitor', 2),
('الذاكرة RAM', 'Memory', 'ram', 'memory-stick', 3),
('التخزين', 'Storage', 'storage', 'hard-drive', 4),
('لوحات أم', 'Motherboards', 'motherboard', 'circuit-board', 5),
('مبردات', 'Cooling', 'cooling', 'fan', 6),
('كيسات', 'Cases', 'case', 'box', 7),
('شاشات', 'Monitors', 'monitor', 'monitor', 8),
('ملحقات', 'Accessories', 'accessories', 'keyboard', 9);

-- الماركات
INSERT INTO brands (name) VALUES
('Intel'), ('AMD'), ('NVIDIA'), ('ASUS'), ('MSI'),
('Gigabyte'), ('Corsair'), ('Kingston'), ('Samsung'), ('DeepCool'),
('Thermalright'), ('NZXT'), ('Lian Li'), ('Razer'), ('Logitech');

-- مستخدم أدمن افتراضي (كلمة المرور: ChangeMe123! — يجب تغييرها فوراً)
INSERT INTO users (username, email, password_hash, full_name, role) VALUES
('admin', 'aliahmed.nkk5@gmail.com', '$2y$10$lsX8iP68S9Bw2hE.mCeQJ.jupzPZNSrBv7riuDUaVSkXpFypCQKD6', 'مدير المتجر', 'super_admin');

-- كوبونات نشطة (نفس الموجودة بالموقع)
INSERT INTO coupons (code, discount_type, discount_value, is_active) VALUES
('MESORA5', 'percent', 5, TRUE),
('IRAQTECH', 'flat', 25000, TRUE),
('FREESHIP', 'free_shipping', 0, TRUE),
('RTXPOWER', 'percent', 10, TRUE);

-- تقييمات افتراضية معتمدة
INSERT INTO reviews (customer_name, city, rating, review_text, is_approved) VALUES
('أحمد ك.', 'بغداد', 5, 'اشتريت معالج مستعمل بحالة ممتازة، الفحص كان دقيق والتوصيل خلال يوم واحد.', TRUE),
('سارة م.', 'أربيل', 5, 'جمعوا لي جهاز ألعاب كامل بميزانية محددة والأداء فاق توقعاتي.', TRUE),
('علي ر.', 'البصرة', 5, 'وفروا لي كرت شاشة نادر لم أجده في أي مكان آخر. خدمة محترفة.', TRUE);