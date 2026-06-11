<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://memetorrent.futuret3ch.com.au');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

try {
    $pdo = new PDO('mysql:host=50.6.160.248;dbname=tcvkxete_userdb', 'tcvkxete_admin', 'Shinhwa1@@');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    file_put_contents('php://stderr', "Cookies: " . print_r($_COOKIE, true) . "\n");
    file_put_contents('php://stderr', "Input Data: " . file_get_contents('php://input') . "\n");

    $token = $_COOKIE['portalToken'] ?? null;
    if (!$token) {
        http_response_code(401);
        $error = ['error' => 'Not logged in'];
        file_put_contents('php://stderr', "No portalToken in cookies\n");
        echo json_encode($error);
        exit;
    }

    $stmt = $pdo->prepare('SELECT id FROM portal_users WHERE session_token = ?');
    $stmt->execute([$token]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) {
        http_response_code(401);
        $error = ['error' => 'Invalid or expired token'];
        file_put_contents('php://stderr', "No user found for token: $token\n");
        echo json_encode($error);
        exit;
    }

    $user_id = $user['id'];
    $data = json_decode(file_get_contents('php://input'), true);
    $wallet_address = $data['wallet_address'] ?? null;

    if ($wallet_address && preg_match('/^[1-9A-HJ-NP-Za-km-z]{32,44}$/', $wallet_address)) {
        $stmt = $pdo->prepare('UPDATE user_details SET wallet_address = ? WHERE id = ?');
        $stmt->execute([$wallet_address, $user_id]);
        echo json_encode(['success' => true]);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid wallet address']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    $error = ['error' => 'Database error: ' . $e->getMessage()];
    file_put_contents('php://stderr', "DB Error: " . $e->getMessage() . "\n");
    echo json_encode($error);
} catch (Exception $e) {
    http_response_code(500);
    $error = ['error' => 'Server error: ' . $e->getMessage()];
    file_put_contents('php://stderr', "Server Error: " . $e->getMessage() . "\n");
    echo json_encode($error);
}
?>