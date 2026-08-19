'use client';

import { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

function broadcast(addr: string) {
  try { localStorage.setItem('mt-game-wallet', addr); } catch { /* */ }
  document.querySelectorAll('iframe').forEach((f) => {
    try { f.contentWindow?.postMessage({ type: 'mt-wallet-ok', addr }, '*'); } catch { /* */ }
  });
}

function injected(kind: string) {
  if (kind === 'solflare') return window.solflare;
  if (kind === 'backpack') return window.backpack;
  return window.phantom?.solana || window.solana || window.solflare || window.backpack;
}

export default function GameWalletBridge() {
  const { select, connect, publicKey, connected } = useWallet();

  useEffect(() => {
    if (connected && publicKey) broadcast(publicKey.toBase58());
  }, [connected, publicKey]);

  useEffect(() => {
    const onMsg = async (e: MessageEvent) => {
      if (!e.data || e.data.type !== 'mt-wallet-request') return;
      const kind = e.data.wallet || 'phantom';
      try {
        const name = kind === 'solflare' ? 'Solflare' : kind === 'backpack' ? 'Backpack' : 'Phantom';
        select(name as never);
        await new Promise((r) => setTimeout(r, 80));
        await connect();
        return;
      } catch { /* try injected */ }
      const p = injected(kind);
      if (p?.connect) {
        try {
          const res = await p.connect();
          const pk = res?.publicKey || p.publicKey;
          const addr = pk && (typeof pk.toString === 'function' ? pk.toString() : String(pk));
          if (addr) { broadcast(addr); return; }
        } catch { /* fall through */ }
      }
      if (/iPhone|Android/i.test(navigator.userAgent)) {
        const url = encodeURIComponent(location.href);
        const ref = encodeURIComponent(location.origin);
        if (kind === 'solflare') location.href = `https://solflare.com/ul/v1/browse/${url}?ref=${ref}`;
        else if (kind === 'backpack') location.href = `https://backpack.app/ul/browse/${url}?ref=${ref}`;
        else location.href = `https://phantom.app/ul/v1/browse/${url}?ref=${ref}`;
      }
    };
    addEventListener('message', onMsg);
    return () => removeEventListener('message', onMsg);
  }, [select, connect]);

  return null;
}
