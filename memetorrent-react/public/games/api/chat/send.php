<?php
require_once "../db.php";
session_start();

if (!isset($_SESSION["user_id"])) {
  json_out(["success" => false, "error" => "Not logged in"], 403);
}

$userId = $_SESSION["user_id"];
$data = json_decode(file_get_contents("php://input"), true);
$content = trim($data["content"] ?? "");

if (empty($content)) {
  json_out(["success" => false, "error" => "Empty content"], 400);
}

try {
  $pdo = pdo_connect("userdb");
  $stmt = $pdo->prepare("INSERT INTO portal_chat_messages (sender_id, content, created_at) VALUES (?, ?, NOW())");
  $stmt->execute([$userId, $content]);
  json_out(["success" => true, "id" => $pdo->lastInsertId()]);
} catch (Exception $e) {
  json_out(["success" => false, "error" => $e->getMessage()], 500);
}
?>