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

    // Either user_id or friend_id must be the logged-in user
    $stmt = $pdo->prepare("
        DELETE FROM portal_friends
        WHERE id = :rid AND (user_id = :uid OR friend_id = :uid)
    ");
    $stmt->execute([":rid" => $relationId, ":uid" => $userId]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(["success" => true, "message" => "Friendship removed"]);
    } else {
        echo json_encode(["success" => false, "error" => "Friendship not found or not yours to remove"]);
    }

} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
