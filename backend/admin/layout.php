<?php
require_once __DIR__ . '/../booking.php';
$ADMIN = require_admin();
expire_holds();

function flash(string $msg = null): ?string {
    if ($msg !== null) { $_SESSION['flash'] = $msg; return null; }
    $m = $_SESSION['flash'] ?? null; unset($_SESSION['flash']); return $m;
}

function redirect(string $to): void { header('Location: ' . $to); exit; }

const STATUS_TH = [
    'awaiting_payment' => 'รอชำระเงิน', 'pending' => 'รอตรวจสอบ', 'paid' => 'ชำระแล้ว', 'rejected' => 'ปฏิเสธ', 'cancelled' => 'ยกเลิก',
    'approved' => 'อนุมัติ', 'active' => 'ปกติ', 'banned' => 'ถูกระงับ',
];
function badge(string $s): string { return '<span class="b b-' . e($s) . '">' . e(STATUS_TH[$s] ?? $s) . '</span>'; }

function page_head(string $title, string $active): void {
    $menu = ['index' => 'ภาพรวม', 'bookings' => 'การจอง', 'users' => 'ผู้ใช้', 'stalls' => 'ล็อก/โซน', 'addons' => 'บริการเสริม', 'settings' => 'กฎการจอง', 'refunds' => 'คืนล็อก/คืนเงิน', 'messages' => 'ข้อความ', 'password' => 'รหัสผ่าน'];
    echo '<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' . e($title) . ' · All IN Market Admin</title>
<style>
:root{--v:#5B3FD6;--bg:#F6F5FB;--ink:#1d1a2b;--mut:#6b6880;--line:#e4e1f0}
*{box-sizing:border-box}body{margin:0;font-family:"Anuphan",system-ui,sans-serif;background:var(--bg);color:var(--ink)}
header{background:var(--v);color:#fff;padding:12px 24px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px}
nav a{color:#fff;opacity:.8;text-decoration:none;margin-right:16px;padding:4px 0}nav a.on,nav a:hover{opacity:1;border-bottom:2px solid #fff}
main{max-width:1100px;margin:24px auto;padding:0 16px}h1{margin:0 0 16px;font-size:22px}
.card{background:#fff;border:1px solid var(--line);border-radius:12px;padding:16px;margin-bottom:16px;overflow-x:auto}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px}.stat b{display:block;font-size:28px;color:var(--v)}
table{width:100%;border-collapse:collapse;font-size:14px}th,td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--line);vertical-align:top}th{color:var(--mut);font-weight:600}
.b{padding:2px 10px;border-radius:99px;font-size:12px;background:#eee}.b-pending,.b-awaiting_payment{background:#FFEBDD;color:#A2430C}.b-paid,.b-approved,.b-active{background:#E3F8EA;color:#0E5A34}.b-rejected,.b-banned,.b-cancelled{background:#fde4e4;color:#a11}
button,.btn{background:var(--v);color:#fff;border:0;border-radius:8px;padding:6px 12px;font:inherit;cursor:pointer;text-decoration:none;display:inline-block}
button.alt{background:#fff;color:var(--v);border:1px solid var(--v)}button.red{background:#c0392b}
input,select,textarea{font:inherit;padding:7px 10px;border:1px solid var(--line);border-radius:8px;max-width:100%}form.inline{display:inline}
.tabs a{margin-right:8px;padding:4px 12px;border-radius:99px;text-decoration:none;color:var(--v);border:1px solid var(--v)}.tabs a.on{background:var(--v);color:#fff}
.flash{background:#E3F8EA;color:#0E5A34;padding:10px 14px;border-radius:8px;margin-bottom:16px}.mut{color:var(--mut)}
.chips span{display:inline-block;margin:2px;padding:3px 9px;border-radius:6px;background:#EDE8FF;font-size:13px}.chips span.shut{background:#fde4e4;text-decoration:line-through}
</style></head><body><header><strong>All IN Market · แอดมิน</strong><nav>';
    foreach ($menu as $k => $v) echo '<a href="' . $k . '.php"' . ($k === $active ? ' class="on"' : '') . '>' . e($v) . '</a>';
    echo '<a href="logout.php">ออกจากระบบ</a></nav></header><main><h1>' . e($title) . '</h1>';
    if ($m = flash()) echo '<div class="flash">' . e($m) . '</div>';
}

function page_foot(): void { echo '</main></body></html>'; }

function csrf_field(): string { return '<input type="hidden" name="csrf" value="' . e(csrf_token()) . '">'; }

function post_form(array $fields, string $label, string $cls = '', string $confirm = ''): string {
    $h = '<form method="post" class="inline"' . ($confirm ? ' onsubmit="return confirm(\'' . e($confirm) . '\')"' : '') . '>' . csrf_field();
    foreach ($fields as $k => $v) $h .= '<input type="hidden" name="' . e($k) . '" value="' . e($v) . '">';
    return $h . '<button class="' . $cls . '">' . e($label) . '</button></form> ';
}
