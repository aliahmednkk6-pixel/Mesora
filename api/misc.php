<?php
/**
 * MESORA API — الكوبونات والتقييمات والإعدادات
 * Endpoints:
 *   GET  /api/misc.php?action=coupons          → قائمة الكوبونات (أدمن)
 *   POST /api/misc.php?action=coupons          → إنشاء كوبون (أدمن)
 *   PUT  /api/misc.php?action=coupons          → تعديل كوبون (أدمن) {id, ...}
 *   DELETE /api/misc.php?action=coupons&id=5   → تعطيل كوبون (أدمن)
 *
 *   GET  /api/misc.php?action=reviews_public   → التقييمات المعتمدة (عام)
 *   GET  /api/misc.php?action=reviews_pending  → بانتظار الموافقة (أدمن)
 *   POST /api/misc.php?action=reviews         → إرسال تقييم جديد (عام)
 *   PUT  /api/misc.php?action=review_approve   → موافقة/رفض تقييم (أدمن) {id, approve}
 *
 *   GET  /api/misc.php?action=settings         → الإعدادات
 *   PUT  /api/misc.php?action=settings         → حفظ الإعدادات (أدمن)
 *
 *   GET  /api/misc.php?action=customers        → قائمة العملاء (أدمن)
 *   GET  /api/misc.php?action=stats            → إحصائيات لوحة التحكم (أدمن)
 */

require_once __DIR__ . '/config.php';
$action = $_GET['action'] ?? '';
$pdo = db();
$method = $_SERVER['REQUEST_METHOD'];

// ==================== الكوبونات ====================
if ($action === 'coupons' && $method === 'GET') {
    require_admin();
    json_success($pdo->query("SELECT * FROM coupons ORDER BY created_at DESC")->fetchAll());
}

if ($action === 'coupons' && $method === 'POST') {
    require_admin();
    $b = request_body();
    $code = strtoupper(trim($b['code'] ?? ''));
    if (!$code) json_error('كود الكوبون مطلوب');

    $check = $pdo->prepare("SELECT id FROM coupons WHERE code = ?");
    $check->execute([$code]);
    if ($check->fetch()) json_error('هذا الكود موجود مسبقاً');

    $pdo->prepare(
        "INSERT INTO coupons (code, discount_type, discount_value, min_order_total, max_uses, expires_at, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?)"
    )->execute([
        $code,
        in_array($b['discount_type'] ?? '', ['percent', 'flat', 'free_shipping']) ? $b['discount_type'] : 'percent',
        (float)($b['discount_value'] ?? 0),
        (float)($b['min_order_total'] ?? 0),
        !empty($b['max_uses']) ? (int)$b['max_uses'] : null,
        !empty($b['expires_at']) ? $b['expires_at'] : null,
        isset($b['is_active']) ? (int)(bool)$b['is_active'] : 1,
    ]);
    log_activity('coupon.created', 'coupon', (int)$pdo->lastInsertId(), ['code' => $code]);
    json_success(null, 'تم إنشاء الكوبون بنجاح');
}

if ($action === 'coupons' && $method === 'PUT') {
    require_admin();
    $b = request_body();
    $id = (int)($b['id'] ?? 0);
    if (!$id) json_error('معرّف الكوبون مطلوب');
    $pdo->prepare("UPDATE coupons SET is_active = ? WHERE id = ?")
        ->execute([(int)(bool)($b['is_active'] ?? true), $id]);
    log_activity('coupon.updated', 'coupon', $id);
    json_success(null, 'تم تحديث الكوبون');
}

if ($action === 'coupons' && $method === 'DELETE') {
    require_admin();
    $id = (int)($_GET['id'] ?? 0);
    $pdo->prepare("UPDATE coupons SET is_active = 0 WHERE id = ?")->execute([$id]);
    log_activity('coupon.disabled', 'coupon', $id);
    json_success(null, 'تم تعطيل الكوبون');
}

// ==================== التقييمات ====================
if ($action === 'reviews_public' && $method === 'GET') {
    $stmt = $pdo->query(
        "SELECT customer_name, city, rating, review_text, created_at
         FROM reviews WHERE is_approved = 1 AND product_id IS NULL
         ORDER BY created_at DESC LIMIT 50"
    );
    json_success($stmt->fetchAll());
}

