<?php
require_once 'vendor/PHPMailer/src/Exception.php';
require_once 'vendor/PHPMailer/src/PHPMailer.php';
require_once 'vendor/PHPMailer/src/SMTP.php';
use PHPMailer\PHPMailer\PHPMailer;
$mail = new PHPMailer(true);
try {
    $mail->isSMTP();
    $mail->Host = 'mail.memetorrent.futuret3ch.com.au';
    $mail->SMTPAuth = true;
    $mail->Username = 'no-reply@memetorrent.futuret3ch.com.au';
    $mail->Password = 'Shinhwa1@@';
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = 587;
    $mail->setFrom('no-reply@memetorrent.futuret3ch.com.au', 'Test');
    $mail->addAddress('your_personal_email@example.com');
    $mail->isHTML(true);
    $mail->Subject = 'Test Email';
    $mail->Body = 'This is a test email.';
    $mail->send();
    echo 'Email sent successfully!';
} catch (Exception $e) {
    echo 'Email failed: ' . $mail->ErrorInfo;
}
?>