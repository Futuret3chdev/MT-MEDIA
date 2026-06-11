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
    SELECT g.id, g.name, g.creator_id, COALESCE(GROUP_CONCAT(m.user_id), '') as members
    FROM portal_chat_groups g
    LEFT JOIN portal_chat_members m ON m.group_id = g.id
    GROUP BY g.id, g.name, g.creator_id
  ");
  $stmt->execute();
  $groups = $stmt->fetchAll(PDO::FETCH_ASSOC);

  foreach ($groups as &$group) {
    $group['members'] = $group['members'] ? array_map('intval', explode(',', $group['members'])) : [];
  }

  json_out(["success" => true, "groups" => $groups]);
} catch (Exception $e) {
  json_out(["success" => false, "error" => $e->getMessage()], 500);
}
?>