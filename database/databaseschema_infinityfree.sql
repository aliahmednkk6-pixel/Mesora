-- ============================================================
-- MESORA Tech Store — نظام قاعدة البيانات الداخلي
-- Database: MySQL 8.0+
-- Charset: utf8mb4
-- Compatible with InfinityFree / MySQL
-- ============================================================

USE `if0_42737865_mesora`;

-- ============================================================
-- UTF-8 / Arabic Support
-- ============================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET COLLATION_CONNECTION = utf8mb4_unicode_ci;

-- محاولة ضبط ترميز قاعدة البيانات
ALTER DATABASE `if0_42737865_mesora`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- ============================================================
-- حذف الجداول القديمة عند إعادة الاستيراد
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS inventory_movements;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS order_status_history;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS coupons;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS product_specs;
DROP TABLE IF EXISTS product_images;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS brands;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 1. المستخدمون (الأدمن والموظفون)
-- ============================================================

CREATE TABLE users (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username        VARCHAR(50) NOT NULL UNIQUE,
    email           VARCHAR(100) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(100) NOT NULL,
    role            ENUM('super_admin', 'admin', 'employee')
                    NOT NULL DEFAULT 'employee',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at   DATETIME NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
)
ENGINE=InnoDB
DEFAULT CHARACTER SET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. الفئات
-- ============================================================

CREATE TABLE categories (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name_ar         VARCHAR(100) NOT NULL,
    name_en         VARCHAR(100) NOT NULL,
    slug            VARCHAR(120) NOT NULL UNIQUE,
    icon            VARCHAR(50) DEFAULT NULL,
    image           VARCHAR(255) DEFAULT NULL,
    sort_order      INT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_categories_slug (slug),
    INDEX idx_categories_active (is_active)
)
ENGINE=InnoDB
DEFAULT CHARACTER SET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. الماركات
-- ============================================================

CREATE TABLE brands (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE,
    logo            VARCHAR(255) DEFAULT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE
)
ENGINE=InnoDB
DEFAULT CHARACTER SET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. المنتجات
-- ============================================================

