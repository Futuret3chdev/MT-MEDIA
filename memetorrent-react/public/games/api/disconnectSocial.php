<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://memetorrent.futuret3ch.com.au');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Accept');

try {
    $pdo_user = new PDO('mysql:host=50.6.160.248;dbname=tcvkxete_userdb', 'tcvkxete_admin', 'Shinhwa1@@');
    $pdo_user->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $session_token = $_COOKIE['session_token'] ?? '';
    if (!$session_token) {
		http_response_code(401);
        throw new Exception('No session token', 401);
    }

    $stmt = $pdo_user->prepare("SELECT id FROM portal_users WHERE session_token = :session_token");
    $stmt->execute(['session_token' => $session_token]);
    $user_id = $stmt->fetchColumn();

    if (!$user_id) {
        throw new Exception('Invalid session token', 401);
    }

    // Clear session token in database
    $stmt = $pdo_user->prepare("UPDATE portal_users SET session_token = NULL WHERE id = :id");
    $stmt->execute(['id' => $user_id]);

    // Clear cookies
    setcookie('session_token', '', time() - 3600, '/', 'memetorrent.futuret3ch.com.au', true, true);
    setcookie('portalToken', '', time() - 3600, '/', '.memetorrent.futuret3ch.com.au', true, true);

    echo json_encode(['success' => true, 'message' => 'Disconnected successfully']);
} catch (Exception $e) {
    $code = $e->getCode() ?: 500;
    http_response_code($code);
    error_log("disconnectSocial.php - Exception: " . $e->getMessage());
    echo json_encode(['error' => $e->getMessage(), 'code' => $code]);
}
?>