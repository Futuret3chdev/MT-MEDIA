<?php
require_once "db.php";

session_start();

// Clear session data
$_SESSION = [];
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 3600,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// Clear session_token cookie
if (isset($_COOKIE['session_token'])) {
    setcookie("session_token", "", time() - 3600, "/", "memetorrent.futuret3ch.com.au", true, true);
    unset($_COOKIE['session_token']);
}

// Destroy session
session_destroy();

// Ensure JSON response
header("Content-Type: application/json");
echo json_encode(["success" => true, "message" => "Logged out"]);
exit;