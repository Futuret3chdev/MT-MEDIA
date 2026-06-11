<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://memetorrent.futuret3ch.com.au');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Accept');

include 'config.php';

try {
    $pdo_user = new PDO('mysql:host=50.6.160.248;dbname=tcvkxete_userdb', 'tcvkxete_admin', 'Shinhwa1@@');
    $pdo_user->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    error_log("telegram_auth.php - Database connection failed: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

$user_id = $_SESSION['user_id'] ?? null;
if (!$user_id) {
    error_log("telegram_auth.php - No user_id in session");
    http_response_code(401);
    echo json_encode(['error' => 'Not logged in']);
    exit;
}

// Verify Telegram auth data
$telegram_data = $_GET;
$check_hash = $telegram_data['hash'] ?? '';
unset($telegram_data['hash']);
$data_check_string = '';
ksort($telegram_data);
foreach ($telegram_data as $key => $value) {
    $data_check_string .= "$key=$value\n";
}
$data_check_string = rtrim($data_check_string, "\n");
$secret_key = hash('sha256', TELEGRAM_BOT_TOKEN, true);
$hash = hash_hmac('sha256', $data_check_string, $secret_key);
if ($hash !== $check_hash) {
    error_log("telegram_auth.php - Invalid Telegram auth hash");
    http_response_code(400);
    echo json_encode(['error' => 'Invalid Telegram auth']);
    exit;
}

// Update user_details with Telegram username
$telegram_username = $telegram_data['username'] ?? null;
if ($telegram_username) {
    $stmt = $pdo_user->prepare('UPDATE user_details SET username = :username WHERE id = :id');
    $stmt->execute(['username' => $telegram_username, 'id' => $user_id]);
    echo json_encode(['success' => true, 'redirect' => '/portal.html']);
} else {
    error_log("telegram_auth.php - No Telegram username provided");
    http_response_code(400);
    echo json_encode(['error' => 'No Telegram username provided']);
}
?>