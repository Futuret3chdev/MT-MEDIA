<?php
require_once __DIR__ . "/../db.php";
session_start();
header('Content-Type: application/json');

if (empty($_SESSION['user_id'])) {
  echo json_encode(["success" => false, "error" => "Not authenticated"]);
  exit;
}

$input = json_decode(file_get_contents("php://input"), true);
$key   = $input['key'] ?? null;
$value = $input['value'] ?? null;

if (!$key) {
  echo json_encode(["success" => false, "error" => "Missing key"]);
  exit;
}

try {
  // Ensure $pdo exists (fix for some db.php setups)
  if (!isset($pdo)) {
    $pdo = pdo_connect("userdb");
  }

  $user_id = $_SESSION['user_id'];

  // Fetch existing preferences
  $stmt = $pdo->prepare("SELECT preferences FROM portal_users WHERE id = ?");
  $stmt->execute([$user_id]);
  $current = $stmt->fetchColumn();
  $prefs = $current ? json_decode($current, true) : [];

  // Update key and save
  $prefs[$key] = $value;
  $json = json_encode($prefs, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

  $update = $pdo->prepare("UPDATE portal_users SET preferences = ? WHERE id = ?");
  $ok = $update->execute([$json, $user_id]);

  if ($ok) {
    error_log("[save-preferences.php] ✅ Updated prefs for user_id={$user_id}: $json");
    echo json_encode(["success" => true]);
  } else {
    error_log("[save-preferences.php] ❌ Update failed for user_id={$user_id}");
    echo json_encode(["success" => false, "error" => "DB update failed"]);
  }
} catch (Throwable $e) {
  error_log("[save-preferences.php] 💥 Error: " . $e->getMessage());
  echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
