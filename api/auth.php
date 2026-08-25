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

    // ===== طلب تغيير كلمة المرور (يتطلب تأكيداً من الإيميل) =====
    case 'change_password':
        require_admin();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_error('طريقة غير مسموحة', 405);

        $body = request_body();
        $old = $body['old_password'] ?? '';
        $new = $body['new_password'] ?? '';
        $confirm = $body['confirm_password'] ?? '';

        if (strlen($new) < 8) json_error('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل');
        if ($new !== $confirm) json_error('كلمتا المرور غير متطابقتين');

        // التحقق من القديمة
        $stmt = db()->prepare("SELECT password_hash, email, full_name FROM users WHERE id = ?");
        $stmt->execute([$_SESSION['user_id']]);
        $user = $stmt->fetch();
        if (!$user || !password_verify($old, $user['password_hash'])) {
            json_error('كلمة المرور الحالية غير صحيحة');
        }
        if (!filter_var($user['email'], FILTER_VALIDATE_EMAIL)) {
            json_error('لا يوجد بريد إلكتروني صالح على حسابك — حدّثه أولاً');
        }

        // إنشاء طلب معلّق صالح 30 دقيقة
        $newHash = password_hash($new, PASSWORD_DEFAULT);
        $token = bin2hex(random_bytes(32));            // يُرسل بالإيميل فقط
        $tokenHash = hash('sha256', $token);
        $expires = date('Y-m-d H:i:s', time() + 1800);

        // إلغاء أي طلبات سابقة لنفس المستخدم
        db()->prepare("DELETE FROM pending_password_changes WHERE user_id = ?")->execute([$_SESSION['user_id']]);
        db()->prepare(
            "INSERT INTO pending_password_changes (user_id, new_hash, token_hash, expires_at)
             VALUES (?, ?, ?, ?)"
        )->execute([$_SESSION['user_id'], $newHash, $tokenHash, $expires]);

        // رابط التأكيد
        $schema = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? 'mesora.iq';
        $confirmUrl = "$schema://$host/api/auth.php?action=confirm_password&token=$token";

        // رسالة الإيميل
        $subject = 'تأكيد تغيير كلمة مرور لوحة تحكم ميسورا';
        $message = "مرحباً {$user['full_name']}،\n\n"
            . "تم طلب تغيير كلمة مرور لوحة التحكم.\n"
            . "للتأكيد اضغط الرابط أدناه (صالح لمدة 30 دقيقة):\n\n"
            . $confirmUrl . "\n\n"
            . "إذا لم تكن أنت من طلب هذا التغيير، تجاهل هذه الرسالة ولن تتغير كلمة المرور.\n\n"
            . "— متجر ميسورا";
        $headers = "From: MESORA <no-reply@mesora.iq>\r\nContent-Type: text/plain; charset=UTF-8\r\n";

        $emailSent = @mail($user['email'], '=?UTF-8?B?' . base64_encode($subject) . '?=', $message, $headers);

        log_activity('auth.change_password_requested', 'user', (int)$_SESSION['user_id']);

        if ($emailSent) {
            json_success(['email_sent' => true],
                '📧 أُرسل رابط التأكيد إلى بريدك (' . $user['email'] . ') — لن تتغير كلمة المرور حتى تضغط عليه خلال 30 دقيقة');
        }

        // الاستضافة لا تدعم الإرسال — نعيد الرابط مباشرة (أدمن فقط)
        json_success([
            'email_sent' => false,
            'confirm_url' => $confirmUrl,
            'expires_in_minutes' => 30,
        ], '⚠️ تعذر إرسال الإيميل من الاستضافة. استخدم رابط التأكيد المباشر أدناه (صالح 30 دقيقة):');

    // ===== تأكيد تغيير كلمة المرور عبر رابط الإيميل (عام — بالرمز فقط) =====
    case 'confirm_password':
        $token = trim($_GET['token'] ?? '');
        header('Content-Type: text/html; charset=utf-8');

        $fail = function (string $msg) {
            echo '<div style="font-family:Cairo,sans-serif;direction:rtl;text-align:center;padding:60px 20px;background:#0a0f14;color:#E8ECEF;min-height:100vh">';
            echo '<div style="max-width:460px;margin:auto;background:#111820;border:1px solid rgba(248,113,113,.4);border-radius:16px;padding:36px">';
            echo '<h2 style="color:#f87171;margin:0 0 12px">✖ فشل التأكيد</h2><p style="color:#8A9AAD">' .
                 htmlspecialchars($msg) . '</p>' .
                 '<a href="/admin/" style="display:inline-block;margin-top:18px;color:#00E5FF">العودة للوحة التحكم</a></div></div>';
            exit;
        };

        if (!$token || !ctype_xdigit($token)) $fail('رابط غير صالح.');
        $tokenHash = hash('sha256', $token);

        $stmt = db()->prepare(
            "SELECT p.*, u.email FROM pending_password_changes p
             JOIN users u ON u.id = p.user_id
             WHERE p.token_hash = ? LIMIT 1"
        );
        $stmt->execute([$tokenHash]);
        $req = $stmt->fetch();

        if (!$req) $fail('الرابط غير صحيح أو تم استخدامه مسبقاً.');
        if (strtotime($req['expires_at']) < time()) {
            db()->prepare("DELETE FROM pending_password_changes WHERE id = ?")->execute([$req['id']]);
            $fail('انتهت صلاحية الرابط (30 دقيقة). اطلب تغييراً جديداً من اللوحة.');
        }

        // تطبيق التغيير وإغلاق الطلب وجلسات أخرى احتياطاً
        db()->prepare("UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?")
            ->execute([$req['new_hash'], $req['user_id']]);
        db()->prepare("DELETE FROM pending_password_changes WHERE user_id = ?")->execute([$req['user_id']]);
        log_activity('auth.password_confirmed', 'user', (int)$req['user_id']);

        echo '<div style="font-family:Cairo,sans-serif;direction:rtl;text-align:center;padding:60px 20px;background:#0a0f14;color:#E8ECEF;min-height:100vh">';
        echo '<div style="max-width:460px;margin:auto;background:#111820;border:1px solid rgba(52,211,153,.4);border-radius:16px;padding:36px">';
        echo '<h2 style="color:#34d399;margin:0 0 12px">✔ تم تغيير كلمة المرور بنجاح</h2>';
        echo '<p style="color:#8A9AAD">استخدم كلمة المرور الجديدة في تسجيل الدخول القادم.</p>';
        echo '<a href="/admin/" style="display:inline-block;margin-top:18px;padding:10px 22px;background:#00E5FF;color:#0a0f14;border-radius:999px;font-weight:800;text-decoration:none">الدخول للوحة التحكم</a></div></div>';
        exit;

    default:
        json_error('إجراء غير معروف', 400);
}