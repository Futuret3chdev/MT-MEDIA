<?php
require_once "db.php";

header('Content-Type: application/json; charset=UTF-8');
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Access-Control-Allow-Origin: https://memetorrent.futuret3ch.com.au");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type, Accept");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

session_start();

try {
    $pdo = pdo_connect("userdb");

    // Grab current user id + token if available
    $userId = $_SESSION['user_id'] ?? null;
    $token = $_COOKIE['session_token'] ?? null;

    if ($userId && $token) {
        $stmt = $pdo->prepare("UPDATE portal_users SET session_token = NULL WHERE id = ? AND session_token = ?");
        $stmt->execute([$userId, $token]);
        error_log("[logout.php] Cleared session_token for user_id $userId");
    }

    // Destroy PHP session
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    session_destroy();

    // Clear our custom cookie
    setcookie('session_token', '', [
        'expires' => time() - 3600,
        'path' => '/',
        'domain' => '.memetorrent.futuret3ch.com.au',
        'secure' => true,
        'httponly' => false, // allow front-end to read it
        'samesite' => 'Lax'
    ]);

    echo json_encode(['success' => true, 'message' => 'Logged out successfully']);
} catch (Exception $e) {
    error_log("[logout.php] Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error']);
}
