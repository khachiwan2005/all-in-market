<?php
require_once __DIR__ . '/layout.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $a = q('SELECT * FROM admins WHERE id=?', [$ADMIN['id']])->fetch();
    $new = (string)($_POST['new'] ?? '');
    if (!password_verify((string)($_POST['old'] ?? ''), $a['password_hash'])) flash('รหัสผ่านเดิมไม่ถูกต้อง');
    elseif (strlen($new) < 8 || $new !== ($_POST['new2'] ?? '')) flash('รหัสผ่านใหม่ต้องยาวอย่างน้อย 8 ตัวและกรอกให้ตรงกันทั้งสองช่อง');
    else { q('UPDATE admins SET password_hash=? WHERE id=?', [password_hash($new, PASSWORD_DEFAULT), $a['id']]); flash('เปลี่ยนรหัสผ่านแล้ว'); }
    redirect('password.php');
}

page_head('เปลี่ยนรหัสผ่าน', 'password');
echo '<div class="card"><form method="post">' . csrf_field() . '
<p><input type="password" name="old" placeholder="รหัสผ่านเดิม" required></p>
<p><input type="password" name="new" placeholder="รหัสผ่านใหม่ (8 ตัวขึ้นไป)" required></p>
<p><input type="password" name="new2" placeholder="ยืนยันรหัสผ่านใหม่" required></p><button>บันทึก</button></form></div>';
page_foot();
