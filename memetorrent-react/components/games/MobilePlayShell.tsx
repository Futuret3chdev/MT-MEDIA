'use client';

import { useMemo, useState } from 'react';
import type { CatalogGame } from '@/lib/mt-catalog';

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

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000' }}>
      <iframe
        title={game.name}
        src={src}
        allow="clipboard-write; fullscreen; autoplay; gamepad"
        allowFullScreen
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          border: 0,
          background: '#000',
        }}
      />
      <button
        type="button"
        onClick={() => setPicker((v) => !v)}
        style={{
          position: 'fixed',
          zIndex: 20,
          top: 8,
          left: 8,
          fontSize: 11,
          fontWeight: 700,
          background: 'rgba(0,0,0,.75)',
          color: '#fff',
          border: '1px solid rgba(255,255,255,.25)',
          borderRadius: 999,
          padding: '6px 12px',
        }}
      >
        Games
      </button>
      {picker && (
        <div
          style={{
            position: 'fixed',
            zIndex: 21,
            top: 40,
            left: 0,
            right: 0,
            padding: 12,
            background: 'rgba(9,9,11,.95)',
            color: '#fff',
          }}
        >
          <a href="/catalog" style={{ color: '#ccc', fontSize: 12 }}>
            ← Catalog
          </a>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginTop: 8 }}>
            {live.map((g) => (
              <a
                key={g.id}
                href={`/play/${g.id}`}
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
    </div>
  );
}
