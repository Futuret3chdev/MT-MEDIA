'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Item = { sku: string; name: string; price_mt: number; kind: string };
type Call = { step: string; method: string; url: string; status: number; body: string };

const STEPS = ['Authenticate', 'Load catalog', 'Purchase', 'Fulfill'];

export default function StudioDemoPage() {
  const [user, setUser] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [inv, setInv] = useState<{ sku: string; qty: number }[]>([]);
  const [step, setStep] = useState(0);
  const [calls, setCalls] = useState<Call[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const addCall = (c: Call) => setCalls((prev) => [c, ...prev].slice(0, 8));

  const api = async (method: string, url: string, body?: object) => {
    const res = await fetch(url, {
      method,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let json: unknown = text;
    try {
      json = JSON.parse(text);
    } catch {
      /* raw */
    }
    addCall({
      step: STEPS[step] || 'Call',
      method,
      url,
      status: res.status,
      body: JSON.stringify(json, null, 2).slice(0, 1200),
    });
    return { res, json };
  };

  const refreshShop = async () => {
    const { json } = await api('GET', '/api/studio/commerce');
    const d = json as { catalog?: Item[]; inventory?: { sku: string; qty: number }[]; user?: string };
    setItems(d.catalog || []);
    setInv(d.inventory || []);
    if (d.user) setUser(d.user);
  };

  useEffect(() => {
    refreshShop();
  }, []);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    const { json } = await api('POST', '/api/portal/login', { email, password });
    const d = json as { ok?: boolean; error?: string; user?: { username: string } };
    setBusy(false);
    if (!d.ok) {
      setErr(d.error || 'Sign in failed');
      return;
    }
    setUser(d.user?.username || 'player');
    setStep(1);
    await api('POST', '/api/studio/commerce', { action: 'seed' });
    await refreshShop();
  };

  const loadCatalog = async () => {
    setBusy(true);
    await api('POST', '/api/studio/commerce', { action: 'seed' });
    await refreshShop();
    setStep(2);
    setBusy(false);
  };

  const buy = async (sku: string) => {
    setBusy(true);
    setStep(2);
    const { json } = await api('POST', '/api/studio/commerce', { action: 'buy', sku });
    const d = json as { ok?: boolean; error?: string };
    if (d.ok) setStep(3);
    await refreshShop();
    setBusy(false);
  };

  return (
    <div className="min-h-[80vh] bg-[#07080c]">
      <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between gap-3">
        <div>
          <Link href="/studio" className="text-xs opacity-60">← MT Studio SDK</Link>
          <div className="font-semibold">SDK Explorer</div>
        </div>
        <div className="flex flex-wrap gap-1 justify-end">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`px-2 py-1 rounded-lg text-[10px] sm:text-xs ${
                i === step ? 'bg-emerald-400 text-black font-semibold' : i < step ? 'bg-white/10' : 'opacity-40'
              }`}
            >
              <span className="sm:hidden">{i + 1}</span>
              <span className="hidden sm:inline">
                {i + 1}. {s}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-12 grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
        <div className="rounded-3xl border border-white/10 bg-[#0e1118] p-5 min-h-[520px]">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold">Player shop</div>
            <div className="text-xs opacity-50">{user ? user : 'Guest'}</div>
          </div>

          {step === 0 && (
            <form onSubmit={login} className="max-w-sm space-y-3">
              <p className="text-sm opacity-70">Authenticate a player to start the live flow.</p>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-sm"
              />
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-sm"
              />
              {err && <div className="text-sm text-red-400">{err}</div>}
              <button disabled={busy} className="w-full py-2.5 rounded-xl bg-emerald-400 text-black font-semibold text-sm">
                Authenticate
              </button>
              <p className="text-xs opacity-50">
                No account? <Link href="/studio/publish" className="text-emerald-400">Get started</Link>
              </p>
            </form>
          )}

          {step >= 1 && (
            <>
              {step === 1 && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={loadCatalog}
                  className="mb-4 px-4 py-2 rounded-xl bg-emerald-400 text-black font-semibold text-sm"
                >
                  Load catalog
                </button>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(items.length ? items : []).map((it) => (
                  <div key={it.sku} className="rounded-2xl border border-white/10 p-3 bg-black/30">
                    <div className="h-20 rounded-xl mb-2" style={{ background: `linear-gradient(135deg,#123,#0f3)` }} />
                    <div className="font-semibold text-sm">{it.name}</div>
                    <div className="text-[11px] opacity-50">{it.sku}</div>
                    <div className="text-emerald-400 text-sm my-2">{it.price_mt} $MT</div>
                    <button
                      type="button"
                      disabled={busy || step < 2}
                      onClick={() => buy(it.sku)}
                      className="w-full py-1.5 rounded-lg bg-white text-black text-xs font-semibold disabled:opacity-30"
                    >
                      Buy
                    </button>
                  </div>
                ))}
              </div>
              {step >= 3 && (
                <div className="mt-5 rounded-xl border border-emerald-400/30 p-3 text-sm">
                  Delivered to inventory:{' '}
                  {inv.map((i) => `${i.sku}×${i.qty}`).join(', ') || '—'}
                </div>
              )}
            </>
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#0a0c10] p-4 font-mono text-[11px] overflow-hidden">
          <div className="text-xs font-sans font-semibold mb-3 opacity-70">Live requests</div>
          <div className="space-y-3 max-h-[560px] overflow-auto">
            {calls.map((c, i) => (
              <div key={i} className="rounded-xl border border-white/10 p-3">
                <div className="flex justify-between gap-2 text-emerald-400">
                  <span>
                    {c.method} {c.url}
                  </span>
                  <span>{c.status}</span>
                </div>
                <pre className="mt-2 whitespace-pre-wrap opacity-80">{c.body}</pre>
              </div>
            ))}
            {!calls.length && <div className="opacity-40">No calls yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
