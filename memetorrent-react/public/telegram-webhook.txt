<?php
session_start();

$input = file_get_contents('php://input');
$update = json_decode($input, true);
$chatId = $update['message']['chat']['id'];
$text = $update['message']['text'];

if (preg_match('/^public_key: (.+)$/', $text, $matches)) {
    $publicKey = $matches[1];
    // Verify Telegram user matches session (optional security)
    if (isset($_SESSION['user']) && $_SESSION['user']['id'] == $chatId) {
        header("Location: https://memetorrent.futuret3ch.com.au/portal.php?wallet=$publicKey");
        exit;
    }
}

// Respond to Telegram to confirm receipt
$botToken = '7899518581:AAGWGghZCOSN_Dyoi-7GDNAJYQBvPvR5ozk';
file_get_contents("https://api.telegram.org/bot$botToken/sendMessage?chat_id=$chatId&text=Received your message. If you sent a public key, it should be linked now.");
?>