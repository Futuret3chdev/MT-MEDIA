<?php
require_once "../db.php";
session_start();

header("Content-Type: application/json");

if (!isset($_SESSION["user_id"])) {
    echo json_encode(["success" => false, "error" => "Not logged in"]);
    exit;
}

$userId = $_SESSION["user_id"];
$relationId = $_POST["friend_id"] ?? null;

if (!$relationId) {
    echo json_encode(["success" => false, "error" => "Missing friend_id"]);
    exit;
}

try {
    $pdo = pdo_connect("userdb");

    // Only the user who initiates block can change the relation to "blocked"
    $stmt = $pdo->prepare("
        UPDATE portal_friends
        SET status = 'blocked'
        WHERE id = :rid
          AND (user_id = :uid OR friend_id = :uid)
    ");
    $stmt->execute([":rid" => $relationId, ":uid" => $userId]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(["success" => true, "message" => "User blocked"]);
    } else {
        echo json_encode(["success" => false, "error" => "Friendship not found"]);
    }

} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
