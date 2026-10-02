<?php
require_once __DIR__ . '/layout.php';
$n = fn($sql) => (int)q($sql)->fetchColumn();
$stats = [
    ['ผู้ใช้ทั้งหมด', $n('SELECT COUNT(*) FROM users')],
    ['การจองรอชำระเงิน', $n("SELECT COUNT(*) FROM bookings WHERE status='awaiting_payment'")],
    ['การจองรอตรวจสอบ', $n("SELECT COUNT(*) FROM bookings WHERE status='pending'")],
    ['การจองชำระแล้ว', $n("SELECT COUNT(*) FROM bookings WHERE status='paid'")],
    ['รายได้รวม (บาท)', number_format((float)q("SELECT COALESCE(SUM(amount),0) FROM bookings WHERE status='paid'")->fetchColumn(), 2)],
    ['ล็อกเปิดให้จอง', $n('SELECT COUNT(*) FROM stalls WHERE is_open=1') . ' / ' . $n('SELECT COUNT(*) FROM stalls')],
    ['คำขอคืนที่รอ', $n("SELECT COUNT(*) FROM refunds WHERE status='pending'")],
    ['ข้อความยังไม่อ่าน', $n('SELECT COUNT(*) FROM messages WHERE is_read=0')],
];
page_head('ภาพรวม', 'index');
echo '<div class="grid">';
foreach ($stats as [$l, $v]) echo '<div class="card stat"><span class="mut">' . e($l) . '</span><b>' . e($v) . '</b></div>';
echo '</div><div class="card"><h3>การจองล่าสุด</h3><table><tr><th>รหัส</th><th>ผู้จอง</th><th>ล็อก</th><th>วันที่</th><th>สถานะ</th></tr>';
foreach (q('SELECT b.code,u.name,s.code AS stall,b.date_start,b.date_end,b.status FROM bookings b JOIN users u ON u.id=b.user_id JOIN stalls s ON s.id=b.stall_id ORDER BY b.id DESC LIMIT 8')->fetchAll() as $r)
    echo '<tr><td>' . e($r['code']) . '</td><td>' . e($r['name']) . '</td><td>' . e($r['stall']) . '</td><td>' . e($r['date_start'] . ($r['date_end'] !== $r['date_start'] ? ' – ' . $r['date_end'] : '')) . '</td><td>' . badge($r['status']) . '</td></tr>';
echo '</table></div>';
page_foot();
