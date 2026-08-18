'use client';

import { useState } from 'react';

export default function NightAward({ names }: { names?: string[] }) {
  const [name, setName] = useState(names?.[0] || '');
  const [amount, setAmount] = useState('');
  const [msg, setMsg] = useState('Award hits their Claim $MT page.');

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/games/night', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'award',
        name,
        amount: Number(amount),
        note: 'Emoji night prize',
      }),
    });
    const d = await res.json();
    if (!d.ok) {
      setMsg(d.error || 'Award failed');
      return;
    }
    setMsg(`Added ${d.added} $MT for ${d.username}. They claim it on /claims.`);
    setAmount('');
  }

  return (
    <form onSubmit={send} className="mt-3 flex flex-col gap-2 border-t border-white/10 pt-3">
      <p className="text-sm font-semibold">Award $MT</p>
      {!!names?.length && (
        <select
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg bg-white/5 border border-white/15 px-3 py-2 text-sm"
        >
          <option value="">Pick a player</option>
          {names.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      )}
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Username"
        className="rounded-lg bg-white/5 border border-white/15 px-3 py-2"
      />
      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount $MT"
        type="number"
        min="0"
        step="1"
        className="rounded-lg bg-white/5 border border-white/15 px-3 py-2"
      />
      <button className="rounded-full bg-emerald-400 text-black font-bold py-2">Drop on Claim</button>
      <p className="text-xs opacity-70">{msg}</p>
    </form>
  );
}
