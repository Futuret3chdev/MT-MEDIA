<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Enable error reporting for debugging
ini_set('display_errors', 0); // Set to 0 in production
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);
file_put_contents('debug.log', "Request received: " . file_get_contents('php://input') . "\n", FILE_APPEND);

try {
    // Database connection
    $host = '50.6.160.248'; // Try 'localhost' or check HostGator cPanel for correct host
    $dbname = 'tcvkxete_userdb';
    $username = 'tcvkxete_admin';
    $password = 'Shinhwa1@@';
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    file_put_contents('debug.log', "Database connected\n", FILE_APPEND);

    // Get request data
    $data = json_decode(file_get_contents('php://input'), true);
    $username = filter_var($data['username'] ?? '', FILTER_SANITIZE_STRING);
    $email = filter_var($data['email'] ?? '', FILTER_SANITIZE_EMAIL);
    $password = $data['password'] ?? '';

    // Validate inputs
    if (empty($username) || empty($email) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Username, email, and password are required']);
        exit;
    }

    if (strlen($username) < 3) {
        echo json_encode(['success' => false, 'message' => 'Username must be at least 3 characters']);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Invalid email format']);
        exit;
    }

    if (strlen($password) < 6) {
        echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters']);
        exit;
    }

    // Check if email already exists
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM portal_users WHERE email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetchColumn() > 0) {
        echo json_encode(['success' => false, 'message' => 'Email already registered']);
        exit;
    }

    // Hash password and insert user
    $passwordHash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare('INSERT INTO portal_users (username, email, password_hash, created_at, is_admin) VALUES (?, ?, ?, NOW(), 0)');
    $stmt->execute([$username, $email, $passwordHash]);
    file_put_contents('debug.log', "User inserted: $username, $email\n", FILE_APPEND);

    echo json_encode(['success' => true, 'message' => 'Registration successful']);
} catch (PDOException $e) {
    file_put_contents('debug.log', "PDO Error: " . $e->getMessage() . "\n", FILE_APPEND);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    file_put_contents('debug.log', "General Error: " . $e->getMessage() . "\n", FILE_APPEND);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>