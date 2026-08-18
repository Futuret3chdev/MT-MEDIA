<?php
session_start();
$code = $_GET['code'] ?? '';
$state = $_GET['state'] ?? '';
if ($code) {
    if (strpos($state, 'nm_') === 0) {
        $q = http_build_query(['code' => $code, 'state' => $state]);
        header("Location: https://memetorrent.futuret3ch.com.au/casino-floor/auth/callback.html?$q");
        exit;
    }
    header("Location: https://memetorrent.futuret3ch.com.au/games/api/connectSocial.php?platform=discord&code=" . urlencode($code));
    exit;
}
error_log("discord-callback.php - No OAuth code received");
http_response_code(400);
header('Content-Type: application/json');
echo json_encode(['error' => 'OAuth failed: No code received']);