CREATE TABLE products (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    sku                 VARCHAR(50) NOT NULL UNIQUE,

    name_ar             VARCHAR(200) NOT NULL,
    name_en             VARCHAR(200) DEFAULT NULL,

    description_ar      TEXT,
    description_en      TEXT,

    category_id         INT UNSIGNED NOT NULL,
    brand_id            INT UNSIGNED DEFAULT NULL,

    cost_price          DECIMAL(12,2) NOT NULL DEFAULT 0,
    selling_price       DECIMAL(12,2) NOT NULL,
    discount_price      DECIMAL(12,2) DEFAULT NULL,

    stock_quantity      INT NOT NULL DEFAULT 0,
    low_stock_threshold INT NOT NULL DEFAULT 5,

    condition_type      ENUM('new', 'used')
                        NOT NULL DEFAULT 'new',

    warranty_months     INT NOT NULL DEFAULT 0,

    main_image          VARCHAR(255) DEFAULT NULL,

    is_featured         BOOLEAN NOT NULL DEFAULT FALSE,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,

    rating_avg          DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    reviews_count       INT UNSIGNED NOT NULL DEFAULT 0,

    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_products_category
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_products_brand
        FOREIGN KEY (brand_id)
        REFERENCES brands(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    INDEX idx_products_sku (sku),
    INDEX idx_products_category (category_id),
    INDEX idx_products_active (is_active),
    INDEX idx_products_featured (is_featured),
    INDEX idx_products_stock (stock_quantity)
)
ENGINE=InnoDB
DEFAULT CHARACTER SET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. صور المنتجات
-- ============================================================

CREATE TABLE product_images (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id      INT UNSIGNED NOT NULL,
    image_path      VARCHAR(255) NOT NULL,
    sort_order      INT NOT NULL DEFAULT 0,

    CONSTRAINT fk_product_images_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    INDEX idx_product_images_product (product_id)
)
ENGINE=InnoDB
DEFAULT CHARACTER SET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. مواصفات المنتجات
-- ============================================================

CREATE TABLE product_specs (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id      INT UNSIGNED NOT NULL,
    spec_key        VARCHAR(100) NOT NULL,
    spec_value      VARCHAR(255) NOT NULL,

    CONSTRAINT fk_product_specs_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    INDEX idx_specs_product (product_id)
)
ENGINE=InnoDB
DEFAULT CHARACTER SET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. العملاء
-- ============================================================

CREATE TABLE customers (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    full_name       VARCHAR(150) NOT NULL,
    phone           VARCHAR(20) NOT NULL UNIQUE,
    email           VARCHAR(100) DEFAULT NULL,

    province        VARCHAR(80) DEFAULT NULL,
    address         TEXT,
    notes           TEXT,

    total_orders    INT UNSIGNED NOT NULL DEFAULT 0,
    total_spent     DECIMAL(14,2) NOT NULL DEFAULT 0,

    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_customers_phone (phone)
)
ENGINE=InnoDB
DEFAULT CHARACTER SET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. الكوبونات
-- ============================================================

CREATE TABLE coupons (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    code            VARCHAR(30) NOT NULL UNIQUE,

    discount_type   ENUM('percent', 'flat', 'free_shipping')
                    NOT NULL,

    discount_value  DECIMAL(12,2) NOT NULL DEFAULT 0,
    min_order_total DECIMAL(12,2) NOT NULL DEFAULT 0,

    max_uses        INT UNSIGNED DEFAULT NULL,
    used_count      INT UNSIGNED NOT NULL DEFAULT 0,

    starts_at       DATETIME DEFAULT NULL,
    expires_at      DATETIME DEFAULT NULL,

    is_active       BOOLEAN NOT NULL DEFAULT TRUE,

    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_coupons_code (code)
)
ENGINE=InnoDB
DEFAULT CHARACTER SET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 9. الطلبات
-- ============================================================

CREATE TABLE orders (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    order_number        VARCHAR(30) NOT NULL UNIQUE,

    customer_id         INT UNSIGNED NOT NULL,

    status              ENUM(
                            'pending',
                            'confirmed',
                            'assembling',
                            'shipping',
                            'delivered',
                            'cancelled',
                            'returned'
                        )
                        NOT NULL DEFAULT 'pending',

    order_source        ENUM(
                            'website',
                            'whatsapp',
                            'phone',
                            'in_store'
                        )
                        NOT NULL DEFAULT 'whatsapp',

    subtotal            DECIMAL(14,2) NOT NULL DEFAULT 0,
    discount_amount     DECIMAL(14,2) NOT NULL DEFAULT 0,
    shipping_fee        DECIMAL(14,2) NOT NULL DEFAULT 0,
    total_amount        DECIMAL(14,2) NOT NULL DEFAULT 0,

    coupon_id           INT UNSIGNED DEFAULT NULL,

    payment_method      ENUM(
                            'cod',
                            'transfer',
                            'zaincash',
                            'fastpay'
                        )
                        NOT NULL DEFAULT 'cod',

    payment_status      ENUM(
                            'unpaid',
                            'partial',
                            'paid'
                        )
                        NOT NULL DEFAULT 'unpaid',

    shipping_address    TEXT,
    tracking_number     VARCHAR(100) DEFAULT NULL,
    admin_notes         TEXT,

    confirmed_by        INT UNSIGNED DEFAULT NULL,

    delivered_at        DATETIME NULL,

    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_orders_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_orders_coupon
        FOREIGN KEY (coupon_id)
        REFERENCES coupons(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_orders_confirmed_by
        FOREIGN KEY (confirmed_by)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    INDEX idx_orders_number (order_number),
    INDEX idx_orders_status (status),
    INDEX idx_orders_customer (customer_id),
    INDEX idx_orders_coupon (coupon_id),
    INDEX idx_orders_created (created_at)
)
ENGINE=InnoDB
DEFAULT CHARACTER SET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 10. عناصر الطلب
-- ============================================================

CREATE TABLE order_items (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    order_id        INT UNSIGNED NOT NULL,
    product_id      INT UNSIGNED NOT NULL,

    product_name    VARCHAR(200) NOT NULL,

    unit_price      DECIMAL(12,2) NOT NULL,

    quantity        INT UNSIGNED NOT NULL DEFAULT 1,

    line_total      DECIMAL(14,2) NOT NULL,

    CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_order_items_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    INDEX idx_items_order (order_id),
    INDEX idx_items_product (product_id)
)
ENGINE=InnoDB
DEFAULT CHARACTER SET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 11. سجل حالات الطلب
-- ============================================================

CREATE TABLE order_status_history (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    order_id        INT UNSIGNED NOT NULL,

    old_status      VARCHAR(30) DEFAULT NULL,
    new_status      VARCHAR(30) NOT NULL,

    changed_by      INT UNSIGNED DEFAULT NULL,

    note            TEXT,

    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_order_history_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_order_history_user
        FOREIGN KEY (changed_by)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    INDEX idx_order_history_order (order_id),
    INDEX idx_order_history_user (changed_by)
)
ENGINE=InnoDB
DEFAULT CHARACTER SET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 12. التقييمات
-- ============================================================

CREATE TABLE reviews (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    product_id      INT UNSIGNED DEFAULT NULL,

    customer_name   VARCHAR(100) NOT NULL,
    city            VARCHAR(80) DEFAULT NULL,

    rating          TINYINT UNSIGNED NOT NULL,

    review_text     TEXT,

    is_approved     BOOLEAN NOT NULL DEFAULT FALSE,

    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_reviews_rating
        CHECK (rating BETWEEN 1 AND 5),

    CONSTRAINT fk_reviews_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    INDEX idx_reviews_product (product_id),
    INDEX idx_reviews_approved (is_approved)
)
ENGINE=InnoDB
DEFAULT CHARACTER SET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 13. حركات المخزون
-- ============================================================

CREATE TABLE inventory_movements (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    product_id      INT UNSIGNED NOT NULL,

    movement_type   ENUM(
                        'purchase',
                        'sale',
                        'return',
                        'adjustment',
                        'damage'
                    )
                    NOT NULL,

    quantity_change INT NOT NULL,

    stock_after     INT NOT NULL,

    reference_id    INT UNSIGNED DEFAULT NULL,

    note            TEXT,

    created_by      INT UNSIGNED DEFAULT NULL,

    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_inventory_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_inventory_user
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    INDEX idx_inv_product (product_id),
    INDEX idx_inv_user (created_by),
    INDEX idx_inv_date (created_at)
)
ENGINE=InnoDB
DEFAULT CHARACTER SET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 14. المصروفات
-- ============================================================

CREATE TABLE expenses (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    expense_type    ENUM(
                        'rent',
                        'salary',
                        'shipping',
                        'purchase',
                        'utilities',
                        'other'
                    )
                    NOT NULL,

    amount          DECIMAL(14,2) NOT NULL,

    description     TEXT,

    spent_at        DATE NOT NULL,

    created_by      INT UNSIGNED DEFAULT NULL,

    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_expenses_user
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    INDEX idx_expenses_type (expense_type),
    INDEX idx_expenses_date (spent_at)
)
ENGINE=InnoDB
DEFAULT CHARACTER SET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 15. سجل النشاطات
-- ============================================================

CREATE TABLE activity_logs (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id         INT UNSIGNED DEFAULT NULL,

    action          VARCHAR(100) NOT NULL,

    entity_type     VARCHAR(50) DEFAULT NULL,

    entity_id       INT UNSIGNED DEFAULT NULL,

    details         JSON,

    ip_address      VARCHAR(45) DEFAULT NULL,

    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_activity_logs_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    INDEX idx_logs_user (user_id),
    INDEX idx_logs_entity (entity_type, entity_id),
    INDEX idx_logs_date (created_at)
)
ENGINE=InnoDB
DEFAULT CHARACTER SET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Seed Data
-- ============================================================

-- ============================================================
-- الفئات
-- ============================================================

INSERT INTO categories
(name_ar, name_en, slug, icon, sort_order)
VALUES

('معالجات', 'Processors', 'cpu', 'cpu', 1),
('كروت شاشة', 'Graphics Cards', 'gpu', 'monitor', 2),
('الذاكرة RAM', 'Memory', 'ram', 'memory-stick', 3),
('التخزين', 'Storage', 'storage', 'hard-drive', 4),
('لوحات أم', 'Motherboards', 'motherboard', 'circuit-board', 5),
('مبردات', 'Cooling', 'cooling', 'fan', 6),
('كيسات', 'Cases', 'case', 'box', 7),
('شاشات', 'Monitors', 'monitor', 'monitor', 8),
('ملحقات', 'Accessories', 'accessories', 'keyboard', 9);

-- ============================================================
-- الماركات
-- ============================================================

INSERT INTO brands
(name)
VALUES
('Intel'),
('AMD'),
('NVIDIA'),
('ASUS'),
('MSI'),
('Gigabyte'),
('Corsair'),
('Kingston'),
('Samsung'),
('DeepCool'),
('Thermalright'),
('NZXT'),
('Lian Li'),
('Razer'),
('Logitech');

-- ============================================================
-- مستخدم الأدمن الافتراضي
-- Password: ChangeMe123!
-- يجب تغيير كلمة المرور فور تسجيل الدخول
-- ============================================================

INSERT INTO users
(username, email, password_hash, full_name, role)
VALUES
(
    'admin',
    'aliahmed.nkk5@gmail.com',
    '$2y$10$lsX8iP68S9Bw2hE.mCeQJ.jupzPZNSrBv7riuDUaVSkXpFypCQKD6',
    'مدير المتجر',
    'super_admin'
);

-- ============================================================
-- الكوبونات
-- ============================================================

INSERT INTO coupons
(code, discount_type, discount_value, is_active)
VALUES
('MESORA5', 'percent', 5, TRUE),
('IRAQTECH', 'flat', 25000, TRUE),
('FREESHIP', 'free_shipping', 0, TRUE),
('RTXPOWER', 'percent', 10, TRUE);

-- ============================================================
-- التقييمات الافتراضية
-- ============================================================

INSERT INTO reviews
(customer_name, city, rating, review_text, is_approved)
VALUES

(
    'أحمد ك.',
    'بغداد',
    5,
    'اشتريت معالج مستعمل بحالة ممتازة، الفحص كان دقيق والتوصيل خلال يوم واحد.',
    TRUE
),

(
    'سارة م.',
    'أربيل',
    5,
    'جمعوا لي جهاز ألعاب كامل بميزانية محددة والأداء فاق توقعاتي.',
    TRUE
),

(
    'علي ر.',
    'البصرة',
    5,
    'وفروا لي كرت شاشة نادر لم أجده في أي مكان آخر. خدمة محترفة.',
    TRUE
);

-- ============================================================
-- التأكد من إعادة تفعيل العلاقات
-- ============================================================

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- END OF MESORA DATABASE SCHEMA
-- ============================================================