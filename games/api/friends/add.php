<?php
require_once "../db.php";
session_start();

header("Content-Type: application/json");

if (!isset($_SESSION["user_id"])) {
    echo json_encode(["success" => false, "error" => "Not logged in"]);
    exit;
}

$userId = $_SESSION["user_id"];
$input = json_decode(file_get_contents("php://input"), true);
$username = trim($input["username"] ?? "");

if (!$username) {
    echo json_encode(["success" => false, "error" => "Missing username/email"]);
    exit;
}

try {
    $pdo = pdo_connect("userdb");

    // Find friend by username or email
    $stmt = $pdo->prepare("SELECT id FROM portal_users WHERE username = :u OR email = :u");
    $stmt->execute([":u" => $username]);
    $friend = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$friend) {
        echo json_encode(["success" => false, "error" => "User not found"]);
        exit;
    }
    $friendId = (int)$friend["id"];

    if ($friendId === (int)$userId) {
        echo json_encode(["success" => false, "error" => "You cannot add yourself"]);
        exit;
    }

    // Check if already exists
    $stmt = $pdo->prepare("SELECT id, status FROM portal_friends WHERE 
        (user_id = :u AND friend_id = :f) OR 
        (user_id = :f AND friend_id = :u)");
    $stmt->execute([":u" => $userId, ":f" => $friendId]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        if ($existing["status"] === "pending") {
            echo json_encode(["success" => false, "error" => "Request already pending"]);
        } else {
            echo json_encode(["success" => false, "error" => "Friendship already exists"]);
        }
        exit;
    }

    // Insert pending request (always from sender → receiver)
    $stmt = $pdo->prepare("INSERT INTO portal_friends (user_id, friend_id, status, reported, created_at)
                           VALUES (:u, :f, 'pending', 0, NOW())");
    $stmt->execute([":u" => $userId, ":f" => $friendId]);

    echo json_encode(["success" => true, "message" => "Friend request sent"]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
