<?php
header("Content-Type: application/json");

$TOKEN = "7899518581:AAGWGghZCOSN_Dyoi-7GDNAJYQBvPvR5ozk";
$CHAT_ID = "-1002403282101"; // your Telegram group ID

$data = json_decode(file_get_contents("php://input"), true);
$img = $data["image"];

// Strip base64 header
$img = str_replace("data:image/png;base64,", "", $img);
$img = base64_decode($img);

$tmpFile = "graffiti_" . time() . ".png";
file_put_contents($tmpFile, $img);

$url = "https://api.telegram.org/bot$TOKEN/sendPhoto";

$post = [
  "chat_id" => $CHAT_ID,
  "photo" => new CURLFile($tmpFile)
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, $post);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);

unlink($tmpFile);

echo json_encode(["success" => true]);
?>
