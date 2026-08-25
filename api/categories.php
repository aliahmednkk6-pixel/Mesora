<?php
/**
 * MESORA API — الفئات
 * Endpoints:
 *   GET    /api/categories.php            → قائمة الفئات (عام)
 *   POST   /api/categories.php            → إضافة فئة (أدمن)
 *   PUT    /api/categories.php            → تعديل فئة (أدمن) {id, ...}
 *   DELETE /api/categories.php?id=5       → حذف/تعطيل فئة (أدمن)
 */
require_once __DIR__ . '/config.php';
$method = $_SERVER['REQUEST_METHOD'];
$pdo = db();

if ($method === 'GET') {
    // عدد المنتجات لكل فئة (لعرضه في اللوحة والموقع)
    $rows = $pdo->query(
        "SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_active = 1) AS products_count
         FROM categories c ORDER BY c.sort_order ASC, c.id ASC"
    )->fetchAll();
    json_success($rows);
}

require_admin();

if ($method === 'POST') {
    $b = request_body();
    $nameAr = trim($b['name_ar'] ?? '');
    if (!$nameAr) json_error('الاسم العربي مطلوب');

    // توليد slug تلقائياً إن لم يُرسل
    $slug = trim($b['slug'] ?? '') ?: preg_replace('/[^a-z0-9]+/', '-', strtolower(trim($b['name_en'] ?? $nameAr)));
    $slug = trim($slug, '-');
    if (!$slug) json_error('تعذّر توليد المعرّف (slug)');

    $dup = $pdo->prepare("SELECT id FROM categories WHERE slug = ?");
    $dup->execute([$slug]);
    if ($dup->fetch()) json_error('المعرّف (slug) مستخدم مسبقاً');

    $stmt = $pdo->prepare(
        "INSERT INTO categories (name_ar, name_en, slug, icon, image, sort_order, is_active)
         VALUES (?, ?, ?, ?, ?, ?, 1)"
    );
    $stmt->execute([
        $nameAr,
        trim($b['name_en'] ?? '') ?: null,
        $slug,
        trim($b['icon'] ?? '') ?: null,
        trim($b['image'] ?? '') ?: null,
        (int)($b['sort_order'] ?? 0),
    ]);
    log_activity('category.created', 'category', (int)$pdo->lastInsertId(), ['slug' => $slug]);
    json_success(['id' => (int)$pdo->lastInsertId()], 'تمت إضافة الفئة بنجاح');
}

if ($method === 'PUT') {
    $b = request_body();
    $id = (int)($b['id'] ?? 0);
    if (!$id) json_error('معرّف الفئة مطلوب');

    $allowed = ['name_ar', 'name_en', 'icon', 'image', 'sort_order', 'is_active'];
    $sets = []; $params = [];
    foreach ($allowed as $f) {
        if (!array_key_exists($f, $b)) continue;
        $sets[] = "$f = ?";
        $params[] = in_array($f, ['sort_order']) ? (int)$b[$f]
                  : ($f === 'is_active' ? (int)(bool)$b[$f]
                  : (trim((string)$b[$f]) ?: null));
    }
    if (empty($sets)) json_error('لا توجد حقول للتعديل');
    $params[] = $id;
    $pdo->prepare("UPDATE categories SET " . implode(', ', $sets) . " WHERE id = ?")->execute($params);
    log_activity('category.updated', 'category', $id, $b);
    json_success(null, 'تم تحديث الفئة');
}

if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) json_error('معرّف الفئة مطلوب');

    // منع الحذف إذا فيها منتجات — نعطّلها فقط
    $count = $pdo->prepare("SELECT COUNT(*) FROM products WHERE category_id = ? AND is_active = 1");
    $count->execute([$id]);
    if ((int)$count->fetchColumn() > 0) {
        $pdo->prepare("UPDATE categories SET is_active = 0 WHERE id = ?")->execute([$id]);
        log_activity('category.disabled', 'category', $id);
        json_success(null, 'الفئة تحتوي منتجات — تم تعطيلها بدلاً من حذفها');
    }

    $pdo->prepare("DELETE FROM categories WHERE id = ?")->execute([$id]);
    log_activity('category.deleted', 'category', $id);
    json_success(null, 'تم حذف الفئة نهائياً');
}

json_error('طريقة غير مدعومة', 405);
