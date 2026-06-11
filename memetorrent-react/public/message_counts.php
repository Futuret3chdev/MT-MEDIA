<?php
// message_counts.php – Melbourne Time + Custom Date Range
header('Content-Type: application/json; charset=utf-8');
error_reporting(0);
date_default_timezone_set('Australia/Melbourne');
$start = $_GET['start_date'] ?? date('Y-m-d');
$end = $_GET['end_date'] ?? $start;
$last_updated = date('Y-m-d H:i:s T');
$response = [
    'timestamp' => $last_updated,
    'telegram' => ['range' => [], 'daily' => [], 'monthly' => []],
    'discord' => ['range' => [], 'daily' => [], 'monthly' => []]
];
/* ---------- TELEGRAM ---------- */
$conn_tg = new mysqli('50.6.160.248', 'tcvkxete_admin', 'Shinhwa1@@', 'tcvkxete_message_tracking');
if (!$conn_tg->connect_error) {
    // Custom range
    $sql = "SELECT user_id, username, SUM(message_count) AS message_count
            FROM daily_message_counts
            WHERE date BETWEEN ? AND ?
            GROUP BY user_id, username
            ORDER BY message_count DESC";
    $stmt = $conn_tg->prepare($sql);
    $stmt->bind_param('ss', $start, $end);
    $stmt->execute();
    $response['telegram']['range'] = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    // Daily (today)
    $today = date('Y-m-d');
    $stmt = $conn_tg->prepare(
        "SELECT user_id, username, message_count
         FROM daily_message_counts
         WHERE date = ? ORDER BY message_count DESC"
    );
    $stmt->bind_param('s', $today);
    $stmt->execute();
    $response['telegram']['daily'] = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    // Monthly
    $month = date('Y-m');
    $stmt = $conn_tg->prepare(
        "SELECT user_id, username, total_message_count
         FROM monthly_message_totals
         WHERE month = ? ORDER BY total_message_count DESC"
    );
    $stmt->bind_param('s', $month);
    $stmt->execute();
    $response['telegram']['monthly'] = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
}
$conn_tg->close();
/* ---------- DISCORD ---------- */
$conn_dc = new mysqli('50.6.160.248', 'tcvkxete_admin', 'Shinhwa1@@', 'tcvkxete_discord_members');
if (!$conn_dc->connect_error) {
    // Custom range
    $sql = "SELECT author_id AS user_id,
                   COALESCE(author_username, 'Unknown') AS username,
                   COUNT(*) AS message_count
            FROM messages
            WHERE DATE(CONVERT_TZ(timestamp, '+00:00', '+10:00')) BETWEEN ? AND ?
            GROUP BY author_id, author_username
            ORDER BY message_count DESC";
    $stmt = $conn_dc->prepare($sql);
    $stmt->bind_param('ss', $start, $end);
    $stmt->execute();
    $response['discord']['range'] = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    // Daily (today)
    $sql = "SELECT author_id AS user_id,
                   COALESCE(author_username, 'Unknown') AS username,
                   COUNT(*) AS message_count
            FROM messages
            WHERE DATE(CONVERT_TZ(timestamp, '+00:00', '+10:00')) = ?
            GROUP BY author_id, author_username
            ORDER BY message_count DESC";
    $stmt = $conn_dc->prepare($sql);
    $stmt->bind_param('s', $today);
    $stmt->execute();
    $response['discord']['daily'] = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    // Monthly
    $sql = "SELECT author_id AS user_id,
                   COALESCE(author_username, 'Unknown') AS username,
                   COUNT(*) AS total_message_count
            FROM messages
            WHERE DATE_FORMAT(CONVERT_TZ(timestamp, '+00:00', '+10:00'), '%Y-%m') = ?
            GROUP BY author_id, author_username
            ORDER BY total_message_count DESC";
    $stmt = $conn_dc->prepare($sql);
    $stmt->bind_param('s', $month);
    $stmt->execute();
    $response['discord']['monthly'] = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
}
$conn_dc->close();
echo json_encode($response, JSON_UNESCAPED_UNICODE);
?>