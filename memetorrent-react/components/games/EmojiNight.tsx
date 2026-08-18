'use client';

import { useEffect, useMemo, useState } from 'react';

type Puzzle = { id: string; emojis: string; hint: string; pack: string };

export default function EmojiNight() {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [prize, setPrize] = useState('');
  const [note, setNote] = useState('');
  const [starts, setStarts] = useState('');
  const [staff, setStaff] = useState(false);
  const [idx, setIdx] = useState(0);
  const [guess, setGuess] = useState('');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [msg, setMsg] = useState('Decode the glyphs.');
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState('');
  const [done, setDone] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [desk, setDesk] = useState(false);
  const [pin, setPin] = useState('');
  const [pw, setPw] = useState('');
  const [prizeDraft, setPrizeDraft] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [startDraft, setStartDraft] = useState('');

  useEffect(() => {
    fetch('/api/games/emoji', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        const list = (d.puzzles || []) as Puzzle[];
        for (let i = list.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [list[i], list[j]] = [list[j], list[i]];
        }
        setPuzzles(list);
        setPrize(d.prize || '');
        setNote(d.note || '');
        setStarts(d.starts_at || '');
        setStaff(!!d.staff);
        setPrizeDraft(d.prize || '');
        setNoteDraft(d.note || '');
        setStartDraft(d.starts_at || '');
      })
      .catch(() => {});
  }, []);

  const p = puzzles[idx];
  const left = Math.max(0, puzzles.length - idx);

  function boom(text: string) {
    setFlash(text);
    setTimeout(() => setFlash(''), text.includes('10') || /x1\d/.test(text) ? 900 : 500);
  }

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!p || done) return;
    const res = await fetch('/api/games/emoji/check', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: p.id, guess }),
    });
    const d = await res.json().catch(() => ({}));
    if (!d.ok) {
      setShake(true);
      setStreak(0);
      setMsg(d.hint ? `Not it. Hint: ${d.hint}` : 'Not it. Try another angle.');
      setTimeout(() => setShake(false), 420);
      return;
    }
    const nextScore = score + 1;
    const nextStreak = streak + 1;
    setScore(nextScore);
    setStreak(nextStreak);
    setGuess('');
    setShowHint(false);
    setMsg('Locked in.');
    if (nextStreak >= 10) boom('$MT');
    else if (nextStreak >= 5) boom('$MT x' + nextStreak);
    else if (nextStreak >= 2) boom('$MT x' + nextStreak);
    if (idx + 1 >= puzzles.length) {
      setDone(true);
      fetch('/api/scores', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: 'emoji', score: nextScore }),
      }).catch(() => {});
    } else setIdx(idx + 1);
  }

  async function staffLogin(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/games/emoji', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', pin, password: pw }),
    });
    const d = await res.json();
    if (!d.ok) {
      setMsg(d.error || 'Staff lock failed');
      return;
    }
    setStaff(true);
    setPin('');
    setPw('');
    setMsg('Staff desk open. Set the prize.');
  }

  async function savePrize(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/games/emoji', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'prize',
        prize: prizeDraft,
        note: noteDraft,
        starts_at: startDraft,
        live: true,
      }),
    });
    const d = await res.json();
    if (!d.ok) {
      setMsg(d.error || 'Could not save');
      return;
    }
    setPrize(prizeDraft);
    setNote(noteDraft);
    setStarts(startDraft);
    setMsg('Prize updated.');
  }

  const packTone = useMemo(() => {
    if (p?.pack === 'crypto') return 'from-amber-400/20';
    if (p?.pack === 'screen') return 'from-fuchsia-500/20';
    if (p?.pack === 'mt') return 'from-emerald-400/25';
    return 'from-sky-400/15';
  }, [p]);

  return (
    <div className="relative min-h-[70vh]">
      {flash && (
        <div className="pointer-events-none fixed inset-0 z-30 flex flex-col items-center justify-center text-emerald-400">
          <div
            className={`font-black tracking-[0.12em] drop-shadow-[0_0_24px_#19d37e] ${
              flash === '$MT' ? 'text-7xl sm:text-9xl' : 'text-5xl sm:text-7xl'
            }`}
          >
            {flash}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[2px] text-emerald-400 mb-4">
        <span>Community night</span>
        {starts && <span className="text-white/70">· {starts}</span>}
        {note && <span className="normal-case tracking-normal text-white/60">· {note}</span>}
      </div>

      {prize && (
        <div className="mb-6 rounded-2xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-emerald-300 font-semibold shadow-[0_0_24px_rgba(25,211,126,.25)]">
          Tonight’s prize: {prize}
        </div>
      )}

      {!done && p && (
        <div
          className={`rounded-[28px] border border-white/10 bg-gradient-to-b ${packTone} to-black/60 p-6 sm:p-10 text-center shadow-[0_20px_80px_rgba(0,0,0,.45)] ${
            shake ? 'animate-pulse' : ''
          }`}
        >
          <div className="text-[11px] uppercase tracking-[3px] opacity-50 mb-4">
            {p.pack} · {idx + 1} / {puzzles.length}
          </div>
          <div className={`text-6xl sm:text-8xl leading-tight mb-6 ${shake ? 'translate-x-1' : ''}`}>{p.emojis}</div>
          <form onSubmit={submit} className="max-w-md mx-auto flex flex-col gap-3">
            <input
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="What is it?"
              autoComplete="off"
              className="w-full text-center text-lg rounded-full bg-black/50 border border-white/15 px-5 py-3 outline-none focus:border-emerald-400"
            />
            <div className="flex flex-wrap justify-center gap-2">
              <button type="submit" className="px-6 py-2 rounded-full bg-emerald-400 text-black font-bold">
                Lock it
              </button>
              <button
                type="button"
                onClick={() => setShowHint(true)}
                className="px-4 py-2 rounded-full border border-white/15 text-sm"
              >
                Hint
              </button>
              <button
                type="button"
                onClick={() => {
                  setIdx((i) => Math.min(puzzles.length - 1, i + 1));
                  setGuess('');
                  setShowHint(false);
                  setStreak(0);
                }}
                className="px-4 py-2 rounded-full border border-white/15 text-sm"
              >
                Skip
              </button>
            </div>
          </form>
          {showHint && <p className="mt-4 text-emerald-300">{p.hint}</p>}
          <p className="mt-4 text-sm opacity-70">{msg}</p>
        </div>
      )}

      {done && (
        <div className="rounded-[28px] border border-emerald-400/30 p-8 text-center bg-black/50">
          <div className="text-5xl mb-3">🟢</div>
          <h2 className="text-3xl font-semibold">Set complete</h2>
          <p className="opacity-70 mt-2">
            {score} correct · best streak {streak}
          </p>
          <a href="/boards?game=emoji" className="inline-block mt-5 text-emerald-400">
            Open the emoji board →
          </a>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
        <div>
          Score <span className="text-emerald-400 font-mono text-lg">{score}</span>
          {streak >= 2 && <span className="ml-3 text-emerald-400 font-bold">$MT x{streak}</span>}
        </div>
        <div className="opacity-50">{left} left in this deck</div>
      </div>

      <div className="mt-10 border-t border-white/10 pt-6">
        <button type="button" onClick={() => setDesk((v) => !v)} className="text-xs uppercase tracking-[2px] opacity-50">
          Staff desk
        </button>
        {desk && (
          <div className="mt-4 max-w-lg rounded-2xl border border-white/10 p-4 bg-black/40">
            {!staff ? (
              <form onSubmit={staffLogin} className="flex flex-col gap-2">
                <p className="text-sm opacity-70">Pin + password. Prize is set here, not in the flyer.</p>
                <input
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Staff pin"
                  className="rounded-lg bg-white/5 border border-white/15 px-3 py-2"
                />
                <input
                  type="password"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="Staff password"
                  className="rounded-lg bg-white/5 border border-white/15 px-3 py-2"
                />
                <button className="rounded-full bg-emerald-400 text-black font-bold py-2">Open desk</button>
              </form>
            ) : (
              <form onSubmit={savePrize} className="flex flex-col gap-2">
                <p className="text-sm text-emerald-300">Desk unlocked. Set what the room is playing for.</p>
                <input
                  value={prizeDraft}
                  onChange={(e) => setPrizeDraft(e.target.value)}
                  placeholder="Prize (shown on the night)"
                  className="rounded-lg bg-white/5 border border-white/15 px-3 py-2"
                />
                <input
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="Note / host line"
                  className="rounded-lg bg-white/5 border border-white/15 px-3 py-2"
                />
                <input
                  value={startDraft}
                  onChange={(e) => setStartDraft(e.target.value)}
                  placeholder="When (e.g. Tomorrow 7PM UTC)"
                  className="rounded-lg bg-white/5 border border-white/15 px-3 py-2"
                />
                <button className="rounded-full bg-emerald-400 text-black font-bold py-2">Save prize</button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
