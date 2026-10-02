<?php
// ตรรกะการจอง: ค่ากฎ, ตรวจเงื่อนไข, คำนวณราคาฝั่งเซิร์ฟเวอร์
require_once __DIR__ . '/lib.php';

const SETTING_DEFAULTS = [
    'market_days' => '6,0',          // วันที่ตลาดเปิด (0=อา. … 6=ส.)
    'days_ahead' => '30',            // จองล่วงหน้าได้สูงสุด (วัน)
    'cutoff_hours' => '12',          // ปิดรับจองก่อนวันขาย (ชม.)
    'max_stalls_per_day' => '2',     // ล็อกสูงสุดต่อคนต่อวัน
    'hold_minutes' => '15',          // กันล็อกระหว่างหน้าชำระเงิน (นาที) — ใช้ในหน้าชำระเงิน
    'pay_within_hours' => '24',      // ต้องชำระภายใน (ชม.) เกินแล้วล็อกกลับมาว่าง
    'promptpay' => '',
    'require_slip' => '1',
    'refund_before_days' => '3',     // คืนล็อกได้ก่อนวันขาย (วัน)
    'refund_percent' => '80',
    'refund_fee' => '0',
    'refund_needs_admin' => '1',
    // แพ็กเกจรายเดือน: เก็บค่าไว้ ยังไม่ได้ใช้ในระบบจอง
    'monthly_enabled' => '1',
    'monthly_max_percent' => '50',
    'monthly_pay_before_days' => '5',
    'monthly_refund_unreached' => '1',
];

const MAX_RANGE_DAYS = 31;

function setting(string $key): string {
    static $cache = null;
    if ($cache === null) {
        $cache = SETTING_DEFAULTS;
        foreach (q('SELECT k,v FROM settings')->fetchAll() as $r) $cache[$r['k']] = $r['v'];
    }
    return (string)($cache[$key] ?? '');
}

function save_settings(array $kv): void {
    foreach ($kv as $k => $v) {
        if (!array_key_exists($k, SETTING_DEFAULTS)) continue;
        q('INSERT INTO settings(k,v) VALUES(?,?) ON DUPLICATE KEY UPDATE v=VALUES(v)', [$k, (string)$v]);
    }
}

// ปล่อยล็อกที่ไม่ชำระภายในเวลา (Re-Stocking)
function expire_holds(): void {
    q("UPDATE bookings SET status='cancelled' WHERE status='awaiting_payment' AND expires_at IS NOT NULL AND expires_at < NOW()");
}

function date_list(string $ds, string $de): array {
    $out = [];
    for ($d = new DateTimeImmutable($ds), $end = new DateTimeImmutable($de); $d <= $end; $d = $d->modify('+1 day')) $out[] = $d->format('Y-m-d');
    return $out;
}

function valid_date(string $s): bool {
    $d = DateTime::createFromFormat('Y-m-d', $s);
    return $d && $d->format('Y-m-d') === $s;
}

class BookingError extends Exception {
    public int $status;
    public function __construct(string $msg, int $status = 422) { parent::__construct($msg); $this->status = $status; }
}

/**
 * ตรวจและคำนวณราคา  $in: stall, date_start, date_end, addons[] (รหัสบริการเสริม)
 * ถ้า $lock = true ต้องเรียกภายใน transaction (ล็อกแถวล็อก/บริการเสริมกันจองชนกัน)
 */
