'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Title = { id: number; name: string; blurb: string; play_url: string; kind: string };

export default function StudioPage() {
  const [authed, setAuthed] = useState(false);
  const [who, setWho] = useState('');
  const [titles, setTitles] = useState<Title[]>([]);
  const [name, setName] = useState('');
  const [blurb, setBlurb] = useState('');
  const [play, setPlay] = useState('');
  const [kind, setKind] = useState('arcade');
  const [msg, setMsg] = useState('');

  const load = () => {
    fetch('/api/studio/titles', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        setAuthed(!!d.ok);
        setTitles(d.titles || []);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetch('/api/portal/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        setAuthed(!!d.user);
        setWho(d.user?.username || '');
      });
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    const res = await fetch('/api/studio/titles', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, blurb, play_url: play, kind }),
    });
    const data = await res.json();
    if (!data.ok) {
      setMsg(data.error || 'Could not publish');
      return;
    }
    setName('');
    setBlurb('');
    setPlay('');
    setMsg('Saved to your studio list.');
    load();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex flex-wrap gap-4 text-sm mb-6">
        <Link href="/" className="opacity-70 hover:opacity-100">← Home</Link>
        <Link href="/catalog" className="opacity-70 hover:opacity-100">← Games</Link>
      </div>
      <div className="uppercase text-xs tracking-[3px] text-emerald-400 mb-2">MT Game Studio</div>
      <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-1.6px] mb-3">
        Web studio. Use it here.
      </h1>
      <p className="opacity-70 max-w-2xl mb-6 text-sm">
        You are on macOS — this page <b>is</b> the web version. Sign in, list a title,
        or grab the Mac app if you want a dock icon.
        {who ? ` Signed in as ${who}.` : ''}
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
        <a href="#publisher" className="rounded-2xl p-4 border border-emerald-400/40">
          <div className="text-[11px] text-emerald-400 uppercase">Now</div>
          <div className="font-semibold">Web</div>
          <p className="text-xs opacity-70 mt-1">This page. No install.</p>
        </a>
        <a href="/downloads/MTStudio-macos.zip" className="rounded-2xl p-4 border border-white/10">
          <div className="text-[11px] text-emerald-400 uppercase">Now</div>
          <div className="font-semibold">macOS</div>
          <p className="text-xs opacity-70 mt-1">Apple Silicon zip. Right-click → Open first time.</p>
        </a>
        <a href="/downloads/MTStudio-macos-intel.zip" className="rounded-2xl p-4 border border-white/10">
          <div className="text-[11px] text-emerald-400 uppercase">Now</div>
          <div className="font-semibold">macOS Intel</div>
          <p className="text-xs opacity-70 mt-1">Older Macs.</p>
        </a>
        <a href="/downloads/MTStudio.exe" className="rounded-2xl p-4 border border-white/10">
          <div className="text-[11px] text-emerald-400 uppercase">Now</div>
          <div className="font-semibold">Windows</div>
          <p className="text-xs opacity-70 mt-1">MTStudio.exe</p>
        </a>
      </div>

      <section id="publisher" className="rounded-2xl border border-white/10 p-5 sm:p-6 mb-8">
        <h2 className="font-semibold text-xl mb-3">Publish a title</h2>
        {!authed ? (
          <p className="text-sm opacity-70">
            Use the account icon to sign in, then this form unlocks. Same portal as the rest of the site.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-3 max-w-xl">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Game name"
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-sm"
            />
            <input
              required
              value={play}
              onChange={(e) => setPlay(e.target.value)}
              placeholder="Play URL (https://…)"
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-sm"
            />
            <textarea
              value={blurb}
              onChange={(e) => setBlurb(e.target.value)}
              placeholder="Short blurb"
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-sm min-h-[80px]"
            />
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-sm"
            >
              <option value="arcade">arcade</option>
              <option value="p2e">p2e</option>
              <option value="action">action</option>
              <option value="multiplayer">multiplayer</option>
            </select>
            <button className="font-semibold text-black bg-emerald-400 px-4 py-2 rounded-full text-sm">
              Save to my studio
            </button>
            {msg && <div className="text-sm opacity-70">{msg}</div>}
          </form>
        )}
      </section>

      {!!titles.length && (
        <section>
          <h2 className="font-semibold text-xl mb-3">Your titles</h2>
          <ul className="space-y-2">
            {titles.map((t) => (
              <li key={t.id} className="rounded-xl border border-white/10 p-3 flex justify-between gap-3">
                <div>
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-xs opacity-60">{t.kind} · {t.blurb}</div>
                </div>
                <a href={t.play_url} className="text-sm text-emerald-400 shrink-0">
                  Play
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
