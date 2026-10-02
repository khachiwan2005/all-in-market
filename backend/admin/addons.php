<?php
require_once __DIR__ . '/layout.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $do = $_POST['do'] ?? '';
    $id = (int)($_POST['id'] ?? 0);
    $price = max(0, round((float)($_POST['price_day'] ?? 0), 2));
    $stock = max(0, (int)($_POST['stock'] ?? 0));
    if ($do === 'save') {
        q('UPDATE addons SET price_day=?, stock=?, name=?, description=? WHERE id=?', [$price, $stock, trim($_POST['name'] ?? ''), trim($_POST['description'] ?? ''), $id]);
        flash('บันทึกบริการเสริมแล้ว (ราคาใหม่มีผลกับการจองถัดไป การจองเดิมใช้ราคาเดิม)');
    } elseif ($do === 'toggle') {
        q('UPDATE addons SET is_active=1-is_active WHERE id=?', [$id]);
        flash('สลับสถานะบริการเสริมแล้ว');
    } elseif ($do === 'add') {
        $name = trim($_POST['name'] ?? '');
        if ($name === '') flash('กรอกชื่อบริการ');
        else {
            q('INSERT INTO addons(code,name,description,price_day,stock) VALUES(?,?,?,?,?)', ['a' . bin2hex(random_bytes(4)), $name, trim($_POST['description'] ?? ''), $price, $stock]);
            flash('เพิ่มบริการ ' . $name . ' แล้ว');
        }
    } elseif ($do === 'delete') {
        if ((int)q('SELECT COUNT(*) FROM booking_addons WHERE addon_id=?', [$id])->fetchColumn()) flash('ลบไม่ได้ มีการจองที่ใช้บริการนี้แล้ว ให้ปิดการขายแทน');
        else { q('DELETE FROM addons WHERE id=?', [$id]); flash('ลบบริการแล้ว'); }
    }
    redirect('addons.php');
}

page_head('บริการเสริม', 'addons');
echo '<div class="card"><table><tr><th>ชื่อ / คำอธิบาย</th><th>ราคา/วัน (บาท)</th><th>จำนวนที่มี</th><th>สถานะ</th><th></th></tr>';
foreach (q('SELECT * FROM addons ORDER BY id')->fetchAll() as $a) {
    $f = 'form="f' . $a['id'] . '"';
    echo '<tr><td><form method="post" id="f' . $a['id'] . '">' . csrf_field() . '<input type="hidden" name="do" value="save"><input type="hidden" name="id" value="' . $a['id'] . '"></form>
      <input ' . $f . ' name="name" value="' . e($a['name']) . '" required><br><input ' . $f . ' name="description" value="' . e($a['description']) . '" placeholder="คำอธิบาย" style="margin-top:4px;width:100%"></td>
      <td><input ' . $f . ' type="number" step="0.01" min="0" name="price_day" value="' . e($a['price_day']) . '" style="width:110px"></td>
      <td><input ' . $f . ' type="number" min="0" name="stock" value="' . e($a['stock']) . '" style="width:90px"></td>
      <td>' . ($a['is_active'] ? badge('active') : '<span class="b b-banned">ปิดขาย</span>') . '</td>
      <td><button ' . $f . '>บันทึก</button> '
        . post_form(['id' => $a['id'], 'do' => 'toggle'], $a['is_active'] ? 'ปิดขาย' : 'เปิดขาย', 'alt')
        . post_form(['id' => $a['id'], 'do' => 'delete'], 'ลบ', 'red', 'ลบบริการนี้?') . '</td></tr>';
}
echo '</table></div><div class="card"><h3>เพิ่มบริการ</h3><form method="post">' . csrf_field() . '<input type="hidden" name="do" value="add">
  <input name="name" placeholder="ชื่อบริการ" required> <input name="description" placeholder="คำอธิบาย">
  <input type="number" step="0.01" min="0" name="price_day" placeholder="ราคา/วัน" style="width:110px" required>
  <input type="number" min="0" name="stock" placeholder="จำนวน" style="width:90px" required> <button>เพิ่ม</button></form></div>';
page_foot();
