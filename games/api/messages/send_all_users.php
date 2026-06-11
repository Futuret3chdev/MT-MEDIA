<?php
session_start();
require_once '../config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    error_log("send_all_users.php: Not authenticated, session user_id missing");
    echo json_encode(['success' => false, 'error' => 'Not logged in'], JSON_UNESCAPED_UNICODE);
    http_response_code(403);
    exit;
}

$userId = $_SESSION['user_id'];
$content_b64 = $_POST['content_b64'] ?? null;

if (!$content_b64) {
    error_log("send_all_users.php: Missing content_b64");
    echo json_encode(['success' => false, 'error' => 'Missing content'], JSON_UNESCAPED_UNICODE);
    http_response_code(400);
    exit;
}

try {
    $content = base64_decode($content_b64, true);
    if ($content === false) {
        error_log("send_all_users.php: Invalid base64 content: $content_b64");
        echo json_encode(['success' => false, 'error' => 'Invalid base64 content'], JSON_UNESCAPED_UNICODE);
        http_response_code(400);
        exit;
    }
    $content = mb_convert_encoding($content, 'UTF-8', 'auto');
} catch (Exception $e) {
    error_log("send_all_users.php: Base64 decode error: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Base64 decode error'], JSON_UNESCAPED_UNICODE);
    http_response_code(400);
    exit;
}

$upload_dir = __DIR__ . '/uploads/';
if (!is_dir($upload_dir)) {
    if (!mkdir($upload_dir, 0755, true)) {
        error_log("send_all_users.php: Failed to create upload directory: $upload_dir");
        echo json_encode(['success' => false, 'error' => 'Failed to create upload directory'], JSON_UNESCAPED_UNICODE);
        http_response_code(500);
        exit;
    }
}

$attachments = [];
if (!empty($_FILES['files']['name'][0])) {
    $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    $max_size = 10 * 1024 * 1024; // 10MB
    $max_files = 5;

    if (count($_FILES['files']['name']) > $max_files) {
        error_log("send_all_users.php: Too many files, max allowed: $max_files");
        echo json_encode(['success' => false, 'error' => 'Maximum 5 files allowed'], JSON_UNESCAPED_UNICODE);
        http_response_code(400);
        exit;
    }

    for ($i = 0; $i < count($_FILES['files']['name']); $i++) {
        $file_name = $_FILES['files']['name'][$i];
        $file_tmp = $_FILES['files']['tmp_name'][$i];
        $file_size = $_FILES['files']['size'][$i];
        $file_type = $_FILES['files']['type'][$i];

        if ($file_size > $max_size) {
            error_log("send_all_users.php: File $file_name exceeds 10MB limit");
            echo json_encode(['success' => false, 'error' => "File $file_name exceeds 10MB limit"], JSON_UNESCAPED_UNICODE);
            http_response_code(400);
            exit;
        }

        if (!in_array($file_type, $allowed_types)) {
            error_log("send_all_users.php: Invalid file type for $file_name: $file_type");
            echo json_encode(['success' => false, 'error' => "File $file_name has invalid type"], JSON_UNESCAPED_UNICODE);
            http_response_code(400);
            exit;
        }

        $new_file_name = uniqid() . '_' . basename($file_name);
        $file_path = $upload_dir . $new_file_name;

        if (!move_uploaded_file($file_tmp, $file_path)) {
            error_log("send_all_users.php: Failed to upload file: $file_name");
            echo json_encode(['success' => false, 'error' => "Failed to upload $file_name"], JSON_UNESCAPED_UNICODE);
            http_response_code(500);
            exit;
        }

        $attachments[] = [
            'name' => $file_name,
            'url' => "https://memetorrent.futuret3ch.com.au/games/api/messages/uploads/$new_file_name",
            'type' => $file_type
        ];
    }
}

try {
    $db = getDB();
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $db->prepare("SELECT is_admin FROM portal_users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user || !$user['is_admin']) {
        error_log("send_all_users.php: User $userId is not admin");
        echo json_encode(['success' => false, 'error' => 'Admin only'], JSON_UNESCAPED_UNICODE);
        http_response_code(403);
        exit;
    }

    $stmt = $db->prepare("
        INSERT INTO portal_messages (sender_id, receiver_id, content, attachments, created_at)
        SELECT ?, id, ?, ?, NOW()
        FROM portal_users
        WHERE id != ?
    ");
    $stmt->execute([$userId, $content, json_encode($attachments, JSON_UNESCAPED_UNICODE), $userId]);
    $sent = $stmt->rowCount();

    echo json_encode(['success' => true, 'sent_count' => $sent], JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    error_log("send_all_users.php: Database error: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Database error'], JSON_UNESCAPED_UNICODE);
    http_response_code(500);
    exit;
} catch (Exception $e) {
    error_log("send_all_users.php: Unexpected error: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Unexpected error'], JSON_UNESCAPED_UNICODE);
    http_response_code(500);
    exit;
}
?>