<?php
header('Content-Type: application/json; charset=UTF-8');
require_once "../db.php";
error_reporting(E_ALL);
ini_set('display_errors', 0);

function out($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    session_start();
    $userId = $_SESSION["user_id"] ?? null;

    $debug = [
        "session_user_id" => $userId,
        "stage" => "start"
    ];

    if (!$userId) out(["success" => false, "error" => "No session"]);

    $senderId   = $_POST["sender_id"] ?? null;
    $receiverId = $_POST["receiver_id"] ?? null;
    $contentB64 = $_POST["content_b64"] ?? null;

    $debug["raw_post"] = $_POST;

    // Decode content
    $decoded = base64_decode($contentB64 ?? "", true);
    $debug["decoded_preview"] = $decoded ? substr($decoded, 0, 60) : "decode_failed";

    $pdo = pdo_connect("userdb");
    $debug["stage"] = "db_connected";

    // Test insert
    $sql = "INSERT INTO portal_messages (sender_id, receiver_id, content, attachments, created_at)
            VALUES (:s, :r, :c, '[]', NOW())";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ":s" => intval($userId),
        ":r" => intval($receiverId),
        ":c" => $decoded ?: "EMPTY"
    ]);

    $debug["stage"] = "insert_done";
    $debug["message_id"] = $pdo->lastInsertId();

    out([
        "success" => true,
        "stage" => "done",
        "debug" => $debug
    ]);

} catch (Throwable $e) {
    out([
        "success" => false,
        "stage" => "error",
        "error" => $e->getMessage(),
        "line" => $e->getLine(),
        "file" => basename($e->getFile())
    ], 500);
}
?>
