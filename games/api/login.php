<?php
require_once "db.php";
session_start();

header('Content-Type: application/json; charset=UTF-8');

// CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = [
    'https://futuret3ch.com.au',
    'https://www.futuret3ch.com.au',
    'https://memetorrent.futuret3ch.com.au',
    'https://memetorrent.futuret3ch.com.au/games'
];
if (in_array($origin, $allowed, true)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Headers: Content-Type, Accept");
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    header("Vary: Origin");
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

try {
    $pdo = pdo_connect("userdb");

    // Clear old cookies
    setcookie('session_token', '', time() - 3600, '/', '.memetorrent.futuret3ch.com.au');
    setcookie('PHPSESSID', '', time() - 3600, '/', '.memetorrent.futuret3ch.com.au');

    if (isset($_COOKIE['session_token'])) {
        error_log("Cookie visible immediately after setcookie: " . $_COOKIE['session_token']);
    } else {
        error_log("Cookie NOT visible in this request (expected, only next request will have it)");
    }
    if (headers_sent($file, $line)) {
        error_log("⚠️ Headers already sent (file: $file, line: $line)");
    }

    // Input
    $data = json_decode(file_get_contents('php://input'), true);
    $email = filter_var($data['email'] ?? '', FILTER_SANITIZE_EMAIL);
    $password = $data['password'] ?? '';

    if (empty($email) || empty($password)) {
        json_out(['success' => false, 'message' => 'Email and password are required'], 400);
    }

    // Lookup user
    $stmt = $pdo->prepare("SELECT id, email, username, password_hash, wallet_address FROM portal_users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && password_verify($password, $user['password_hash'])) {
        $token = bin2hex(random_bytes(32));

        // Save token and last login
        $stmt = $pdo->prepare("UPDATE portal_users SET session_token = ?, last_login = NOW() WHERE id = ?");
        $stmt->execute([$token, $user['id']]);

        // Start PHP session
        $_SESSION['user_id'] = $user['id'];

        // Set fresh cookie
        setcookie('session_token', $token, [
            'expires' => time() + (86400 * 7),
            'path' => '/',
            'domain' => '.memetorrent.futuret3ch.com.au',
            'secure' => true,
            'httponly' => true,
            'samesite' => 'Lax'
        ]);

        json_out([
            'success' => true,
            'message' => 'Login successful',
            'token' => $token,
            'user' => [
                'email' => $user['email'],
                'username' => $user['username'],
                'wallet_address' => $user['wallet_address'] ?: null
            ]
        ]);
    } else {
        json_out(['success' => false, 'message' => 'Invalid email or password'], 401);
    }
} catch (Throwable $e) {
    error_log("[login.php] Error: " . $e->getMessage());
    json_out(['success' => false, 'message' => 'Server error: ' . $e->getMessage()], 500);
}
?>