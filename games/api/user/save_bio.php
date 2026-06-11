<?php
require_once __DIR__ . "/../db.php";

header('Content-Type: application/json');

// Pick up the session cookie (support both names)
$session_token = $_COOKIE['session_token'] 
    ?? $_COOKIE['portalToken'] 
    ?? ($_GET['session_token'] ?? null);

if (!$session_token) {
    echo json_encode(["success" => false, "error" => "No session token"]);
    exit;
}

try {
    $pdo = pdo_connect("userdb");

    // Verify session
    $stmt = $pdo->prepare("SELECT * FROM portal_users WHERE session_token = ?");
    $stmt->execute([$session_token]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode(["success" => false, "error" => "Invalid session"]);
        exit;
    }

    // Get posted bio
    $input = json_decode(file_get_contents("php://input"), true);
    $bio = trim($input['bio'] ?? "");

    // Save bio into portal_users (or user_details if you prefer)
    $stmt = $pdo->prepare("UPDATE portal_users SET bio = ? WHERE id = ?");
    $stmt->execute([$bio, $user['id']]);

    echo json_encode(["success" => true, "bio" => $bio]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
