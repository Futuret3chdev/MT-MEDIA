<?php
require_once "db.php"; // db.php is in the same folder

session_start();
header('Content-Type: application/json; charset=UTF-8');

// Get token (prefer cookie, fallback to GET param for debugging)
$session_token = $_COOKIE['session_token'] ?? ($_GET['session_token'] ?? null);
error_log("[check-session.php] Received session_token: " . ($session_token ?: 'null'));

if (!$session_token) {
    json_out([
        "valid" => false,
        "error" => "No session token provided"
    ], 401);
    exit;
}

try {
    $pdo = pdo_connect("userdb");

    $stmt = $pdo->prepare("
        SELECT id, username, email, preferences
        FROM portal_users 
        WHERE session_token = ?
        LIMIT 1
    ");
    $stmt->execute([$session_token]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        // Success: attach session
        $_SESSION['user_id'] = $user['id'];

        error_log("[check-session.php] ✅ Valid token for user_id={$user['id']}, username={$user['username']}");

        // Decode preferences (if any)
        $prefs = [];
        if (!empty($user['preferences'])) {
            $decoded = json_decode($user['preferences'], true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $prefs = $decoded;
            } else {
                error_log("[check-session.php] ⚠️ JSON decode failed for preferences: " . json_last_error_msg());
            }
        }

        json_out([
            "valid" => true,
            "user_id" => $user['id'],
            "username" => $user['username'],
            "email" => $user['email'],
            "preferences" => $prefs
        ], 200);
    } else {
        // Invalid token
        error_log("[check-session.php] ❌ Invalid token: $session_token");
        json_out([
            "valid" => false,
            "error" => "Invalid token"
        ], 401);
    }

} catch (Throwable $e) {
    error_log("[check-session.php] 💥 Error: " . $e->getMessage());
    json_out([
        "valid" => false,
        "error" => "Server/DB error: " . $e->getMessage()
    ], 500);
}
