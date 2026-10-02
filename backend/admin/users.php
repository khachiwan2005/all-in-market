<?php
require_once __DIR__ . '/layout.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $to = ['ban' => 'banned', 'unban' => 'active'][$_POST['do'] ?? ''] ?? null;
    if ($to) { q('UPDATE users SET status=? WHERE id=?', [$to, (int)$_POST['id']]); flash('อัปเดตผู้ใช้แล้ว'); }
    redirect('users.php');
}

$kw = trim($_GET['q'] ?? '');
$like = '%' . $kw . '%';
$rows = q("SELECT u.*,
    (SELECT COUNT(*) FROM bookings b WHERE b.user_id=u.id) AS bookings,
    (SELECT COUNT(*) FROM bookings b WHERE b.user_id=u.id AND b.status='cancelled') AS cancels
  FROM users u WHERE (?='' OR u.name LIKE ? OR u.shop LIKE ? OR u.email LIKE ? OR u.phone LIKE ?) ORDER BY u.id DESC LIMIT 300", [$kw, $like, $like, $like, $like])->fetchAll();

page_head('ผู้ใช้', 'users');
echo '<form method="get"><input name="q" value="' . e($kw) . '" placeholder="ค้นหา ชื่อ/ร้าน/อีเมล/โทร"> <button>ค้นหา</button></form><br>
<div class="card"><table><tr><th>ชื่อ</th><th>ร้าน</th><th>ประเภท</th><th>อีเมล</th><th>โทร</th><th>จอง</th><th>ยกเลิก</th><th>สมัครเมื่อ</th><th>สถานะ</th><th></th></tr>';
foreach ($rows as $r) {
    echo '<tr><td>' . e($r['name']) . '</td><td>' . e($r['shop']) . '</td><td>' . e($r['shop_type']) . '</td><td>' . e($r['email']) . '</td><td>' . e($r['phone']) . '</td><td>' . $r['bookings'] . '</td><td>' . $r['cancels'] . '</td><td>' . e($r['created_at']) . '</td><td>' . badge($r['status']) . '</td><td>'
        . ($r['status'] === 'active' ? post_form(['id' => $r['id'], 'do' => 'ban'], 'ระงับ', 'red', 'ระงับผู้ใช้นี้?') : post_form(['id' => $r['id'], 'do' => 'unban'], 'ปลดระงับ', 'alt')) . '</td></tr>';
}
if (!$rows) echo '<tr><td colspan="10" class="mut">ไม่พบผู้ใช้</td></tr>';
echo '</table></div>';
page_foot();
