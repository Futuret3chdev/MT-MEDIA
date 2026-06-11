<?php
require_once __DIR__ . "/../db.php";
session_start();
header('Content-Type: application/json');

// --- Validate session ---
$session_token = $_COOKIE['session_token'] ?? ($_GET['session_token'] ?? null);
if (!$session_token) {
	http_response_code(401);
    echo json_encode(["success" => false, "error" => "No session token"]);
    exit;
}

try {
    $pdo = pdo_connect("userdb");

    // Find the logged-in user
    $stmt = $pdo->prepare("SELECT id FROM portal_users WHERE session_token = ?");
    $stmt->execute([$session_token]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
		http_response_code(401);
        echo json_encode(["success" => false, "error" => "Invalid session"]);
        exit;
    }

    $userId = $user['id'];
    $uploadDir = __DIR__ . "/../../uploads/avatars/";
    $publicDir = "https://memetorrent.futuret3ch.com.au/games/uploads/avatars/";
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0775, true);

    // --- Case 1: File Upload ---
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && (!empty($_FILES['avatar']) || !empty($_FILES['avatar_file']))) {
        $fileKey = !empty($_FILES['avatar']) ? 'avatar' : 'avatar_file';
        $fileTmp = $_FILES[$fileKey]['tmp_name'];
        $ext     = strtolower(pathinfo($_FILES[$fileKey]['name'], PATHINFO_EXTENSION) ?: 'png');
        $fileName = uniqid("avt_") . "." . $ext;
        $target   = $uploadDir . $fileName;

        if (move_uploaded_file($fileTmp, $target)) {
            $avatarUrl = $publicDir . $fileName;

            $stmt = $pdo->prepare("UPDATE portal_users SET avatar_url = ? WHERE id = ?");
            $stmt->execute([$avatarUrl, $userId]);

            echo json_encode(["success" => true, "avatar_url" => $avatarUrl]);
        } else {
            echo json_encode(["success" => false, "error" => "Upload failed"]);
        }
        exit;
    }

    // --- Case 2: Save via URL ---
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty($_POST['avatar_url'])) {
        $avatarUrl = trim($_POST['avatar_url']);

        $stmt = $pdo->prepare("UPDATE portal_users SET avatar_url = ? WHERE id = ?");
        $stmt->execute([$avatarUrl, $userId]);

        echo json_encode(["success" => true, "avatar_url" => $avatarUrl]);
        exit;
    }

    // --- Case 3: Fetch current avatar ---
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = $pdo->prepare("SELECT avatar_url FROM portal_users WHERE id = ?");
        $stmt->execute([$userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            "success" => true,
            "avatar_url" => $row['avatar_url'] ?? null
        ]);
        exit;
    }

    // --- Fallback ---
    echo json_encode(["success" => false, "error" => "Unsupported request"]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
    exit;
}
