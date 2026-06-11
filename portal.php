<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
session_start();

// Fallback if no user session (for testing)
if (!isset($_SESSION['user'])) {
    $_SESSION['user'] = ['username' => 'testuser', 'photo_url' => 'default_avatar.png'];
}

// Get user details
$user = $_SESSION['user'];

// Handle avatar upload or selection
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['avatar_select']) && !empty($_POST['avatar_select'])) {
        $_SESSION['user']['gaming_avatar'] = $_POST['avatar_select'];
    } elseif (isset($_FILES['avatar_upload']) && $_FILES['avatar_upload']['error'] === UPLOAD_ERR_OK) {
        $upload_dir = 'uploads/avatars/';
        if (!file_exists($upload_dir)) {
            mkdir($upload_dir, 0777, true);
        }
        $file_name = $upload_dir . uniqid() . '-' . basename($_FILES['avatar_upload']['name']);
        if (move_uploaded_file($_FILES['avatar_upload']['tmp_name'], $file_name)) {
            $_SESSION['user']['gaming_avatar'] = $file_name;
        }
    }
}

// Default avatar if none is set
$default_avatar = "default_avatar.png";
$gaming_avatar = isset($_SESSION['user']['gaming_avatar']) ? $_SESSION['user']['gaming_avatar'] : null;

// Twitter API Configuration (Use secure storage in production)
$bearertoken = 'AAAAAAAAAAAAAAAAAAAAAI17zwEAAAAAb%2FDQXBG%2BoqE%2FgTkHJ6ppZtJ36Io%3DkklGXbgBjVdSpUoU7tdZaVfDbEWZI53yYDBkThqbdzJEruTpSx';
$access_token = '1875186134126559232-9PrCkN3LLWaVVxNtZHPznxlyJfiM7Z';
$secret_key = 'sc2kPvxHJjYxuPB3KlJr623foGUydlDJeDTr92TfRxBsP';

