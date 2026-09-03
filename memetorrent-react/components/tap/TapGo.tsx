'use client';

import { useCallback, useEffect, useState } from 'react';
import ShiftPicker from '@/components/tap/tapmatch/ShiftPicker';

type Lane = 'trips' | 'packages' | 'food';
type Job = {
  id: string;
  lane: string;
  pickup?: string;
  dropoff?: string;
  km?: number;
  quote?: { usd?: number; mt?: number };
  status?: string;
  demo?: boolean;
};

const LANES: { id: Lane; name: string; tag: string }[] = [
  { id: 'trips', name: 'Trips', tag: 'Rides' },
  { id: 'packages', name: 'Packages', tag: 'Drop-offs' },
  { id: 'food', name: 'Food', tag: 'Deliveries' },
];

export default function TapGo({ user }: { user: { username: string } | null }) {
  const [lane, setLane] = useState<Lane>('trips');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [km, setKm] = useState('5');
  const [when, setWhen] = useState('');
  const [quote, setQuote] = useState<{ usd?: number; mt?: number } | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch(`/api/v1/tap/jobs?lane=${lane}`, { credentials: 'include', cache: 'no-store' });
    const d = await r.json();
    setJobs(Array.isArray(d?.data?.jobs) ? d.data.jobs : []);
  }, [lane]);

  useEffect(() => {
    load().catch(() => setJobs([]));
  }, [load]);

  async function getQuote() {
    const r = await fetch(
      `/api/v1/tap/quote?lane=${lane}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&km=${encodeURIComponent(km)}`,
      { cache: 'no-store' }
    );
    const d = await r.json();
    setQuote(d?.data || null);
  }

  async function requestJob(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    try {
      const r = await fetch('/api/v1/tap/jobs', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lane, from, to, km: Number(km), when }),
      });
      const d = await r.json();
      if (d?.status?.error_code) {
        setMsg(d.status.error_message || 'Could not request');
        return;
      }
      setMsg(`${LANES.find((l) => l.id === lane)?.name} requested`);
      setFrom('');
      setTo('');
      await load();
    } catch {
      setMsg('Sign in to the portal to request');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-sky-400/30 bg-sky-400/5 p-6 sm:p-8">
        <h2 className="text-xl font-semibold mb-2">Trips · Packages · Food</h2>
        <p className="text-sm opacity-70 max-w-xl mb-4">
          {user ? `@${user.username}` : 'Sign in'} — request a ride, parcel, or food run.
        </p>
        <div className="flex flex-wrap gap-2 mb-5">
          {LANES.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setLane(l.id)}
              className={`px-4 py-2 rounded-2xl text-sm font-semibold border ${
                lane === l.id ? 'bg-sky-400 text-black border-sky-400' : 'border-sky-400/30'
              }`}
            >
              {l.name}
              <span className="ml-2 text-[10px] opacity-70">{l.tag}</span>
            </button>
          ))}
        </div>
        <form onSubmit={requestJob} className="grid sm:grid-cols-2 gap-3">
          <input
            required
            className="rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-sm"
            placeholder={lane === 'food' ? 'Restaurant or shop' : 'Pickup'}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <input
            required
            className="rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-sm"
            placeholder="Drop-off"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          <input
            className="rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-sm"
            placeholder="Km"
            value={km}
            onChange={(e) => setKm(e.target.value)}
          />
          <ShiftPicker label="When" value={when} onChange={setWhen} />
          <div className="sm:col-span-2 flex flex-wrap gap-2">
            <button type="button" className="rounded-2xl border border-white/15 px-4 py-2 text-sm" onClick={getQuote}>
              Quote
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-sky-400 text-black font-bold text-sm px-5 py-2 disabled:opacity-50"
            >
              {busy ? 'Sending…' : `Request ${LANES.find((l) => l.id === lane)?.name}`}
            </button>
          </div>
        </form>
        {quote && (
          <p className="text-sm text-sky-300 mt-3">
            About ${Number(quote.usd || 0).toFixed(2)}
            {quote.mt ? ` · ${Math.round(quote.mt).toLocaleString()} $MT` : ''}
          </p>
        )}
        {msg && <p className="text-sm mt-2 opacity-80">{msg}</p>}
      </div>
      <div className="space-y-3">
        {jobs.map((j) => (
          <article key={j.id} className="rounded-2xl border border-white/10 p-4">
            <div className="text-[10px] tracking-[2px] text-sky-400 uppercase">{j.lane}</div>
            <div className="font-semibold">
              {j.pickup} → {j.dropoff}
            </div>
            <p className="text-sm opacity-60">
              {j.km ? `${j.km} km` : ''} {j.quote?.usd != null ? `· $${j.quote.usd}` : ''} {j.demo ? '· sample' : ''}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
