<?php
// unreport.php
ob_start();
header('Content-Type: application/json; charset=UTF-8');
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../error_log');
error_reporting(E_ALL);

try {
    require_once "../db.php";
} catch (Exception $e) {
    error_log("unreport.php: Failed to include db.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Failed to load database configuration"]);
    ob_end_flush();
    exit;
}

try {
    if (!session_start()) {
        throw new Exception("Failed to start session");
    }

    if (!isset($_SESSION["user_id"])) {
        http_response_code(403);
        echo json_encode(["success" => false, "error" => "Not logged in"]);
        ob_end_flush();
        exit;
    }

    $userId = (int)$_SESSION["user_id"];

    // Expect JSON input
    $raw = file_get_contents("php://input");
    $data = json_decode($raw, true);

    if (!$data || !isset($data["friend_id"])) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Invalid friend ID"]);
        ob_end_flush();
        exit;
    }

    $relationId = (int)$data["friend_id"];

    $pdo = pdo_connect("userdb");
    if (!$pdo) {
        throw new Exception("Database connection failed");
    }

    $stmt = $pdo->prepare("
        UPDATE portal_friends 
        SET reported = 0, report_reason = NULL 
        WHERE id = :rid 
          AND (user_id = :uid OR friend_id = :uid)
    ");
    $stmt->execute([":rid" => $relationId, ":uid" => $userId]);

    if ($stmt->rowCount() > 0) {
        http_response_code(200);
        echo json_encode(["success" => true, "message" => "User unreported"]);
    } else {
        http_response_code(404);
        echo json_encode(["success" => false, "error" => "No report found"]);
    }
} catch (Exception $e) {
    error_log("unreport.php error: " . $e->getMessage() . " | Line: " . $e->getLine());
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Server error: " . $e->getMessage()]);
}
ob_end_flush();
