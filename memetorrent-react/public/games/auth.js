let socialUser = null;

async function fetchBalances(walletAddress) {
  try {
    console.log('Fetching balances for wallet:', walletAddress);
    const solPayload = { jsonrpc: '2.0', id: 1, method: 'getBalance', params: [walletAddress] };
    const solResponse = await fetch('https://thrumming-fluent-mansion.solana-mainnet.quiknode.pro/d783f3b5140172f93f2f05fa72ba7838a563042e/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(solPayload)
    });
    if (!solResponse.ok) throw new Error(`Solana RPC error ${solResponse.status}`);
    const solData = await solResponse.json();
    const solBalance = (solData.result?.value || 0) / 1e9;

    // Query $MT token balance using the user's token account
    const tokenAccountPayload = {
      jsonrpc: '2.0',
      id: 2,
      method: 'getTokenAccountsByOwner',
      params: [
        walletAddress,
        { mint: 'ELywDcVX2WumHm4xEfqF8NdEKaeGCAaq9JmwtjE8pump' },
        { encoding: 'jsonParsed' }
      ]
    };
    const tokenAccountResponse = await fetch('https://thrumming-fluent-mansion.solana-mainnet.quiknode.pro/d783f3b5140172f93f2f05fa72ba7838a563042e/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tokenAccountPayload)
    });
    if (!tokenAccountResponse.ok) throw new Error(`$MT token account RPC error ${tokenAccountResponse.status}`);
    const tokenAccountData = await tokenAccountResponse.json();
    const tokenAccount = tokenAccountData.result?.value?.[0]?.account?.data?.parsed?.info?.tokenAmount?.uiAmount || 0.00;

    const mtBalanceEl = document.getElementById('mt-balance');
    const statusBalanceEl = document.getElementById('status-balance');
    if (mtBalanceEl) mtBalanceEl.textContent = tokenAccount.toFixed(2);
    if (statusBalanceEl) statusBalanceEl.textContent = tokenAccount.toFixed(2);
    const walletBalanceEl = document.getElementById('wallet-balance');
    if (walletBalanceEl) walletBalanceEl.textContent = `${solBalance.toFixed(2)} SOL`;
    sessionStorage.setItem('mtBalance', tokenAccount.toFixed(2));
    return { solBalance, mtBalance: tokenAccount };
  } catch (e) {
    console.error('Fetch balances failed:', e.message);
    const mtBalanceEl = document.getElementById('mt-balance');
    const statusBalanceEl = document.getElementById('status-balance');
    if (mtBalanceEl) mtBalanceEl.textContent = '0.00';
    if (statusBalanceEl) statusBalanceEl.textContent = '0.00';
    if (document.getElementById('wallet-balance')) document.getElementById('wallet-balance').textContent = '0 SOL';
    return { solBalance: 0, mtBalance: 0 };
  }
}

async function initAuth() {
  console.log('initAuth called, checking auth...');
  const urlParams = new URLSearchParams(window.location.search);
  const sessionToken = urlParams.get('session_token') || document.cookie.split('; ').find(row => row.startsWith('session_token='))?.split('=')[1];
  try {
    const response = await fetch('/games/api/authCheck.php', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      credentials: 'include'
    });
    console.log('Fetch response status:', response.status);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const data = await response.json();
    console.log('Fetch response data:', JSON.stringify(data, null, 2));
    if (data.error || !data.success) throw new Error(data.error || 'Authentication failed');
    if (data.success && (data.user.discord_id || data.user.telegram_id)) {
      socialUser = {
        wallet_address: data.user.wallet_address || 'Not set',
        social_id: data.user.discord_id || data.user.telegram_id,
        platform: data.user.discord_id ? 'Discord' : 'Telegram'
      };
      console.log('socialUser:', socialUser);
      const userInfo = document.getElementById('user-info');
      const authButtons = document.getElementById('auth-buttons');
      const usernameEl = document.getElementById('status-username');
      const lastLoginEl = document.getElementById('status-lastlogin');
      if (userInfo && authButtons && usernameEl && lastLoginEl) {
        authButtons.style.display = 'none';
        userInfo.style.display = 'flex';
        usernameEl.textContent = data.user.email || 'Guest';
        lastLoginEl.textContent = localStorage.getItem('lastLogin') || new Date().toLocaleString();
      }
      if (socialUser.wallet_address && socialUser.wallet_address !== 'Not set') {
        await fetchBalances(socialUser.wallet_address);
      } else {
        console.warn('No valid wallet address, setting default balances');
        const mtBalanceEl = document.getElementById('mt-balance');
        const statusBalanceEl = document.getElementById('status-balance');
        if (mtBalanceEl) mtBalanceEl.textContent = '0.00';
        if (statusBalanceEl) statusBalanceEl.textContent = '0.00';
        if (document.getElementById('wallet-balance')) document.getElementById('wallet-balance').textContent = '0 SOL';
      }
    } else {
      console.log('No social connection');
      const mtBalanceEl = document.getElementById('mt-balance');
      const statusBalanceEl = document.getElementById('status-balance');
      if (mtBalanceEl) mtBalanceEl.textContent = '0.00';
      if (statusBalanceEl) statusBalanceEl.textContent = '0.00';
      if (document.getElementById('wallet-balance')) document.getElementById('wallet-balance').textContent = '0 SOL';
    }
  } catch (e) {
    console.error('Auth check failed:', e.message);
    const mtBalanceEl = document.getElementById('mt-balance');
    const statusBalanceEl = document.getElementById('status-balance');
    if (mtBalanceEl) mtBalanceEl.textContent = '0.00';
    if (statusBalanceEl) statusBalanceEl.textContent = '0.00';
    if (document.getElementById('wallet-balance')) document.getElementById('wallet-balance').textContent = '0 SOL';
  }
}

document.addEventListener('DOMContentLoaded', initAuth);