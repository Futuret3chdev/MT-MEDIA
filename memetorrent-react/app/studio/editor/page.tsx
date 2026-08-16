'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import MapEditor from '@/components/studio/MapEditor';
import PlatformPlay from '@/components/studio/PlatformPlay';
import { TILE, blankMap, idx, type MapSpec, type ThemeId, type TileId } from '@/lib/studio-map';
import RequireLogin from '@/components/auth/RequireLogin';

const WHEN = [
  'Player touches Coin',
  'Player touches Spike',
  'Player touches Exit',
  'Player jumps on Enemy',
  'Score reaches 10',
];
const THEN = ['Add 1 to Score', 'Restart scene', 'Win the game', 'Remove Enemy', 'Play sound'];

export default function StudioEditorPage() {
  return (
    <RequireLogin next="/studio/editor">
      <EditorInner />
    </RequireLogin>
  );
}

function EditorInner() {
  const [authed, setAuthed] = useState(false);
  const [spec, setSpec] = useState<MapSpec>(blankMap());
  const [brush, setBrush] = useState<TileId>(TILE.ground);
  const [tab, setTab] = useState<'scene' | 'events' | 'preview'>('scene');
  const [msg, setMsg] = useState('');
  const [sel, setSel] = useState<string>('Ground');

  useEffect(() => {
    fetch('/api/portal/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setAuthed(!!d.user));
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
      body: JSON.stringify({ name: spec.name, blurb: spec.blurb, kind: 'platformer', config: spec }),
    });
    const data = await res.json();
    if (!data.ok) {
      setMsg(data.error || 'Save failed');
      return;
    }
    setMsg(data.play_url ? `Saved · ${data.play_url}` : 'Saved');
  };

  const events = spec.events || [];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#12141a] text-[#e8eaf0]">
      <div className="border-b border-white/10 flex flex-wrap items-center gap-2 px-3 py-2 text-xs">
        <Link href="/" className="opacity-60 hover:opacity-100">
          ← Home
        </Link>
        <Link href="/studio" className="opacity-60 hover:opacity-100">
          ← Studio
        </Link>
        <span className="opacity-30 hidden sm:inline">/</span>
        <input
          value={spec.name}
          onChange={(e) => setSpec({ ...spec, name: e.target.value })}
          className="bg-transparent font-semibold w-28 sm:w-40 outline-none"
        />
        <div className="flex-1 min-w-2" />
        <button
          type="button"
          onClick={() => setTab('preview')}
          className="px-3 py-2 rounded-md bg-emerald-400 text-black font-semibold min-h-[40px]"
        >
          Preview
        </button>
        <button
          type="button"
          disabled={!authed}
          onClick={save}
          className="px-3 py-2 rounded-md border border-white/20 disabled:opacity-40 min-h-[40px]"
        >
          Save
        </button>
        {msg && <span className="opacity-50 w-full sm:w-auto max-w-full truncate">{msg}</span>}
      </div>

      <div className="grid lg:grid-cols-[200px_1fr_240px] min-h-[calc(100vh-8rem)]">
        <aside className="border-b lg:border-b-0 lg:border-r border-white/10 p-3 text-sm">
          <div className="flex lg:block gap-2 overflow-x-auto pb-1">
          <div className="text-[10px] uppercase tracking-wider opacity-40 mb-2 hidden lg:block">Project</div>
          <button type="button" onClick={() => setTab('scene')} className={`shrink-0 px-3 py-2 rounded ${tab === 'scene' ? 'bg-white/10' : ''}`}>
            Scene
          </button>
          <button type="button" onClick={() => setTab('events')} className={`shrink-0 px-3 py-2 rounded ${tab === 'events' ? 'bg-white/10' : ''}`}>
            Events
          </button>
          <button type="button" onClick={() => setTab('preview')} className={`shrink-0 px-3 py-2 rounded ${tab === 'preview' ? 'bg-white/10' : ''}`}>
            Preview
          </button>
          </div>
          <div className="text-[10px] uppercase tracking-wider opacity-40 mt-3 mb-2">Objects</div>
          {['Ground', 'Spike', 'Coin', 'Start', 'Exit', 'Enemy', 'Spring'].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                setSel(n);
                const map: Record<string, TileId> = {
                  Ground: TILE.ground,
                  Spike: TILE.hazard,
                  Coin: TILE.coin,
                  Start: TILE.spawn,
                  Exit: TILE.exit,
                  Enemy: TILE.enemy,
                  Spring: TILE.spring,
                };
                setBrush(map[n]);
                setTab('scene');
              }}
              className={`inline-block lg:block mr-1 lg:mr-0 px-2 py-1.5 rounded ${sel === n ? 'text-emerald-400' : 'opacity-70'}`}
            >
              {n}
            </button>
          ))}
        </aside>

        <section className="p-3 overflow-auto bg-[#0d0f14]">
          {tab === 'scene' && (
            <MapEditor spec={spec} brush={brush} onBrush={setBrush} onPaint={paint} />
          )}
          {tab === 'preview' && (
            <PlatformPlay key={JSON.stringify(spec.tiles) + spec.theme} spec={spec} />
          )}
          {tab === 'events' && (
            <div className="space-y-2">
              <div className="text-xs opacity-50 mb-2">When · Then</div>
              {events.map((ev, i) => (
                <div key={i} className="flex flex-wrap gap-2 items-center bg-white/5 rounded-lg p-2 text-xs">
                  <span className="opacity-40">If</span>
                  <select
                    value={ev.when}
                    onChange={(e) => {
                      const next = events.slice();
                      next[i] = { ...ev, when: e.target.value };
                      setSpec({ ...spec, events: next });
                    }}
                    className="bg-black/40 border border-white/15 rounded px-2 py-1"
                  >
                    {WHEN.map((w) => (
                      <option key={w}>{w}</option>
                    ))}
                  </select>
                  <span className="opacity-40">then</span>
                  <select
                    value={ev.do}
                    onChange={(e) => {
                      const next = events.slice();
                      next[i] = { ...ev, do: e.target.value };
                      setSpec({ ...spec, events: next });
                    }}
                    className="bg-black/40 border border-white/15 rounded px-2 py-1"
                  >
                    {THEN.map((w) => (
                      <option key={w}>{w}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="opacity-40 ml-auto"
                    onClick={() => setSpec({ ...spec, events: events.filter((_, j) => j !== i) })}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="text-xs text-emerald-400"
                onClick={() =>
                  setSpec({ ...spec, events: [...events, { when: WHEN[0], do: THEN[0] }] })
                }
              >
                + Add event
              </button>
            </div>
          )}
        </section>

        <aside className="border-t lg:border-t-0 lg:border-l border-white/10 p-3 text-sm space-y-3">
          <div className="text-[10px] uppercase tracking-wider opacity-40">Properties</div>
          <div className="opacity-70 text-xs">Selected object: {sel}</div>
          <label className="block text-xs">
            Scene name
            <input
              value={spec.name}
              onChange={(e) => setSpec({ ...spec, name: e.target.value })}
              className="mt-1 w-full px-2 py-1 rounded bg-black/40 border border-white/15"
            />
          </label>
          <label className="block text-xs">
            Theme
            <select
              value={spec.theme}
              onChange={(e) => setSpec({ ...spec, theme: e.target.value as ThemeId })}
              className="mt-1 w-full px-2 py-1 rounded bg-black/40 border border-white/15"
            >
              <option value="night">Night</option>
              <option value="forest">Forest</option>
              <option value="city">City</option>
              <option value="space">Space</option>
            </select>
          </label>
          <label className="block text-xs">
            Speed {spec.speed.toFixed(1)}
            <input type="range" min={2} max={6} step={0.1} value={spec.speed} onChange={(e) => setSpec({ ...spec, speed: Number(e.target.value) })} className="w-full" />
          </label>
          <label className="block text-xs">
            Jump {spec.jump.toFixed(1)}
            <input type="range" min={6} max={13} step={0.1} value={spec.jump} onChange={(e) => setSpec({ ...spec, jump: Number(e.target.value) })} className="w-full" />
          </label>
          <label className="block text-xs">
            Gravity {spec.gravity.toFixed(2)}
            <input type="range" min={0.25} max={0.9} step={0.05} value={spec.gravity} onChange={(e) => setSpec({ ...spec, gravity: Number(e.target.value) })} className="w-full" />
          </label>
          <div className="text-[10px] opacity-40">
            {spec.cols}×{spec.rows} tiles · click and drag to paint
          </div>
        </aside>
      </div>
    </div>
  );
}