function quote(array $in, ?int $userId, bool $lock = false): array {
    $ds = (string)($in['date_start'] ?? ''); $de = (string)($in['date_end'] ?? $ds);
    if (!valid_date($ds) || !valid_date($de) || $de < $ds) throw new BookingError('วันที่ไม่ถูกต้อง');
    $dates = date_list($ds, $de);
    if (count($dates) > MAX_RANGE_DAYS) throw new BookingError('จองได้ไม่เกิน ' . MAX_RANGE_DAYS . ' วันต่อครั้ง');

    $marketDays = array_map('intval', array_filter(explode(',', setting('market_days')), 'strlen'));
    foreach ($dates as $d) {
        if (!in_array((int)date('w', strtotime($d)), $marketDays, true)) throw new BookingError("วันที่ $d ไม่ใช่วันที่ตลาดเปิด");
    }
    if (strtotime($ds . ' 00:00:00') - time() < (int)setting('cutoff_hours') * 3600) throw new BookingError('ปิดรับจองสำหรับวันดังกล่าวแล้ว');
    if ($de > date('Y-m-d', strtotime('+' . (int)setting('days_ahead') . ' days'))) throw new BookingError('จองล่วงหน้าได้ไม่เกิน ' . (int)setting('days_ahead') . ' วัน');

    $lockSql = $lock ? ' FOR UPDATE' : '';
    $stall = q('SELECT s.id,s.code,s.is_open,z.name AS zone,COALESCE(s.price_day,z.price_day) AS price_day FROM stalls s JOIN zones z ON z.id=s.zone_id WHERE s.code=?' . $lockSql, [(string)($in['stall'] ?? '')])->fetch();
    if (!$stall || !$stall['is_open']) throw new BookingError('ล็อกนี้ไม่เปิดให้จอง');

    $active = "status IN ('awaiting_payment','pending','paid')";
    if (q("SELECT 1 FROM bookings WHERE stall_id=? AND $active AND date_start<=? AND date_end>=?", [$stall['id'], $de, $ds])->fetch())
        throw new BookingError('ล็อกนี้ถูกจองในช่วงวันดังกล่าวแล้ว', 409);

    if ($userId) {
        $max = (int)setting('max_stalls_per_day');
        foreach ($dates as $d) {
            $n = (int)q("SELECT COUNT(*) FROM bookings WHERE user_id=? AND $active AND date_start<=? AND date_end>=?", [$userId, $d, $d])->fetchColumn();
            if ($max > 0 && $n >= $max) throw new BookingError("จองได้สูงสุด $max ล็อกต่อวัน (วันที่ $d เต็มสิทธิ์แล้ว)", 409);
        }
    }

    $days = count($dates);
    $lines = [['name' => 'ค่าล็อก ' . $stall['code'] . ' (' . $stall['zone'] . ')', 'unit' => (float)$stall['price_day'], 'days' => $days, 'amount' => round((float)$stall['price_day'] * $days, 2)]];
    $addonsTotal = 0.0; $addonIds = [];
    $codes = array_values(array_unique(array_map('strval', (array)($in['addons'] ?? []))));
    foreach ($codes as $code) {
        $a = q('SELECT * FROM addons WHERE code=? AND is_active=1' . $lockSql, [$code])->fetch();
        if (!$a) throw new BookingError('ไม่พบบริการเสริม ' . $code);
        foreach ($dates as $d) {
            $used = (int)q("SELECT COUNT(*) FROM booking_addons ba JOIN bookings b ON b.id=ba.booking_id WHERE ba.addon_id=? AND b.$active AND b.date_start<=? AND b.date_end>=?", [$a['id'], $d, $d])->fetchColumn();
            if ($used >= (int)$a['stock']) throw new BookingError($a['name'] . ' หมดในวันที่ ' . $d, 409);
        }
        $amt = round((float)$a['price_day'] * $days, 2);
        $lines[] = ['name' => $a['name'], 'unit' => (float)$a['price_day'], 'days' => $days, 'amount' => $amt];
        $addonsTotal += $amt; $addonIds[] = ['id' => (int)$a['id'], 'price_day' => (float)$a['price_day'], 'name' => $a['name']];
    }

    $stallAmount = $lines[0]['amount'];
    return [
        'stall_id' => (int)$stall['id'], 'stall' => $stall['code'], 'date_start' => $ds, 'date_end' => $de, 'days' => $days,
        'lines' => $lines, 'stall_amount' => $stallAmount, 'addons_amount' => round($addonsTotal, 2), 'total' => round($stallAmount + $addonsTotal, 2),
        'addon_rows' => $addonIds, 'pay_within_hours' => (int)setting('pay_within_hours'),
    ];
}

function create_booking(array $in, int $userId): array {
    expire_holds();
    db()->beginTransaction();
    try {
        $qt = quote($in, $userId, true);
        $expires = date('Y-m-d H:i:s', time() + $qt['pay_within_hours'] * 3600);
        q('INSERT INTO bookings(user_id,stall_id,date_start,date_end,days,addons,stall_amount,addons_amount,amount,expires_at) VALUES(?,?,?,?,?,?,?,?,?,?)', [
            $userId, $qt['stall_id'], $qt['date_start'], $qt['date_end'], $qt['days'],
            implode(' · ', array_column($qt['addon_rows'], 'name')), $qt['stall_amount'], $qt['addons_amount'], $qt['total'], $expires,
        ]);
        $id = (int)db()->lastInsertId();
        $code = booking_code($id);
        q('UPDATE bookings SET code=? WHERE id=?', [$code, $id]);
        foreach ($qt['addon_rows'] as $a) q('INSERT INTO booking_addons(booking_id,addon_id,price_day) VALUES(?,?,?)', [$id, $a['id'], $a['price_day']]);
        db()->commit();
        return ['code' => $code, 'total' => $qt['total'], 'expires_at' => $expires, 'lines' => $qt['lines']];
    } catch (Throwable $e) {
        if (db()->inTransaction()) db()->rollBack();
        throw $e;
    }
}

// เงินที่คืนได้ตามกฎ (null = เกินกำหนดคืน)
function refund_quote(array $booking): ?float {
    $daysLeft = (int)round((strtotime($booking['date_start']) - strtotime(date('Y-m-d'))) / 86400);
    if ($daysLeft < (int)setting('refund_before_days')) return null;
    return max(0.0, round((float)$booking['amount'] * (float)setting('refund_percent') / 100 - (float)setting('refund_fee'), 2));
}
