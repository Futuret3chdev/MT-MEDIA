<?php
require_once "../db.php";
session_start();

if (!isset($_SESSION["user_id"])) {
  json_out(["success" => false, "error" => "Not logged in"], 403);
}

$userId = $_SESSION["user_id"];
$data = json_decode(file_get_contents("php://input"), true);
$otherUserId = (int)($data["user_id"] ?? 0);

if (!$otherUserId) {
  json_out(["success" => false, "error" => "Invalid user ID"], 400);
}

try {
  $pdo = pdo_connect("userdb");
  $stmt = $pdo->prepare("DELETE FROM portal_chat_private_members WHERE user_id = ? AND chat_with = ?");
  $stmt->execute([$userId, $otherUserId]);
  $stmt = $pdo->prepare("DELETE FROM portal_chat_private_members WHERE user_id = ? AND chat_with = ?");
  $stmt->execute([$otherUserId, $userId]);
  json_out(["success" => true]);
} catch (Exception $e) {
  json_out(["success" => false, "error" => $e->getMessage()], 500);
}