// Function to fetch tweets using X API v2 with Bearer Token for multiple usernames
function fetchTweets($usernames = ['memetorrent', 'futuret3chdev']) {
    global $bearertoken;

    $fallback_tweets = [
        'memetorrent' => [
            [
                'created_at' => '2025-03-16T11:06:00Z',
                'text' => 'Our latest update teases what’s ahead! Take a look and get excited for what’s coming! #PlayToEarn <a href="https://t.co/0REOnjkvjO">https://t.co/0REOnjkvjO</a>',
                'username' => 'memetorrent'
            ],
            [
                'created_at' => '2025-03-15T11:01:00Z',
                'text' => 'Where are the reply guys at? @memetorrent is giving away 200,000 $MT on this post! ✅ Leave a thoughtful reply and drop your $Sol CA❗️ 🚨 We’re looking for new holders!',
                'username' => 'memetorrent'
            ]
        ],
        'futuret3chdev' => [
            [
                'created_at' => '2025-03-17T23:00:00Z',
                'text' => 'Building the future of Web3 gaming, one line of code at a time. #Solana #NFTs',
                "username" => 'futuret3chdev'
            ],
            [
                'created_at' => '2025-03-16T04:30:00Z',
                'text' => 'Excited to collaborate with @memetorrent on some epic projects! Stay tuned! #Web3',
                'username' => 'futuret3chdev'
            ]
        ]
    ];

    $all_tweets = [];
    $ch = curl_init();

    foreach ($usernames as $username) {
        $tweets = $fallback_tweets[$username] ?? [];
        $user_endpoint = 'https://api.twitter.com/2/users/by/username/' . urlencode($username);
        curl_setopt($ch, CURLOPT_URL, $user_endpoint);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $bearertoken,
            'Content-Type: application/json'
        ]);

        $user_response = curl_exec($ch);
        if (curl_errno($ch)) {
            error_log('cURL Error for ' . $username . ': ' . curl_error($ch));
            $all_tweets = array_merge($all_tweets, $tweets);
            continue;
        }

        $user_data = json_decode($user_response, true);
        if (isset($user_data['data']['id'])) {
            $user_id = $user_data['data']['id'];
            $tweet_endpoint = "https://api.twitter.com/2/users/{$user_id}/tweets";
            curl_setopt($ch, CURLOPT_URL, $tweet_endpoint);
            curl_setopt($ch, CURLOPT_HTTPGET, 1);
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'GET');
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Authorization: Bearer ' . $bearertoken,
                'Content-Type: application/json'
            ]);

            $tweet_response = curl_exec($ch);
            if (curl_errno($ch)) {
                error_log('cURL Error for tweets of ' . $username . ': ' . curl_error($ch));
                $all_tweets = array_merge($all_tweets, $tweets);
                continue;
            }

            $tweet_data = json_decode($tweet_response, true);
            if (isset($tweet_data['data']) && is_array($tweet_data['data'])) {
                $tweets = array_map(function($tweet) use ($username) {
                    $created_at = $tweet['created_at'] ?? '1970-01-01T00:00:00Z';
                    $dateTime = new DateTime($created_at, new DateTimeZone('UTC'));
                    $dateTime->setTimezone(new DateTimeZone('Australia/Sydney'));
                    $date = $dateTime->format('M d, Y - H:i') . ' AEDT';
                    $text = $tweet['text'] ?? 'No text available';
                    if (isset($tweet['entities']['urls'])) {
                        foreach ($tweet['entities']['urls'] as $url) {
                            $text = str_replace($url['url'], '<a href="' . htmlspecialchars($url['expanded_url'] ?? $url['url']) . '">' . $url['url'] . '</a>', $text);
                        }
                    }
                    return [
                        'date' => $date,
                        'text' => $text,
                        'username' => $username
                    ];
                }, $tweet_data['data']);
            }
        }
        $all_tweets = array_merge($all_tweets, $tweets);
    }

    curl_close($ch);

    usort($all_tweets, function($a, $b) {
        $aDate = isset($a['date']) ? strtotime($a['date']) : 0;
        $bDate = isset($b['date']) ? strtotime($b['date']) : 0;
        return $bDate - $aDate;
    });

    return $all_tweets;
}

