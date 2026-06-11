<?php
$host = '50.6.160.248';
$dbname = 'tcvkxete_message_tracking';
$username = 'tcvkxete_admin';
$password = 'Shinhwa1@@';

$conn = new mysqli($host, $username, $password, $dbname);
if ($conn->connect_error) {
  die("Connection failed: " . $conn->connect_error);
}

$result = $conn->query("SELECT address FROM scam_reports ORDER BY submitted_at DESC LIMIT 1");
if ($row = $result->fetch_assoc()) {
  echo $row["address"];
} else {
  echo "No scams reported yet.";
}

$conn->close();
?>