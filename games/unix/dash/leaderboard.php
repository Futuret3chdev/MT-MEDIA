<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

$db_host = '50.6.160.248';
$db_user = 'tcvkxete_admin';
$db_password = 'Shinhwa1@@';
$db_database = 'tcvkxete_userdb';

$bot_token = '7899518581:AAGWGghZCOSN_Dyoi-7GDNAJYQBvPvR5ozk';

$conn = new mysqli($db_host, $db_user, $db_password, $db_database);
if ($conn->connect_error) {
    http_response_code(500);
    error_log('Database connection failed: ' . $conn->connect_error);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

function verifyTelegramLogin($data, $bot_token) {
    $check_hash = $data['hash'] ?? '';
    unset($data['hash']);
    $data_check_arr = [];
    foreach ($data as $key => $value) {
        if ($value !== '') {
            $data_check_arr[] = $key . '=' . $value;
        }
    }
    sort($data_check_arr);
    $data_check_string = implode("\n", $data_check_arr);
    $secret_key = hash('sha256', $bot_token, true);
    $hash = hash_hmac('sha256', $data_check_string, $secret_key);
    $is_valid = $hash === $check_hash && isset($data['auth_date']) && (time() - $data['auth_date']) < 86400;
    error_log('Telegram login verification: valid=' . ($is_valid ? 'true' : 'false') . ', data=' . json_encode($data) . ', check_hash=' . $check_hash . ', computed_hash=' . $hash . ', data_check_string=' . $data_check_string);
    return $is_valid;
}

$method = $_SERVER['REQUEST_METHOD'];

if (isset($_GET['auth']) && $_GET['auth'] === 'telegram') {
    $telegram_data = [
        'id' => $_GET['id'] ?? '',
        'first_name' => $_GET['first_name'] ?? '',
        'username' => $_GET['username'] ?? '',
        'auth_date' => $_GET['auth_date'] ?? '',
        'hash' => $_GET['hash'] ?? ''
    ];
    error_log('Telegram auth attempt: ' . json_encode($telegram_data));
    if (verifyTelegramLogin($telegram_data, $bot_token)) {
        $user_data = json_encode([
            'id' => $telegram_data['id'],
            'username' => $telegram_data['username'],
            'first_name' => $telegram_data['first_name']
        ]);
        echo "<script>window.opener.onTelegramAuth($user_data); window.close();</script>";
    } else {
        http_response_code(401);
        error_log('Invalid Telegram login: ' . json_encode($telegram_data));
        echo json_encode(['error' => 'Invalid Telegram login']);
    }
    exit;
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $player_name = isset($data['player_name']) ? trim($data['player_name']) : 'Anonymous';
    $score = isset($data['score']) ? (int)$data['score'] : 0;

    error_log('Received POST data: player_name=' . $player_name . ', score=' . $score);

    if (empty($player_name) || $score < 0 || $score > 1000000 || !preg_match('/^[a-zA-Z0-9_@ -]+$/', $player_name)) {
        http_response_code(400);
        error_log('Invalid leaderboard data: player_name=' . $player_name . ', score=' . $score);
        echo json_encode(['error' => 'Invalid data']);
        exit;
    }

    $player_name = $conn->real_escape_string($player_name);

    $stmt = $conn->prepare("INSERT INTO leaderboard (player_name, score) VALUES (?, ?)");
    if (!$stmt) {
        http_response_code(500);
        error_log('Prepare failed: ' . $conn->error);
        echo json_encode(['error' => 'Failed to prepare statement']);
        exit;
    }
    $stmt->bind_param("si", $player_name, $score);
    if ($stmt->execute()) {
        error_log('Score saved: player_name=' . $player_name . ', score=' . $score);
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        error_log('Execute failed: ' . $stmt->error);
        echo json_encode(['error' => 'Failed to save score']);
    }
    $stmt->close();
} elseif ($method === 'GET') {
    $result = $conn->query("SELECT player_name, score FROM leaderboard ORDER BY score DESC LIMIT 5");
    if ($result === false) {
        http_response_code(500);
        error_log('Query failed: ' . $conn->error);
        echo json_encode(['error' => 'Failed to fetch scores']);
        exit;
    }
    $scores = [];
    while ($row = $result->fetch_assoc()) {
        $scores[] = $row;
    }
    error_log('Fetched leaderboard: ' . json_encode($scores));
    echo json_encode($scores);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

$conn->close();
?>