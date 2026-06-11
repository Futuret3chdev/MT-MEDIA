<?php
session_start();

// Redirect to login page if not logged in
if (!isset($_SESSION['user'])) {
    header("Location: index.html");
    exit;
}

$walletType = isset($_GET['wallet_type']) ? $_GET['wallet_type'] : null;

if ($walletType) {
    // Check if wallet provider is injected (e.g., after redirect from Phantom)
    echo "<script>
        window.addEventListener('load', async () => {
            let provider = null;
            if ('$walletType' === 'phantom' && window.solana && window.solana.isPhantom) {
                provider = window.solana;
            } else if ('$walletType' === 'solflare' && window.solflare && window.solflare.isSolflare) {
                provider = window.solflare;
            }
            if (provider) {
                try {
                    await provider.connect();
                    const publicKey = provider.publicKey.toString();
                    window.location.href = 'portal.php?wallet=' + publicKey;
                } catch (error) {
                    console.error('Error connecting wallet:', error);
                    alert('Failed to connect $walletType wallet.');
                }
            } else {
                alert('Please connect your $walletType wallet and try again.');
            }
        });
    </script>";
} else {
    echo "<h1>No wallet type specified.</h1>";
}
?>