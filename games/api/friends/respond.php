<?php
require_once '../db.php';
session_start();

$session_token = $_COOKIE['session_token'] ?? null;
if (!$session_token) {
  echo json_encode(["success" => false, "error" => "Not authenticated"]);
  exit;
}

$stmt = $pdo->prepare("SELECT id FROM portal_users WHERE session_token = ?");
$stmt->execute([$session_token]);
$user = $stmt->fetch();
if (!$user) {
  echo json_encode(["success" => false, "error" => "Invalid session"]);
  exit;
}
$user_id = $user['id'];

$data = json_decode(file_get_contents("php://input"), true);
$request_id = intval($data['request_id'] ?? 0);
$action = $data['action'] ?? '';

if (!$request_id || !in_array($action, ['accept','decline'])) {
  echo json_encode(["success" => false, "error" => "Invalid request"]);
  exit;
}

if ($action === 'accept') {
  $stmt = $pdo->prepare("UPDATE portal_friends SET status='accepted' WHERE id=? AND friend_id=?");
  $stmt->execute([$request_id, $user_id]);
} else {
  $stmt = $pdo->prepare("DELETE FROM portal_friends WHERE id=? AND friend_id=?");
  $stmt->execute([$request_id, $user_id]);
}

echo json_encode(["success" => true, "message" => "Request handled"]);