if ($action === 'reviews_pending' && $method === 'GET') {
    require_admin();
    json_success($pdo->query(
        "SELECT * FROM reviews WHERE is_approved = 0 ORDER BY created_at DESC"
    )->fetchAll());
}

if ($action === 'reviews' && $method === 'POST') {
    $b = request_body();
    $name = trim($b['customer_name'] ?? '');
    $rating = (int)($b['rating'] ?? 0);
    $text = trim($b['review_text'] ?? '');

    if (!$name || !$text) json_error('الاسم والنص مطلوبان');
    if ($rating < 1 || $rating > 5) json_error('التقييم يجب أن يكون بين 1 و 5');

    $pdo->prepare(
        "INSERT INTO reviews (product_id, customer_name, city, rating, review_text, is_approved)
         VALUES (?, ?, ?, ?, ?, 0)"
    )->execute([
        !empty($b['product_id']) ? (int)$b['product_id'] : null,
        $name,
        trim($b['city'] ?? '') ?: null,
        $rating,
        $text,
    ]);
    json_success(null, 'شكراً لك! تم استلام تقييمك وسيظهر بعد المراجعة');
}

if ($action === 'review_approve' && $method === 'PUT') {
    require_admin();
    $b = request_body();
    $id = (int)($b['id'] ?? 0);
    $approve = (int)(bool)($b['approve'] ?? true);
    if (!$id) json_error('معرّف التقييم مطلوب');

    if ($approve) {
        $pdo->prepare("UPDATE reviews SET is_approved = 1 WHERE id = ?")->execute([$id]);
        // تحديث متوسط تقييم المنتج إن وجد
        $pid = $pdo->prepare("SELECT product_id FROM reviews WHERE id = ?");
        $pid->execute([$id]);
        $productId = $pid->fetchColumn();
        if ($productId) {
            $pdo->prepare(
                "UPDATE products p SET
                    rating_avg = (SELECT AVG(rating) FROM reviews WHERE product_id = p.id AND is_approved = 1),
                    reviews_count = (SELECT COUNT(*) FROM reviews WHERE product_id = p.id AND is_approved = 1)
                 WHERE p.id = ?"
            )->execute([$productId]);
        }
    } else {
        $pdo->prepare("DELETE FROM reviews WHERE id = ?")->execute([$id]);
    }
    log_activity($approve ? 'review.approved' : 'review.rejected', 'review', $id);
    json_success(null, $approve ? 'تم اعتماد التقييم' : 'تم رفض التقييم');
}

// ==================== الإعدادات ====================
if ($action === 'settings' && $method === 'GET') {
    $rows = $pdo->query("SELECT setting_key, setting_value FROM settings")->fetchAll();
    $settings = [];
    foreach ($rows as $r) $settings[$r['setting_key']] = $r['setting_value'];
    json_success($settings);
}

if ($action === 'settings' && $method === 'PUT') {
    require_admin();
    $b = request_body();
    $stmt = $pdo->prepare(
        "INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)"
    );
    foreach ($b as $key => $value) {
        if (!preg_match('/^[a-z0-9_]{2,50}$/', $key)) continue;
        $stmt->execute([$key, (string)$value]);
    }
    log_activity('settings.updated');
    json_success(null, 'تم حفظ الإعدادات بنجاح');
}

// ==================== العملاء ====================
if ($action === 'customers' && $method === 'GET') {
    require_admin();
    json_success($pdo->query(
        "SELECT c.*,
            (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id AND o.status != 'cancelled') AS total_orders,
            (SELECT COALESCE(SUM(o.total_amount), 0) FROM orders o WHERE o.customer_id = c.id AND o.status = 'delivered') AS total_spent
         FROM customers c ORDER BY c.created_at DESC LIMIT 500"
    )->fetchAll());
}

// ==================== إضافة مخزون سريعة (أدمن) ====================
if ($action === 'add_stock' && $method === 'POST') {
    require_admin();
    $b = request_body();
    $pid = (int)($b['product_id'] ?? 0);
    $qty = (int)($b['quantity'] ?? 0);
    if (!$pid || $qty <= 0) json_error('المنتج والكمية مطلوبان');

    $pdo->prepare("UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?")->execute([$qty, $pid]);
    $after = $pdo->prepare("SELECT stock_quantity FROM products WHERE id = ?");
    $after->execute([$pid]);
    $pdo->prepare(
        "INSERT INTO inventory_movements (product_id, movement_type, quantity_change, stock_after, note, created_by)
         VALUES (?, 'purchase', ?, ?, ?, ?)"
    )->execute([$pid, $qty, $after->fetchColumn(), $b['note'] ?? 'إضافة مخزون سريعة', $_SESSION['user_id']]);

    log_activity('stock.added', 'product', $pid, ['qty' => $qty]);
    json_success(null, "تمت إضافة $qty قطعة للمخزون");
}

