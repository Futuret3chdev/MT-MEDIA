'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import GameRuntime from '@/components/studio/GameRuntime';
import { TEMPLATES, defaultSpec, type StudioSpec, type StudioTemplate } from '@/lib/studio-spec';

type Title = { id: number; name: string; blurb: string; play_url: string; kind: string };

export default function StudioPage() {
  const [authed, setAuthed] = useState(false);
  const [who, setWho] = useState('');
  const [titles, setTitles] = useState<Title[]>([]);
  const [tmpl, setTmpl] = useState<StudioTemplate>('tap');
  const [spec, setSpec] = useState<StudioSpec>(defaultSpec('tap'));
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

  const pick = (id: StudioTemplate) => {
    setTmpl(id);
    setSpec(defaultSpec(id));
  };

  const set = (patch: Partial<StudioSpec>) => setSpec((s) => ({ ...s, ...patch }));

  const save = async () => {
    setMsg('');
    const res = await fetch('/api/studio/titles', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: spec.name,
        blurb: spec.blurb,
        kind: spec.template,
        config: spec,
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      setMsg(data.error || 'Could not save');
      return;
    }
    setMsg('Saved. Open Play to share it.');
    if (data.play_url) {
      const row = { id: data.id, name: spec.name, blurb: spec.blurb, play_url: data.play_url, kind: spec.template };
      setTitles((t) => [row, ...t]);
    }
  };

  const hint = useMemo(() => {
    if (spec.template === 'tap') return 'Click the green orbs.';
    if (spec.template === 'dodge') return 'A/D or arrows to dodge red blocks.';
    return 'A/D or arrows. Grab green, avoid red.';
  }, [spec.template]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-wrap gap-4 text-sm mb-6">
        <Link href="/" className="opacity-70 hover:opacity-100">← Home</Link>
        <Link href="/catalog" className="opacity-70 hover:opacity-100">← Games</Link>
      </div>
      <div className="uppercase text-xs tracking-[3px] text-emerald-400 mb-2">MT Game Studio</div>
      <h1 className="text-4xl font-semibold tracking-tight mb-2">Make a game. Play it. Save it.</h1>
      <p className="opacity-70 max-w-2xl mb-6 text-sm">
        This is the studio — not a form that asks for a URL. Pick a kit, change the rules,
        playtest on the right, save to your account.
        {who ? ` Signed in as ${who}.` : ' Sign in with 👤 to save.'}
      </p>

      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => pick(t.id)}
            className={`text-left rounded-2xl p-4 border ${
              tmpl === t.id ? 'border-emerald-400/50' : 'border-white/10'
            }`}
          >
            <div className="font-semibold">{t.title}</div>
            <div className="text-xs opacity-60 mt-1">{t.blurb}</div>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        <div className="space-y-3 text-sm">
          <label className="block">
            Name
            <input value={spec.name} onChange={(e) => set({ name: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15" />
          </label>
          <label className="block">
            Blurb
            <input value={spec.blurb} onChange={(e) => set({ blurb: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15" />
          </label>
          <label className="block">
            Speed {spec.speed}
            <input type="range" min={1} max={12} value={spec.speed} onChange={(e) => set({ speed: Number(e.target.value) })} className="w-full" />
          </label>
          <label className="block">
            Spawn {spec.spawn}
            <input type="range" min={1} max={10} value={spec.spawn} onChange={(e) => set({ spawn: Number(e.target.value) })} className="w-full" />
          </label>
          <label className="block">
            Goal {spec.goal}
            <input type="range" min={5} max={50} value={spec.goal} onChange={(e) => set({ goal: Number(e.target.value) })} className="w-full" />
          </label>
          <label className="block">
            Lives {spec.lives}
            <input type="range" min={1} max={9} value={spec.lives} onChange={(e) => set({ lives: Number(e.target.value) })} className="w-full" />
          </label>
          <div className="grid grid-cols-3 gap-2">
            <label>BG<input type="color" value={spec.bg} onChange={(e) => set({ bg: e.target.value })} className="w-full h-8" /></label>
            <label>Orbs<input type="color" value={spec.accent} onChange={(e) => set({ accent: e.target.value })} className="w-full h-8" /></label>
            <label>You<input type="color" value={spec.player} onChange={(e) => set({ player: e.target.value })} className="w-full h-8" /></label>
          </div>
          <button
            type="button"
            onClick={save}
            disabled={!authed}
            className="w-full font-semibold text-black bg-emerald-400 disabled:opacity-40 px-4 py-2 rounded-full"
          >
            Save game
          </button>
          {msg && <div className="opacity-70">{msg}</div>}
        </div>
        <div>
          <div className="text-xs opacity-50 mb-2">{hint}</div>
          <GameRuntime key={tmpl} spec={spec} />
        </div>
      </div>

      {!!titles.length && (
        <div className="mt-10">
          <h2 className="font-semibold text-xl mb-3">Your games</h2>
          <ul className="space-y-2">
            {titles.map((t) => (
              <li key={t.id} className="rounded-xl border border-white/10 p-3 flex justify-between gap-3">
                <div>
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-xs opacity-60">{t.blurb}</div>
                </div>
                {t.play_url && (
                  <Link href={t.play_url} className="text-sm text-emerald-400 shrink-0">
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
