-- إضافة جدول الإعدادات + منتجات تجريبية
USE mesora_store;

-- جدول الإعدادات (Key-Value)
CREATE TABLE IF NOT EXISTS settings (
    setting_key     VARCHAR(50) PRIMARY KEY,
    setting_value   TEXT,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO settings (setting_key, setting_value) VALUES
('store_name', 'MESORA — متجر ميسورا'),
('whatsapp_number', '9647866554424'),
('email', 'aliahmed.nkk5@gmail.com'),
('city', 'كربلاء، العراق'),
('free_shipping_threshold', '500000'),
('working_hours', '10:00 — 22:00');

-- منتجات تجريبية (تظهر في الموقع بعد الربط)
INSERT INTO products (sku, name_ar, description_ar, category_id, brand_id, cost_price, selling_price, stock_quantity, condition_type, warranty_months, main_image, is_featured) VALUES
('MES-GPU-001', 'كرت شاشة RTX', 'أداء عالي للألعاب والتصميم مع دعم Ray Tracing', 2, 3, 780000, 850000, 10, 'new', 12, 'picture/Gpu.optimized.jpg', 1),
('MES-ACC-001', 'كيبورد ميكانيكي', 'مفاتيح RGB احترافية قابلة للتخصيص', 9, 14, 95000, 120000, 3, 'used', 1, 'picture/Keybord.jpg', 1),
('MES-ACC-002', 'ماوس ألعاب', 'دقة عالية 16000 DPI واستجابة سريعة', 9, 15, 60000, 75000, 15, 'new', 6, 'picture/mouse.jpg', 1),
('MES-AUD-001', 'سماعات رأس', 'صوت محيطي 7.1 للألعاب مع ميكروفون عالي الجودة', 9, 14, 80000, 95000, 8, 'new', 6, 'picture/headset.jpg', 1);