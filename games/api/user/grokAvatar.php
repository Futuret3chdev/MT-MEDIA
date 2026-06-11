<?php
require_once __DIR__ . "/../db.php";
header('Content-Type: application/json');

try {
    session_start();
    $session_token = $_COOKIE['session_token'] ?? ($_GET['session_token'] ?? null);

    if (!$session_token) {
        echo json_encode(["success" => false, "error" => "No session token"]);
        exit;
    }

    // ✅ DB lookup
    $pdo = pdo_connect("userdb");
    $stmt = $pdo->prepare("SELECT id FROM portal_users WHERE session_token = ?");
    $stmt->execute([$session_token]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode(["success" => false, "error" => "Invalid session"]);
        exit;
    }

    // ✅ Input
    $input = json_decode(file_get_contents("php://input"), true);
    $prompt = $input['prompt'] ?? null;
    if (!$prompt) {
        echo json_encode(["success" => false, "error" => "No prompt provided"]);
        exit;
    }

    // ✅ Call Grok API
    $XAI_API_KEY = "xai-FAmZhIPeJTCQH3VaXFS9rjGdHjePEJRxgsP91OY1PbyU1n72zQ0t7t1KClpAmY1lS6eJREp1WVfjCGH8";
    $payload = [
        "model"  => "grok-2-image-1212",
        "prompt" => $prompt,
        "n"      => 1
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

    if ($response === false) {
        echo json_encode(["success" => false, "error" => "Curl failed", "curl_error" => $curlError]);
        exit;
    }

    $data = json_decode($response, true);

    if (!isset($data['data'][0]['url'])) {
        echo json_encode(["success" => false, "error" => "API did not return image URL", "raw" => $data]);
        exit;
    }

    // ✅ Download image from Grok’s CDN
    $imageUrl = $data['data'][0]['url'];
    $imageData = @file_get_contents($imageUrl);
    if ($imageData === false) {
        echo json_encode(["success" => false, "error" => "Failed to download image", "url" => $imageUrl]);
        exit;
    }

    // ✅ Save into /games/uploads/avatars/ (not /games/api/uploads/)
    $uploadDir = dirname(__DIR__, 2) . "/uploads/avatars/"; 
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0775, true);

    $fileName = "grok_" . uniqid() . ".png";
    $filePath = $uploadDir . $fileName;
    file_put_contents($filePath, $imageData);

    $avatarUrl = "https://memetorrent.futuret3ch.com.au/games/uploads/avatars/" . $fileName;

    // ✅ Update DB
    $stmt = $pdo->prepare("UPDATE portal_users SET avatar_url = ? WHERE id = ?");
    $stmt->execute([$avatarUrl, $user['id']]);

    echo json_encode([
        "success"    => true,
        "avatar_url" => $avatarUrl
    ]);

} catch (Throwable $e) {
    echo json_encode([
        "success" => false,
        "error"   => $e->getMessage()
    ]);
}
