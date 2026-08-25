<?php
/**
 * MESORA API — المصادقة (تسجيل الدخول/الخروج)
 * Endpoints:
 *   POST /api/auth.php?action=login    {username, password}
 *   POST /api/auth.php?action=logout
 *   GET  /api/auth.php?action=me
 */

require_once __DIR__ . '/config.php';

$action = $_GET['action'] ?? '';

switch ($action) {

    // ===== تسجيل الدخول =====
    case 'login':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_error('طريقة غير مسموحة', 405);

        // Brute-force protection check
        $attempts = $_SESSION['login_attempts'] ?? 0;
        $lastAttempt = $_SESSION['last_attempt_time'] ?? 0;

        if ($attempts >= 5 && (time() - $lastAttempt) < 300) {
            $remMinutes = ceil((300 - (time() - $lastAttempt)) / 60);
            json_error("تم حظر محاولات الدخول المؤقت لكثرة المحاولات الخاطئة. يرجى المحاولة بعد {$remMinutes} دقائق.", 429);
        }

        $body = request_body();
        $username = trim($body['username'] ?? '');
        $password = $body['password'] ?? '';

        if (!$username || !$password) json_error('يرجى إدخال اسم المستخدم وكلمة المرور');

        $stmt = db()->prepare("SELECT * FROM users WHERE username = ? AND is_active = 1 LIMIT 1");
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            $_SESSION['login_attempts'] = $attempts + 1;
            $_SESSION['last_attempt_time'] = time();
            json_error('اسم المستخدم أو كلمة المرور غير صحيحة', 401);
        }

        // نجاح الدخول - إعادة تعيين المحاولات
        $_SESSION['login_attempts'] = 0;
        $_SESSION['last_attempt_time'] = 0;

        // تحديث آخر دخول
        db()->prepare("UPDATE users SET last_login_at = NOW() WHERE id = ?")->execute([$user['id']]);

        $_SESSION['user_id'] = $user['id'];
        session_regenerate_id(true);

        log_activity('auth.login', 'user', (int)$user['id']);

        json_success([
            'id' => $user['id'],
            'username' => $user['username'],
            'full_name' => $user['full_name'],
            'role' => $user['role'],
        ], 'تم تسجيل الدخول بنجاح');

    // ===== تسجيل الخروج =====
    case 'logout':
        log_activity('auth.logout');
        session_destroy();
        json_success(null, 'تم تسجيل الخروج');

    // ===== معلومات المستخدم الحالي =====
    case 'me':
        $user = current_user();
        if (!$user) json_error('غير مصرح', 401);
        json_success($user);

    // ===== تغيير كلمة المرور =====
    case 'change_password':
        require_admin();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_error('طريقة غير مسموحة', 405);

        $body = request_body();
        $old = $body['old_password'] ?? '';
        $new = $body['new_password'] ?? '';

        if (strlen($new) < 8) json_error('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل');

        $stmt = db()->prepare("SELECT password_hash FROM users WHERE id = ?");
        $stmt->execute([$_SESSION['user_id']]);
        $hash = $stmt->fetchColumn();

        if (!password_verify($old, $hash)) json_error('كلمة المرور القديمة غير صحيحة');

        db()->prepare("UPDATE users SET password_hash = ? WHERE id = ?")
             ->execute([password_hash($new, PASSWORD_DEFAULT), $_SESSION['user_id']]);

        log_activity('auth.change_password', 'user', (int)$_SESSION['user_id']);
        json_success(null, 'تم تغيير كلمة المرور بنجاح');

    default:
        json_error('إجراء غير معروف', 400);
}