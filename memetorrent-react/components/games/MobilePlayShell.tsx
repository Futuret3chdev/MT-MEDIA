'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CatalogGame } from '@/lib/mt-catalog';

function isPhone() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 900px), (pointer: coarse)').matches;
}

function isPortrait() {
  if (typeof window === 'undefined') return false;
  const o = (screen.orientation && screen.orientation.type) || '';
  if (o.indexOf('landscape') === 0) return false;
  if (o.indexOf('portrait') === 0) return true;
  const w = window.visualViewport?.width || window.innerWidth;
  const h = window.visualViewport?.height || window.innerHeight;
  return h > w + 24;
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
  const [phone, setPhone] = useState(false);
  const [portrait, setPortrait] = useState(false);
  const [picker, setPicker] = useState(false);

  const goFullscreen = useCallback(async () => {
    const el = document.getElementById('mt-play-shell');
    try {
      if (el && !document.fullscreenElement) await el.requestFullscreen();
    } catch {
      try {
        if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      } catch {
        /* iOS: CSS fullscreen only */
      }
    }
    try {
      const o = screen.orientation as ScreenOrientation & { lock?: (m: string) => Promise<void> };
      await o.lock?.('landscape');
    } catch {
      /* */
    }
  }, []);

  const measure = useCallback(() => {
    setPhone(isPhone());
    setPortrait(isPortrait());
    const el = document.getElementById('mt-play-shell');
    const frame = document.getElementById('mt-play-iframe') as HTMLIFrameElement | null;
    const vv = window.visualViewport;
    const w = Math.round(vv?.width || window.innerWidth);
    const h = Math.round(vv?.height || window.innerHeight);
    const left = Math.round(vv?.offsetLeft || 0);
    const top = Math.round(vv?.offsetTop || 0);
    if (el) {
      el.style.position = 'fixed';
      el.style.left = `${left}px`;
      el.style.top = `${top}px`;
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
    }
    if (frame) {
      frame.style.position = 'absolute';
      frame.style.left = '0';
      frame.style.top = '0';
      frame.style.width = `${w}px`;
      frame.style.height = `${h}px`;
    }
  }, []);

  useEffect(() => {
    const meta = document.querySelector('meta[name="viewport"]');
    const prev = meta?.getAttribute('content') || '';
    meta?.setAttribute(
      'content',
      'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
    );
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    measure();
    const vv = window.visualViewport;
    const onOrient = () => {
      setTimeout(measure, 120);
      setTimeout(measure, 320);
      setTimeout(() => {
        if (!isPortrait() && isPhone()) goFullscreen();
      }, 200);
    };
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', onOrient);
    vv?.addEventListener('resize', measure);
    vv?.addEventListener('scroll', measure);
    const onPointer = () => {
      if (!isPortrait() && isPhone()) goFullscreen();
    };
    window.addEventListener('pointerdown', onPointer, { once: true });
    return () => {
      window.removeEventListener('pointerdown', onPointer);
      meta?.setAttribute('content', prev || 'width=device-width, initial-scale=1, viewport-fit=cover');
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', onOrient);
      vv?.removeEventListener('resize', measure);
      vv?.removeEventListener('scroll', measure);
    };
  }, [measure, goFullscreen]);

  const live = useMemo(
    () => games.filter((g) => g.status === 'live' && g.id !== 'mtgames'),
    [games],
  );

  async function tryLandscape() {
    await goFullscreen();
    measure();
  }

  const showGate = phone && portrait;
  const iframe = (
    <iframe
      id="mt-play-iframe"
      src={src}
      title={game.name}
      className="block border-0 bg-black"
      allow="clipboard-write; fullscreen; autoplay; gamepad"
      allowFullScreen
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        minHeight: '100%',
        border: 0,
      }}
    />
  );

  const switcher = (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" style={{ WebkitOverflowScrolling: 'touch' }}>
      {live.map((g) => (
        <a
          key={g.id}
          href={`/play/${g.id}`}
          className={`shrink-0 rounded-xl overflow-hidden border ${
            g.id === game.id ? 'border-emerald-400' : 'border-white/15'
          }`}
          style={{ width: 92 }}
        >
          <img src={g.img} alt="" className="w-full h-14 object-cover block" />
          <div className="px-1.5 py-1 text-[10px] leading-tight truncate">{g.name}</div>
        </a>
      ))}
    </div>
  );

  const gate = showGate ? (
      <div className="absolute inset-0 z-[2] bg-[#04140c] text-white flex flex-col px-4 pt-[max(12px,env(safe-area-inset-top))] pb-[max(12px,env(safe-area-inset-bottom))]">
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
          <div className="text-5xl" aria-hidden>
            📱↪️
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{game.name}</h1>
          <p className="opacity-80 max-w-sm text-sm leading-relaxed">
            Turn your phone sideways. These tables and stages are built for <b>landscape</b>.
          </p>
          <button
            type="button"
            onClick={tryLandscape}
            className="font-semibold text-black bg-emerald-400 px-5 py-2.5 rounded-full text-sm"
          >
            Play in landscape
          </button>
          <a href="/catalog" className="text-sm opacity-70">
            ← All games
          </a>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[2px] text-emerald-400 mb-2">Switch game</div>
          {switcher}
        </div>
      </div>
  ) : null;

  return (
    <div
      id="mt-play-shell"
      className="fixed inset-0 z-[90] bg-black flex flex-col overflow-hidden"
    >
      {!showGate && phone && (
        <button
          type="button"
          onClick={() => setPicker((v) => !v)}
          className="absolute z-[5] top-2 left-2 text-[11px] font-semibold bg-black/70 border border-white/20 rounded-full px-3 py-1"
        >
          Games
        </button>
      )}
      {!showGate && !phone && (
        <button
          type="button"
          onClick={() => setPicker((v) => !v)}
          className="absolute z-[5] top-2 left-2 text-[11px] font-semibold bg-black/70 border border-white/20 rounded-full px-3 py-1"
        >
          Games
        </button>
      )}
      {picker && !showGate && (
        <div className="absolute z-[6] top-10 left-0 right-0 px-3 py-2 bg-zinc-950/95 border-b border-white/10">
          <a href="/catalog" className="text-xs opacity-80 mb-2 inline-block">← Catalog</a>
          {switcher}
        </div>
      )}
      <div className="flex-1 min-h-0 relative">
        {gate}
        {iframe}
      </div>
    </div>
  );
}
