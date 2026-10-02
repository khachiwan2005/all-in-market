<?php
require_once __DIR__ . '/layout.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $to = ['approve' => 'paid', 'reject' => 'rejected'][$_POST['do'] ?? ''] ?? null;
    if ($to) {
        q("UPDATE bookings SET status=? WHERE id=? AND status IN ('awaiting_payment','pending')", [$to, (int)$_POST['id']]);
        flash('อัปเดตสถานะการจองแล้ว');
    }
    redirect('bookings.php?tab=' . urlencode($_GET['tab'] ?? 'awaiting_payment'));
}

$tab = $_GET['tab'] ?? 'awaiting_payment';
$tabs = ['awaiting_payment' => 'รอชำระเงิน', 'pending' => 'รอตรวจสอบ', 'paid' => 'ชำระแล้ว', 'rejected' => 'ปฏิเสธ', 'cancelled' => 'ยกเลิก', 'all' => 'ทั้งหมด'];
if (!isset($tabs[$tab])) $tab = 'awaiting_payment';
$where = $tab === 'all' ? '' : 'WHERE b.status=' . db()->quote($tab);
$rows = q("SELECT b.*,u.name,u.shop,u.phone,s.code AS stall FROM bookings b JOIN users u ON u.id=b.user_id JOIN stalls s ON s.id=b.stall_id $where ORDER BY b.id DESC LIMIT 300")->fetchAll();

page_head('การจอง', 'bookings');
echo '<p class="tabs">';
foreach ($tabs as $k => $v) echo '<a href="?tab=' . $k . '"' . ($k === $tab ? ' class="on"' : '') . '>' . e($v) . '</a>';
echo '</p><div class="card"><table><tr><th>รหัส</th><th>ผู้จอง / ร้าน</th><th>โทร</th><th>ล็อก</th><th>วันที่</th><th>บริการเสริม</th><th>ยอด</th><th>สถานะ</th><th></th></tr>';
foreach ($rows as $r) {
    echo '<tr><td>' . e($r['code']) . '</td><td>' . e($r['name']) . '<br><span class="mut">' . e($r['shop']) . '</span></td><td>' . e($r['phone']) . '</td><td>' . e($r['stall']) . '</td><td>'
        . e($r['date_start'] . ($r['date_end'] !== $r['date_start'] ? ' – ' . $r['date_end'] : '')) . '</td><td>' . e($r['addons'] ?: '-') . '</td><td>' . number_format((float)$r['amount'], 2) . '<br><span class="mut">ล็อก ' . number_format((float)$r['stall_amount'], 2) . ' + เสริม ' . number_format((float)$r['addons_amount'], 2) . '</span></td><td>' . badge($r['status']) . ($r['status'] === 'awaiting_payment' && $r['expires_at'] ? '<br><span class="mut">หมดเวลา ' . e($r['expires_at']) . '</span>' : '') . '</td><td>';
    if (in_array($r['status'], ['awaiting_payment', 'pending'], true))
        echo post_form(['id' => $r['id'], 'do' => 'approve'], 'อนุมัติ') . post_form(['id' => $r['id'], 'do' => 'reject'], 'ปฏิเสธ', 'red', 'ปฏิเสธการจองนี้?');
    echo '</td></tr>';
}
if (!$rows) echo '<tr><td colspan="9" class="mut">ไม่มีรายการ</td></tr>';
echo '</table></div>';
page_foot();
