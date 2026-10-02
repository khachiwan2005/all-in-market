<?php
require_once __DIR__ . '/layout.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $to = ['approve' => 'approved', 'reject' => 'rejected'][$_POST['do'] ?? ''] ?? null;
    $r = q("SELECT * FROM refunds WHERE id=? AND status='pending'", [(int)$_POST['id']])->fetch();
    if ($to && $r) {
        db()->beginTransaction();
        q('UPDATE refunds SET status=? WHERE id=?', [$to, $r['id']]);
        if ($to === 'approved') q("UPDATE bookings SET status='cancelled' WHERE id=?", [$r['booking_id']]); // ล็อกกลับมาว่าง
        db()->commit();
        flash($to === 'approved' ? 'อนุมัติแล้ว ล็อกกลับมาว่าง' : 'ปฏิเสธคำขอแล้ว');
    }
    redirect('refunds.php');
}

$rows = q('SELECT r.*,b.code,b.amount,b.date_start,s.code AS stall,u.name,u.phone FROM refunds r JOIN bookings b ON b.id=r.booking_id JOIN stalls s ON s.id=b.stall_id JOIN users u ON u.id=b.user_id ORDER BY r.status="pending" DESC, r.id DESC LIMIT 300')->fetchAll();
page_head('คืนล็อก/คืนเงิน', 'refunds');
echo '<div class="card"><table><tr><th>การจอง</th><th>ผู้ขอ</th><th>ล็อก</th><th>วันที่ขาย</th><th>ยอดจอง</th><th>ยอดที่ต้องคืน</th><th>เหตุผล</th><th>ขอเมื่อ</th><th>สถานะ</th><th></th></tr>';
foreach ($rows as $r) {
    echo '<tr><td>' . e($r['code']) . '</td><td>' . e($r['name']) . '<br><span class="mut">' . e($r['phone']) . '</span></td><td>' . e($r['stall']) . '</td><td>' . e($r['date_start']) . '</td><td>' . number_format((float)$r['amount'], 2) . '</td><td><b>' . number_format((float)$r['refund_amount'], 2) . '</b></td><td>' . e($r['reason']) . '</td><td>' . e($r['created_at']) . '</td><td>' . badge($r['status']) . '</td><td>';
    if ($r['status'] === 'pending') echo post_form(['id' => $r['id'], 'do' => 'approve'], 'อนุมัติ') . post_form(['id' => $r['id'], 'do' => 'reject'], 'ปฏิเสธ', 'red', 'ปฏิเสธคำขอนี้?');
    echo '</td></tr>';
}
if (!$rows) echo '<tr><td colspan="10" class="mut">ยังไม่มีคำขอ</td></tr>';
echo '</table></div>';
page_foot();
