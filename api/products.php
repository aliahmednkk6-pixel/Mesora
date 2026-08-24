<?php
/**
 * MESORA API — المنتجات
 * Endpoints:
 *   GET    /api/products.php              → قائمة المنتجات (عام — النشطة فقط)
 *   GET    /api/products.php?all=1        → كل المنتجات (أدمن فقط)
 *   GET    /api/products.php?id=5         → منتج واحد
 *   POST   /api/products.php              → إضافة منتج (أدمن)
 *   PUT    /api/products.php              → تعديل منتج (أدمن) {id, ...fields}
 *   DELETE /api/products.php?id=5         → حذف منتج (أدمن)
 */
require_once __DIR__ . '/db.php';

// استعلام لتمكين جلب جميع المنتجات من قاعدة البيانات
try {
    $stmt = $pdo->query("SELECT * FROM products WHERE is_featured = 1");
    $products = $stmt->fetchAll();

    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => true, 'data' => $products]);
} catch (\PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
require_once __DIR__ . '/config.php';
$method = $_SERVER['REQUEST_METHOD'];

// ===== GET =====
if ($method === 'GET') {
    $pdo = db();

    // منتج واحد
    if (isset($_GET['id'])) {
        $stmt = $pdo->prepare(
            "SELECT p.*, c.name_ar AS category_name, b.name AS brand_name
             FROM products p
             LEFT JOIN categories c ON c.id = p.category_id
             LEFT JOIN brands b ON b.id = p.brand_id
             WHERE p.id = ?"
        );
        $stmt->execute([(int)$_GET['id']]);
        $product = $stmt->fetch();
        if (!$product) json_error('المنتج غير موجود', 404);

        // الصور والمواصفات
        $imgStmt = $pdo->prepare("SELECT image_path FROM product_images WHERE product_id = ? ORDER BY sort_order");
        $imgStmt->execute([$product['id']]);
        $product['images'] = $imgStmt->fetchAll(PDO::FETCH_COLUMN);

        $specStmt = $pdo->prepare("SELECT spec_key, spec_value FROM product_specs WHERE product_id = ?");
        $specStmt->execute([$product['id']]);
        $product['specs'] = $specStmt->fetchAll();

        json_success($product);
    }

    // كل المنتجات (أدمن)
    if (isset($_GET['all'])) {
        require_admin();
        $stmt = $pdo->query(
            "SELECT p.*, c.name_ar AS category_name, b.name AS brand_name
             FROM products p
             LEFT JOIN categories c ON c.id = p.category_id
             LEFT JOIN brands b ON b.id = p.brand_id
             ORDER BY p.created_at DESC"
        );
        json_success($stmt->fetchAll());
    }

    // المنتجات النشطة (عام — للموقع)
    $featuredOnly = isset($_GET['featured']) ? 'AND p.is_featured = 1' : '';
    $categoryFilter = isset($_GET['category']) ? 'AND c.slug = ' . $pdo->quote($_GET['category']) : '';
    $limit = isset($_GET['limit']) ? 'LIMIT ' . (int)$_GET['limit'] : '';

    $stmt = $pdo->query(
        "SELECT p.id, p.sku, p.name_ar, p.description_ar, p.selling_price, p.discount_price,
                p.stock_quantity, p.condition_type, p.warranty_months, p.main_image,
                p.rating_avg, p.reviews_count, c.slug AS category_slug, c.name_ar AS category_name,
                b.name AS brand_name
         FROM products p
         LEFT JOIN categories c ON c.id = p.category_id
         LEFT JOIN brands b ON b.id = p.brand_id
         WHERE p.is_active = 1 $featuredOnly $categoryFilter
         ORDER BY p.is_featured DESC, p.created_at DESC
         $limit"
    );
    json_success($stmt->fetchAll());
}

// ===== POST (إضافة منتج) =====
if ($method === 'POST') {
    require_admin();
    $body = request_body();

    $sku = trim($body['sku'] ?? '');
    $name = trim($body['name_ar'] ?? '');
    if (!$sku || !$name) json_error('رمز المنتج (SKU) والاسم مطلوبان');

    // التحقق من عدم تكرار SKU
    $check = db()->prepare("SELECT id FROM products WHERE sku = ?");
    $check->execute([$sku]);
    if ($check->fetch()) json_error('رمز المنتج (SKU) موجود مسبقاً');

    // براند مكتوب يدوياً — إنشاءه تلقائياً إن لم يكن موجوداً
    $brandId = !empty($body['brand_id']) ? (int)$body['brand_id'] : null;
    $brandName = trim($body['brand_name'] ?? '');
    if (!$brandId && $brandName !== '') {
        $bStmt = db()->prepare("SELECT id FROM brands WHERE name = ?");
        $bStmt->execute([$brandName]);
        $existing = $bStmt->fetchColumn();
        if ($existing) {
            $brandId = (int)$existing;
        } else {
            db()->prepare("INSERT INTO brands (name) VALUES (?)")->execute([$brandName]);
            $brandId = (int)db()->lastInsertId();
        }
    }

    $stmt = db()->prepare(
        "INSERT INTO products (sku, name_ar, name_en, description_ar, category_id, brand_id,
            cost_price, selling_price, discount_price, stock_quantity, condition_type,
            warranty_months, main_image, is_featured, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->execute([
        $sku,
        $name,
        trim($body['name_en'] ?? '') ?: null,
        trim($body['description_ar'] ?? '') ?: null,
        (int)($body['category_id'] ?? 0),
        $brandId,
        (float)($body['cost_price'] ?? 0),
        (float)($body['selling_price'] ?? 0),
        !empty($body['discount_price']) ? (float)$body['discount_price'] : null,
        (int)($body['stock_quantity'] ?? 0),
        in_array($body['condition_type'] ?? '', ['new', 'used']) ? $body['condition_type'] : 'new',
        (int)($body['warranty_months'] ?? 0),
        trim($body['main_image'] ?? '') ?: null,
        !empty($body['is_featured']) ? 1 : 0,
        isset($body['is_active']) ? (int)(bool)$body['is_active'] : 1,
    ]);

    $productId = (int)db()->lastInsertId();

    // تسجيل حركة مخزون أولية
    $stock = (int)($body['stock_quantity'] ?? 0);
    if ($stock > 0) {
        db()->prepare(
            "INSERT INTO inventory_movements (product_id, movement_type, quantity_change, stock_after, note, created_by)
             VALUES (?, 'purchase', ?, ?, 'إضافة منتج جديد', ?)"
        )->execute([$productId, $stock, $stock, $_SESSION['user_id']]);
    }

    log_activity('product.created', 'product', $productId, ['sku' => $sku, 'name' => $name]);
    json_success(['id' => $productId], 'تم إضافة المنتج بنجاح');
}

// ===== PUT (تعديل منتج) =====
if ($method === 'PUT') {
    require_admin();
    $body = request_body();
    $id = (int)($body['id'] ?? 0);
    if (!$id) json_error('معرّف المنتج مطلوب');

    $allowed = ['name_ar', 'name_en', 'description_ar', 'category_id', 'brand_id',
                'cost_price', 'selling_price', 'discount_price', 'stock_quantity',
                'condition_type', 'warranty_months', 'main_image', 'is_featured', 'is_active'];

    $sets = [];
    $params = [];
    foreach ($allowed as $field) {
        if (array_key_exists($field, $body)) {
            $sets[] = "$field = ?";
            $val = $body[$field];
            if (in_array($field, ['category_id', 'brand_id', 'stock_quantity', 'warranty_months'])) {
                $val = $val === null || $val === '' ? null : (int)$val;
            } elseif (in_array($field, ['cost_price', 'selling_price', 'discount_price'])) {
                $val = $val === null || $val === '' ? null : (float)$val;
            } elseif (in_array($field, ['is_featured', 'is_active'])) {
                $val = (int)(bool)$val;
            }
            $params[] = $val;
        }
    }

    if (empty($sets)) json_error('لا توجد حقول للتعديل');
    $params[] = $id;

    db()->prepare("UPDATE products SET " . implode(', ', $sets) . " WHERE id = ?")->execute($params);

    log_activity('product.updated', 'product', $id, $body);
    json_success(null, 'تم تحديث المنتج بنجاح');
}

// ===== DELETE =====
if ($method === 'DELETE') {
    require_admin();
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) json_error('معرّف المنتج مطلوب');

    // حذف ناعم (تعطيل) للحفاظ على سجل الطلبات
    db()->prepare("UPDATE products SET is_active = 0 WHERE id = ?")->execute([$id]);

    log_activity('product.deleted', 'product', $id);
    json_success(null, 'تم حذف المنتج (تعطيل) بنجاح');
}

json_error('طريقة غير مدعومة', 405);