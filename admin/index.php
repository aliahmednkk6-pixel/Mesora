<?php
/**
 * MESORA — مدخل لوحة التحكم (admin)
 * -------------------------------------------------------------
 * يُطلق صفحة /admin/ عبر PHP حتى لا يظهر خطأ "الصفحة غير موجودة"
 * عند طلب المسار مباشرة، ويُحمّل لوحة التحكم من index.html.
 *
 * @see  index.html  — واجهة لوحة التحكم (HTML/JS)
 */
session_start();

// إعادة توجيه فورية إلى صفحة لوحة التحكم (نفس المجلد)
$__page = __DIR__ . '/index.html';
if (is_file($__page)) {
    header('Content-Type: text/html; charset=utf-8');
    readfile($__page);
    exit;
}

http_response_code(500);
echo 'لوحة التحكم غير متوفرة — تأكد من وجود ملف index.html في مجلد admin/.';