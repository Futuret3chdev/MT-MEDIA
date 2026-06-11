<?php
require_once "../db.php";
session_start();

if (!isset($_SESSION["user_id"])) {
  json_out(["success" => false, "error" => "Not logged in"], 403);
}

$data = json_decode(file_get_contents("php://input"), true);
$tab = $_GET["tab"] ?? "global";
$content = trim($data["content"] ?? "");
$senderId = $data["sender_id"] ?? $_SESSION["user_id"];
$senderName = trim($data["sender_name"] ?? "");

if (empty($content) || empty($senderName)) {
  json_out(["success" => false, "error" => "Content and sender name required"], 400);
}

try {
  $pdo = pdo_connect("userdb");
  $groupId = null;
  if (strpos($tab, "group-") === 0) {
    $groupId = str_replace("group-", "", $tab);
    $stmt = $pdo->prepare("SELECT 1 FROM portal_chat_groups WHERE id = ?");
    $stmt->execute([$groupId]);
    if (!$stmt->fetch()) {
      json_out(["success" => false, "error" => "Group not found"], 404);
    }
    $stmt = $pdo->prepare("INSERT IGNORE INTO portal_chat_members (group_id, user_id, joined_at) VALUES (?, ?, NOW())");
    $stmt->execute([$groupId, $senderId]);
  }

  $stmt = $pdo->prepare("
    INSERT INTO portal_chat_messages (tab, group_id, sender_id, sender_name, content, created_at)
    VALUES (?, ?, ?, ?, ?, NOW())
  ");
  $stmt->execute([$tab, $groupId, $senderId, $senderName, $content]);
  $messageId = $pdo->lastInsertId();

  json_out(["success" => true, "id" => $messageId]);
} catch (PDOException $e) {
  json_out(["success" => false, "error" => $e->getMessage()], 500);
}
?>