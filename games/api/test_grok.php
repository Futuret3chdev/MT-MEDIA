<?php
header('Content-Type: application/json');

$XAI_API_KEY = "xai-FAmZhIPeJTCQH3VaXFS9rjGdHjePEJRxgsP91OY1PbyU1n72zQ0t7t1KClpAmY1lS6eJREp1WVfjCGH8";

$payload = [
    "model"  => "grok-2-image-1212",
    "prompt" => "A futuristic neon cyberpunk avatar with glowing eyes",
    "n"      => 1,
    "size"   => "512x512"
];

$ch = curl_init("https://api.x.ai/v1/images/generations");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer {$XAI_API_KEY}",
    "Content-Type: application/json"
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
$response  = curl_exec($ch);
$httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

echo json_encode([
    "http_code"  => $httpCode,
    "curl_error" => $curlError,
    "raw"        => $response
], JSON_PRETTY_PRINT);
