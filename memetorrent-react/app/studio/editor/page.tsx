'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import MapEditor from '@/components/studio/MapEditor';
import PlatformPlay from '@/components/studio/PlatformPlay';
import { BRUSHES, TILE, blankMap, idx, type MapSpec, type ThemeId, type TileId } from '@/lib/studio-map';
import RequireLogin from '@/components/auth/RequireLogin';

const WHEN = [
  'Player touches Coin',
  'Player touches Spike',
  'Player touches Exit',
  'Player jumps on Enemy',
  'Score reaches 10',
];
const THEN = ['Add 1 to Score', 'Restart scene', 'Win the game', 'Remove Enemy', 'Play sound'];

type Title = { id: number; name: string; blurb: string; play_url: string; config?: string | MapSpec | null };

function flood(spec: MapSpec, x: number, y: number, to: TileId): MapSpec {
  const from = spec.tiles[idx(spec, x, y)] as TileId;
  if (from === to) return spec;
  const tiles = spec.tiles.slice();
  const stack = [[x, y]];
  while (stack.length) {
    const [cx, cy] = stack.pop()!;
    if (cx < 0 || cy < 0 || cx >= spec.cols || cy >= spec.rows) continue;
    const i = idx(spec, cx, cy);
    if (tiles[i] !== from) continue;
    tiles[i] = to;
    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }
  return { ...spec, tiles };
}

function resizeMap(spec: MapSpec, cols: number, rows: number): MapSpec {
  cols = Math.max(16, Math.min(80, cols));
  rows = Math.max(10, Math.min(32, rows));
  const tiles = new Array(cols * rows).fill(TILE.empty);
  for (let y = 0; y < Math.min(rows, spec.rows); y++) {
    for (let x = 0; x < Math.min(cols, spec.cols); x++) {
      tiles[y * cols + x] = spec.tiles[y * spec.cols + x];
    }
  }
  return { ...spec, cols, rows, tiles };
}

function parseConfig(raw: Title['config']): MapSpec | null {
  if (!raw) return null;
  if (typeof raw === 'object') return raw as MapSpec;
  try {
    return JSON.parse(raw) as MapSpec;
  } catch {
    return null;
  }
}

export default function StudioEditorPage() {
  return (
    <RequireLogin next="/studio/editor">
      <EditorInner />
    </RequireLogin>
  );
}

