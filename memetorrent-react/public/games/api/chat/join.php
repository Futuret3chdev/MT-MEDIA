<?php
require_once "../db.php";
session_start();

if (!isset($_SESSION["user_id"])) {
  json_out(["success" => false, "error" => "Not logged in"], 403);
}

$userId = $_SESSION["user_id"];
try {
  $pdo = pdo_connect("userdb");
  $pdo->prepare("INSERT IGNORE INTO portal_chat_members (group_id, user_id) VALUES (NULL, ?)")->execute([$userId]);
  json_out(["success" => true]);
} catch (Exception $e) {
  json_out(["success" => false, "error" => $e->getMessage()], 500);
}