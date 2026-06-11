<?php
// db.php

$db_host = "50.6.160.248";
$db_user = "tcvkxete_admin";
$db_password = "Shinhwa1@@";

$db_database = "tcvkxete_userdb";
$message_db_database = "tcvkxete_message_tracking";
$discord_db_database = "tcvkxete_discord_members";

$DBS = [
    "userdb" => [
        "host" => $db_host,
        "user" => $db_user,
        "password" => $db_password,
        "database" => $db_database,
    ],
    "messagedb" => [
        "host" => $db_host,
        "user" => $db_user,
        "password" => $db_password,
        "database" => $message_db_database,
    ],
    "discorddb" => [
        "host" => $db_host,
        "user" => $db_user,
        "password" => $db_password,
        "database" => $discord_db_database,
    ]
];

function pdo_connect($key) {
    global $DBS;
    if (!isset($DBS[$key])) {
        throw new Exception("Unknown DB key: " . $key);
    }
    $cfg = $DBS[$key];
    return new PDO(
        "mysql:host={$cfg['host']};dbname={$cfg['database']};charset=utf8mb4",
        $cfg['user'],
        $cfg['password'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
}

function json_out($arr, $code = 200) {
    http_response_code($code);
    header("Content-Type: application/json");
    echo json_encode($arr);
    exit;
}
