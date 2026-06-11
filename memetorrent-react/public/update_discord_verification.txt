<?php
// Enable error logging for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Log file for debugging
$log_file = 'update_discord_verification.log';
file_put_contents($log_file, "Request received at " . date('Y-m-d H:i:s') . "\n", FILE_APPEND);

// Log request headers (fallback if getallheaders() is not available)
if (function_exists('getallheaders')) {
    $headers = getallheaders();
} else {
    $headers = [];
    foreach ($_SERVER as $key => $value) {
        if (substr($key, 0, 5) === 'HTTP_') {
            $header_key = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($key, 5)))));
            $headers[$header_key] = $value;
        }
    }
}
file_put_contents($log_file, "Request headers: " . print_r($headers, true) . "\n", FILE_APPEND);

// Log server environment
file_put_contents($log_file, "Server environment: " . print_r($_SERVER, true) . "\n", FILE_APPEND);

// Get the form data
$data = $_POST;
file_put_contents($log_file, "Form data: " . print_r($data, true) . "\n", FILE_APPEND);

header('Content-Type: application/json');

// Add authentication with a secret token
$secret_token = 'x9y8z7w6v5u4t3s2r1q0';
if (!isset($data['token']) || $data['token'] !== $secret_token) {
    file_put_contents($log_file, "Unauthorized access attempt\n", FILE_APPEND);
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Database credentials for HostGator
$host = '50.6.160.248';
$dbname = 'tcvkxete_discord_members';
$username = 'tcvkxete_admin';
$password = 'Shinhwa1@@';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if (!isset($data['discord_id']) || !isset($data['verified']) || !isset($data['verified_at'])) {
        file_put_contents($log_file, "Missing required fields\n", FILE_APPEND);
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        exit;
    }

    // Parse the verified_at timestamp (in case it's in ISO 8601 format)
    $verified_at = $data['verified_at'];
    if (preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/', $verified_at)) {
        $verified_at = date('Y-m-d H:i:s', strtotime($verified_at));
    }

    $sql = "UPDATE discord_users 
            SET verified = :verified, verified_at = :verified_at 
            WHERE discord_id = :discord_id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':discord_id' => $data['discord_id'],
        ':verified' => filter_var($data['verified'], FILTER_VALIDATE_BOOLEAN),
        ':verified_at' => $verified_at
    ]);

    if ($stmt->rowCount() > 0) {
        file_put_contents($log_file, "Successfully updated verification\n", FILE_APPEND);
        http_response_code(200);
        echo json_encode(['status' => 'success']);
    } else {
        file_put_contents($log_file, "User not found\n", FILE_APPEND);
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
    }
} catch (PDOException $e) {
    file_put_contents($log_file, "Database error: " . $e->getMessage() . "\n", FILE_APPEND);
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    file_put_contents($log_file, "Server error: " . $e->getMessage() . "\n", FILE_APPEND);
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?>