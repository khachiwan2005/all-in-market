<?php
// API ฝั่งผู้ใช้ (JSON)  เรียกที่ backend/api/index.php?action=...
require_once __DIR__ . '/../booking.php';
start_session();

$action = $_GET['action'] ?? '';
$in = json_decode(file_get_contents('php://input'), true);
if (!is_array($in)) $in = $_POST;
$method = $_SERVER['REQUEST_METHOD'];

function need_user(): array {
    $u = current_user();
    if (!$u) json_out(['error' => 'กรุณาเข้าสู่ระบบ'], 401);
    return $u;
}
function post_only(): void {
    global $method;
    if ($method !== 'POST') json_out(['error' => 'ต้องใช้ POST'], 405);
}

try {
    switch ($action) {
        case 'register':
            post_only();
            $name = trim(trim($in['first_name'] ?? '') . ' ' . trim($in['last_name'] ?? ''));
            if ($name === '') $name = trim($in['name'] ?? '');
            $phone = preg_replace('/\D/', '', (string)($in['phone'] ?? ''));
            $email = strtolower(trim($in['email'] ?? ''));
            $pass = (string)($in['password'] ?? '');
            if ($name === '') json_out(['error' => 'กรอกชื่อ-นามสกุล'], 422);
            if (!preg_match('/^0\d{8,9}$/', $phone)) json_out(['error' => 'เบอร์โทรศัพท์ไม่ถูกต้อง'], 422);
            if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) json_out(['error' => 'อีเมลไม่ถูกต้อง'], 422);
            if (strlen($pass) < 8) json_out(['error' => 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'], 422);
            if (q('SELECT 1 FROM users WHERE phone=?', [$phone])->fetch()) json_out(['error' => 'เบอร์โทรนี้สมัครไว้แล้ว'], 409);
            if ($email !== '' && q('SELECT 1 FROM users WHERE email=?', [$email])->fetch()) json_out(['error' => 'อีเมลนี้ถูกใช้แล้ว'], 409);
            q('INSERT INTO users(name,shop,phone,email,password_hash,shop_type) VALUES(?,?,?,?,?,?)', [
                $name, trim($in['shop'] ?? ''), $phone, $email === '' ? null : $email, password_hash($pass, PASSWORD_DEFAULT), trim($in['shop_type'] ?? ''),
            ]);
            session_regenerate_id(true);
            $_SESSION['user_id'] = (int)db()->lastInsertId();
            json_out(['ok' => true]);

        case 'login':
            post_only();
            $ident = trim((string)($in['identifier'] ?? ($in['email'] ?? '')));
            $u = strpos($ident, '@') !== false
                ? q('SELECT * FROM users WHERE email=?', [strtolower($ident)])->fetch()
                : q('SELECT * FROM users WHERE phone=?', [preg_replace('/\D/', '', $ident)])->fetch();
            if (!$u ||!password_verify((string)($in['password'] ?? ''), $u['password_hash'])) json_out(['error' => 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'], 401);
            if ($u['status'] !== 'active') json_out(['error' => 'บัญชีนี้ถูกระงับ'], 403);
            session_regenerate_id(true);
            $_SESSION['user_id'] = (int)$u['id'];
            json_out(['ok' => true]);

        case 'logout':
            post_only();
            unset($_SESSION['user_id']);
            json_out(['ok' => true]);

        case 'me':
            json_out(['user' => current_user()]);

        case 'stalls': // ?date_start=YYYY-MM-DD&date_end=YYYY-MM-DD  ->  ล็อกทั้งหมด พร้อมสถานะว่าง/ไม่ว่าง
            $s = $_GET['date_start'] ?? date('Y-m-d'); $e = $_GET['date_end'] ?? $s;
            expire_holds();
            $rows = q("SELECT s.code, s.is_open, z.name AS zone, z.color, COALESCE(s.price_day,z.price_day) AS price_day,
                         (SELECT u.shop_type FROM bookings b JOIN users u ON u.id=b.user_id WHERE b.stall_id=s.id AND b.status IN ('awaiting_payment','pending','paid') AND b.date_start<=? AND b.date_end>=? LIMIT 1) AS holder_type,
                         EXISTS(SELECT 1 FROM bookings b WHERE b.stall_id=s.id AND b.user_id=? AND b.status IN ('awaiting_payment','pending','paid') AND b.date_start<=? AND b.date_end>=?) AS mine,
                         EXISTS(SELECT 1 FROM bookings b WHERE b.stall_id=s.id AND b.status IN ('awaiting_payment','pending','paid') AND b.date_start<=? AND b.date_end>=?) AS taken
                       FROM stalls s JOIN zones z ON z.id=s.zone_id ORDER BY s.code", [$e, $s, (int)(current_user()['id'] ?? 0), $e, $s, $e, $s])->fetchAll();
            json_out(['stalls' => $rows]);

        case 'config': // ค่ากฎ + ราคา สำหรับแสดงในหน้าเว็บ (ไม่มีข้อมูลลับ)
            expire_holds();
            json_out([
                'market_days' => array_map('intval', array_filter(explode(',', setting('market_days')), 'strlen')),
                'days_ahead' => (int)setting('days_ahead'), 'cutoff_hours' => (int)setting('cutoff_hours'),
                'max_stalls_per_day' => (int)setting('max_stalls_per_day'), 'hold_minutes' => (int)setting('hold_minutes'),
                'pay_within_hours' => (int)setting('pay_within_hours'), 'promptpay' => setting('promptpay'),
                'require_slip' => setting('require_slip') === '1',
                'refund_before_days' => (int)setting('refund_before_days'), 'refund_percent' => (float)setting('refund_percent'), 'refund_fee' => (float)setting('refund_fee'),
                'zones' => q('SELECT prefix,name,description,color,price_day,price_month FROM zones ORDER BY prefix')->fetchAll(),
            ]);

        case 'availability': // ?from=&to=  -> จำนวนล็อกว่างรายวัน (ล็อกที่เปิดให้จอง)
            expire_holds();
            $from = $_GET['from'] ?? date('Y-m-d'); $to = $_GET['to'] ?? $from;
            if (!valid_date($from) || !valid_date($to) || $to < $from || count(date_list($from, $to)) > 120) json_out(['error' => 'ช่วงวันที่ไม่ถูกต้อง'], 422);
            $total = (int)q('SELECT COUNT(*) FROM stalls WHERE is_open=1')->fetchColumn();
            $bk = q("SELECT b.stall_id,b.date_start,b.date_end FROM bookings b JOIN stalls s ON s.id=b.stall_id AND s.is_open=1 WHERE b.status IN ('awaiting_payment','pending','paid') AND b.date_start<=? AND b.date_end>=?", [$to, $from])->fetchAll();
            $days = [];
            foreach (date_list($from, $to) as $d) {
                $taken = [];
                foreach ($bk as $b) if ($b['date_start'] <= $d && $b['date_end'] >= $d) $taken[$b['stall_id']] = 1;
                $days[$d] = ['free' => $total - count($taken)];
            }
            json_out(['total' => $total, 'days' => $days]);

        case 'addons': // ?date_start=&date_end=  -> บริการเสริมพร้อมจำนวนคงเหลือต่ำสุดในช่วงวันนั้น
            expire_holds();
            $ds = $_GET['date_start'] ?? date('Y-m-d'); $de = $_GET['date_end'] ?? $ds;
            if (!valid_date($ds) || !valid_date($de) || $de < $ds || count(date_list($ds, $de)) > MAX_RANGE_DAYS) json_out(['error' => 'วันที่ไม่ถูกต้อง'], 422);
            $out = [];
            foreach (q('SELECT * FROM addons WHERE is_active=1 ORDER BY id')->fetchAll() as $a) {
                $left = (int)$a['stock'];
                foreach (date_list($ds, $de) as $d) {
                    $used = (int)q("SELECT COUNT(*) FROM booking_addons ba JOIN bookings b ON b.id=ba.booking_id WHERE ba.addon_id=? AND b.status IN ('awaiting_payment','pending','paid') AND b.date_start<=? AND b.date_end>=?", [$a['id'], $d, $d])->fetchColumn();
                    $left = min($left, (int)$a['stock'] - $used);
                }
                $out[] = ['code' => $a['code'], 'name' => $a['name'], 'description' => $a['description'], 'price_day' => (float)$a['price_day'], 'left' => max(0, $left)];
            }
            json_out(['addons' => $out]);

        case 'quote': // คำนวณราคาโดยเซิร์ฟเวอร์ (ยังไม่สร้างการจอง)
            post_only();
            expire_holds();
            $u = current_user();
            $qt = quote($in, $u ? (int)$u['id'] : null);
            unset($qt['addon_rows'], $qt['stall_id']);
            json_out(['ok' => true] + $qt);

        case 'booking_create': // ราคาทั้งหมดคำนวณฝั่งเซิร์ฟเวอร์ ไม่รับยอดเงินจากผู้ใช้
            post_only();
            $u = need_user();
            json_out(['ok' => true] + create_booking($in, (int)$u['id']));

        case 'my_bookings':
            $u = need_user();
            expire_holds();
            json_out(['bookings' => q('SELECT b.code,s.code AS stall,b.date_start,b.date_end,b.days,b.addons,b.stall_amount,b.addons_amount,b.amount,b.status,b.expires_at FROM bookings b JOIN stalls s ON s.id=b.stall_id WHERE b.user_id=? ORDER BY b.id DESC', [$u['id']])->fetchAll()]);

        case 'booking_get': // ?code=AIM-0001  (เฉพาะเจ้าของการจอง)
            $u = need_user();
            expire_holds();
            $b = q('SELECT b.code,b.date_start,b.date_end,b.days,b.addons,b.stall_amount,b.addons_amount,b.amount,b.status,b.expires_at,b.created_at,s.code AS stall,z.name AS zone,u.name,u.shop
                    FROM bookings b JOIN stalls s ON s.id=b.stall_id JOIN zones z ON z.id=s.zone_id JOIN users u ON u.id=b.user_id WHERE b.code=? AND b.user_id=?', [$_GET['code'] ?? '', $u['id']])->fetch();
            if (!$b) json_out(['error' => 'ไม่พบการจองนี้'], 404);
            $b['addon_lines'] = q('SELECT a.name, ba.price_day FROM booking_addons ba JOIN addons a ON a.id=ba.addon_id JOIN bookings b ON b.id=ba.booking_id WHERE b.code=?', [$b['code']])->fetchAll();
            $b['promptpay'] = setting('promptpay'); $b['refund_before_days'] = (int)setting('refund_before_days');
            $b['refund_amount'] = $b['status'] === 'paid' ? refund_quote(q('SELECT amount,date_start FROM bookings WHERE code=?', [$b['code']])->fetch()) : null;
            json_out(['booking' => $b]);

        case 'refund_request':
            post_only();
            $u = need_user();
            $b = q("SELECT * FROM bookings WHERE code=? AND user_id=? AND status='paid'", [$in['code'] ?? '', $u['id']])->fetch();
            if (!$b) json_out(['error' => 'ไม่พบการจองที่ขอคืนได้'], 404);
            $refund = refund_quote($b);
            if ($refund === null) json_out(['error' => 'เกินกำหนดคืนล็อก (ต้องคืนก่อนวันขาย ' . (int)setting('refund_before_days') . ' วัน)'], 422);
            if (q("SELECT 1 FROM refunds WHERE booking_id=? AND status='pending'", [$b['id']])->fetch()) json_out(['error' => 'ส่งคำขอไปแล้ว'], 409);
            $auto = setting('refund_needs_admin') !== '1';
            db()->beginTransaction();
            q('INSERT INTO refunds(booking_id,reason,refund_amount,status) VALUES(?,?,?,?)', [$b['id'], mb_substr(trim($in['reason'] ?? ''), 0, 200), $refund, $auto ? 'approved' : 'pending']);
            if ($auto) q("UPDATE bookings SET status='cancelled' WHERE id=?", [$b['id']]);
            db()->commit();
            json_out(['ok' => true, 'refund_amount' => $refund, 'auto_approved' => $auto]);

        case 'contact':
            post_only();
            $name = trim($in['name'] ?? ''); $body = trim($in['body'] ?? '');
            if ($name === '' || $body === '') json_out(['error' => 'กรอกชื่อและข้อความ'], 422);
            q('INSERT INTO messages(name,email,phone,body) VALUES(?,?,?,?)', [$name, trim($in['email'] ?? ''), trim($in['phone'] ?? ''), $body]);
            json_out(['ok' => true]);

        default:
            json_out(['error' => 'ไม่รู้จัก action'], 404);
    }
} catch (BookingError $ex) {
    json_out(['error' => $ex->getMessage()], $ex->status);
} catch (Throwable $ex) {
    if (db()->inTransaction()) db()->rollBack();
    json_out(['error' => 'เกิดข้อผิดพลาดในระบบ'], 500);
}
