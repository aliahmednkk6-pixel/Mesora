<?php
/**
 * MESORA API — الطلبات
 * Endpoints:
 *   POST /api/orders.php?action=create     → إنشاء طلب جديد (عام — من الموقع/الواتساب)
 *   GET  /api/orders.php?action=list       → قائمة الطلبات (أدمن)
 *   GET  /api/orders.php?action=get&id=5   → تفاصيل طلب (أدمن)
 *   PUT  /api/orders.php?action=status     → تغيير حالة طلب (أدمن) {id, status}
 *   GET  /api/orders.php?action=track&number=MES-2026-00001 → تتبع عام برقم الطلب
 */

require_once __DIR__ . '/config.php';
$action = $_GET['action'] ?? '';
$pdo = db();

// ===== إنشاء طلب جديد (عام) =====
if ($action === 'create' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = request_body();

    $name = trim($body['customer_name'] ?? '');
    $phone = trim($body['customer_phone'] ?? '');
    $items = $body['items'] ?? [];

    if (!$name || !$phone) json_error('الاسم ورقم الهاتف مطلوبان');
    if (!is_array($items) || empty($items)) json_error('لا توجد منتجات في الطلب');

    // التحقق من المنتجات وحساب المجموع من قاعدة البيانات (وليس من العميل — للأمان)
    $subtotal = 0;
    $validatedItems = [];
    $prodStmt = $pdo->prepare("SELECT id, name_ar, selling_price, discount_price, stock_quantity FROM products WHERE id = ? AND is_active = 1");

    foreach ($items as $item) {
        $pid = (int)($item['product_id'] ?? 0);
        $qty = max(1, (int)($item['quantity'] ?? 1));
        if (!$pid) continue;

        $prodStmt->execute([$pid]);
        $p = $prodStmt->fetch();
        if (!$p) json_error("منتج غير موجود (ID: $pid)");
        if ($p['stock_quantity'] < $qty) json_error("الكمية المتوفرة من [{$p['name_ar']}] هي {$p['stock_quantity']} فقط");

        $price = $p['discount_price'] !== null ? (float)$p['discount_price'] : (float)$p['selling_price'];
        $lineTotal = $price * $qty;
        $subtotal += $lineTotal;

        $validatedItems[] = [
            'product_id' => $pid,
            'product_name' => $p['name_ar'],
            'unit_price' => $price,
            'quantity' => $qty,
            'line_total' => $lineTotal,
        ];
    }

    if (empty($validatedItems)) json_error('لا توجد منتجات صالحة في الطلب');

    // الكوبون
    $discountAmount = 0;
    $couponId = null;
    $couponCode = strtoupper(trim($body['coupon_code'] ?? ''));
    if ($couponCode) {
        $cStmt = $pdo->prepare(
            "SELECT * FROM coupons WHERE code = ? AND is_active = 1
             AND (expires_at IS NULL OR expires_at > NOW())
             AND (starts_at IS NULL OR starts_at <= NOW())
             AND (max_uses IS NULL OR used_count < max_uses)"
        );
        $cStmt->execute([$couponCode]);
        $coupon = $cStmt->fetch();
        if (!$coupon) json_error('الكوبون غير صالح أو منتهي الصلاحية');
        if ($subtotal < (float)$coupon['min_order_total']) json_error('قيمة الطلب أقل من الحد الأدنى للكوبون');

        if ($coupon['discount_type'] === 'percent') {
            $discountAmount = round($subtotal * ((float)$coupon['discount_value'] / 100));
        } elseif ($coupon['discount_type'] === 'flat') {
            $discountAmount = min((float)$coupon['discount_value'], $subtotal);
        }
        $couponId = (int)$coupon['id'];
    }

    $total = max(0, $subtotal - $discountAmount);

    // رقم الطلب التسلسلي
    $year = date('Y');
    $seq = $pdo->query("SELECT COUNT(*) + 1 FROM orders WHERE YEAR(created_at) = $year")->fetchColumn();
    $orderNumber = sprintf('MES-%s-%05d', $year, $seq);

    // إنشاء أو تحديث العميل
    $custStmt = $pdo->prepare("SELECT id FROM customers WHERE phone = ?");
    $custStmt->execute([$phone]);
    $customerId = $custStmt->fetchColumn();

    if (!$customerId) {
        $pdo->prepare("INSERT INTO customers (full_name, phone, province) VALUES (?, ?, ?)")
            ->execute([$name, $phone, trim($body['province'] ?? '') ?: null]);
        $customerId = (int)$pdo->lastInsertId();
    } else {
        $pdo->prepare("UPDATE customers SET full_name = ?, province = COALESCE(NULLIF(?, ''), province) WHERE id = ?")
            ->execute([$name, trim($body['province'] ?? ''), $customerId]);
    }

    // إنشاء الطلب
    $allowedSources = ['website', 'whatsapp', 'phone', 'in_store'];
    $source = in_array($body['source'] ?? '', $allowedSources) ? $body['source'] : 'website';

    $stmt = $pdo->prepare(
        "INSERT INTO orders (order_number, customer_id, status, order_source, subtotal,
            discount_amount, total_amount, coupon_id, payment_method, shipping_address, admin_notes)
         VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->execute([
        $orderNumber,
        $customerId,
        $source,
        $subtotal,
        $discountAmount,
        $total,
        $couponId,
        in_array($body['payment_method'] ?? '', ['cod', 'transfer', 'zaincash', 'fastpay']) ? $body['payment_method'] : 'cod',
        trim($body['shipping_address'] ?? '') ?: null,
        trim($body['notes'] ?? '') ?: null,
    ]);
    $orderId = (int)$pdo->lastInsertId();

    // عناصر الطلب + خصم المخزون
    $itemStmt = $pdo->prepare(
        "INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, line_total)
         VALUES (?, ?, ?, ?, ?, ?)"
    );
    $stockStmt = $pdo->prepare("UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?");
    $invStmt = $pdo->prepare(
        "INSERT INTO inventory_movements (product_id, movement_type, quantity_change, stock_after, reference_id, created_by)
         VALUES (?, 'sale', ?, ?, ?, NULL)"
    );

    foreach ($validatedItems as $vi) {
        $itemStmt->execute([$orderId, $vi['product_id'], $vi['product_name'], $vi['unit_price'], $vi['quantity'], $vi['line_total']]);
        $stockStmt->execute([$vi['quantity'], $vi['product_id']]);

        $after = $pdo->prepare("SELECT stock_quantity FROM products WHERE id = ?");
        $after->execute([$vi['product_id']]);
        $invStmt->execute([$vi['product_id'], -$vi['quantity'], $after->fetchColumn(), $orderId]);
    }

    // استخدام الكوبون
    if ($couponId) {
        $pdo->prepare("UPDATE coupons SET used_count = used_count + 1 WHERE id = ?")->execute([$couponId]);
    }

    json_success([
        'order_id' => $orderId,
        'order_number' => $orderNumber,
        'subtotal' => $subtotal,
        'discount' => $discountAmount,
        'total' => $total,
    ], "تم استلام طلبك بنجاح! رقم الطلب: $orderNumber");
}

