<?php
require_once "../db.php";
session_start();

if (!isset($_SESSION["user_id"])) {
  json_out(["success" => false, "error" => "Not logged in"], 403);
}

$userId = $_SESSION["user_id"];

try {
  $pdo = pdo_connect("userdb");
  $stmt = $pdo->prepare("
    SELECT u.id, u.username FROM portal_users u
    JOIN portal_chat_private_members pm ON pm.user_id = u.id
    WHERE pm.chat_with = ? AND pm.user_id != ?
  ");
  $stmt->execute([$userId, $userId]);
  $chats = $stmt->fetchAll(PDO::FETCH_ASSOC);

  json_out(["success" => true, "chats" => $chats]);
} catch (Exception $e) {
  json_out(["success" => false, "error" => $e->getMessage()], 500);
}