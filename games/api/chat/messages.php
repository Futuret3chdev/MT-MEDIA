<?php
require_once "../db.php";
session_start();

if (!isset($_SESSION["user_id"])) {
  json_out(["success" => false, "error" => "Not logged in"], 403);
}

$tab = $_GET["tab"] ?? "global";
$sinceId = (int)($_GET["since_id"] ?? 0);

try {
  $pdo = pdo_connect("userdb");
  $query = "
    SELECT id, tab, group_id, sender_id, sender_name, content, created_at 
    FROM portal_chat_messages 
    WHERE tab = ? AND id > ? 
  ";
  $params = [$tab, $sinceId];

  if (strpos($tab, "group-") === 0) {
    $groupId = str_replace("group-", "", $tab);
    $query .= " AND group_id = ?";
    $params[] = $groupId;
  }

  $query .= " ORDER BY created_at ASC";
  $stmt = $pdo->prepare($query);
  $stmt->execute($params);
  json_out(["success" => true, "messages" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
} catch (Exception $e) {
  json_out(["success" => false, "error" => $e->getMessage()], 500);
}
?>