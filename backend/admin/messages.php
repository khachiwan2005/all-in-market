<?php
require_once __DIR__ . '/layout.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $id = (int)($_POST['id'] ?? 0);
    if (($_POST['do'] ?? '') === 'read') q('UPDATE messages SET is_read=1 WHERE id=?', [$id]);
    if (($_POST['do'] ?? '') === 'delete') { q('DELETE FROM messages WHERE id=?', [$id]); flash('ลบข้อความแล้ว'); }
    redirect('messages.php');
}

page_head('ข้อความติดต่อ', 'messages');
echo '<div class="card"><table><tr><th>จาก</th><th>ติดต่อ</th><th>ข้อความ</th><th>เมื่อ</th><th></th></tr>';
$rows = q('SELECT * FROM messages ORDER BY is_read, id DESC LIMIT 300')->fetchAll();
foreach ($rows as $r) {
    echo '<tr' . ($r['is_read'] ? ' class="mut"' : '') . '><td>' . e($r['name']) . '</td><td>' . e($r['email']) . '<br>' . e($r['phone']) . '</td><td style="white-space:pre-wrap">' . e($r['body']) . '</td><td>' . e($r['created_at']) . '</td><td>'
        . (!$r['is_read'] ? post_form(['id' => $r['id'], 'do' => 'read'], 'อ่านแล้ว', 'alt') : '') . post_form(['id' => $r['id'], 'do' => 'delete'], 'ลบ', 'red', 'ลบข้อความนี้?') . '</td></tr>';
}
if (!$rows) echo '<tr><td colspan="5" class="mut">ยังไม่มีข้อความ</td></tr>';
echo '</table></div>';
page_foot();
