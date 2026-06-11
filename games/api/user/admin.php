<?php
require_once "../db.php";
session_start();

if (!isset($_SESSION["user_id"])) {
  json_out(["is_admin" => false], 403);
}

$userId = $_SESSION["user_id"];

try {
  $pdo = pdo_connect("userdb");
  $stmt = $pdo->prepare("SELECT is_admin FROM portal_users WHERE id = ?");
  $stmt->execute([$userId]);
  $user = $stmt->fetch(PDO::FETCH_ASSOC);
  json_out(["is_admin" => $user['is_admin'] ?? false]);
} catch (Exception $e) {
  json_out(["is_admin" => false], 500);
}