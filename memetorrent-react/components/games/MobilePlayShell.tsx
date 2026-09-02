'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CatalogGame } from '@/lib/mt-catalog';
import GameWalletBridge from '@/components/wallet/GameWalletBridge';
import PlayStaffMenu from '@/components/games/PlayStaffMenu';
import PlayWalletMenu from '@/components/games/PlayWalletMenu';

const BAR = 44;

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
    fetch('/api/portal/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => { if (d?.ok && d.user) setUser(d.user); })
      .catch(() => {});
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const next = encodeURIComponent(`/play/${game.id}`);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000' }}>
      <GameWalletBridge />
      <div className="mt-play-bar">
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
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
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, minWidth: 0 }}>
          <PlayWalletMenu />
          {user ? (
            <a href="/portal" style={{ color: '#19d37e', fontSize: 11, textDecoration: 'none' }}>@{user.username}</a>
          ) : (
            <a href={`/login?next=${next}`} style={{ color: '#ccc', fontSize: 11, textDecoration: 'none' }}>Log in</a>
          )}
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
          <PlayStaffMenu gameId={game.id} gameName={game.name} />
        </div>
      </div>

      {picker && (
        <div className="mt-play-picker">
          <div className="mt-play-picker-grid">
            {live.map((g) => (
              <a
                key={g.id}
                href={`/play/${g.id}`}
                onClick={() => setPicker(false)}
                className={`mt-play-chip${g.id === game.id ? ' is-on' : ''}`}
              >
                <img src={g.img} alt="" />
                {g.name}
              </a>
            ))}
          </div>
        </div>
      )}

      <iframe
        title={game.name}
        src={src}
        allow="clipboard-write; fullscreen; autoplay; gamepad"
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
