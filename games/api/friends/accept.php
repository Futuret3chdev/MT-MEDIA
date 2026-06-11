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

    // Only receiver can accept (friend_id = me, status = pending)
    $stmt = $pdo->prepare("UPDATE portal_friends
                           SET status = 'accepted'
                           WHERE id = :rid AND friend_id = :uid AND status = 'pending'");
    $stmt->execute([":rid" => $relationId, ":uid" => $userId]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(["success" => true, "message" => "Friend request accepted"]);
    } else {
        echo json_encode(["success" => false, "error" => "Not authorized to accept this request"]);
    }

} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
