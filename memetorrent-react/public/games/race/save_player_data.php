<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

// MySQL credentials
$host = "localhost";
$db_name = "tcvkxete_racerdb";
$db_user = "tcvkxete_admin";
$db_pass = "Shinhwa1@@";

// Connect to MySQL
$conn = new mysqli($host, $db_user, $db_pass, $db_name);
if ($conn->connect_error) {
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}

// Handle POST request to save data
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!$data || !isset($data["name"]) || !isset($data["lapTimes"]) || !isset($data["track_id"])) {
        echo json_encode(["error" => "Invalid or missing data (name, lapTimes, or track_id)"]);
        $conn->close();
        exit;
    }

    $name = $conn->real_escape_string($data["name"]);
    $lapTimes = $data["lapTimes"];
    $position = isset($data["position"]) ? $conn->real_escape_string($data["position"]) : "N/A";
    $difficulty = isset($data["difficulty"]) ? (int)$data["difficulty"] : 1;
    $mode = isset($data["mode"]) ? $conn->real_escape_string($data["mode"]) : "race";
    $track_id = (int)$data["track_id"]; // Ensure track_id is included
    $newTotalLapTime = array_sum($lapTimes);

    // Log the incoming data for debugging
    error_log("POST data - name: $name, mode: $mode, difficulty: $difficulty, track_id: $track_id, total_lap_time: $newTotalLapTime");

    // Check if player already exists with the same difficulty, mode, and track_id
    $sql = "SELECT lap_times, position, total_lap_time FROM players WHERE name = '$name' AND difficulty = $difficulty AND mode = '$mode' AND track_id = $track_id";
    error_log("Check existing query: $sql");
    $result = $conn->query($sql);

    if ($result && $result->num_rows > 0) {
        $row = $result->fetch_assoc();
        $existingLapTimes = json_decode($row["lap_times"], true);
        $existingTotalLapTime = (float)$row["total_lap_time"] ?: array_sum($existingLapTimes);
        $existingPosition = $row["position"];

        $shouldUpdate = false;
        if ($mode === "timeAttack" && $newTotalLapTime < $existingTotalLapTime) {
            $shouldUpdate = true;
        } elseif ($mode === "race" && $newTotalLapTime < $existingTotalLapTime) {
            $shouldUpdate = true;
        }

        if (!$shouldUpdate) {
            echo json_encode([
                "success" => "No update needed, existing score is better or equal",
                "existing_total" => $existingTotalLapTime,
                "new_total" => $newTotalLapTime
            ]);
            $conn->close();
            exit;
        }
    }

    $lapTimesJson = json_encode($lapTimes);
    $sql = "INSERT INTO players (name, lap_times, position, difficulty, mode, total_lap_time, track_id) 
            VALUES ('$name', '$lapTimesJson', '$position', $difficulty, '$mode', $newTotalLapTime, $track_id)
            ON DUPLICATE KEY UPDATE 
                lap_times = '$lapTimesJson', 
                position = '$position', 
                total_lap_time = $newTotalLapTime";
    error_log("Insert/Update query: $sql");

    if ($conn->query($sql) === TRUE) {
        echo json_encode(["success" => "Data saved", "new_total" => $newTotalLapTime]);
    } else {
        echo json_encode(["error" => "Error saving data: " . $conn->error]);
    }
}

// Handle GET request to fetch leaderboard data
if ($_SERVER["REQUEST_METHOD"] == "GET") {
    $difficulty = isset($_GET["difficulty"]) ? (int)$_GET["difficulty"] : null;
    $mode = isset($_GET["mode"]) ? $conn->real_escape_string($_GET["mode"]) : null;
    $track_id = isset($_GET["track_id"]) ? (int)$_GET["track_id"] : null;

    // Log incoming GET parameters
    error_log("GET params - mode: " . ($mode ?? 'null') . ", difficulty: " . ($difficulty ?? 'null') . ", track_id: " . ($track_id ?? 'null'));

    $sql = "SELECT name, lap_times, position, difficulty, mode, total_lap_time, track_id FROM players";
    $where = [];
    if ($difficulty !== null) {
        $where[] = "difficulty = $difficulty";
    }
    if ($mode !== null) {
        $where[] = "LOWER(mode) = LOWER('$mode')";
    }
    if ($track_id !== null) {
        $where[] = "track_id = $track_id";
    }
    if (!empty($where)) {
        $sql .= " WHERE " . implode(" AND ", $where);
    }

    $sql .= " ORDER BY total_lap_time ASC LIMIT 10";
    error_log("Leaderboard query: $sql");

    $result = $conn->query($sql);
    $players = [];
    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $row["lap_times"] = json_decode($row["lap_times"], true);
            if ($row["total_lap_time"] == 0 && !empty($row["lap_times"])) {
                $row["total_lap_time"] = array_sum($row["lap_times"]);
                $updateSql = "UPDATE players SET total_lap_time = " . $row["total_lap_time"] . " 
                              WHERE name = '" . $conn->real_escape_string($row["name"]) . "' 
                              AND difficulty = " . $row["difficulty"] . " 
                              AND mode = '" . $conn->real_escape_string($row["mode"]) . "' 
                              AND track_id = " . $row["track_id"];
                $conn->query($updateSql);
            }
            $players[] = $row;
        }
    }
    error_log("Returning players: " . json_encode($players));
    echo json_encode($players);
}

$conn->close();
?>