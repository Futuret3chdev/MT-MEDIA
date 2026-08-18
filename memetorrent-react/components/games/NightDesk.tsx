'use client';

import { useEffect, useState } from 'react';
import NightAward from '@/components/games/NightAward';

export default function NightDesk({ names }: { names?: string[] }) {
  const [open, setOpen] = useState(false);
  const [staff, setStaff] = useState(false);
  const [pin, setPin] = useState('');
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch('/api/games/night', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setStaff(!!d.staff))
      .catch(() => {});
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/games/night', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', pin, password: pw }),
    });
    const d = await res.json();
    if (!d.ok) {
      setMsg(d.error || 'No');
      return;
    }
    setStaff(true);
    setPw('');
    setPin('');
  }

  return (
    <div className="mt-10 border-t border-white/10 pt-5">
      <button type="button" onClick={() => setOpen((v) => !v)} className="text-xs uppercase tracking-[2px] opacity-40">
        Staff desk
      </button>
      {open && (
        <div className="mt-3 max-w-lg rounded-2xl border border-white/10 p-4 bg-black/50">
          {!staff ? (
            <form onSubmit={login} className="flex flex-col gap-2">
              <p className="text-sm opacity-70">Same pin + password as the emoji nights.</p>
              <input value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Staff pin" className="rounded-lg bg-white/5 border border-white/15 px-3 py-2" />
              <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Staff password" className="rounded-lg bg-white/5 border border-white/15 px-3 py-2" />
              <button className="rounded-full bg-emerald-400 text-black font-bold py-2">Open desk</button>
              {msg && <p className="text-xs opacity-70">{msg}</p>}
            </form>
          ) : (
            <>
              <p className="text-sm text-emerald-300">Desk open. Award hits Claim $MT.</p>
              <NightAward names={names} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
