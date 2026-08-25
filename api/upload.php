<?php
/**
 * MESORA API — رفع صور المنتجات (أدمن فقط)
 * POST /api/upload.php  (multipart/form-data, field: image)
 * Response: {success, data: {path}}
 */

require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_error('طريقة غير مسموحة', 405);
require_admin();

if (empty($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    json_error('لم يتم اختيار صورة أو حدث خطأ في الرفع');
}

$file = $_FILES['image'];

// التحقق من الحجم
if ($file['size'] > MAX_UPLOAD_SIZE) json_error('حجم الصورة يتجاوز 5MB');

// التحقق من النوع الحقيقي للملف (وليس الامتداد فقط)
$allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($file['tmp_name']);
if (!isset($allowed[$mime])) json_error('صيغة غير مدعومة — المسموح: JPG, PNG, WEBP, GIF');

// إنشاء مجلد الرفع
if (!is_dir(UPLOAD_DIR)) mkdir(UPLOAD_DIR, 0755, true);

// اسم آمن وعشوائي بصيغة WebP
$baseName = 'prod_' . date('Ymd_His') . '_' . bin2hex(random_bytes(4));
$webpName = $baseName . '.webp';
$destWebp = UPLOAD_DIR . $webpName;

$converted = false;

// محاولة التحويل إلى WebP باستخدام GD Library
if (function_exists('imagewebp')) {
    $img = null;
    if ($mime === 'image/jpeg') $img = @imagecreatefromjpeg($file['tmp_name']);
    elseif ($mime === 'image/png') {
        $img = @imagecreatefrompng($file['tmp_name']);
        if ($img) {
            imagealphablending($img, true);
            imagesavealpha($img, true);
        }
    }
    elseif ($mime === 'image/webp') $img = @imagecreatefromwebp($file['tmp_name']);

    if ($img) {
        if (@imagewebp($img, $destWebp, 85)) {
            $converted = true;
            $name = $webpName;
        }
        imagedestroy($img);
    }
}

if (!$converted) {
    $name = $baseName . '.' . $allowed[$mime];
    $dest = UPLOAD_DIR . $name;
    if (!move_uploaded_file($file['tmp_name'], $dest)) json_error('فشل حفظ الصورة', 500);
}

log_activity('image.uploaded', 'product', null, ['file' => $name]);
json_success(['path' => 'picture/uploads/' . $name], 'تم رفع وتطوير الصورة بنجاح');