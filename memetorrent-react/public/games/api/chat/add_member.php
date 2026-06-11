<?php
require_once "../db.php";
session_start();

if (!isset($_SESSION["user_id"])) {
  json_out(["success" => false, "error" => "Not logged in"], 403);
}

$userId = $_SESSION["user_id"];
$data = json_decode(file_get_contents("php://input"), true);
$groupId = $data["group_id"] ?? null;
$targetUserId = $data["user_id"] ?? null;

if (!$groupId || !$targetUserId) {
  error_log("add_member.php: Missing group_id=$groupId or user_id=$targetUserId");
  json_out(["success" => false, "error" => "Group ID and user ID required"], 400);
}

try {
  $pdo = pdo_connect("userdb");
  $stmt = $pdo->prepare("SELECT creator_id FROM portal_chat_groups WHERE id = ?");
  $stmt->execute([$groupId]);
  $group = $stmt->fetch();
  if (!$group || $group["creator_id"] != $userId) {
    error_log("add_member.php: Not authorized, group_id=$groupId, user_id=$userId");
    json_out(["success" => false, "error" => "Not authorized"], 403);
  }

  $stmt = $pdo->prepare("SELECT id FROM portal_users WHERE id = ?");
  $stmt->execute([$targetUserId]);
  if (!$stmt->fetch()) {
    error_log("add_member.php: User not found, user_id=$targetUserId");
    json_out(["success" => false, "error" => "User not found"], 404);
  }

  $stmt = $pdo->prepare("INSERT IGNORE INTO portal_chat_members (group_id, user_id, joined_at) VALUES (?, ?, NOW())");
  $stmt->execute([$groupId, $targetUserId]);

  json_out(["success" => true]);
} catch (PDOException $e) {
  error_log("add_member.php: Error - " . $e->getMessage());
  json_out(["success" => false, "error" => $e->getMessage()], 500);
}
?>