// Fetch tweets
$tweets = fetchTweets(['memetorrent', 'futuret3chdev']);
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Customer Portal</title>
    <script src="https://cdn.jsdelivr.net/npm/@solana/web3.js@1.31.0/lib/index.iife.min.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Orbitron', sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #e0e0e0;
            min-height: 100vh;
            padding: 10px;
            display: flex;
            flex-direction: column;
        }

        .navbar {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 10px;
            backdrop-filter: blur(10px);
            display: flex;
            flex-wrap: wrap;
            justify-content: space-around;
            margin-bottom: 20px;
            width: 100%;
        }

        .navbar a {
            color: #00ffea;
            text-decoration: none;
            font-size: clamp(12px, 2.5vw, 14px);
            text-transform: uppercase;
            letter-spacing: 2px;
            transition: color 0.3s ease;
            padding: 5px 10px;
            margin: 0 5px;
        }

        .navbar a:hover {
            color: #00c4ff;
        }

        .sidebar, .main-content {
            width: 100%;
            display: block;
        }

        .sidebar {
            display: flex;
            flex-direction: column;
            gap: 20px;
            width: 100%;
            padding: 0 10px;
        }

        .main-content {
            display: flex;
            flex-direction: column;
            gap: 30px;
            padding: 0 10px;
        }

        .portal-link, .social-container, .profile-container, 
        .wallet-container, .section-card, .logout-container, 
        .twitter-post-window {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: clamp(15px, 3vw, 25px);
            backdrop-filter: blur(10px);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            margin-bottom: 15px;
            display: block;
            position: relative;
            width: 100%;
            box-sizing: border-box;
        }

        .portal-link:hover, .social-container:hover, 
        .profile-container:hover, .wallet-container:hover, 
        .section-card:hover, .logout-container:hover, 
        .twitter-post-window:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
        }

        .portal-link {
            text-align: center;
        }

        .portal-link a {
            color: #00ffea;
            text-decoration: none;
            font-size: clamp(14px, 3vw, 18px);
            text-transform: uppercase;
            letter-spacing: 2px;
            transition: color 0.3s ease;
        }

        .portal-link a:hover {
            color: #00c4ff;
        }

        .social-icons {
            display: flex;
            justify-content: space-evenly;
            padding: 10px 0;
        }

        .social-icons a {
            color: #00ffea;
            font-size: clamp(14px, 4vw, 16px);
            transition: color 0.3s ease;
            padding: 10px;
        }

        .social-icons a:hover {
            color: #00c4ff;
        }

        .profile-container {
            text-align: center;
            min-height: 200px;
        }

        .profile-container img {
            border: 2px solid #00ffea;
            box-shadow: 0 0 10px #00ffea;
            width: clamp(60px, 20vw, 100px);
            height: auto;
            border-radius: 50%;
            margin-bottom: 10px;
        }

        .wallet-btn, .disconnect-btn, .minimize-btn, 
        .reopen-btn, .logout-btn {
            background: linear-gradient(90deg, #00ffea, #00c4ff);
            color: #1a1a2e;
            border: none;
            padding: clamp(8px, 2vw, 10px);
            border-radius: 5px;
            cursor: pointer;
            font-size: clamp(12px, 2.5vw, 14px);
            width: 100%;
            transition: background 0.3s ease;
            margin: 5px 0;
        }

        .wallet-btn:hover, .minimize-btn:hover, 
        .reopen-btn:hover, .logout-btn:hover {
            background: linear-gradient(90deg, #00c4ff, #00ffea);
        }

        .disconnect-btn {
            background: linear-gradient(90deg, #ff4d4d, #ff1a1a);
        }

        .disconnect-btn:hover {
            background: linear-gradient(90deg, #ff1a1a, #ff4d4d);
        }

        .minimize-btn, .reopen-btn {
            background: linear-gradient(90deg, #28ff85, #00c853);
        }

        .reopen-btn {
            display: none;
        }

        .logout-container {
            text-align: center;
        }

        .logout-btn {
            display: inline-block;
            text-decoration: none;
            text-align: center;
        }

        .wallet-info {
            font-size: clamp(12px, 2vw, 14px);
            margin-top: 10px;
            color: #e0e0e0;
            word-wrap: break-word;
            text-align: left;
            padding: 10px;
            white-space: normal;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 5px;
        }

        h3 {
            color: #00ffea;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 2px;
            font-size: clamp(14px, 3vw, 18px);
        }

        .twitter-post {
            margin-bottom: 15px;
            padding: 15px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 5px;
            word-wrap: break-word;
            max-width: 100%;
        }

        .twitter-post h4 {
            color: #00ffea;
            font-size: clamp(12px, 2.5vw, 14px);
            margin-bottom: 5px;
        }

        .twitter-post p {
            font-size: clamp(10px, 2vw, 12px);
            color: #e0e0e0;
            margin-bottom: 5px;
        }

        .twitter-post a {
            color: #00c4ff;
            text-decoration: none;
            font-size: clamp(10px, 2vw, 12px);
        }

        .twitter-post a:hover {
            text-decoration: underline;
        }

        .nft-grid, .game-grid, .game-scores, 
        .leaderboard, .transactions, .wallet-stats {
            display: grid;
            gap: 20px;
        }

        .nft-grid {
            grid-template-columns: repeat(auto-fill, minmax(clamp(150px, 30vw, 200px), 1fr));
        }

        .game-grid {
            grid-template-columns: repeat(auto-fill, minmax(clamp(150px, 40vw, 200px), 1fr));
            gap: 20px;
        }

        .game-card, .nft-card {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 15px;
            text-align: center;
            transition: transform 0.3s ease;
            min-height: 200px;
        }

        .game-card:hover, .nft-card:hover {
            transform: scale(1.05);
        }

        .game-card img, .nft-card img {
            width: 100%;
            max-width: 150px;
            max-height: 100px;
            border-radius: 5px;
            display: block;
            margin: 0 auto 15px;
        }

        .nft-card img {
            border: 2px solid #00ffea;
            box-shadow: 0 0 10px #00ffea;
            object-fit: cover; /* Ensure images fit nicely */
        }

        .nft-card p, .game-card p {
            margin-top: 10px;
            font-size: clamp(12px, 2vw, 14px);
        }

        .game-scores table, .leaderboard table, .transactions table {
            width: 100%;
            max-width: 100%;
            border-collapse: collapse;
            font-size: clamp(10px, 2vw, 12px);
            overflow-x: auto;
        }

        .game-scores table, .leaderboard table, .transactions table {
            display: block;
            overflow-x: auto;
            white-space: nowrap;
        }

        .game-scores th, .game-scores td,
        .leaderboard th, .leaderboard td,
        .transactions th, .transactions td {
            padding: clamp(5px, 1.5vw, 10px);
            text-align: left;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .game-scores th, .leaderboard th, .transactions th {
            color: #00ffea;
        }

        .wallet-stats {
            flex-direction: column;
            gap: 20px;
        }

        .stat-box {
            background: rgba(255, 255, 255, 0.1);
            padding: 15px;
            border-radius: 5px;
            text-align: center;
            min-height: 100px;
        }

        .username {
            color: #00ffea;
            font-weight: bold;
            font-size: clamp(14px, 3vw, 16px);
        }

        .mt-balance {
            color: #ff00ff;
            font-size: clamp(14px, 3vw, 16px);
            margin-top: 10px;
        }

        .future-wallet {
            color: #00ffea;
            font-style: italic;
            text-align: center;
            margin-top: 10px;
            font-size: clamp(12px, 2.5vw, 14px);
        }

        .avatar-section {
            margin-top: 15px;
        }

        .avatar-section select, .avatar-section input[type="file"] {
            width: 100%;
            padding: 8px;
            margin-top: 10px;
            border-radius: 5px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            background: rgba(255, 255, 255, 0.1);
            color: #e0e0e0;
            font-size: clamp(12px, 2.5vw, 14px);
        }

        .avatar-section select:focus, .avatar-section input[type="file"]:focus {
            outline: none;
            border-color: #00ffea;
        }

        .avatar-display {
            margin-top: 15px;
            text-align: center;
        }

        .avatar-display img {
            width: clamp(40px, 10vw, 50px);
            height: auto;
            border-radius: 50%;
            border: 2px solid #28ff85;
        }

        .games-avatar-wrapper {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        .twitter-post-window {
            max-height: 400px;
            overflow-y: auto;
        }

        @media (max-width: 768px) {
            body {
                padding: 5px;
            }

            .sidebar {
                width: 100%;
                padding: 0;
            }

            .main-content {
                padding: 0;
            }

            .portal-link, .social-container, .profile-container, 
            .wallet-container, .section-card, .logout-container, 
            .twitter-post-window {
                width: 100%;
                padding: 10px;
                margin-bottom: 10px;
            }

            .game-grid, .nft-grid {
                grid-template-columns: 1fr;
            }

            .twitter-post {
                margin-bottom: 10px;
                padding: 10px;
            }
        }

        @media (min-width: 768px) {
            body {
                display: grid;
                grid-template-columns: 250px 1fr;
                padding: 20px;
                gap: 30px;
            }

            .navbar {
                grid-column: 1 / 3;
            }

            .sidebar {
                width: 250px;
                max-width: 250px;
                position: sticky;
                top: 20px;
                align-self: flex-start;
                padding-right: 10px;
            }

            .main-content {
                width: auto;
                padding-left: 10px;
            }

            .game-grid {
                grid-template-columns: repeat(4, 1fr);
            }

            .nft-grid {
                grid-template-columns: repeat(3, 1fr); /* Force 3 columns on larger screens */
                gap: 30px;
            }

            .wallet-stats {
                flex-direction: row;
                justify-content: space-between;
            }

            .section-card {
                margin-bottom: 30px;
            }
        }

        @media (min-width: 1024px) {
            .sidebar {
                width: 300px;
                max-width: 300px;
            }

            .navbar a {
                font-size: 14px;
            }

            .social-icons a {
                font-size: 16px;
            }

            .game-grid {
                grid-template-columns: repeat(4, 1fr);
            }

            .nft-grid {
                grid-template-columns: repeat(3, 1fr);
                gap: 35px;
            }
        }
    </style>
</head>
<body>
    <div class="navbar">
        <a href="#about">About</a>
        <a href="#tokenomics">Tokenomics</a>
        <a href="#safety">Safety</a>
        <a href="#utility">Utility</a>
        <a href="#updates">Updates</a>
        <a href="#games">Games</a>
        <a href="#contact">Contact</a>
    </div>

    <div class="sidebar">
        <div class="portal-link">
            <a href="#">Portal</a>
        </div>

        <div class="social-container">
            <div class="social-icons">
                <a href="https://twitter.com" target="_blank"><i class="fab fa-twitter"></i></a>
                <a href="https://t.me" target="_blank"><i class="fab fa-telegram"></i></a>
                <a href="https://discord.com" target="_blank"><i class="fab fa-discord"></i></a>
            </div>
        </div>

        <div class="profile-container">
            <h3>Welcome</h3>
            <div class="profile">
                <img src="<?= htmlspecialchars($user['photo_url']) ?>" style="width: 100px; height: 100px; border-radius: 50%;" alt="Profile Picture">
                <p class="username">@<?= htmlspecialchars($user['username']) ?></p>
                <p class="mt-balance" id="mt-balance">Checking $MT Balance...</p>
            </div>
            <div class="avatar-section">
                <h3>Gaming Avatar</h3>
                <form method="POST" enctype="multipart/form-data">
                    <select name="avatar_select" onchange="this.form.submit()">
                        <option value="">Select an Avatar</option>
                        <option value="space_warrior.png" <?= $gaming_avatar === "space_warrior.png" ? "selected" : "" ?>>Space Warrior</option>
                        <option value="crypto_knight.png" <?= $gaming_avatar === "crypto_knight.png" ? "selected" : "" ?>>Crypto Knight</option>
                        <option value="pixel_ninja.png" <?= $gaming_avatar === "pixel_ninja.png" ? "selected" : "" ?>>Pixel Ninja</option>
                    </select>
                    <input type="file" name="avatar_upload" accept="image/*" onchange="this.form.submit()">
                </form>
            </div>
        </div>

        <div class="wallet-container" id="connect-wallet-box">
            <h3>Connect Wallet</h3>
            <button id="phantom-btn" class="wallet-btn" onclick="connectWallet('phantom')">Connect Phantom</button>
            <button id="solflare-btn" class="wallet-btn" onclick="connectWallet('solflare')">Connect Solflare</button>
        </div>

        <div class="reopen-container" id="reopen-buttons">
            <button id="phantom-reopen-btn" class="reopen-btn" onclick="reopenWallet('phantom')">Reopen Phantom</button>
            <button id="solflare-reopen-btn" class="reopen-btn" onclick="reopenWallet('solflare')">Reopen Solflare</button>
        </div>

        <div class="logout-container">
            <a href="logout.php" class="logout-btn">Logout</a>
        </div>
    </div>

    <div class="main-content" id="main-content">
        <div class="wallet-container" id="phantom-wallet-box" style="display: none;">
            <h3>Phantom Wallet</h3>
            <p id="phantom-wallet-address" class="wallet-info">Not Connected</p>
            <p id="phantom-wallet-balance" class="wallet-info"></p>
            <div id="phantom-wallet-assets" class="wallet-info"></div>
            <div id="phantom-disconnect-btn-container"></div>
            <button id="phantom-minimize-btn" class="minimize-btn" onclick="minimizeWallet('phantom')">Minimize</button>
        </div>

        <div class="wallet-container" id="solflare-wallet-box" style="display: none;">
            <h3>Solflare Wallet</h3>
            <p id="solflare-wallet-address" class="wallet-info">Not Connected</p>
            <p id="solflare-wallet-balance" class="wallet-info"></p>
            <div id="solflare-wallet-assets" class="wallet-info"></div>
            <div id="solflare-disconnect-btn-container"></div>
            <button id="solflare-minimize-btn" class="minimize-btn" onclick="minimizeWallet('solflare')">Minimize</button>
        </div>

        <div class="section-card games-avatar-wrapper">
            <h3>Available Games</h3>
            <div class="game-grid">
                <div class="game-card">
                    <img src="https://via.placeholder.com/200" alt="TETRIS">
                    <p>TETRIS</p>
                </div>
                <div class="game-card">
                    <img src="https://via.placeholder.com/200" alt="PACMAN">
                    <p>PACMAN</p>
                </div>
                <div class="game-card">
                    <img src="https://via.placeholder.com/200" alt="TAP">
                    <p>TAP</p>
                </div>
                <div class="game-card">
                    <img src="https://via.placeholder.com/200" alt="INFINITE LEDGER">
                    <p>INFINITE LEDGER</p>
                </div>
            </div>
            <?php if ($gaming_avatar): ?>
                <div class="avatar-display">
                    <h3>Your Gaming Avatar</h3>
                    <img src="<?= htmlspecialchars($gaming_avatar) ?>" alt="Gaming Avatar">
                </div>
            <?php endif; ?>
        </div>

        <div class="section-card">
            <h3>Infinite Wallet</h3>
            <p class="future-wallet">Coming Soon: A custom wallet to store your NFTs and bring them into our games! Stay tuned.</p>
        </div>

        <div class="section-card nft-grid">
            <h3>NFT Collection</h3>
            <div class="nft-card">
                <img src="https://via.placeholder.com/150x100?text=Cosmic+Cat+1" alt="Cosmic Cat #1">
                <p>Cosmic Cat #1</p>
            </div>
            <div class="nft-card">
                <img src="https://via.placeholder.com/150x100?text=Pixel+Punk+2" alt="Pixel Punk #2">
                <p>Pixel Punk #2</p>
            </div>
        </div>

        <div class="section-card game-scores">
            <h3>Game Scores</h3>
            <table>
                <thead>
                    <tr>
                        <th>Game</th>
                        <th>Score</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>TETRIS</td>
                        <td>1200</td>
                        <td>2025-03-15</td>
                    </tr>
                    <tr>
                        <td>PACMAN</td>
                        <td>950</td>
                        <td>2025-03-14</td>
                    </tr>
                    <tr>
                        <td>TAP</td>
                        <td>800</td>
                        <td>2025-03-13</td>
                    </tr>
                    <tr>
                        <td>INFINITE LEDGER</td>
                        <td>1100</td>
                        <td>2025-03-12</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="section-card leaderboard">
            <h3>Leaderboard</h3>
            <table>
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>User</th>
                        <th>Score</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>1</td>
                        <td>@CryptoKing</td>
                        <td>2500</td>
                    </tr>
                    <tr>
                        <td>2</td>
                        <td>@NFTWizard</td>
                        <td>2200</td>
                    </tr>
                    <tr>
                        <td>3</td>
                        <td>@futurechdev</td>
                        <td>2000</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="section-card transactions">
            <h3>Recent Transactions</h3>
            <table>
                <thead>
                    <tr>
                        <th>Tx Hash</th>
                        <th>Amount</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>5Ey...aBc</td>
                        <td>0.5 SOL</td>
                        <td>2025-03-15</td>
                    </tr>
                    <tr>
                        <td>7Gh...xYz</td>
                        <td>1.2 SOL</td>
                        <td>2025-03-14</td>
                    </tr>
                    <tr>
                        <td>9Jk...pQr</td>
                        <td>0.8 SOL</td>
                        <td>2025-03-13</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="section-card wallet-stats">
            <h3>Wallet Stats</h3>
            <div class="stat-box">
                <p>Total NFT Value</p>
                <p>15 SOL</p>
            </div>
            <div class="stat-box">
                <p>SOL Staked</p>
                <p>10 SOL</p>
            </div>
            <div class="stat-box">
                <p>Transactions (30d)</p>
                <p>42</p>
            </div>
        </div>

        <div class="section-card twitter-post-window">
            <h3>Community Posts</h3>
            <?php foreach ($tweets as $tweet): ?>
                <div class="twitter-post">
                    <h4>@<?= htmlspecialchars($tweet['username'] ?? 'Unknown') ?> - <?= htmlspecialchars($tweet['date'] ?? 'No Date') ?></h4>
                    <p><?= $tweet['text'] ?? 'No text available' ?></p>
                </div>
            <?php endforeach; ?>
        </div>
    </div>

    <script>
        let wallets = {
            phantom: null,
            solflare: null
        };

        const MT_TOKEN_MINT = "ELywDcVX2WumHm4xEfqF8NdEKaeGCAaq9JmwtjE8pump";
        const connection = new solanaWeb3.Connection(
            "https://thrumming-fluent-mansion.solana-mainnet.quiknode.pro/d783f3b5140172f93f2f05fa72ba7838a563042e/",
            "confirmed"
        );

        window.addEventListener("load", () => {
            console.log("Solana Object on Load:", window.solana);
            console.log("Solflare Object on Load:", window.solflare);
            fetchMTBalance();
        });

        async function detectWallet(walletType) {
            return new Promise((resolve) => {
                let attempts = 0;
                const interval = setInterval(() => {
                    attempts++;
                    if (walletType === "phantom" && window.solana && window.solana.isPhantom) {
                        clearInterval(interval);
                        resolve(window.solana);
                    }
                    if (walletType === "solflare" && window.solflare && window.solflare.isSolflare) {
                        clearInterval(interval);
                        resolve(window.solflare);
                    }
                    if (attempts >= 10) {
                        clearInterval(interval);
                        resolve(null);
                    }
                }, 500);
            });
        }

        function updateConnectBoxVisibility() {
            const connectBox = document.getElementById("connect-wallet-box");
            if (wallets.phantom && wallets.solflare) {
                connectBox.style.display = "none";
            } else {
                connectBox.style.display = "block";
            }
        }

        async function connectWallet(walletType) {
            let provider = await detectWallet(walletType);

            if (!provider) {
                alert(`${walletType.charAt(0).toUpperCase() + walletType.slice(1)} Wallet not detected. 
                🚀 Try opening this page inside the ${walletType} app browser.`);
                return;
            }

            try {
                await provider.connect();
                wallets[walletType] = provider.publicKey.toString();
                const walletBox = document.getElementById(`${walletType}-wallet-box`);
                walletBox.style.display = "block";
                document.getElementById(`${walletType}-wallet-address`).innerText = `Connected: ${wallets[walletType]}`;
                fetchWalletData(wallets[walletType], walletType);
                fetchMTBalance(wallets[walletType]);

                const connectBtn = document.getElementById(`${walletType}-btn`);
                connectBtn.style.display = "none";

                const disconnectBtnContainer = document.getElementById(`${walletType}-disconnect-btn-container`);
                const disconnectBtn = document.createElement("button");
                disconnectBtn.innerText = `Disconnect ${walletType.charAt(0).toUpperCase() + walletType.slice(1)}`;
                disconnectBtn.className = "disconnect-btn";
                disconnectBtn.onclick = () => disconnectWallet(walletType);
                disconnectBtnContainer.appendChild(disconnectBtn);

                document.querySelector(".reopen-container").appendChild(walletBox);
                updateConnectBoxVisibility();
            } catch (error) {
                console.error(`${walletType} connection error:`, error);
                alert(`Connection to ${walletType} wallet failed.`);
            }
        }

        function disconnectWallet(walletType) {
            wallets[walletType] = null;
            const walletBox = document.getElementById(`${walletType}-wallet-box`);
            walletBox.style.display = "none";

            const disconnectBtnContainer = document.getElementById(`${walletType}-disconnect-btn-container`);
            disconnectBtnContainer.innerHTML = "";

            const connectBtn = document.getElementById(`${walletType}-btn`);
            connectBtn.style.display = "block";
            connectBtn.innerText = `Connect ${walletType.charAt(0).toUpperCase() + walletType.slice(1)}`;
            connectBtn.className = "wallet-btn";
            connectBtn.onclick = () => connectWallet(walletType);

            document.getElementById(`${walletType}-reopen-btn`).style.display = "block";
            if (!document.querySelector(".reopen-container").contains(walletBox)) {
                document.querySelector(".reopen-container").appendChild(walletBox);
            }

            fetchMTBalance();
            updateConnectBoxVisibility();
        }

        function minimizeWallet(walletType) {
            const walletBox = document.getElementById(`${walletType}-wallet-box`);
            walletBox.style.display = "none";
            document.getElementById(`${walletType}-reopen-btn`).style.display = "block";
        }

        function reopenWallet(walletType) {
            const walletBox = document.getElementById(`${walletType}-wallet-box`);
            walletBox.style.display = "block";
            document.getElementById(`${walletType}-reopen-btn`).style.display = "none";
            if (!document.querySelector(".reopen-container").contains(walletBox)) {
                document.querySelector(".reopen-container").appendChild(walletBox);
            }
        }

        async function fetchWalletData(wallet, walletType) {
            let balanceBox = document.getElementById(`${walletType}-wallet-balance`);
            let assetsBox = document.getElementById(`${walletType}-wallet-assets`);

            try {
                const balance = await connection.getBalance(new solanaWeb3.PublicKey(wallet));
                balanceBox.innerText = `Wallet Balance: ${(balance / solanaWeb3.LAMPORTS_PER_SOL).toFixed(4)} SOL`;

                const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
                    new solanaWeb3.PublicKey(wallet),
                    { programId: new solanaWeb3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") }
                );

                if (!tokenAccounts.value.length) {
                    assetsBox.innerHTML = "No tokens found.";
                    return;
                }

                let assetList = `<h4>Your Tokens:</h4><ul>`;
                tokenAccounts.value.forEach((account) => {
                    const tokenInfo = account.account.data.parsed.info;
                    const mint = tokenInfo.mint;
                    const amount = tokenInfo.tokenAmount.uiAmount;
                    assetList += `<li>${amount} tokens of ${mint.substring(0, 6)}...${mint.slice(-6)}</li>`;
                });
                assetList += `</ul>`;
                assetsBox.innerHTML = assetList;
            } catch (error) {
                console.error(`Error fetching wallet data for ${walletType}:`, error);
                balanceBox.innerText = "Error fetching balance.";
                assetsBox.innerHTML = "Error fetching assets.";
            }
        }

        async function fetchMTBalance(wallet) {
            const mtBalanceElement = document.getElementById("mt-balance");
            let totalMTBalance = 0;

            try {
                for (const walletType in wallets) {
                    const walletAddress = wallets[walletType];
                    if (!walletAddress) continue;

                    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
                        new solanaWeb3.PublicKey(walletAddress),
                        { programId: new solanaWeb3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") }
                    );

                    tokenAccounts.value.forEach((account) => {
                        const tokenInfo = account.account.data.parsed.info;
                        if (tokenInfo.mint === MT_TOKEN_MINT) {
                            totalMTBalance += tokenInfo.tokenAmount.uiAmount;
                        }
                    });
                }

                if (totalMTBalance > 0) {
                    mtBalanceElement.innerText = `$MT Balance: ${totalMTBalance.toFixed(2)}`;
                } else {
                    mtBalanceElement.innerText = "$MT Balance: 0.00";
                }
            } catch (error) {
                console.error("Error fetching $MT balance:", error);
                mtBalanceElement.innerText = "$MT Balance: Error";
            }
        }
    </script>
</body>
</html>