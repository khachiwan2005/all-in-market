<?php
// ใช้โดยหน้า AdminLogin.dc.html:  GET ?action=csrf  /  POST ?action=login (JSON + header X-CSRF-Token)
require_once __DIR__ . '/../lib.php';
start_session();

$action = $_GET['action'] ?? '';

if ($action === 'csrf') json_out(['csrf' => csrf_token(), 'loggedIn' => (bool)admin_user()]);

if ($action === 'login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $in = json_decode(file_get_contents('php://input'), true) ?: [];
    $_SESSION['tries'] = ($_SESSION['tries'] ?? 0) + 1;
    if ($_SESSION['tries'] > 8) json_out(['error' => 'ลองผิดหลายครั้งเกินไป กรุณาลองใหม่ภายหลัง'], 429);
    $a = q('SELECT * FROM admins WHERE username=?', [trim($in['username'] ?? '')])->fetch();
    if (!$a || !password_verify((string)($in['password'] ?? ''), $a['password_hash'])) {
        usleep(400000);
        json_out(['error' => 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'], 401);
    }
    session_regenerate_id(true);
    $_SESSION['admin_id'] = (int)$a['id'];
    $_SESSION['admin_name'] = $a['username'];
    $_SESSION['tries'] = 0;
    json_out(['ok' => true, 'redirect' => 'backend/admin/index.php']);
}

json_out(['error' => 'bad request'], 400);
