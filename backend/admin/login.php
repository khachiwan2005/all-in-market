<?php
require_once __DIR__ . '/../lib.php';
start_session();
if (admin_user()) { header('Location: index.php'); exit; }

$err = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    // หน่วงเวลาและจำกัดจำนวนครั้ง กันเดารหัสผ่าน
    $_SESSION['tries'] = ($_SESSION['tries'] ?? 0) + 1;
    if ($_SESSION['tries'] > 8) { $err = 'ลองผิดหลายครั้งเกินไป ปิดเบราว์เซอร์แล้วลองใหม่ภายหลัง'; }
    else {
        $a = q('SELECT * FROM admins WHERE username=?', [trim($_POST['username'] ?? '')])->fetch();
        if ($a && password_verify((string)($_POST['password'] ?? ''), $a['password_hash'])) {
            session_regenerate_id(true);
            $_SESSION['admin_id'] = (int)$a['id'];
            $_SESSION['admin_name'] = $a['username'];
            $_SESSION['tries'] = 0;
            header('Location: index.php'); exit;
        }
        usleep(400000);
        $err = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
    }
}
?><!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>เข้าสู่ระบบแอดมิน</title>
<style>body{font-family:system-ui,sans-serif;background:#F6F5FB;display:grid;place-items:center;min-height:100vh;margin:0}
form{background:#fff;padding:28px;border-radius:14px;border:1px solid #e4e1f0;width:min(340px,92vw)}h1{font-size:20px;margin:0 0 16px;color:#5B3FD6}
input{width:100%;padding:9px 12px;margin-bottom:12px;border:1px solid #e4e1f0;border-radius:8px;font:inherit}
button{width:100%;padding:10px;border:0;border-radius:8px;background:#5B3FD6;color:#fff;font:inherit;cursor:pointer}.err{color:#a11;margin-bottom:10px}</style></head>
<body><form method="post"><h1>All IN Market · แอดมิน</h1>
<?php if ($err) echo '<div class="err">' . e($err) . '</div>'; ?>
<?= '<input type="hidden" name="csrf" value="' . e(csrf_token()) . '">' ?>
<input name="username" placeholder="ชื่อผู้ใช้" required autofocus>
<input name="password" type="password" placeholder="รหัสผ่าน" required>
<button>เข้าสู่ระบบ</button></form></body></html>
