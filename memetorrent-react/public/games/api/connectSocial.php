<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://memetorrent.futuret3ch.com.au');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type, Accept');

// Toggle debug mode
$debug = true;

// Log helper
function log_debug($msg) {
    global $debug;
    if ($debug) error_log("[connectSocial] " . $msg . " at " . date('Y-m-d H:i:s'));
}

// Database credentials
$admin_username = 'tcvkxete_admin';
$admin_password = 'Shinhwa1@@';

// Validate input
$platform = $_GET['platform'] ?? '';
$code = $_GET['code'] ?? '';

if ($platform !== 'discord' || empty($code)) {
    log_debug("Invalid platform or missing code: platform=$platform, code=$code");
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request', 'details' => "platform=$platform, code=$code"]);
    exit;
}

// Discord credentials
$client_id = '1380444668562505789';
$client_secret = 'Pl_jTJEmumMAtPknE19iYEkApjS_9Wnh';
$redirect_uri = 'https://memetorrent.futuret3ch.com.au/games/api/discord-callback.php';

// Step 1: Exchange code for token
$token_url = 'https://discord.com/api/oauth2/token';
$data = [
    'client_id' => $client_id,
    'client_secret' => $client_secret,
    'grant_type' => 'authorization_code',
    'code' => $code,
    'redirect_uri' => $redirect_uri,
    'scope' => 'identify email'
];

log_debug("Token request data: " . http_build_query($data));

$ch = curl_init($token_url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 15);
curl_setopt($ch, CURLOPT_VERBOSE, true);
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_error = curl_error($ch);
curl_close($ch);

log_debug("Token exchange HTTP $http_code, Error: $curl_error, Response: " . ($response ?: 'null'));

if ($curl_error) {
    http_response_code(502);
    echo json_encode(['error' => 'cURL error during token exchange', 'details' => $curl_error]);
    exit;
}

if ($http_code !== 200) {
    http_response_code(502);
    echo json_encode(['error' => 'Discord token exchange failed', 'http_code' => $http_code, 'response' => $response]);
    exit;
}

$token_data = json_decode($response, true);
$access_token = $token_data['access_token'] ?? null;

if (!$access_token) {
    log_debug("Missing access token, Token data: " . json_encode($token_data));
    http_response_code(500);
    echo json_encode(['error' => 'Access token missing', 'token_data' => $token_data]);
    exit;
}

// Step 2: Fetch user info
$user_url = 'https://discord.com/api/users/@me';
$ch = curl_init($user_url);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $access_token]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 15);
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_error = curl_error($ch);
curl_close($ch);

log_debug("User info HTTP $http_code, Error: $curl_error, Response: " . ($response ?: 'null'));

if ($curl_error) {
    http_response_code(502);
    echo json_encode(['error' => 'cURL error fetching user info', 'details' => $curl_error]);
    exit;
}

if ($http_code !== 200) {
    http_response_code(502);
    echo json_encode(['error' => 'Failed to fetch Discord user info', 'http_code' => $http_code, 'response' => $response]);
    exit;
}

$user_data = json_decode($response, true);
$discord_id = $user_data['id'] ?? '';
$username = $user_data['username'] ?? '';
$discriminator = $user_data['discriminator'] ?? '';
$email = $user_data['email'] ?? null;

if (!$discord_id) {
    log_debug("Missing Discord user ID, User data: " . json_encode($user_data));
    http_response_code(500);
    echo json_encode(['error' => 'Discord user ID missing', 'user_data' => $user_data]);
    exit;
}

log_debug("Discord user: $username#$discriminator ($discord_id), email: " . ($email ?: 'not provided'));

// Database connections
$discord_db = new PDO("mysql:host=50.6.160.248;dbname=tcvkxete_discord_members", $admin_username, $admin_password);
$discord_db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$user_db = new PDO("mysql:host=50.6.160.248;dbname=tcvkxete_userdb", $admin_username, $admin_password);
$user_db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$reward_db = new PDO("mysql:host=50.6.160.248;dbname=tcvkxete_message_tracking", $admin_username, $admin_password);
$reward_db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Fetch wallet_address from discord_users first
$walletStmt = $discord_db->prepare("SELECT wallet_address FROM discord_users WHERE discord_id = :discord_id LIMIT 1");
$walletStmt->execute(['discord_id' => $discord_id]);
$wallet_from_discord = $walletStmt->fetchColumn();

