'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CatalogGame } from '@/lib/mt-catalog';

const BAR = 40;

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
  const live = useMemo(
    () => games.filter((g) => g.status === 'live' && g.id !== 'mtgames'),
    [games],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPicker(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000' }}>
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
          gap: 10,
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
          }}
        >
          {picker ? 'Close' : 'Games'}
        </button>
        <span style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {game.name}
        </span>
        <a href="/catalog" style={{ marginLeft: 'auto', color: '#ccc', fontSize: 12, textDecoration: 'none' }}>
          Catalog
        </a>
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
