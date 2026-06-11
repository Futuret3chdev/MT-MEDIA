<?php
session_start();
header("Content-Type: application/json");

if (!isset($_SESSION["user_id"])) {
    echo json_encode(["success" => false, "error" => "Not logged in"]);
    exit;
}
$friend_id = intval($_POST["friend_id"] ?? 0);

echo json_encode(["success" => true, "message" => "Messaging feature coming soon"]);
