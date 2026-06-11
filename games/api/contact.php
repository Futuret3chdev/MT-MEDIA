<?php
// ----- CORS -----
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allow  = $origin && preg_match('#^https://([a-z0-9-]+\.)?futuret3ch\.com\.au$#i', $origin);

if ($allow) {
  header("Access-Control-Allow-Origin: $origin");
  header("Vary: Origin");
  header("Access-Control-Allow-Credentials: true");
  header("Access-Control-Allow-Headers: Content-Type");
  header("Access-Control-Allow-Methods: POST, OPTIONS");
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  // help during testing even if origin didn't match
  if (!$allow) header("Access-Control-Allow-Origin: https://futuret3ch.com.au");
  http_response_code(204);
  exit;
}

header('Content-Type: application/json; charset=UTF-8');
$log = function($s){
  @file_put_contents(sys_get_temp_dir().'/contact.log', date('c').' '.$s."\n", FILE_APPEND);
};
$log('origin='.($origin ?: 'none').' method='.$_SERVER['REQUEST_METHOD']);



// ----- Read & validate payload -----
// ----- Read payload (JSON or x-www-form-urlencoded) -----
$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!is_array($data) || empty($data)) {
  // If not JSON, try normal form post (PHP already parsed into $_POST)
  if (!empty($_POST)) {
    $data = $_POST;
  } else {
    // As an extra fallback, parse urlencoded body manually
    $tmp = [];
    parse_str($raw, $tmp);
    if (!empty($tmp)) { $data = $tmp; }
  }
}

$hp      = trim($data['hp'] ?? '');
$name    = trim($data['name'] ?? '');
$email   = filter_var($data['email'] ?? '', FILTER_VALIDATE_EMAIL);
$subject = trim($data['subject'] ?? 'Contact form');
$message = trim($data['message'] ?? '');

// Honeypot: silently succeed for bots
if ($hp !== '') { echo json_encode(['success'=>true]); exit; }

// Validate
if ($name === '' || !$email || $message === '') {
  http_response_code(400);
  echo json_encode([
    'success' => false,
    'message' => 'Please fill in all required fields.',
    // DEBUG so you can see what arrived (remove after testing)
    'received' => [
      'name'    => $name,
      'email'   => $data['email'] ?? null,
      'subject' => $subject,
      'message' => $message
    ]
  ]);
  exit;
}


// ----- Build email (keep From on your domain for SPF/DMARC) -----
// Build email (unchanged except subject_in/out for clarity)
$to          = 'jason.c@futuret3ch.com.au';
$from        = 'no-reply@futuret3ch.com.au';
$subject_in  = $subject;                       // what user typed
$subject_out = "Website contact: $subject_in";

$body = "New message from FutureT3ch website\n\n"
      . "Name: $name\nEmail: " . ($data['email'] ?? '') . "\nSubject: $subject_in\n\n"
      . "$message\n\n"
      . "IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . "\n";

$headers  = "From: FutureT3ch <{$from}>\r\n";
$headers .= "Reply-To: {$name} <{$data['email']}>\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

// Send with envelope sender
$sent = @mail($to, $subject, $body, $headers, "-f {$from}");
echo json_encode($sent
  ? ['success'=>true,'message'=>'Thanks, your message has been sent.']
  : (http_response_code(500) || true) && ['success'=>false,'message'=>'Mail failed on server.']
);


if ($sent) {
  echo json_encode(['success'=>true,'message'=>'Thanks, your message has been sent.']);
} else {
  // log so we can see failures in server logs
  error_log('contact.php: mail() failed to send');
  http_response_code(500);
  echo json_encode(['success'=>false,'message'=>'Mail failed on server.']);
}
