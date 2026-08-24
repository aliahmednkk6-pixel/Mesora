-- ============================================================
-- MESORA Tech Store — إضافة جدول الإعدادات والمنتجات التجريبية
-- ============================================================

USE `if0_42737865_mesora`;

-- 1. إنشاء جدول الإعدادات (إذا لم يكن موجوداً)
CREATE TABLE IF NOT EXISTS settings (
    setting_key     VARCHAR(50) PRIMARY KEY,
    setting_value   TEXT,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. إدخال أو تحديث إعدادات المتجر
INSERT INTO settings (setting_key, setting_value) VALUES
('store_name', 'MESORA — متجر ميسورا'),
('whatsapp_number', '9647866554424'),
('email', 'aliahmed.nkk5@gmail.com'),
('city', 'كربلاء، العراق'),
('free_shipping_threshold', '500000'),
('working_hours', '10:00 — 22:00')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- 3. إضافة منتجات تجريبية للمتجر
INSERT INTO products (
    sku, 
    name_ar, 
    description_ar, 
    category_id, 
    brand_id, 
    cost_price, 
    selling_price, 
    stock_quantity, 
    condition_type, 
    warranty_months, 
    main_image, 
    is_featured
) VALUES
('MES-GPU-001', 'كرت شاشة RTX', 'أداء عالي للألعاب والتصميم مع دعم Ray Tracing', 2, 3, 780000.00, 850000.00, 10, 'new', 12, 'picture/Gpu.optimized.jpg', 1),
('MES-ACC-001', 'كيبورد ميكانيكي', 'مفاتيح RGB احترافية قابلة للتخصيص', 9, 14, 95000.00, 120000.00, 3, 'used', 1, 'picture/Keybord.jpg', 1),
('MES-ACC-002', 'ماوس ألعاب', 'دقة عالية 16000 DPI واستجابة سريعة', 9, 15, 60000.00, 75000.00, 15, 'new', 6, 'picture/mouse.jpg', 1),
('MES-AUD-001', 'سماعات رأس', 'صوت محيطي 7.1 للألعاب مع ميكروفون عالي الجودة', 9, 14, 80000.00, 95000.00, 8, 'new', 6, 'picture/headset.jpg', 1)
ON DUPLICATE KEY UPDATE 
    name_ar = VALUES(name_ar),
    description_ar = VALUES(description_ar),
    cost_price = VALUES(cost_price),
    selling_price = VALUES(selling_price),
    stock_quantity = VALUES(stock_quantity),
    main_image = VALUES(main_image);