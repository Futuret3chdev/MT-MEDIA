<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');
$db_host = '50.6.160.248';
$db_user = 'tcvkxete_admin';
$db_password = 'Shinhwa1@@';
$db_database = 'tcvkxete_message_tracking';
try {
    $conn = new mysqli($db_host, $db_user, $db_password, $db_database);
    if ($conn->connect_error) {
        throw new Exception('Database connection failed: ' . $conn->connect_error);
    }
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $player = $data['player'] ?? '';
        $score = isset($data['score']) ? (int)$data['score'] : 0;
        $game_mode = $data['game_mode'] ?? 'Pac-Man';
        $play_mode = $data['play_mode'] ?? 'PLAY'; // Default to PLAY
        if (empty($player) || $score <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid data']);
            exit;
        }
        // Accept TURBO explicitly, preserve the sent value if valid
        $play_mode = strtoupper(trim($play_mode)); // Normalize to uppercase and trim
        if (!in_array($play_mode, ['PLAY', 'TURBO'])) {
            $play_mode = 'PLAY'; // Default to PLAY only if not PLAY or TURBO
        }
        $stmt = $conn->prepare('INSERT INTO pacman (player, score, game_mode, play_mode) VALUES (?, ?, ?, ?)');
        $stmt->bind_param('siss', $player, $score, $game_mode, $play_mode);
        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode(['message' => 'Score saved', 'saved_play_mode' => $play_mode]); // Log saved play mode
        } else {
            throw new Exception('Error saving score');
        }
        $stmt->close();
    } elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $game_mode = $_GET['game_mode'] ?? '';
        $play_mode = $_GET['play_mode'] ?? '';
        $query = 'SELECT player, score, game_mode, play_mode FROM pacman WHERE 1=1';
        $params = [];
        if ($game_mode) {
            $query .= ' AND game_mode = ?';
            $params[] = $game_mode;
        }
        if ($play_mode) {
            $query .= ' AND play_mode = ?';
            $params[] = $play_mode;
        }
        $query .= ' ORDER BY score DESC LIMIT 10';
        $stmt = $conn->prepare($query);
        if (!empty($params)) {
            $types = str_repeat('s', count($params));
            $stmt->bind_param($types, ...$params);
        }
        $stmt->execute();
        $result = $stmt->get_result();
        $scores = [];
        while ($row = $result->fetch_assoc()) {
            $scores[] = $row;
            error_log("Fetched row: " . json_encode($row)); // Debug log to server
        }
        echo json_encode($scores);
        $stmt->close();
    }
    $conn->close();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}