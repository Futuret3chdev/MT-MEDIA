<?php
require_once "../db.php";
session_start();

if (!isset($_SESSION["user_id"])) {
  http_response_code(401);
  exit;
}

header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('Connection: keep-alive');

$lastId = 0;
while (true) {
  $pdo = pdo_connect("userdb");
  $stmt = $pdo->prepare("SELECT * FROM portal_chat_messages WHERE id > ? ORDER BY id ASC LIMIT 1");
  $stmt->execute([$lastId]);
  $msg = $stmt->fetch(PDO::FETCH_ASSOC);
  if ($msg) {
    $lastId = $msg['id'];
    echo "id: $lastId\n";
    echo "data: " . json_encode($msg) . "\n\n";
    ob_flush();
    flush();
  }
  sleep(1);
}
?>