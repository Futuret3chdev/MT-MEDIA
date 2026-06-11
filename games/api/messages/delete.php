<?php
require_once "../db.php";
session_start();

if (!isset($_SESSION["user_id"])) {
  json_out(["success" => false, "error" => "Not logged in"], 403);
}

$userId = $_SESSION["user_id"];
$data = json_decode(file_get_contents("php://input"), true);

try {
  $pdo = pdo_connect("userdb");

  if (isset($data["message_ids"]) && is_array($data["message_ids"]) && !empty($data["message_ids"])) {
    // Batch delete
    $messageIds = array_map('intval', $data["message_ids"]);
    $placeholders = implode(',', array_fill(0, count($messageIds), '?'));
    $stmt = $pdo->prepare("
      DELETE FROM portal_messages
      WHERE id IN ($placeholders) AND (sender_id = ? OR receiver_id = ?)
    ");
    $stmt->execute([...$messageIds, $userId, $userId]);
    $affected = $stmt->rowCount();
    if ($affected > 0) {
      json_out(["success" => true, "message" => "Messages deleted", "deleted_count" => $affected]);
    } else {
      json_out(["success" => false, "error" => "No messages found"], 404);
    }
  } elseif (isset($data["message_id"]) && (int)$data["message_id"] > 0) {
    // Single delete
    $messageId = (int)$data["message_id"];
    $stmt = $pdo->prepare("
      DELETE FROM portal_messages
      WHERE id = ? AND (sender_id = ? OR receiver_id = ?)
    ");
    $stmt->execute([$messageId, $userId, $userId]);
    $affected = $stmt->rowCount();
    if ($affected > 0) {
      json_out(["success" => true, "message" => "Message deleted"]);
    } else {
      json_out(["success" => false, "error" => "Message not found"], 404);
    }
  } else {
    json_out(["success" => false, "error" => "Invalid input"], 400);
  }
} catch (Exception $e) {
  json_out(["success" => false, "error" => $e->getMessage()], 500);
}