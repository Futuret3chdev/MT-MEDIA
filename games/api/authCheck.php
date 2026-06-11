<?php
require_once "db.php";
session_start([
    'cookie_secure'   => true,
    'cookie_httponly' => true,
    'cookie_samesite' => 'Strict',
    'use_strict_mode' => true
]);

header('Content-Type: application/json; charset=UTF-8');

$userId = $_SESSION['user_id'] ?? null;
$token  = $_COOKIE['session_token'] ?? null;

if (!$userId || !$token) {
    json_out(['success' => false, 'error' => 'Not authenticated'], 401);
}

try {
    $pdo = pdo_connect('userdb');
    $stmt = $pdo->prepare("SELECT id, username, email, avatar_url, discord_id, wallet_address FROM portal_users WHERE id = ? AND session_token = ?");
    $stmt->execute([$userId, $token]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        json_out(['success' => true, 'user' => $user]);
    } else {
        json_out(['success' => false, 'error' => 'Invalid session'], 401);
    }
} catch (Exception $e) {
    error_log("[authCheck] " . $e->getMessage());
    json_out(['success' => false, 'error' => 'Server error'], 500);
}
