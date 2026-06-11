<?php
header('Content-Type: application/json; charset=UTF-8');

// Generate a test value
$testValue = bin2hex(random_bytes(8));

// Try to set a cookie
$cookieSet = setcookie('cookie_test', $testValue, [
    'expires' => time() + 3600, // 1 hour
    'path' => '/',
    'domain' => '.memetorrent.futuret3ch.com.au',
    'secure' => true,   // must be HTTPS
    'httponly' => false, // let JS read it for debugging
    'samesite' => 'Lax'
]);

// Collect cookie values from browser request
$existing = $_COOKIE['cookie_test'] ?? null;

echo json_encode([
    "cookieSet" => $cookieSet,
    "newValue"  => $testValue,
    "existingCookie" => $existing,
    "allCookies" => $_COOKIE
], JSON_PRETTY_PRINT);
