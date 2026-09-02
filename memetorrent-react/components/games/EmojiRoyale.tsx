'use client';

import { useEffect, useState } from 'react';
import NightAward from '@/components/games/NightAward';

type Round = {
  id: number;
  status: 'guess' | 'reveal';
  emojis: string;
  hint: string;
  answer: string;
  ends_in: number;
  locked: boolean;
  locked_n: number;
  locked_names: string[];
  winners: string[];
  my_guess: string;
};
type BoardRow = { username: string; score: number };

export default function EmojiRoyale() {
  const [handle, setHandle] = useState('');
  const [prize, setPrize] = useState('');
  const [note, setNote] = useState('');
  const [live, setLive] = useState(false);
  const [staff, setStaff] = useState(false);
  const [round, setRound] = useState<Round | null>(null);
  const [board, setBoard] = useState<BoardRow[]>([]);
  const [guess, setGuess] = useState('');
  const [msg, setMsg] = useState('One card. Whole room. Lock before the clock dies.');
  const [flash, setFlash] = useState('');
  const [desk, setDesk] = useState(false);
  const [pin, setPin] = useState('');
  const [pw, setPw] = useState('');
  const [prizeDraft, setPrizeDraft] = useState('');
  const [noteDraft, setNoteDraft] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('mt-royale-name') || '';
    setHandle(saved);
    fetch('/api/portal/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (d.user?.username) {
          setHandle(d.user.username);
          localStorage.setItem('mt-royale-name', d.user.username);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let on = true;
    const pull = () => {
      const q = handle ? `?as=${encodeURIComponent(handle)}` : '';
      fetch('/api/games/royale' + q, { credentials: 'include' })
        .then((r) => r.json())
        .then((d) => {
          if (!on) return;
          setPrize(d.prize || '');
          setNote(d.note || '');
          setLive(!!d.live);
          setStaff(!!d.staff);
          setRound(d.round || null);
          setBoard(d.board || []);
          if (d.staff && !prizeDraft) setPrizeDraft(d.prize || '');
          if (d.staff && !noteDraft) setNoteDraft(d.note || '');
        })
        .catch(() => {});
    };
    pull();
    const t = setInterval(pull, 900);
    return () => {
      on = false;
      clearInterval(t);
    };
  }, [handle]);

  async function lock(e: React.FormEvent) {
    e.preventDefault();
    if (!handle.trim()) {
      setMsg('Pick a handle (or sign in) so the room can see you.');
      return;
    }
    localStorage.setItem('mt-royale-name', handle.trim());
    const res = await fetch('/api/games/royale', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'lock', name: handle.trim(), guess }),
    });
    const d = await res.json();
    if (!d.ok) {
      setMsg(d.error || 'Too late');
      return;
    }
    setMsg('Locked. Wait for the drop.');
    setGuess('');
  }

  async function staffCall(action: string, extra: Record<string, unknown> = {}) {
    const res = await fetch('/api/games/royale', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, pin, password: pw, ...extra }),
    });
    return res.json();
  }

  return (
    <div className="relative">
      {flash && (
        <div className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center text-emerald-400 text-7xl sm:text-9xl font-black tracking-widest drop-shadow-[0_0_28px_#19d37e]">
          {flash}
        </div>
      )}

      {prize && (
        <div className="mb-5 rounded-2xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 font-semibold text-emerald-300">
          Room prize: {prize}
          {note && <span className="block text-sm font-normal text-white/60 mt-1">{note}</span>}
        </div>
      )}

      <div className="grid lg:grid-cols-[1.4fr_.8fr] gap-6">
        <div className="rounded-[28px] border border-white/10 bg-gradient-to-b from-emerald-400/15 to-black/70 p-6 sm:p-10 text-center min-h-[360px]">
          {!live && (
            <div className="py-16">
              <div className="text-5xl mb-4">🟢🏟️</div>
              <h2 className="text-2xl font-semibold">Arena dark</h2>
              <p className="opacity-60 mt-2">Staff hit Live when the room is ready.</p>
            </div>
          )}
          {live && !round && (
            <div className="py-16 opacity-70">Waiting for the first card…</div>
          )}
          {live && round && (
            <>
              <div className="flex justify-between text-xs uppercase tracking-[2px] opacity-50 mb-4">
                <span>{round.status === 'guess' ? 'Lock in' : 'Reveal'}</span>
                <span className="text-emerald-400 text-lg font-black tabular-nums">{round.ends_in}s</span>
              </div>
              <div className="text-6xl sm:text-8xl leading-tight mb-6">{round.emojis}</div>
              {round.status === 'guess' && !round.locked && (
                <form onSubmit={lock} className="max-w-md mx-auto flex flex-col gap-3">
                  <input
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="Handle"
                    className="rounded-full bg-black/40 border border-white/15 px-4 py-2 text-center"
                  />
                  <input
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    placeholder="Your lock"
                    className="rounded-full bg-black/50 border border-emerald-400/40 px-5 py-3 text-center text-lg"
                    autoComplete="off"
                  />
                  <button className="rounded-full bg-emerald-400 text-black font-black py-3">LOCK</button>
                </form>
              )}
              {round.status === 'guess' && round.locked && (
                <p className="text-emerald-300 font-semibold">You’re in. {round.locked_n} locked.</p>
              )}
              {round.status === 'reveal' && (
                <div>
                  <div className="text-3xl font-black text-emerald-400 mb-2">{round.answer}</div>
                  {round.hint && <p className="opacity-50 text-sm mb-3">{round.hint}</p>}
                  <p className="text-sm">
                    {round.winners.length
                      ? `Hit: ${round.winners.join(', ')}`
                      : 'Nobody hit it. Next card incoming.'}
                  </p>
                  {round.winners.length >= 3 && (
                    <button
                      type="button"
                      className="mt-3 text-emerald-400 font-black"
                      onClick={() => {
                        setFlash('$MT');
                        setTimeout(() => setFlash(''), 700);
                      }}
                    >
                      $MT
                    </button>
                  )}
                </div>
              )}
              <p className="mt-5 text-sm opacity-60">{msg}</p>
              {!!round.locked_names.length && (
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {round.locked_names.map((n) => (
                    <span key={n} className="text-[11px] px-2 py-1 rounded-full bg-white/5 border border-white/10">
                      {n}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <aside className="rounded-3xl border border-white/10 p-5 bg-black/40 space-y-4">

          <div className="text-[11px] uppercase tracking-[2px] text-emerald-400 mb-3">Tonight</div>
          {!board.length && <p className="text-sm opacity-50">No hits yet.</p>}
          <ol className="space-y-1 text-sm">
            {board.map((r, i) => (
              <li key={r.username} className="flex justify-between">
                <span>
                  <span className="opacity-40 mr-2">{i + 1}</span>
                  {r.username}
                </span>
                <span className="font-mono text-emerald-400">{r.score}</span>
              </li>
            ))}
          </ol>
          <a href="/boards?game=emoji-royale" className="block mt-4 text-xs text-emerald-400">
            All-time royale board →
          </a>
        </aside>
      </div>

      <div className="mt-10 border-t border-white/10 pt-5">
        <button type="button" onClick={() => setDesk((v) => !v)} className="text-xs uppercase tracking-[2px] opacity-40">
          Staff desk
        </button>
        {desk && (
          <div className="mt-3 max-w-lg rounded-2xl border border-white/10 p-4 space-y-2 bg-black/50">
            {!staff ? (
              <>
                <input value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Staff pin" className="w-full rounded-lg bg-white/5 border border-white/15 px-3 py-2" />
                <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Staff password" className="w-full rounded-lg bg-white/5 border border-white/15 px-3 py-2" />
                <button
                  type="button"
                  className="rounded-full bg-emerald-400 text-black font-bold px-4 py-2"
                  onClick={async () => {
                    const d = await staffCall('login');
                    if (d.ok) setStaff(true);
                    else setMsg(d.error || 'No');
                  }}
                >
                  Open desk
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-emerald-300">Desk live. You run the arena.</p>
                <input value={prizeDraft} onChange={(e) => setPrizeDraft(e.target.value)} placeholder="Prize" className="w-full rounded-lg bg-white/5 border border-white/15 px-3 py-2" />
                <input value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} placeholder="Note" className="w-full rounded-lg bg-white/5 border border-white/15 px-3 py-2" />
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="rounded-full bg-emerald-400 text-black font-bold px-4 py-2" onClick={() => staffCall('prize', { prize: prizeDraft, note: noteDraft })}>
                    Save prize
                  </button>
                  <button type="button" className="rounded-full border border-white/20 px-4 py-2" onClick={() => staffCall('live', { live: !live })}>
                    {live ? 'Kill live' : 'Go live'}
                  </button>
                  <button type="button" className="rounded-full border border-white/20 px-4 py-2" onClick={() => staffCall('next')}>
                    Next card
                  </button>
                  <button type="button" className="rounded-full border border-white/20 px-4 py-2" onClick={() => staffCall('reset')}>
                    Reset night
                  </button>
                </div>
                <NightAward names={board.map((b) => b.username)} />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
