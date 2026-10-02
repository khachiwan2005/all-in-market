<?php
require_once __DIR__ . '/layout.php';

$int = fn($k, $min = 0, $max = 100000) => (string)max($min, min($max, (int)($_POST[$k] ?? 0)));
$flag = fn($k) => isset($_POST[$k]) ? '1' : '0';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $days = array_values(array_intersect(array_map('intval', (array)($_POST['market_days'] ?? [])), [0, 1, 2, 3, 4, 5, 6]));
    if (!$days) { flash('เลือกวันที่ตลาดเปิดอย่างน้อย 1 วัน'); redirect('settings.php'); }
    save_settings([
        'market_days' => implode(',', $days),
        'days_ahead' => $int('days_ahead', 1, 365), 'cutoff_hours' => $int('cutoff_hours', 0, 720),
        'max_stalls_per_day' => $int('max_stalls_per_day', 1, 100),
        'hold_minutes' => $int('hold_minutes', 1, 1440), 'pay_within_hours' => $int('pay_within_hours', 1, 720),
        'promptpay' => preg_replace('/[^0-9]/', '', $_POST['promptpay'] ?? ''), 'require_slip' => $flag('require_slip'),
        'refund_before_days' => $int('refund_before_days', 0, 365), 'refund_percent' => $int('refund_percent', 0, 100),
        'refund_fee' => $int('refund_fee'), 'refund_needs_admin' => $flag('refund_needs_admin'),
        'monthly_enabled' => $flag('monthly_enabled'), 'monthly_max_percent' => $int('monthly_max_percent', 0, 100),
        'monthly_pay_before_days' => $int('monthly_pay_before_days', 0, 60), 'monthly_refund_unreached' => $flag('monthly_refund_unreached'),
    ]);
    flash('บันทึกกฎการจองแล้ว');
    redirect('settings.php');
}

$s = fn($k) => e(setting($k));
$chk = fn($k) => setting($k) === '1' ? ' checked' : '';
$market = array_map('intval', array_filter(explode(',', setting('market_days')), 'strlen'));
$num = fn($k, $label, $unit, $hint = '') => '<tr><td>' . e($label) . ($hint ? '<br><span class="mut">' . e($hint) . '</span>' : '') . '</td><td><input type="number" name="' . $k . '" value="' . $s($k) . '" min="0" style="width:110px"> ' . e($unit) . '</td></tr>';
$box = fn($k, $label, $hint = '') => '<tr><td>' . e($label) . ($hint ? '<br><span class="mut">' . e($hint) . '</span>' : '') . '</td><td><input type="checkbox" name="' . $k . '" value="1"' . $chk($k) . '></td></tr>';

page_head('กฎการจอง', 'settings');
echo '<form method="post">' . csrf_field();
echo '<div class="card"><h3>การจอง</h3><table><tr><td>วันที่ตลาดเปิด</td><td>';
foreach ([1 => 'จ.', 2 => 'อ.', 3 => 'พ.', 4 => 'พฤ.', 5 => 'ศ.', 6 => 'ส.', 0 => 'อา.'] as $n => $l)
    echo '<label style="margin-right:10px"><input type="checkbox" name="market_days[]" value="' . $n . '"' . (in_array($n, $market, true) ? ' checked' : '') . '> ' . $l . '</label>';
echo '</td></tr>'
    . $num('days_ahead', 'จองล่วงหน้าได้สูงสุด', 'วัน') . $num('cutoff_hours', 'ปิดรับจองก่อนวันขาย', 'ชั่วโมง', 'นับจากเวลา 00:00 ของวันขาย')
    . $num('max_stalls_per_day', 'จำนวนล็อกสูงสุดต่อคนต่อวัน', 'ล็อก') . '</table></div>';
echo '<div class="card"><h3>การชำระเงิน</h3><table>'
    . $num('hold_minutes', 'กันล็อกไว้ระหว่างชำระเงิน', 'นาที', 'ใช้กับตัวนับเวลาในหน้าชำระเงิน')
    . $num('pay_within_hours', 'ต้องชำระภายใน', 'ชั่วโมง', 'เกินเวลา ล็อกกลับเป็นว่างอัตโนมัติ')
    . '<tr><td>พร้อมเพย์สำหรับรับเงิน</td><td><input name="promptpay" value="' . $s('promptpay') . '" placeholder="เบอร์/เลขบัตร"></td></tr>'
    . $box('require_slip', 'ต้องแนบสลิปทุกครั้ง') . '</table></div>';
echo '<div class="card"><h3>การยกเลิกและคืนล็อก</h3><table>'
    . $num('refund_before_days', 'คืนล็อกได้ก่อนวันขาย', 'วัน') . $num('refund_percent', 'คืนเงิน', '% ของยอดที่ชำระ')
    . $num('refund_fee', 'ค่าธรรมเนียมการคืน', 'บาท', 'หักจากยอดคืน')
    . $box('refund_needs_admin', 'ต้องให้แอดมินอนุมัติการคืนเงิน', 'ถ้าปิด ระบบอนุมัติและปล่อยล็อกทันที') . '</table></div>';
echo '<div class="card"><h3>แพ็กเกจรายเดือน <span class="mut">(เก็บค่าไว้ ยังไม่ได้ใช้ในระบบจอง)</span></h3><table>'
    . $box('monthly_enabled', 'เปิดขายแพ็กเกจรายเดือน') . $num('monthly_max_percent', 'ล็อกที่ขายเป็นแพ็กเกจได้สูงสุด', '%')
    . $num('monthly_pay_before_days', 'ต้องชำระก่อนเริ่มเดือน', 'วัน') . $box('monthly_refund_unreached', 'คืนแพ็กเกจได้เฉพาะวันที่ยังไม่ถึง')
    . '</table><p class="mut">ราคาแพ็กเกจต่อเดือนของแต่ละโซนตั้งได้ที่เมนู "ล็อก/โซน"</p></div>';
echo '<button>บันทึกการตั้งค่า</button></form>';
page_foot();
