<?php
require_once "../db.php";
session_start();

if (!isset($_SESSION["user_id"])) {
  json_out(["success" => false, "error" => "Not logged in"], 403);
}

$userId = $_SESSION["user_id"];
$data = json_decode(file_get_contents("php://input"), true);
$name = trim($data["name"] ?? "");

if (empty($name)) {
  json_out(["success" => false, "error" => "Group name required"], 400);
}

try {
  $pdo = pdo_connect("userdb");
  $pdo->beginTransaction();

  $checkStmt = $pdo->prepare("SELECT id FROM portal_chat_groups WHERE name = ?");
  $checkStmt->execute([$name]);
  if ($checkStmt->fetch()) {
    $pdo->rollBack();
    json_out(["success" => false, "error" => "Group name already exists"], 400);
  }

  $stmt = $pdo->prepare("INSERT INTO portal_chat_groups (name, creator_id, created_at) VALUES (?, ?, NOW())");
  $stmt->execute([$name, $userId]);
  $groupId = $pdo->lastInsertId();

  $memberStmt = $pdo->prepare("INSERT INTO portal_chat_members (group_id, user_id, joined_at) VALUES (?, ?, NOW())");
  $memberStmt->execute([$groupId, $userId]);

  $pdo->commit();
  json_out(["success" => true, "group_id" => $groupId]);
} catch (PDOException $e) {
  $pdo->rollBack();
  json_out(["success" => false, "error" => $e->getMessage()], 500);
}
?>