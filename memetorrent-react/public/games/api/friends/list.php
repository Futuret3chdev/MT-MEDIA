<?php
require_once "../db.php";
session_start();

error_log("SESSION USER: " . ($_SESSION["user_id"] ?? "NONE"));

if (!isset($_SESSION["user_id"])) {
    json_out(["success" => false, "error" => "Not logged in"], 403);
}


$userId = $_SESSION["user_id"];

try {
    $pdo = pdo_connect("userdb");

    $stmt = $pdo->prepare("
        SELECT f.id as relation_id, f.user_id, f.friend_id, f.status, f.reported, f.created_at,
               u.id as uid, u.username, u.email, u.avatar_url, u.bio, u.last_login
        FROM portal_friends f
        JOIN portal_users u 
          ON (u.id = CASE WHEN f.user_id = :uid THEN f.friend_id ELSE f.user_id END)
        WHERE f.user_id = :uid OR f.friend_id = :uid
    ");
    $stmt->execute([":uid" => $userId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $friends = [
        "accepted" => [],
        "pending"  => [],
        "sent"     => [],
        "blocked"  => []
    ];

    foreach ($rows as $r) {
        $friend = [
            "relation_id" => $r["relation_id"],
            "id"          => $r["uid"],
            "username"    => $r["username"] ?? $r["email"],
            "avatar_url"  => $r["avatar_url"],
            "bio"         => $r["bio"],
            "online"      => ($r["last_login"] && strtotime($r["last_login"]) > time() - 300),
            "reported"    => $r["reported"]
        ];

        switch ($r["status"]) {
            case "accepted":
                $friends["accepted"][] = $friend;
                break;

            case "blocked":
                $friends["blocked"][] = $friend;
                break;

            case "pending":
                if ($r["user_id"] == $userId) {
                    // ✅ I am the one who sent it
                    $friends["sent"][] = $friend;
                } elseif ($r["friend_id"] == $userId) {
                    // ✅ I received it
                    $friends["pending"][] = $friend;
                }
                break;
        }
    }

    json_out(["success" => true, "friends" => $friends]);
} catch (Exception $e) {
    json_out(["success" => false, "error" => $e->getMessage()], 500);
}
