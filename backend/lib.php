<?php
require_once __DIR__ . '/config.php';

function db(): PDO {
    static $pdo = null;
    if (!$pdo) {
        $pdo = new PDO('mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4', DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        $pdo->exec("SET time_zone = '+07:00'");
    }
    return $pdo;
}

function q(string $sql, array $args = []): PDOStatement {
    $st = db()->prepare($sql);
    $st->execute($args);
    return $st;
}

function start_session(): void {
    if (session_status() === PHP_SESSION_NONE) {
        session_set_cookie_params(['httponly' => true, 'samesite' => 'Lax']);
        session_start();
    }
}

function e($v): string { return htmlspecialchars((string)$v, ENT_QUOTES, 'UTF-8'); }

function csrf_token(): string {
    start_session();
    if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(16));
    return $_SESSION['csrf'];
}

function csrf_check(): void {
    start_session();
    $t = $_POST['csrf'] ?? ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
    if (!$t || !hash_equals($_SESSION['csrf'] ?? '', $t)) {
        http_response_code(419);
        exit('CSRF token ไม่ถูกต้อง กรุณารีเฟรชหน้า');
    }
}

// ---- แอดมิน ----
function admin_user(): ?array {
    start_session();
    return isset($_SESSION['admin_id']) ? ['id' => $_SESSION['admin_id'], 'username' => $_SESSION['admin_name']] : null;
}

function require_admin(): array {
    $a = admin_user();
    if (!$a) { header('Location: login.php'); exit; }
    return $a;
}

// ---- ผู้ใช้ทั่วไป ----
function current_user(): ?array {
    start_session();
    if (empty($_SESSION['user_id'])) return null;
    $u = q('SELECT id,name,shop,phone,email,shop_type,status FROM users WHERE id=?', [$_SESSION['user_id']])->fetch();
    return ($u && $u['status'] === 'active') ? $u : null;
}

function json_out($data, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function booking_code(int $id): string { return 'AIM-' . str_pad((string)$id, 4, '0', STR_PAD_LEFT); }
