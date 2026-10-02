<?php
require_once __DIR__ . '/layout.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $do = $_POST['do'] ?? '';
    if ($do === 'toggle') {
        q('UPDATE stalls SET is_open=1-is_open WHERE id=?', [(int)$_POST['id']]);
        flash('สลับสถานะล็อกแล้ว');
    } elseif ($do === 'zone_price') {
        q('UPDATE zones SET price_day=?, price_month=? WHERE id=?', [max(0, round((float)$_POST['price_day'], 2)), max(0, round((float)$_POST['price_month'], 2)), (int)$_POST['id']]);
        flash('บันทึกราคาโซนแล้ว (มีผลกับการจองถัดไป)');
    } elseif ($do === 'stall_price') {
        $v = trim($_POST['price_day'] ?? '');
        q('UPDATE stalls SET price_day=? WHERE id=?', [$v === '' ? null : max(0, round((float)$v, 2)), (int)$_POST['id']]);
        flash($v === '' ? 'ล็อกนี้กลับไปใช้ราคาของโซนแล้ว' : 'บันทึกราคาเฉพาะล็อกแล้ว');
    } elseif ($do === 'delete') {
        $c = q("SELECT COUNT(*) FROM bookings WHERE stall_id=? AND status IN ('pending','paid')", [(int)$_POST['id']])->fetchColumn();
        if ($c) flash('ลบไม่ได้ ล็อกนี้ยังมีการจองที่ใช้งานอยู่');
        else { q('DELETE FROM stalls WHERE id=?', [(int)$_POST['id']]); flash('ลบล็อกแล้ว'); }
    } elseif ($do === 'add_zone') {
        $p = strtoupper(preg_replace('/[^A-Za-z]/', '', $_POST['prefix'] ?? ''));
        $name = trim($_POST['name'] ?? ''); $cnt = max(1, min(40, (int)($_POST['count'] ?? 1)));
        $color = in_array($_POST['color'] ?? '', ['violet', 'orange', 'green', 'blue'], true) ? $_POST['color'] : 'green';
        if ($p === '' || strlen($p) > 2 || $name === '') flash('กรอกชื่อโซนและตัวอักษรนำหน้า (A–Z ไม่เกิน 2 ตัว)');
        elseif (q('SELECT 1 FROM zones WHERE prefix=?', [$p])->fetch()) flash("ตัวอักษร $p ถูกใช้แล้ว");
        else {
            q('INSERT INTO zones(prefix,name,description,color,price_day,price_month) VALUES(?,?,?,?,?,?)', [$p, $name, trim($_POST['desc'] ?? ''), $color, max(0, round((float)($_POST['price_day'] ?? 0), 2)), max(0, round((float)($_POST['price_month'] ?? 0), 2))]);
            $zid = (int)db()->lastInsertId();
            for ($i = 1; $i <= $cnt; $i++) q('INSERT INTO stalls(zone_id,code) VALUES(?,?)', [$zid, sprintf('%s%02d', $p, $i)]);
            flash("สร้างโซน $name ($cnt ล็อก) แล้ว");
        }
    } elseif ($do === 'add_stalls') {
        $z = q('SELECT * FROM zones WHERE id=?', [(int)$_POST['zone_id']])->fetch();
        $cnt = max(1, min(20, (int)($_POST['count'] ?? 1)));
        if ($z) {
            $last = (int)q('SELECT COALESCE(MAX(CAST(SUBSTRING(code,?) AS UNSIGNED)),0) FROM stalls WHERE zone_id=?', [strlen($z['prefix']) + 1, $z['id']])->fetchColumn();
            for ($i = 1; $i <= $cnt; $i++) q('INSERT INTO stalls(zone_id,code) VALUES(?,?)', [$z['id'], sprintf('%s%02d', $z['prefix'], $last + $i)]);
            flash("เพิ่ม $cnt ล็อกในโซน {$z['name']} แล้ว");
        }
    }
    redirect('stalls.php');
}

