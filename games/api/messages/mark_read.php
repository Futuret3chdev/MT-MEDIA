<?php
require_once "../db.php";
session_start();

if (!isset($_SESSION["user_id"])) {
  json_out(["success" => false, "error" => "Not logged in"], 403);
}

$userId = $_SESSION["user_id"];
$data = json_decode(file_get_contents("php://input"), true);
$messageId = isset($data["message_id"]) ? (int)$data["message_id"] : null;

if (!$messageId) {
  json_out(["success" => false, "error" => "Missing message_id"], 400);
}

try {
  $pdo = pdo_connect("userdb");
  $stmt = $pdo->prepare("
    UPDATE portal_messages
    SET read_at = NOW()
    WHERE id = ? AND receiver_id = ? AND read_at IS NULL
  ");
  $stmt->execute([$messageId, $userId]);
  $affected = $stmt->rowCount();

  if ($affected > 0) {
    json_out(["success" => true, "message" => "Message marked as read"]);
  } else {
    json_out(["success" => false, "error" => "Message not found or already read"], 404);
  }
} catch (Exception $e) {
  json_out(["success" => false, "error" => $e->getMessage()], 500);
}