// ==================== بيانات المخططات البيانية (أدمن) ====================
if ($action === 'charts' && $method === 'GET') {
    require_admin();

    // مبيعات آخر 14 يوم
    $daily = $pdo->query(
        "SELECT DATE(created_at) AS d, COALESCE(SUM(total_amount),0) AS total
         FROM orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) AND status NOT IN ('cancelled')
         GROUP BY DATE(created_at) ORDER BY d ASC"
    )->fetchAll();

    // أعلى الفئات مبيعاً
    $cats = $pdo->query(
        "SELECT c.name_ar, COALESCE(SUM(oi.line_total),0) AS total
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
         JOIN categories c ON c.id = p.category_id
         GROUP BY c.id ORDER BY total DESC LIMIT 6"
    )->fetchAll();

    // مصادر الطلبات
    $sources = $pdo->query(
        "SELECT order_source, COUNT(*) AS cnt FROM orders GROUP BY order_source"
    )->fetchAll();

    json_success(['daily' => $daily, 'categories' => $cats, 'sources' => $sources]);
}

// ==================== حركات المخزون (أدمن) ====================
if ($action === 'inventory' && $method === 'GET') {
    require_admin();
    json_success($pdo->query(
        "SELECT im.*, p.name_ar AS product_name, p.sku, u.username AS created_by_name
         FROM inventory_movements im
         LEFT JOIN products p ON p.id = im.product_id
         LEFT JOIN users u ON u.id = im.created_by
         ORDER BY im.created_at DESC
         LIMIT 200"
    )->fetchAll());
}

// ==================== إحصائيات لوحة التحكم ====================
if ($action === 'stats' && $method === 'GET') {
    require_admin();

    $todaySales = $pdo->query(
        "SELECT COALESCE(SUM(total_amount),0), COUNT(*) FROM orders
         WHERE DATE(created_at) = CURDATE() AND status NOT IN ('cancelled')"
    )->fetch(PDO::FETCH_NUM);

    $monthSales = $pdo->query(
        "SELECT COALESCE(SUM(total_amount),0), COUNT(*) FROM orders
         WHERE YEAR(created_at) = YEAR(NOW()) AND MONTH(created_at) = MONTH(NOW()) AND status NOT IN ('cancelled')"
    )->fetch(PDO::FETCH_NUM);

    $pendingOrders = $pdo->query("SELECT COUNT(*) FROM orders WHERE status = 'pending'")->fetchColumn();
    $lowStock = $pdo->query("SELECT COUNT(*) FROM products WHERE stock_quantity <= low_stock_threshold AND is_active = 1")->fetchColumn();
    $pendingReviews = $pdo->query("SELECT COUNT(*) FROM reviews WHERE is_approved = 0")->fetchColumn();

    // أحدث الطلبات
    $recentOrders = $pdo->query(
        "SELECT o.order_number, o.total_amount, o.status, o.created_at, c.full_name AS customer_name
         FROM orders o LEFT JOIN customers c ON c.id = o.customer_id
         ORDER BY o.created_at DESC LIMIT 10"
    )->fetchAll();

    // منتجات المخزون المنخفض
    $lowStockProducts = $pdo->query(
        "SELECT id, name_ar, stock_quantity, low_stock_threshold FROM products
         WHERE stock_quantity <= low_stock_threshold AND is_active = 1
         ORDER BY stock_quantity ASC LIMIT 10"
    )->fetchAll();

    json_success([
        'today_sales' => (float)$todaySales[0],
        'today_orders' => (int)$todaySales[1],
        'month_sales' => (float)$monthSales[0],
        'month_orders' => (int)$monthSales[1],
        'pending_orders' => (int)$pendingOrders,
        'low_stock_count' => (int)$lowStock,
        'pending_reviews' => (int)$pendingReviews,
        'recent_orders' => $recentOrders,
        'low_stock_products' => $lowStockProducts,
    ]);
}

json_error('إجراء غير معروف', 400);