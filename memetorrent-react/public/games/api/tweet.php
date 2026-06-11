<?php
// tweet.php — FINAL WORKING VERSION (November 2025)
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: https://memetorrent.futuret3ch.com.au");

require_once __DIR__ . "/twitter_settings.php";

// YOUR USER ID (from your @futuret3chdev account)
$userId = "1875186134126559232";   // ← this is correct

$input = json_decode(file_get_contents("php://input"), true);
if (empty($input["image"])) die(json_encode(["success"=>false,"error"=>"No image"]));

$img = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $input["image"]));
if (!$img) die(json_encode(["success"=>false,"error"=>"Bad image"]));

$tmp = tempnam(sys_get_temp_dir(), "graffiti_") . ".png";
file_put_contents($tmp, $img);
$media = new CURLFile($tmp, "image/png", "graffiti.png");

function oauthHeader($url) {
    $oauth = [
        'oauth_consumer_key'     => TWITTER_API_KEY,
        'oauth_nonce'            => bin2hex(random_bytes(32)),
        'oauth_signature_method' => 'HMAC-SHA1',
        'oauth_timestamp'        => time(),
        'oauth_token'            => TWITTER_ACCESS_TOKEN,
        'oauth_version'          => '1.0'
    ];
    ksort($oauth);
    $base = "POST&" . rawurlencode($url) . "&" . rawurlencode(http_build_query($oauth, '', '&', PHP_QUERY_RFC3986));
    $key  = rawurlencode(TWITTER_API_SECRET) . "&" . rawurlencode(TWITTER_ACCESS_SECRET);
    $oauth['oauth_signature'] = base64_encode(hash_hmac('sha1', $base, $key, true));
    $parts = [];
    foreach ($oauth as $k => $v) $parts[] = $k.'="'.rawurlencode($v).'"';
    return "OAuth " . implode(", ", $parts);
}

// STEP 1: Upload media
$auth = oauthHeader("https://upload.twitter.com/1.1/media/upload.json");
$ch = curl_init("https://upload.twitter.com/1.1/media/upload.json");
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ["Authorization: $auth"],
    CURLOPT_POSTFIELDS => [
        "media" => $media,
        "additional_owners" => $userId
    ]
]);
$resp = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
unlink($tmp);

if ($code !== 200) die(json_encode(["success"=>false,"error"=>"Upload failed","code"=>$code,"raw"=>$resp]));
$mediaId = json_decode($resp,true)["media_id_string"];

// STEP 2: Post tweet
$auth = oauthHeader("https://api.twitter.com/2/tweets");
$payload = json_encode([
    "text" => "Fresh graffiti just dropped on MemeTorrent!\n\nCreate yours → https://memetorrent.futuret3ch.com.au/create.html\n\n#MemeTorrent @MemeTorrent #GraffitiWall #Web2 #Web3 #Futuret3chdev @Futuret3chdev",
    "media" => ["media_ids" => [$mediaId]]
]);

$ch = curl_init("https://api.twitter.com/2/tweets");
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ["Authorization: $auth", "Content-Type: application/json"],
    CURLOPT_POSTFIELDS => $payload
]);
$result = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($code === 201) {
    $id = json_decode($result,true)["data"]["id"];
    $url = "https://twitter.com/" . TWITTER_USERNAME . "/status/" . $id;
    echo json_encode(["success" => true, "url" => $url]);
} else {
    echo json_encode(["success" => false, "raw" => $result]);
}
?>