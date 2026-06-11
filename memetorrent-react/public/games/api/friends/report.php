<?php
// report.php

ob_start();
header('Content-Type: application/json; charset=UTF-8');
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../error_log');
error_reporting(E_ALL);

require_once "../db.php";

try {
    session_start();
    if (!isset($_SESSION["user_id"])) {
        json_out(["success" => false, "error" => "Not logged in"], 403);
    }

    $userId = (int)$_SESSION["user_id"];

    // ✅ Handle both JSON and form POST
    $input = file_get_contents("php://input");
    $data = [];
    if ($input) {
        $decoded = json_decode($input, true);
        if (is_array($decoded)) {
            $data = $decoded;
        }
    }
    if (empty($data)) {
        $data = $_POST; // fallback for form-urlencoded
    }

    $relationId = isset($data["friend_id"]) ? (int)$data["friend_id"] : null;
    $reason     = isset($data["reason"]) ? trim($data["reason"]) : null;

    if (!$relationId || !$reason) {
        json_out(["success" => false, "error" => "Missing friend_id or reason"], 400);
    }

    $pdo = pdo_connect("userdb");

    // Verify the friendship exists
    $stmt = $pdo->prepare("
        SELECT id 
        FROM portal_friends 
        WHERE id = :rid 
          AND (user_id = :uid OR friend_id = :uid)
    ");
    $stmt->execute([":rid" => $relationId, ":uid" => $userId]);
    if ($stmt->rowCount() === 0) {
        json_out(["success" => false, "error" => "Friendship not found"], 404);
    }

    // Update report status
    $stmt = $pdo->prepare("
        UPDATE portal_friends
        SET reported = 1, report_reason = :reason
        WHERE id = :rid
          AND (user_id = :uid OR friend_id = :uid)
    ");
    $stmt->execute([":rid" => $relationId, ":uid" => $userId, ":reason" => $reason]);

    if ($stmt->rowCount() > 0) {
        json_out(["success" => true, "message" => "User reported"]);
    } else {
        json_out(["success" => false, "error" => "Failed to update report"], 500);
    }
} catch (Exception $e) {
    error_log("report.php error: " . $e->getMessage());
    json_out(["success" => false, "error" => "Server error: " . $e->getMessage()], 500);
}
