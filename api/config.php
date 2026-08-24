<?php
/**
 * MESORA Internal System — Database Config & Helpers
 * ضع بيانات الاتصال الخاصة بك هنا
 */

// ===== إعدادات قاعدة البيانات =====
define('DB_HOST', 'localhost');
define('DB_NAME', 'mesora_store');
define('DB_USER', 'root');
define('DB_PASS', '');           // غيّرها حسب سيرفرك

// ===== إعدادات عامة =====
define('UPLOAD_DIR', __DIR__ . '/../picture/uploads/');
define('MAX_UPLOAD_SIZE', 5 * 1024 * 1024); // 5MB

// ===== اتصال قاعدة البيانات (PDO) =====
function db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]
        );
    }
    return $pdo;
}

// ===== JSON Response Helper =====
function json_response($data, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function json_error(string $message, int $code = 400): void {
    json_response(['success' => false, 'error' => $message], $code);
}

function json_success($data = null, string $message = 'OK'): void {
    json_response(['success' => true, 'message' => $message, 'data' => $data]);
}

// ===== Session & Auth =====
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function require_admin(): void {
    if (empty($_SESSION['user_id'])) {
        json_error('غير مصرح — يرجى تسجيل الدخول', 401);
    }
}

function current_user(): ?array {
    if (empty($_SESSION['user_id'])) return null;
    $stmt = db()->prepare("SELECT id, username, full_name, role FROM users WHERE id = ? AND is_active = 1");
    $stmt->execute([$_SESSION['user_id']]);
    return $stmt->fetch() ?: null;
}

function log_activity(string $action, string $entityType = '', ?int $entityId = null, $details = null): void {
    try {
        $stmt = db()->prepare(
            "INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address)
             VALUES (?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            $_SESSION['user_id'] ?? null,
            $action,
            $entityType,
            $entityId,
            $details ? json_encode($details, JSON_UNESCAPED_UNICODE) : null,
            $_SERVER['REMOTE_ADDR'] ?? null
        ]);
    } catch (Exception $e) { /* silent */ }
}

// ===== Request Body Helper =====
function request_body(): array {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    return is_array($data) ? $data : $_POST;
}

// ===== CORS (للتطوير المحلي فقط — احذفه في الإنتاج أو حدد الدومين) =====
header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? '*'));
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }