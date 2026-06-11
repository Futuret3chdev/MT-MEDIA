<?php
// config.php contains sensitive credentials
require_once 'config.php';

// Set headers for CORS and JSON response
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

// Database connection
try {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        throw new Exception('Database connection failed: ' . $conn->connect_error);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
    exit;
}

// Handle requests
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    // Save a new score
    $data = json_decode(file_get_contents('php://input'), true);
    $player_name = isset($data['player_name']) ? trim($data['player_name']) : '';
    $score = isset($data['score']) ? intval($data['score']) : 0;

    // Validate input
    if (empty($player_name) || $score <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid player name or score']);
        exit;
    }

    // Sanitize player name
    $player_name = $conn->real_escape_string(substr($player_name, 0, 20));

    // Insert score
    $stmt = $conn->prepare('INSERT INTO leaderboard (player_name, score) VALUES (?, ?)');
    $stmt->bind_param('si', $player_name, $score);

    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save score']);
    }
    $stmt->close();
} elseif ($method === 'GET') {
    // Retrieve top 10 scores
    $query = 'SELECT player_name, score, timestamp FROM leaderboard ORDER BY score DESC, timestamp ASC LIMIT 10';
    $result = $conn->query($query);

    $scores = [];
    while ($row = $result->fetch_assoc()) {
        $scores[] = [
            'player_name' => $row['player_name'],
            'score' => (int)$row['score'],
            'timestamp' => $row['timestamp']
        ];
    }

    echo json_encode($scores);
    $result->free();
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

$conn->close();
?>