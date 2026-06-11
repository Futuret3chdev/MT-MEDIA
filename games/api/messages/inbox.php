<?php
require_once "../db.php";
session_start();

if (!isset($_SESSION["user_id"])) {
  json_out(["success" => false, "error" => "Not logged in"], 403);
}

$userId = $_SESSION["user_id"];
$tab = isset($_GET["tab"]) ? $_GET["tab"] : "inbox";

try {
  $pdo = pdo_connect("userdb");
  $query = "
    SELECT DISTINCT m.id, m.sender_id, us.username AS sender_name, m.receiver_id, ur.username AS receiver_name,
           us.avatar_url AS avatar_url, m.content, m.attachments, m.created_at, m.read_at
    FROM portal_messages m
    JOIN portal_users us ON us.id = m.sender_id
    JOIN portal_users ur ON ur.id = m.receiver_id
    WHERE m.receiver_id = ?
  ";
  if ($tab === "inbox") {
    $query .= " AND m.read_at IS NULL";
  }
  $query .= " ORDER BY m.created_at DESC LIMIT 50";
  
  $stmt = $pdo->prepare($query);
  $stmt->execute([$userId]);
  $msgs = $stmt->fetchAll(PDO::FETCH_ASSOC);

  json_out(["success" => true, "messages" => $msgs]);
} catch (Exception $e) {
  json_out(["success" => false, "error" => $e->getMessage()], 500);
}
?>