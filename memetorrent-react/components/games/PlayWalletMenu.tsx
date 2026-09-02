'use client';

import { useCallback, useEffect, useState } from 'react';

const WALLETS = [
  { id: 'phantom', label: 'Phantom', icon: '/icons/phantom.svg' },
  { id: 'solflare', label: 'Solflare', icon: '/icons/solflare.svg' },
  { id: 'backpack', label: 'Backpack', icon: '/icons/backpack.png' },
] as const;

function injected(kind: string) {
  if (kind === 'solflare') return (window as unknown as { solflare?: { connect: () => Promise<{ publicKey?: { toString: () => string } }> } }).solflare;
  if (kind === 'backpack') return (window as unknown as { backpack?: { connect: () => Promise<{ publicKey?: { toString: () => string } }> } }).backpack;
  const w = window as unknown as { phantom?: { solana?: { connect: () => Promise<{ publicKey?: { toString: () => string } }> } }; solana?: { connect: () => Promise<{ publicKey?: { toString: () => string } }> } };
  return w.phantom?.solana || w.solana;
}

export default function PlayWalletMenu() {
  const [open, setOpen] = useState(false);
  const [addr, setAddr] = useState('');
  const [busy, setBusy] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('mt-game-wallet') || '';
      if (saved) setAddr(saved);
    } catch { /* */ }
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === 'mt-wallet-ok' && e.data.addr) setAddr(e.data.addr);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('message', onMsg);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const connect = useCallback(async (kind: string) => {
    setBusy(kind);
    document.querySelectorAll('iframe').forEach((f) => {
      try { f.contentWindow?.postMessage({ type: 'mt-wallet-request', wallet: kind }, '*'); } catch { /* */ }
    });
    const p = injected(kind);
    if (p?.connect) {
      try {
        const res = await p.connect();
        const pk = res?.publicKey;
        const a = pk && (typeof pk.toString === 'function' ? pk.toString() : String(pk));
        if (a) {
          setAddr(a);
          try { localStorage.setItem('mt-game-wallet', a); } catch { /* */ }
          document.querySelectorAll('iframe').forEach((f) => {
            try { f.contentWindow?.postMessage({ type: 'mt-wallet-ok', addr: a }, '*'); } catch { /* */ }
          });
          setOpen(false);
          setBusy('');
          return;
        }
      } catch { /* deeplink */ }
    }
    if (/iPhone|Android/i.test(navigator.userAgent)) {
      const url = encodeURIComponent(location.href);
      const ref = encodeURIComponent(location.origin);
      if (kind === 'solflare') location.href = `https://solflare.com/ul/v1/browse/${url}?ref=${ref}`;
      else if (kind === 'backpack') location.href = `https://backpack.app/ul/browse/${url}?ref=${ref}`;
      else location.href = `https://phantom.app/ul/v1/browse/${url}?ref=${ref}`;
    }
    setBusy('');
  }, []);

  const short = addr ? `${addr.slice(0, 4)}…${addr.slice(-4)}` : '';

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Connect wallet"
        title={short || 'Connect wallet'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          height: 28,
          padding: short ? '0 8px 0 4px' : 0,
          width: short ? 'auto' : 28,
          border: `1px solid ${addr ? 'rgba(25,211,126,.55)' : 'rgba(255,255,255,.2)'}`,
          borderRadius: 8,
          background: open ? 'rgba(25,211,126,.16)' : '#111',
          color: addr ? '#19d37e' : '#fff',
          cursor: 'pointer',
        }}
      >
        <span style={{ width: 26, height: 26, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="6" width="18" height="13" rx="3" stroke={addr ? '#19d37e' : '#fff'} strokeWidth="1.8" />
            <path d="M15 12.5h4.5A1.5 1.5 0 0 0 21 11V9.5" stroke={addr ? '#19d37e' : '#fff'} strokeWidth="1.8" />
            <circle cx="16.5" cy="12.5" r="1" fill={addr ? '#19d37e' : '#fff'} />
          </svg>
        </span>
        {short && <span style={{ fontSize: 10, fontWeight: 700 }}>{short}</span>}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            minWidth: 176,
            background: '#111113',
            border: '1px solid rgba(255,255,255,.16)',
            borderRadius: 10,
            zIndex: 40,
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,.45)',
          }}
        >
          {WALLETS.map((w) => (
            <button
              key={w.id}
              type="button"
              disabled={busy === w.id}
              onClick={() => connect(w.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                textAlign: 'left',
                background: 'transparent',
                color: '#fff',
                border: 0,
                borderBottom: '1px solid rgba(255,255,255,.06)',
                padding: '9px 12px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <img src={w.icon} alt="" width={20} height={20} style={{ borderRadius: 4 }} />
              {busy === w.id ? 'Connecting…' : w.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
