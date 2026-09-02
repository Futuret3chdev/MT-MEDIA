'use client';

import { useEffect, useState } from 'react';


type Round = {
  id: number;
  status: string;
  glyphs: string;
  answer: string;
  ends_in: number;
  locked: boolean;
  locked_names: string[];
  winners: string[];
};

export default function SignalDesk() {
  const [handle, setHandle] = useState('');
  const [guess, setGuess] = useState('');
  const [round, setRound] = useState<Round | null>(null);
  const [board, setBoard] = useState<{ username: string; score: number }[]>([]);
  const [msg, setMsg] = useState('Read the tape.');

  useEffect(() => {
    const s = localStorage.getItem('mt-signal-name') || '';
    setHandle(s);
    fetch('/api/portal/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (d.user?.username) {
          setHandle(d.user.username);
          localStorage.setItem('mt-signal-name', d.user.username);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const pull = () => {
      const q = handle ? `?as=${encodeURIComponent(handle)}` : '';
      fetch('/api/games/signal' + q, { credentials: 'include' })
        .then((r) => r.json())
        .then((d) => {
          setRound(d.round || null);
          setBoard(d.board || []);
        })
        .catch(() => {});
    };
    pull();
    const t = setInterval(pull, 900);
    return () => clearInterval(t);
  }, [handle]);

  async function lock(e: React.FormEvent) {
    e.preventDefault();
    localStorage.setItem('mt-signal-name', handle.trim());
    const res = await fetch('/api/games/signal', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: handle.trim(), guess }),
    });
    const d = await res.json();
    setMsg(d.ok ? 'Locked.' : d.error || 'Closed');
    if (d.ok) setGuess('');
  }

  return (
    <div>
      <div className="grid lg:grid-cols-[1.3fr_.7fr] gap-6">
        <div className="rounded-[28px] border border-white/10 bg-gradient-to-b from-amber-400/10 to-black/70 p-8 text-center">
          {!round && <p className="py-16 opacity-60">Waiting on the next signal…</p>}
          {round && (
            <>
              <div className="flex justify-between text-xs uppercase tracking-[2px] opacity-50 mb-4">
                <span>{round.status === 'guess' ? 'Call it' : 'Print'}</span>
                <span className="text-emerald-400 text-xl font-black">{round.ends_in}s</span>
              </div>
              <div className="text-6xl sm:text-8xl mb-6">{round.glyphs}</div>
              {round.status === 'guess' && !round.locked && (
                <form onSubmit={lock} className="max-w-sm mx-auto flex flex-col gap-2">
                  <input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="Handle" className="rounded-full bg-black/40 border border-white/15 px-4 py-2 text-center" />
                  <input value={guess} onChange={(e) => setGuess(e.target.value)} placeholder="BTC / SOL / $MT…" className="rounded-full bg-black/50 border border-emerald-400/40 px-4 py-3 text-center text-lg uppercase" />
                  <button className="rounded-full bg-emerald-400 text-black font-black py-3">LOCK TICKER</button>
                </form>
              )}
              {round.locked && round.status === 'guess' && <p className="text-emerald-300 font-semibold">You’re on the tape.</p>}
              {round.status === 'reveal' && (
                <div>
                  <div className="text-4xl font-black text-emerald-400">{round.answer.toUpperCase()}</div>
                  <p className="mt-2 text-sm opacity-70">{round.winners.length ? `Hit: ${round.winners.join(', ')}` : 'Nobody printed.'}</p>
                </div>
              )}
              <p className="mt-4 text-sm opacity-50">{msg}</p>
            </>
          )}
        </div>
        <aside className="space-y-4">

          <div className="rounded-3xl border border-white/10 p-4 bg-black/40">
            <div className="text-[11px] uppercase tracking-[2px] text-emerald-400 mb-2">Tonight</div>
            <ol className="text-sm space-y-1">
              {board.map((r, i) => (
                <li key={r.username} className="flex justify-between">
                  <span>{i + 1}. {r.username}</span>
                  <span className="text-emerald-400 font-mono">{r.score}</span>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>

    </div>
  );
}