$wallet_address = $wallet_from_discord ?: 'Not set';
if (!$wallet_from_discord) {
    // If not in discord_users, find user_id from user_rewards using discord_id
    $rewardStmt = $reward_db->prepare("SELECT user_id FROM user_rewards WHERE discord_id = :discord_id LIMIT 1");
    $rewardStmt->execute(['discord_id' => $discord_id]);
    $user_id = $rewardStmt->fetchColumn();
    if ($user_id) {
        // Fetch wallet_address from user_details using id
        $userDetailStmt = $user_db->prepare("SELECT wallet_address FROM user_details WHERE id = :id LIMIT 1");
        $userDetailStmt->execute(['id' => $user_id]);
        $wallet_from_user = $userDetailStmt->fetchColumn();
        if ($wallet_from_user) {
            $wallet_address = $wallet_from_user;
            log_debug("Wallet address fetched from user_details: $wallet_address for id $user_id (discord_id $discord_id)");
        }
    }
}

try {
    // Only update existing users
    $session_token = bin2hex(random_bytes(16));
    $password_hash = null;
    $existingUser = false;

    // Check if session_token exists and is valid
    $session_token_cookie = $_COOKIE['session_token'] ?? '';
    if ($session_token_cookie) {
        $sessionCheckStmt = $user_db->prepare("SELECT id FROM portal_users WHERE session_token = :session_token");
        $sessionCheckStmt->execute(['session_token' => $session_token_cookie]);
        $existingId = $sessionCheckStmt->fetchColumn();
        if ($existingId) {
            $existingUser = true;
            log_debug("Valid session_token found for id $existingId");
        }
    }

    // If no valid session_token, check email
    if (!$existingUser && $email) {
        $emailCheckStmt = $user_db->prepare("SELECT id FROM portal_users WHERE email = :email");
        $emailCheckStmt->execute(['email' => $email]);
        $existingId = $emailCheckStmt->fetchColumn();
        if ($existingId) {
            $existingUser = true;
            log_debug("Valid email found for id $existingId");
        }
    }

    if ($existingUser && $existingId) {
    $stmt = $user_db->prepare("UPDATE portal_users 
        SET discord_id = :discord_id, 
            wallet_address = :wallet_address, 
            session_token = :session_token, 
            last_login = NOW() 
        WHERE id = :id");
    $stmt->execute([
        'id' => $existingId,
        'discord_id' => $discord_id,
        'wallet_address' => $wallet_address,
        'session_token' => $session_token
    ]);
    log_debug("Updated existing user in portal_users: $existingId, discord_id: $discord_id, wallet_address: $wallet_address");

    // ✅ Store in PHP session
    $_SESSION['user_id'] = $existingId;
    $_SESSION['discord_id'] = $discord_id;
    $_SESSION['email'] = $email;
    $_SESSION['portal_username'] = $username;
} else {
    log_debug("No valid session_token or email found, update denied for discord_id $discord_id");
    http_response_code(403);
    echo json_encode([
        'error' => 'Forbidden',
        'details' => 'Only existing users with valid session_token or email can be updated'
    ]);
    exit;
}


    // Set cookie with secure attributes
    $cookieOptions = [
        'expires' => time() + 3600,
        'path' => '/',
        'domain' => 'memetorrent.futuret3ch.com.au',
        'secure' => false, // Temporarily disable
        'httponly' => false, // Temporarily disable
        'samesite' => 'Lax'
    ];
    $cookieSuccess = setcookie('session_token', $session_token, $cookieOptions);
    if ($cookieSuccess) {
        log_debug("Session token cookie set successfully for token: $session_token");
    } else {
        log_debug("Failed to set session token cookie for token: $session_token with options: " . json_encode($cookieOptions));
    }

    // Force cookie verification
    if (!isset($_COOKIE['session_token']) || $_COOKIE['session_token'] !== $session_token) {
        log_debug("Cookie not set or mismatched, forcing set: current cookies: " . json_encode($_COOKIE));
        setcookie('session_token', $session_token, $cookieOptions);
        if (isset($_COOKIE['session_token']) && $_COOKIE['session_token'] === $session_token) {
            log_debug("Forced cookie set successful: " . $_COOKIE['session_token']);
        } else {
            log_debug("Forced cookie set failed, current cookies: " . json_encode($_COOKIE));
        }
    } else {
        log_debug("Cookie verified in current session: " . $_COOKIE['session_token']);
    }
} catch (PDOException $e) {
    log_debug("Database error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error', 'details' => $e->getMessage()]);
    exit;
}

// Step 4: Redirect to correct URL
header("Location: https://memetorrent.futuret3ch.com.au/games/portal.html?session_token=$session_token");
exit;
?>