$zones = q('SELECT * FROM zones ORDER BY prefix')->fetchAll();
$stalls = q("SELECT s.*, EXISTS(SELECT 1 FROM bookings b WHERE b.stall_id=s.id AND b.status IN ('pending','paid') AND b.date_end>=CURDATE()) AS booked FROM stalls s ORDER BY s.code")->fetchAll();

page_head('ล็อก/โซน', 'stalls');
foreach ($zones as $z) {
    echo '<div class="card"><h3>' . e($z['name']) . ' <span class="mut">(' . e($z['description']) . ')</span></h3><form method="post">' . csrf_field() . '<input type="hidden" name="do" value="zone_price"><input type="hidden" name="id" value="' . $z['id'] . '">ราคา/วัน <input type="number" step="0.01" min="0" name="price_day" value="' . e($z['price_day']) . '" style="width:100px"> บาท · แพ็กเกจรายเดือน <input type="number" step="0.01" min="0" name="price_month" value="' . e($z['price_month']) . '" style="width:110px"> บาท <button>บันทึกราคาโซน</button></form><p class="mut">ช่องราคาในตารางว่าง = ใช้ราคาของโซน ใส่ตัวเลข = ราคาเฉพาะล็อกนั้น</p><table><tr><th>ล็อก</th><th>ราคา/วัน (บาท)</th><th>สถานะ</th><th>การจองที่ยังไม่หมดอายุ</th><th></th></tr>';
    foreach ($stalls as $s) {
        if ($s['zone_id'] != $z['id']) continue;
        echo '<tr><td>' . e($s['code']) . '</td><td><form method="post" class="inline">' . csrf_field() . '<input type="hidden" name="do" value="stall_price"><input type="hidden" name="id" value="' . $s['id'] . '"><input type="number" step="0.01" min="0" name="price_day" value="' . e($s['price_day'] ?? '') . '" placeholder="' . e($z['price_day']) . '" style="width:100px"> <button class="alt">บันทึก</button></form></td><td>' . ($s['is_open'] ? badge('active') : '<span class="b b-banned">ปิดซ่อม</span>') . '</td><td>' . ($s['booked'] ? 'มี' : '-') . '</td><td>' . ($s['booked'] ? 'มี' : '-') . '</td><td>'
            . post_form(['id' => $s['id'], 'do' => 'toggle'], $s['is_open'] ? 'ปิดซ่อม' : 'เปิดให้จอง', 'alt')
            . post_form(['id' => $s['id'], 'do' => 'delete'], 'ลบ', 'red', 'ลบล็อก ' . $s['code'] . '?') . '</td></tr>';
    }
    echo '</table><br><form method="post">' . csrf_field() . '<input type="hidden" name="do" value="add_stalls"><input type="hidden" name="zone_id" value="' . $z['id'] . '">
      เพิ่มล็อก <input type="number" name="count" value="1" min="1" max="20" style="width:70px"> <button>เพิ่ม</button></form></div>';
}
echo '<div class="card"><h3>สร้างโซนใหม่</h3><form method="post">' . csrf_field() . '<input type="hidden" name="do" value="add_zone">
  <input name="name" placeholder="ชื่อโซน" required> <input name="prefix" placeholder="ตัวอักษรนำหน้า เช่น D" maxlength="2" size="14" required>
  <input type="number" name="count" value="8" min="1" max="40" style="width:70px"> ล็อก
  <input name="desc" placeholder="คำอธิบาย"> <input type="number" step="0.01" min="0" name="price_day" placeholder="ราคา/วัน" style="width:100px"> <input type="number" step="0.01" min="0" name="price_month" placeholder="ราคา/เดือน" style="width:110px"> <select name="color"><option value="violet">ม่วง</option><option value="orange">ส้ม</option><option value="green" selected>เขียว</option><option value="blue">ฟ้า</option></select>
  <button>สร้างโซน</button></form></div>';
page_foot();
