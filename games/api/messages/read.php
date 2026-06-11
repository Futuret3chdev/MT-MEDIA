<?php
require_once "../db.php";
session_start();

if (!isset($_SESSION["user_id"])) {
  json_out(["success" => false, "error" => "Not logged in"], 403);
}

$userId = $_SESSION["user_id"];
$msgId  = $_POST["message_id"] ?? null;

if (!$msgId) {
  json_out(["success" => false, "error" => "Missing message_id"], 400);
}

try {
  $pdo = pdo_connect("userdb");
  $stmt = $pdo->prepare("
    UPDATE portal_messages 
    SET read_at = NOW()
    WHERE id = ? AND receiver_id = ?
  ");
  $stmt->execute([$msgId, $userId]);

  if ($stmt->rowCount() > 0) {
    json_out(["success" => true, "message" => "Marked as read"]);
  } else {
    json_out(["success" => false, "error" => "Message not found"]);
  }
} catch (Exception $e) {
  json_out(["success" => false, "error" => $e->getMessage()], 500);
}
