<?php
session_start();
header('Content-Type: application/json');
$code = $_GET['code'] ?? '';
if ($code) {
    header("Location: https://memetorrent.futuret3ch.com.au/games/api/connectSocial.php?platform=discord&code=$code");
} else {
    error_log("discord-callback.php - No OAuth code received");
    http_response_code(400);
    echo json_encode(['error' => 'OAuth failed: No code received']);
}
?>