function EditorInner() {
  const [spec, setSpec] = useState<MapSpec>(blankMap());
  const [brush, setBrush] = useState<TileId>(TILE.ground);
  const [tool, setTool] = useState<'paint' | 'fill' | 'pick'>('paint');
  const [tab, setTab] = useState<'scene' | 'events' | 'preview'>('scene');
  const [msg, setMsg] = useState('');
  const [titles, setTitles] = useState<Title[]>([]);
  const [titleId, setTitleId] = useState<number | null>(null);
  const [cell, setCell] = useState(18);
  const undo = useRef<number[][]>([]);
  const redo = useRef<number[][]>([]);
  const specRef = useRef(spec);
  specRef.current = spec;

  const pushUndo = (tiles: number[]) => {
    undo.current = [...undo.current.slice(-39), tiles];
    redo.current = [];
  };

  useEffect(() => {
    fetch('/api/studio/titles', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => { if (d.ok) setTitles(d.titles || []); })
      .catch(() => {});
    try {
      const raw = localStorage.getItem('mt-studio-draft');
      if (raw) {
        const d = JSON.parse(raw) as MapSpec;
        if (d?.tiles?.length) setSpec(d);
      }
    } catch { /* */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem('mt-studio-draft', JSON.stringify(spec)); } catch { /* */ }
  }, [spec]);

  const paint = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= spec.cols || y >= spec.rows) return;
    if (tool === 'pick') {
      setBrush(spec.tiles[idx(spec, x, y)] as TileId);
      setTool('paint');
      return;
    }
    if (tool === 'fill') {
      pushUndo(spec.tiles);
      setSpec((s) => flood(s, x, y, brush));
      return;
    }
    const i = idx(spec, x, y);
    if (spec.tiles[i] === brush && brush !== TILE.spawn) return;
    pushUndo(spec.tiles);
    setSpec((s) => {
      const tiles = s.tiles.slice();
      if (brush === TILE.spawn) {
        for (let k = 0; k < tiles.length; k++) if (tiles[k] === TILE.spawn) tiles[k] = TILE.empty;
      }
      tiles[idx(s, x, y)] = brush;
      return { ...s, tiles };
    });
  };

  const doUndo = useCallback(() => {
    const prev = undo.current.pop();
    if (!prev) return;
    redo.current.push(specRef.current.tiles);
    setSpec((s) => ({ ...s, tiles: prev }));
  }, []);

  const doRedo = useCallback(() => {
    const next = redo.current.pop();
    if (!next) return;
    undo.current.push(specRef.current.tiles);
    setSpec((s) => ({ ...s, tiles: next }));
  }, []);

  const save = async () => {
    setMsg('');
    const path = titleId ? `/api/studio/titles/${titleId}` : '/api/studio/titles';
    const res = await fetch(path, {
      method: titleId ? 'PUT' : 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: spec.name, blurb: spec.blurb, kind: 'platformer', config: spec }),
    });
    const data = await res.json();
    if (!data.ok) {
      setMsg(data.error || 'Save failed');
      return;
    }
    const id = Number(data.id);
    setTitleId(id);
    const play = data.play_url || `/studio/play/${id}`;
    setMsg(`Saved · ${play}`);
    setTitles((t) => {
      const row = { id, name: spec.name, blurb: spec.blurb, play_url: play };
      return [row, ...t.filter((x) => x.id !== id)];
    });
  };
  const saveRef = useRef(save);
  saveRef.current = save;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) doRedo();
        else doUndo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveRef.current();
        return;
      }
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      const n = Number(e.key);
      if (n >= 1 && n <= BRUSHES.length) {
        setBrush(BRUSHES[n - 1].id);
        setTool('paint');
      }
      if (e.key === 'b') setTool('paint');
      if (e.key === 'g') setTool('fill');
      if (e.key === 'i') setTool('pick');
      if (e.key === ' ') {
        e.preventDefault();
        setTab((t) => (t === 'preview' ? 'scene' : 'preview'));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [doUndo, doRedo]);

  const loadTitle = (t: Title) => {
    const cfg = parseConfig(t.config);
    if (cfg?.tiles) setSpec({ ...blankMap(), ...cfg, name: t.name, blurb: t.blurb || cfg.blurb });
    else setSpec((s) => ({ ...s, name: t.name, blurb: t.blurb }));
    setTitleId(t.id);
    setTab('scene');
    setMsg(`Loaded ${t.name}`);
  };

  const playUrl = titleId ? `/studio/play/${titleId}` : '';

  return (
    <div className="h-dvh flex flex-col bg-[#12141a] text-[#e8eaf0]">
      <div className="border-b border-white/10 flex flex-wrap items-center gap-2 px-3 py-2 text-xs shrink-0">
        <Link href="/studio" className="opacity-60 hover:opacity-100">
          ← Studio
        </Link>
        <input
          value={spec.name}
          onChange={(e) => setSpec({ ...spec, name: e.target.value })}
          className="bg-transparent font-semibold w-28 sm:w-44 outline-none"
        />
        <select
          className="bg-black/40 border border-white/15 rounded px-2 py-1 max-w-[140px]"
          value={titleId || ''}
          onChange={(e) => {
            const id = Number(e.target.value);
            const t = titles.find((x) => x.id === id);
            if (t) loadTitle(t);
            else {
              setTitleId(null);
              setSpec(blankMap());
            }
          }}
        >
          <option value="">New level</option>
          {titles.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <div className="flex-1 min-w-2" />
        <button type="button" onClick={doUndo} className="px-2 py-1 rounded border border-white/15">Undo</button>
        <button type="button" onClick={doRedo} className="px-2 py-1 rounded border border-white/15">Redo</button>
        <button type="button" onClick={() => setTab('preview')} className="px-3 py-2 rounded-md bg-emerald-400 text-black font-semibold min-h-[36px]">
          Play
        </button>
        <button type="button" onClick={save} className="px-3 py-2 rounded-md border border-white/20 min-h-[36px]">
          Save
        </button>
        {playUrl && (
          <Link href={playUrl} className="text-emerald-400 hidden sm:inline">
            Open play
          </Link>
        )}
        {msg && <span className="opacity-50 w-full sm:w-auto max-w-full truncate">{msg}</span>}
      </div>

      <div className="grid lg:grid-cols-[188px_1fr_220px] flex-1 min-h-0">
        <aside className="border-b lg:border-b-0 lg:border-r border-white/10 p-3 text-sm overflow-auto">
          <div className="flex lg:block gap-2 overflow-x-auto pb-1">
            {(['scene', 'events', 'preview'] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                className={`shrink-0 px-3 py-2 rounded capitalize ${tab === k ? 'bg-white/10 text-emerald-400' : 'opacity-70'}`}
              >
                {k === 'preview' ? 'Play' : k}
              </button>
            ))}
          </div>
          <div className="text-[10px] uppercase tracking-wider opacity-40 mt-3 mb-2">Brush · 1–8</div>
          {BRUSHES.map((b, i) => (
            <button
              key={b.id}
              type="button"
              onClick={() => { setBrush(b.id); setTool('paint'); setTab('scene'); }}
              className={`flex items-center gap-2 w-full text-left px-2 py-1.5 rounded ${brush === b.id && tool === 'paint' ? 'bg-white/10 text-emerald-400' : 'opacity-70'}`}
            >
              <span className="opacity-40 text-[10px] w-3">{i + 1}</span>
              {b.label}
            </button>
          ))}
          <div className="text-[10px] uppercase tracking-wider opacity-40 mt-3 mb-2">Tool</div>
          {(['paint', 'fill', 'pick'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTool(t)}
              className={`block w-full text-left px-2 py-1.5 rounded capitalize ${tool === t ? 'text-emerald-400' : 'opacity-70'}`}
            >
              {t === 'paint' ? 'Paint (B)' : t === 'fill' ? 'Fill (G)' : 'Eyedrop (I)'}
            </button>
          ))}
        </aside>

        <section className="p-3 overflow-auto bg-[#0d0f14] min-h-0">
          {tab === 'scene' && (
            <MapEditor
              spec={spec}
              brush={brush}
              cell={cell}
              onPaint={paint}
              onSample={(x, y) => {
                setBrush(spec.tiles[idx(spec, x, y)] as TileId);
                setTool('paint');
              }}
            />
          )}
          {tab === 'preview' && <PlatformPlay spec={spec} />}
          {tab === 'events' && (
            <div className="space-y-2 max-w-xl">
              <p className="text-xs opacity-50">When · Then — used by Play</p>
              {(spec.events || []).map((ev, i) => (
                <div key={i} className="flex flex-wrap gap-2 items-center bg-white/5 rounded-lg p-2 text-xs">
                  <span className="opacity-40">If</span>
                  <select
                    value={ev.when}
                    onChange={(e) => {
                      const next = (spec.events || []).slice();
                      next[i] = { ...ev, when: e.target.value };
                      setSpec({ ...spec, events: next });
                    }}
                    className="bg-black/40 border border-white/15 rounded px-2 py-1"
                  >
                    {WHEN.map((w) => <option key={w}>{w}</option>)}
                  </select>
                  <span className="opacity-40">then</span>
                  <select
                    value={ev.do}
                    onChange={(e) => {
                      const next = (spec.events || []).slice();
                      next[i] = { ...ev, do: e.target.value };
                      setSpec({ ...spec, events: next });
                    }}
                    className="bg-black/40 border border-white/15 rounded px-2 py-1"
                  >
                    {THEN.map((w) => <option key={w}>{w}</option>)}
                  </select>
                  <button type="button" className="opacity-40 ml-auto" onClick={() => setSpec({ ...spec, events: (spec.events || []).filter((_, j) => j !== i) })}>
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="text-xs text-emerald-400"
                onClick={() => setSpec({ ...spec, events: [...(spec.events || []), { when: WHEN[0], do: THEN[0] }] })}
              >
                + Add event
              </button>
            </div>
          )}
        </section>

        <aside className="border-t lg:border-t-0 lg:border-l border-white/10 p-3 text-sm space-y-3 overflow-auto">
          <div className="text-[10px] uppercase tracking-wider opacity-40">Properties</div>
          <label className="block text-xs">
            Blurb
            <input
              value={spec.blurb}
              onChange={(e) => setSpec({ ...spec, blurb: e.target.value })}
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
          <label className="block text-xs">
            Zoom {cell}px
            <input type="range" min={12} max={28} step={2} value={cell} onChange={(e) => setCell(Number(e.target.value))} className="w-full" />
          </label>
          <div className="flex gap-2 text-xs">
            <label className="flex-1">
              W
              <input type="number" min={16} max={80} value={spec.cols} onChange={(e) => setSpec((s) => resizeMap(s, Number(e.target.value), s.rows))} className="w-full px-2 py-1 rounded bg-black/40 border border-white/15" />
            </label>
            <label className="flex-1">
              H
              <input type="number" min={10} max={32} value={spec.rows} onChange={(e) => setSpec((s) => resizeMap(s, s.cols, Number(e.target.value)))} className="w-full px-2 py-1 rounded bg-black/40 border border-white/15" />
            </label>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <button type="button" className="px-2 py-1 rounded border border-white/15" onClick={() => { pushUndo(spec.tiles); setSpec(blankMap()); setTitleId(null); }}>
              New
            </button>
            <button
              type="button"
              className="px-2 py-1 rounded border border-white/15"
              onClick={() => {
                const blob = new Blob([JSON.stringify(spec, null, 2)], { type: 'application/json' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `${spec.name.replace(/\s+/g, '-').toLowerCase() || 'level'}.json`;
                a.click();
              }}
            >
              Export
            </button>
            <label className="px-2 py-1 rounded border border-white/15 cursor-pointer">
              Import
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  f.text().then((t) => {
                    try {
                      const d = JSON.parse(t) as MapSpec;
                      if (d?.tiles) setSpec({ ...blankMap(), ...d });
                    } catch { setMsg('Bad JSON'); }
                  });
                }}
              />
            </label>
          </div>
          <p className="text-[10px] opacity-40">
            {spec.cols}×{spec.rows} · drag paint · right-click sample · Ctrl+Z undo · Space play
          </p>
        </aside>
      </div>
    </div>
  );
}
