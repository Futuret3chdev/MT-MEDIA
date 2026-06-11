<?php
require_once "../db.php";
session_start();

if (!isset($_SESSION["user_id"])) {
  json_out(["success" => false, "error" => "Not logged in"], 403);
}

$userId = $_SESSION["user_id"];
$data = json_decode(file_get_contents("php://input"), true);
$groupId = $data["group_id"] ?? null;

if (!$groupId || !is_numeric($groupId)) {
  json_out(["success" => false, "error" => "Invalid group ID"], 400);
}

try {
  $pdo = pdo_connect("userdb");
  // Check if user is a member or creator
  $checkStmt = $pdo->prepare("SELECT creator_id FROM portal_chat_groups WHERE id = ? AND (creator_id = ? OR id IN (SELECT group_id FROM portal_chat_members WHERE user_id = ?))");
  $checkStmt->execute([$groupId, $userId, $userId]);
  if (!$checkStmt->fetch()) {
    json_out(["success" => false, "error" => "Not authorized to leave/delete this group"], 403);
  }

  // Delete the group (with CASCADE handling members)
  $deleteStmt = $pdo->prepare("DELETE FROM portal_chat_groups WHERE id = ? AND creator_id = ?");
  $deleteStmt->execute([$groupId, $userId]);
  if ($deleteStmt->rowCount() > 0) {
    json_out(["success" => true]);
  } else {
    json_out(["success" => false, "error" => "Group not deleted (only creator can delete)"], 403);
  }
} catch (PDOException $e) {
  json_out(["success" => false, "error" => $e->getMessage()], 500);
}
?>