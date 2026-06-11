<?php
require_once "../db.php";
session_start();

if (!isset($_SESSION["user_id"])) {
  json_out(["success" => false, "error" => "Not logged in"], 403);
}

$userId = $_SESSION["user_id"];
$data = json_decode(file_get_contents("php://input"), true);
$groupId = (int)($data["group_id"] ?? 0);

if (!$groupId) {
  json_out(["success" => false, "error" => "Invalid group ID"], 400);
}

try {
  $pdo = pdo_connect("userdb");
  $stmt = $pdo->prepare("INSERT IGNORE INTO portal_chat_members (group_id, user_id) VALUES (?, ?)");
  $stmt->execute([$groupId, $userId]);
  json_out(["success" => true]);
} catch (Exception $e) {
  json_out(["success" => false, "error" => $e->getMessage()], 500);
}