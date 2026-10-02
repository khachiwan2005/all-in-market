<?php
// รันจาก command line (รันซ้ำได้ ปลอดภัย):  php backend/setup.php [รหัสผ่านแอดมิน]
if (PHP_SAPI !== 'cli') { http_response_code(403); exit('รันผ่าน command line เท่านั้น'); }
require_once __DIR__ . '/config.php';

$pdo = new PDO('mysql:host=' . DB_HOST . ';charset=utf8mb4', DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$pdo->exec(file_get_contents(__DIR__ . '/sql/schema.sql'));
require_once __DIR__ . '/lib.php';

// ---- อัปเกรดฐานข้อมูลเดิม (เพิ่มคอลัมน์ที่ยังไม่มี) ----
function has_col(string $t, string $c): bool {
    return (bool)q('SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME=?', [DB_NAME, $t, $c])->fetch();
}
$alters = [
    ['zones', 'price_day', 'ALTER TABLE zones ADD price_day DECIMAL(10,2) NOT NULL DEFAULT 0'],
    ['zones', 'price_month', 'ALTER TABLE zones ADD price_month DECIMAL(10,2) NOT NULL DEFAULT 0'],
    ['stalls', 'price_day', 'ALTER TABLE stalls ADD price_day DECIMAL(10,2) NULL'],
    ['bookings', 'days', 'ALTER TABLE bookings ADD days INT NOT NULL DEFAULT 1'],
    ['bookings', 'stall_amount', 'ALTER TABLE bookings ADD stall_amount DECIMAL(10,2) NOT NULL DEFAULT 0'],
    ['bookings', 'addons_amount', 'ALTER TABLE bookings ADD addons_amount DECIMAL(10,2) NOT NULL DEFAULT 0'],
    ['bookings', 'expires_at', 'ALTER TABLE bookings ADD expires_at DATETIME NULL'],
    ['refunds', 'refund_amount', 'ALTER TABLE refunds ADD refund_amount DECIMAL(10,2) NOT NULL DEFAULT 0'],
];
foreach ($alters as [$t, $c, $sql]) if (!has_col($t, $c)) { $pdo->exec($sql); echo "เพิ่มคอลัมน์ $t.$c\n"; }
// ผู้ใช้: เบอร์โทรเป็นตัวระบุหลัก (ไม่ซ้ำ) อีเมลไม่บังคับ
$pdo->exec('ALTER TABLE users MODIFY email VARCHAR(160) NULL');
if (!q("SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=? AND TABLE_NAME='users' AND COLUMN_NAME='phone' AND NON_UNIQUE=0", [DB_NAME])->fetch()) { $pdo->exec('ALTER TABLE users ADD UNIQUE (phone)'); echo "phone เป็น unique แล้ว\n"; }
$pdo->exec("ALTER TABLE bookings MODIFY status ENUM('awaiting_payment','pending','paid','rejected','cancelled') NOT NULL DEFAULT 'awaiting_payment'");

// ---- ข้อมูลเริ่มต้น ----
// ราคาด้านล่างเป็นค่าตั้งต้นชั่วคราว (หน้าเดิมเป็น "[ราคา]") กรุณาแก้ในหน้าแอดมิน: ล็อก/โซน และ บริการเสริม
if (!(int)q('SELECT COUNT(*) FROM zones')->fetchColumn()) {
    foreach ([['C', 'โซน C', 'ล็อกในร่ม', 'violet', 16, 150, 3000], ['F', 'โซน F', 'ริมทางเดิน', 'orange', 8, 100, 2000]] as [$p, $n, $d, $c, $cnt, $pd, $pm]) {
        q('INSERT INTO zones(prefix,name,description,color,price_day,price_month) VALUES(?,?,?,?,?,?)', [$p, $n, $d, $c, $pd, $pm]);
        $zid = (int)db()->lastInsertId();
        for ($i = 1; $i <= $cnt; $i++) q('INSERT INTO stalls(zone_id,code) VALUES(?,?)', [$zid, sprintf('%s%02d', $p, $i)]);
    }
    echo "สร้างโซน/ล็อกเริ่มต้นแล้ว\n";
}
// ฐานข้อมูลเดิมที่เพิ่งได้คอลัมน์ราคา (ยังเป็น 0) ให้ใส่ราคาตั้งต้นชั่วคราว
q("UPDATE zones SET price_day=150, price_month=3000 WHERE prefix='C' AND price_day=0 AND price_month=0");
q("UPDATE zones SET price_day=100, price_month=2000 WHERE prefix='F' AND price_day=0 AND price_month=0");
if (!(int)q('SELECT COUNT(*) FROM addons')->fetchColumn()) {
    foreach ([
        ['electric', 'ไฟฟ้า', 'ปลั๊กพ่วงประจำล็อก', 30, 20],
        ['water', 'น้ำประปา', 'จุดต่อน้ำใกล้ล็อก', 20, 8],
        ['tent', 'โต๊ะและเต็นท์', 'ให้เช่าพร้อมจัดวางที่ล็อก', 50, 10],
    ] as $a) q('INSERT INTO addons(code,name,description,price_day,stock) VALUES(?,?,?,?,?)', $a);
    echo "สร้างบริการเสริมเริ่มต้นแล้ว\n";
}

if (!(int)q('SELECT COUNT(*) FROM admins')->fetchColumn()) {
    $pass = $argv[1] ?? bin2hex(random_bytes(5));
    q('INSERT INTO admins(username,password_hash) VALUES(?,?)', ['admin', password_hash($pass, PASSWORD_DEFAULT)]);
    echo "สร้างแอดมินแล้ว\n  username: admin\n  password: $pass\n(เปลี่ยนรหัสผ่านหลังเข้าสู่ระบบครั้งแรกได้ที่เมนู \"รหัสผ่าน\")\n";
} else {
    echo "มีแอดมินอยู่แล้ว ข้ามขั้นตอนนี้\n";
}
echo "เสร็จสิ้น\n";
