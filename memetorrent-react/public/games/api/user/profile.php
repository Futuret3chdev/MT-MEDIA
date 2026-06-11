<?php
require_once __DIR__ . "/../db.php"; // one level up from /user/

session_start();
header('Content-Type: application/json; charset=UTF-8');

// ---- CORS (allow same origins as login.php) ----
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = [
    'https://memetorrent.futuret3ch.com.au',
    'https://www.futuret3ch.com.au',
    'https://futuret3ch.com.au'
];
if (in_array($origin, $allowed, true)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Headers: Content-Type, Accept");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    header("Vary: Origin");
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ---- Get token from cookie or GET ----
$session_token = $_COOKIE['session_token'] ?? ($_GET['session_token'] ?? null);
error_log("profile.php: Received session_token: " . ($session_token ?: 'null'));

if (!$session_token) {
    http_response_code(401);
    echo json_encode(["success" => false, "error" => "No session token"]);
    exit;
}

try {
    $pdo = pdo_connect("userdb");

    // Lookup portal user
    $stmt = $pdo->prepare("SELECT * FROM portal_users WHERE session_token = ?");
    $stmt->execute([$session_token]);
    $portalUser = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$portalUser) {
        http_response_code(401);
        echo json_encode(["success" => false, "error" => "Invalid session"]);
        exit;
    }

    // Lookup details
    $details = null;
    if (!empty($portalUser['username'])) {
        $stmt2 = $pdo->prepare("SELECT * FROM user_details WHERE username = ? LIMIT 1");
        $stmt2->execute([$portalUser['username']]);
        $details = $stmt2->fetch(PDO::FETCH_ASSOC);
    }
    if (!$details && !empty($portalUser['wallet_address'])) {
        $stmt2 = $pdo->prepare("SELECT * FROM user_details WHERE wallet_address = ? LIMIT 1");
        $stmt2->execute([$portalUser['wallet_address']]);
        $details = $stmt2->fetch(PDO::FETCH_ASSOC);
    }

    // Merge profile data
    $wallet = $portalUser['wallet_address'] ?? ($details['wallet_address'] ?? null);

    $profile = [
        "id"          => $portalUser['id'] ?? null,
        "email"       => $portalUser['email'] ?? null,
        "username"    => $details['username'] ?? $portalUser['username'] ?? null,
        "first_name"  => $details['first_name'] ?? null,
        "last_name"   => $details['last_name'] ?? null,
        "wallet"      => $wallet ?? "-",
        "discord_id"  => $portalUser['discord_id'] ?? null,
        "telegram_id" => $portalUser['telegram_id'] ?? null,
        "avatar_url"  => $portalUser['avatar_url'] ?? "/games/default-avatar.png",
        "bio"         => $portalUser['bio'] ?? ""
    ];

    echo json_encode([
        "success"     => true,
        "profile"     => $profile,
        "badge"       => "Alpha Tester",
        "leaderboard" => [
            "rank"  => rand(1, 100),
            "score" => rand(100, 9999)
        ]
    ]);

} catch (Throwable $e) {
    error_log("profile.php error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error"   => "Server error: " . $e->getMessage()
    ]);
}
