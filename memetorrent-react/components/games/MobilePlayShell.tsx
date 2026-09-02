'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CatalogGame } from '@/lib/mt-catalog';
import GameWalletBridge from '@/components/wallet/GameWalletBridge';

const BAR = 44;

function injected(kind: string) {
  if (kind === 'solflare') return (window as unknown as { solflare?: { connect: () => Promise<{ publicKey?: { toString: () => string } }> } }).solflare;
  if (kind === 'backpack') return (window as unknown as { backpack?: { connect: () => Promise<{ publicKey?: { toString: () => string } }> } }).backpack;
  const w = window as unknown as { phantom?: { solana?: { connect: () => Promise<{ publicKey?: { toString: () => string } }> } }; solana?: { connect: () => Promise<{ publicKey?: { toString: () => string } }> } };
  return w.phantom?.solana || w.solana;
}

export default function MobilePlayShell({
  game,
  games,
  src,
}: {
  game: CatalogGame;
  games: CatalogGame[];
  src: string;
}) {
  const [picker, setPicker] = useState(false);
  const [addr, setAddr] = useState('');
  const [user, setUser] = useState<{ username?: string; is_admin?: boolean } | null>(null);

  const live = useMemo(
    () => games.filter((g) => g.status === 'live' && g.id !== 'mtgames'),
    [games],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPicker(false);
    };
    window.addEventListener('keydown', onKey);
    try {
      const saved = localStorage.getItem('mt-game-wallet') || '';
      if (saved) setAddr(saved);
    } catch { /* */ }
    fetch('/api/portal/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => { if (d?.ok && d.user) setUser(d.user); })
      .catch(() => {});
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === 'mt-wallet-ok' && e.data.addr) setAddr(e.data.addr);
    };
    window.addEventListener('message', onMsg);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('message', onMsg);
    };
  }, []);

  const connectWallet = useCallback(async (kind: string) => {
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
  }, []);

  const short = addr ? `${addr.slice(0, 4)}…${addr.slice(-4)}` : '';
  const next = encodeURIComponent(`/play/${game.id}`);

  const iconBtn = (kind: string, srcImg: string, label: string) => (
    <button
      type="button"
      title={label}
      onClick={() => connectWallet(kind)}
      style={{
        width: 28,
        height: 28,
        padding: 0,
        border: '1px solid rgba(255,255,255,.2)',
        borderRadius: 8,
        overflow: 'hidden',
        background: '#111',
        cursor: 'pointer',
      }}
    >
      <img src={srcImg} alt={label} style={{ width: '100%', height: '100%', display: 'block' }} />
    </button>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000' }}>
      <GameWalletBridge />
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: BAR,
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 10px',
          background: '#09090b',
          borderBottom: '1px solid rgba(255,255,255,.12)',
          color: '#fff',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <button
          type="button"
          onClick={() => setPicker((v) => !v)}
          aria-expanded={picker}
          style={{
            fontSize: 12,
            fontWeight: 800,
            background: picker ? '#19d37e' : 'rgba(255,255,255,.08)',
            color: picker ? '#04140c' : '#fff',
            border: '1px solid rgba(255,255,255,.2)',
            borderRadius: 999,
            padding: '6px 12px',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          {picker ? 'Close' : 'Games'}
        </button>
        <span style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
          {game.name}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto', flexShrink: 0 }}>
          {iconBtn('phantom', '/icons/phantom.svg', 'Phantom')}
          {iconBtn('solflare', '/icons/solflare.svg', 'Solflare')}
          {iconBtn('backpack', '/icons/backpack.png', 'Backpack')}
          {short && <span style={{ fontSize: 10, color: '#19d37e', maxWidth: 72, overflow: 'hidden' }}>{short}</span>}
          {user ? (
            <a href="/portal" style={{ color: '#19d37e', fontSize: 11, textDecoration: 'none' }}>@{user.username}</a>
          ) : (
            <a href={`/login?next=${next}`} style={{ color: '#ccc', fontSize: 11, textDecoration: 'none' }}>Log in</a>
          )}
          {user?.is_admin && (
            <a href="https://testers.futuret3ch.com.au/" style={{ color: '#fbbf24', fontSize: 11, textDecoration: 'none', fontWeight: 800 }}>Staff</a>
          )}
          <a href="/catalog" style={{ color: '#ccc', fontSize: 12, textDecoration: 'none' }}>Catalog</a>
          <a
            href="/catalog"
            style={{
              color: '#04140c',
              background: '#19d37e',
              fontSize: 12,
              fontWeight: 800,
              textDecoration: 'none',
              borderRadius: 999,
              padding: '6px 12px',
            }}
          >
            Exit
          </a>
        </div>
      </div>

      {picker && (
        <div
          style={{
            position: 'fixed',
            zIndex: 31,
            top: BAR,
            left: 0,
            right: 0,
            padding: 12,
            background: 'rgba(9,9,11,.97)',
            color: '#fff',
            borderBottom: '1px solid rgba(255,255,255,.12)',
          }}
        >
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            {live.map((g) => (
              <a
                key={g.id}
                href={`/play/${g.id}`}
                onClick={() => setPicker(false)}
                style={{
                  flex: '0 0 92px',
                  border: g.id === game.id ? '2px solid #19d37e' : '1px solid #333',
                  borderRadius: 12,
                  overflow: 'hidden',
                  color: '#fff',
                  textDecoration: 'none',
                  fontSize: 10,
                }}
              >
                <img src={g.img} alt="" style={{ width: '100%', height: 56, objectFit: 'cover', display: 'block' }} />
                <div style={{ padding: 4 }}>{g.name}</div>
              </a>
            ))}
          </div>
        </div>
      )}

      <iframe
        title={game.name}
        src={src}
        allow="clipboard-write; fullscreen; autoplay; gamepad"
        allowFullScreen
        style={{
          position: 'fixed',
          top: BAR,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: `calc(100% - ${BAR}px)`,
          border: 0,
          background: '#000',
        }}
      />
    </div>
  );
}