// ===== قائمة الطلبات (أدمن) =====
if ($action === 'list') {
    require_admin();
    $statusFilter = isset($_GET['status']) && $_GET['status'] !== 'all'
        ? 'WHERE o.status = ' . $pdo->quote($_GET['status']) : '';

    $stmt = $pdo->query(
        "SELECT o.*, c.full_name AS customer_name, c.phone, c.province,
                (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS items_count
         FROM orders o
         LEFT JOIN customers c ON c.id = o.customer_id
         $statusFilter
         ORDER BY o.created_at DESC
         LIMIT 200"
    );
    json_success($stmt->fetchAll());
}

// ===== تفاصيل طلب (أدمن) =====
if ($action === 'get') {
    require_admin();
    $id = (int)($_GET['id'] ?? 0);
    $stmt = $pdo->prepare(
        "SELECT o.*, c.full_name AS customer_name, c.phone, c.province, c.email
         FROM orders o LEFT JOIN customers c ON c.id = o.customer_id WHERE o.id = ?"
    );
    $stmt->execute([$id]);
    $order = $stmt->fetch();
    if (!$order) json_error('الطلب غير موجود', 404);

    $items = $pdo->prepare("SELECT * FROM order_items WHERE order_id = ?");
    $items->execute([$id]);
    $order['items'] = $items->fetchAll();

    $history = $pdo->prepare(
        "SELECT h.*, u.full_name AS changed_by_name FROM order_status_history h
         LEFT JOIN users u ON u.id = h.changed_by WHERE h.order_id = ? ORDER BY h.created_at ASC"
    );
    $history->execute([$id]);
    $order['history'] = $history->fetchAll();

    json_success($order);
}

// ===== تغيير حالة طلب (أدمن) =====
if ($action === 'status' && $_SERVER['REQUEST_METHOD'] === 'PUT') {
    require_admin();
    $body = request_body();
    $id = (int)($body['id'] ?? 0);
    $newStatus = $body['status'] ?? '';

    $validStatuses = ['pending', 'confirmed', 'assembling', 'shipping', 'delivered', 'cancelled', 'returned'];
    if (!$id || !in_array($newStatus, $validStatuses)) json_error('حالة غير صالحة');

    $old = $pdo->prepare("SELECT status FROM orders WHERE id = ?");
    $old->execute([$id]);
    $oldStatus = $old->fetchColumn();
    if ($oldStatus === false) json_error('الطلب غير موجود', 404);
    if ($oldStatus === $newStatus) json_success(null, 'الحالة لم تتغير');

    $pdo->prepare("UPDATE orders SET status = ?, delivered_at = IF(? = 'delivered', NOW(), delivered_at) WHERE id = ?")
        ->execute([$newStatus, $newStatus, $id]);

    // إرجاع المخزون عند الإلغاء أو الإرجاع
    if (in_array($newStatus, ['cancelled', 'returned']) && !in_array($oldStatus, ['cancelled', 'returned'])) {
        $items = $pdo->prepare("SELECT product_id, quantity FROM order_items WHERE order_id = ?");
        $items->execute([$id]);
        foreach ($items->fetchAll() as $it) {
            $pdo->prepare("UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?")
                ->execute([(int)$it['quantity'], $it['product_id']]);
            $after = $pdo->prepare("SELECT stock_quantity FROM products WHERE id = ?");
            $after->execute([$it['product_id']]);
            $pdo->prepare(
                "INSERT INTO inventory_movements (product_id, movement_type, quantity_change, stock_after, reference_id, note, created_by)
                 VALUES (?, 'return', ?, ?, ?, ?, ?)"
            )->execute([$it['product_id'], (int)$it['quantity'], $after->fetchColumn(), $id, 'إرجاع بسبب ' . $newStatus, $_SESSION['user_id']]);
        }
    }

    $pdo->prepare(
        "INSERT INTO order_status_history (order_id, old_status, new_status, changed_by)
         VALUES (?, ?, ?, ?)"
    )->execute([$id, $oldStatus, $newStatus, $_SESSION['user_id']]);

    log_activity('order.status_changed', 'order', $id, ['from' => $oldStatus, 'to' => $newStatus]);
    json_success(null, 'تم تحديث حالة الطلب');
}

// ===== تتبع عام برقم الطلب (بدون تسجيل دخول) =====
if ($action === 'track') {
    $number = trim($_GET['number'] ?? '');
    if (!$number) json_error('يرجى إدخال رقم الطلب');

    $stmt = $pdo->prepare(
        "SELECT order_number, status, created_at, delivered_at, total_amount FROM orders WHERE order_number = ?"
    );
    $stmt->execute([$number]);
    $order = $stmt->fetch();
    if (!$order) json_error('رقم الطلب غير موجود', 404);

    // إخفاء التفاصيل الحساسة — عرض الحالة فقط
    json_success([
        'order_number' => $order['order_number'],
        'status' => $order['status'],
        'created_at' => $order['created_at'],
        'delivered_at' => $order['delivered_at'],
    ]);
}

json_error('إجراء غير معروف', 400);