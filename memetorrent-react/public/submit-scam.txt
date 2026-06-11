<?php
$host = '50.6.160.248';
$dbname = 'tcvkxete_message_tracking';
$username = 'tcvkxete_admin';
$password = 'Shinhwa1@@';

$conn = new mysqli($host, $username, $password, $dbname);
if ($conn->connect_error) {
  die("Connection failed: " . $conn->connect_error);
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
  $address = $_POST["scamAddress"];
  $notes = $_POST["scamNotes"];

  $stmt = $conn->prepare("INSERT INTO scam_reports (address, notes) VALUES (?, ?)");
  $stmt->bind_param("ss", $address, $notes);
  $stmt->execute();
  $stmt->close();

  echo "Success";
}

$conn->close();
?>