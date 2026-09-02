'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import MapEditor from '@/components/studio/MapEditor';
import PlatformPlay from '@/components/studio/PlatformPlay';
import { TILE, blankMap, idx, type MapSpec, type ThemeId, type TileId } from '@/lib/studio-map';
import RequireLogin from '@/components/auth/RequireLogin';

type Title = { id: number; name: string; blurb: string; play_url: string };

export default function StudioPage() {
  return (
    <RequireLogin next="/studio/maker">
      <MakerInner />
    </RequireLogin>
  );
}

function MakerInner() {
  const [authed, setAuthed] = useState(false);
  const [who, setWho] = useState('');
  const [titles, setTitles] = useState<Title[]>([]);
  const [spec, setSpec] = useState<MapSpec>(blankMap());
  const [brush, setBrush] = useState<TileId>(TILE.ground);
  const [mode, setMode] = useState<'edit' | 'play'>('edit');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch('/api/portal/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        setAuthed(!!d.user);
        setWho(d.user?.username || '');
      });
    fetch('/api/studio/titles', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setTitles(d.titles || []);
      });
  }, []);

  const paint = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= spec.cols || y >= spec.rows) return;
    setSpec((s) => {
      const tiles = s.tiles.slice();
      if (brush === TILE.spawn) {
        for (let i = 0; i < tiles.length; i++) if (tiles[i] === TILE.spawn) tiles[i] = TILE.empty;
      }
      tiles[idx(s, x, y)] = brush;
      return { ...s, tiles };
    });
  };

  const save = async () => {
    setMsg('');
    const res = await fetch('/api/studio/titles', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: spec.name,
        blurb: spec.blurb,
        kind: 'platformer',
        config: spec,
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      setMsg(data.error || 'Could not save');
      return;
    }
    setMsg('Saved. Share the Play link.');
    if (data.play_url) {
      setTitles((t) => [{ id: data.id, name: spec.name, blurb: spec.blurb, play_url: data.play_url }, ...t]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-wrap gap-4 text-sm mb-4">
        <Link href="/studio" className="opacity-70 hover:opacity-100">← Studio SDK</Link>
        <Link href="/" className="opacity-70 hover:opacity-100">← Home</Link>
        <Link href="/catalog" className="opacity-70 hover:opacity-100">← Games</Link>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
        <div>
          <div className="uppercase text-xs tracking-[3px] text-emerald-400 mb-1">Optional kit</div>
          <h1 className="text-3xl font-semibold tracking-tight">Prototype maker</h1>
          <p className="text-sm opacity-70 mt-1">
            Paint a stage, drop coins and enemies, press Play. This is how you make the game.
            {who ? ` ${who}` : ' Sign in to save.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('edit')}
            className={`px-4 py-2 rounded-full text-sm ${mode === 'edit' ? 'bg-white text-black' : 'border border-white/15'}`}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setMode('play')}
            className={`px-4 py-2 rounded-full text-sm ${mode === 'play' ? 'bg-emerald-400 text-black font-semibold' : 'border border-white/15'}`}
          >
            Play
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[240px_1fr] gap-5">
        <div className="space-y-3 text-sm">
          <label className="block">
            Title
            <input value={spec.name} onChange={(e) => setSpec({ ...spec, name: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15" />
          </label>
          <label className="block">
            Blurb
            <input value={spec.blurb} onChange={(e) => setSpec({ ...spec, blurb: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15" />
          </label>
          <label className="block">
            Theme
            <select
              value={spec.theme}
              onChange={(e) => setSpec({ ...spec, theme: e.target.value as ThemeId })}
              className="mt-1 w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15"
            >
              <option value="night">Night</option>
              <option value="forest">Forest</option>
              <option value="city">City</option>
              <option value="space">Space</option>
            </select>
          </label>
          <label className="block">Speed {spec.speed.toFixed(1)}
            <input type="range" min={2} max={6} step={0.1} value={spec.speed} onChange={(e) => setSpec({ ...spec, speed: Number(e.target.value) })} className="w-full" />
          </label>
          <label className="block">Jump {spec.jump.toFixed(1)}
            <input type="range" min={6} max={13} step={0.1} value={spec.jump} onChange={(e) => setSpec({ ...spec, jump: Number(e.target.value) })} className="w-full" />
          </label>
          <label className="block">Gravity {spec.gravity.toFixed(2)}
            <input type="range" min={0.25} max={0.9} step={0.05} value={spec.gravity} onChange={(e) => setSpec({ ...spec, gravity: Number(e.target.value) })} className="w-full" />
          </label>
          <button type="button" onClick={() => setSpec(blankMap())} className="w-full border border-white/15 rounded-full py-2">
            Reset sample level
          </button>
          <button
            type="button"
            disabled={!authed}
            onClick={save}
            className="w-full font-semibold text-black bg-emerald-400 disabled:opacity-40 rounded-full py-2"
          >
            Save & get play link
          </button>
          {msg && <div className="opacity-70">{msg}</div>}
        </div>
        <div>
          {mode === 'edit' ? (
            <MapEditor spec={spec} brush={brush} onPaint={paint} />
          ) : (
            <PlatformPlay key={JSON.stringify(spec.tiles) + spec.theme} spec={spec} />
          )}
        </div>
      </div>

      {!!titles.length && (
        <div className="mt-10">
          <h2 className="font-semibold text-xl mb-3">Your games</h2>
          <ul className="space-y-2">
            {titles.map((t) => (
              <li key={String(t.id)} className="rounded-xl border border-white/10 p-3 flex justify-between gap-3">
                <div>
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-xs opacity-60">{t.blurb}</div>
                </div>
                {t.play_url && (
                  <Link href={t.play_url} className="text-sm text-emerald-400">
                    Play
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
