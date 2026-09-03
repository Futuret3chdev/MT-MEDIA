'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const ORIGIN = 'https://memetorrent.futuret3ch.com.au';
const CURL = `curl "${ORIGIN}/api/v1/cryptocurrency/quotes/latest?symbol=MT"`;
const CLI_UNIX = `curl -fsSL ${ORIGIN}/cli/mt.js -o mt.js && chmod +x mt.js
node mt.js quotes`;
const CLI_WIN = `irm ${ORIGIN}/cli/mt.ps1 -OutFile mt.ps1
powershell -File .\\mt.ps1 quotes`;

function Copy({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setOk(true);
          setTimeout(() => setOk(false), 1400);
        } catch { /* */ }
      }}
      className="text-xs font-bold rounded-full px-3 py-1 bg-emerald-400 text-black shrink-0"
    >
      {ok ? 'Copied' : 'Copy'}
    </button>
  );
}

export default function DevelopersPage() {
  const [form, setForm] = useState({ gameId: '', playUrl: '', coverUrl: '', blurb: '', contact: '' });
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [quote, setQuote] = useState<{ price?: number; market_cap?: number; liquidity?: number } | null>(null);

  useEffect(() => {
    fetch('/api/v1/cryptocurrency/quotes/latest?symbol=MT')
      .then((r) => r.json())
      .then((d) => {
        const usd = d?.data?.quote?.USD;
        if (usd) setQuote({ price: usd.price, market_cap: usd.market_cap, liquidity: usd.liquidity });
      })
      .catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch('/api/sdk/submit', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      setMsg(d.ok ? `Queued ${d.gameId}.` : d.error || 'Failed');
    } catch {
      setMsg('Network error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen">
      <div className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          <Link href="/" className="font-semibold tracking-tight">
            <span className="text-emerald-400">MT</span> Developers
          </Link>
          <div className="flex flex-wrap gap-4">
            <Link href="/developers/docs">API reference</Link>
            <Link href="/cli/mt.js">CLI</Link>
            <Link href="/studio" className="opacity-70">Studio</Link>
            <a href="/sdk/mt-play.js" className="text-emerald-400 font-medium">Play SDK</a>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <p className="text-xs uppercase tracking-[3px] text-emerald-400 mb-2">Market data · TAP · Token tracker · Play · Wallet-ready</p>
        <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight mb-4">Build on $MT.</h1>
        <p className="opacity-70 max-w-2xl text-lg mb-8">
          Keyless market API today (quotes, holders, candles). TAP API for trips, packages, and food — plus TAPSHOP and TAPMATCH.
          Same paths for Infinite Wallet and MT-Chain when they launch. Play SDK for catalog games. CLI for scripts.
        </p>
        <div className="flex flex-wrap gap-3 mb-12">
          <Link href="/developers/docs" className="rounded-full bg-emerald-400 text-black font-bold px-5 py-2">
            Open API reference
          </Link>
          <a href="#cli" className="rounded-full border border-white/20 px-5 py-2">
            Install CLI
          </a>
        </div>

        {quote && (
          <div className="grid sm:grid-cols-3 gap-3 mb-14 text-sm">
            <div className="rounded-2xl border border-white/10 p-4">
              <div className="opacity-50 text-xs">Price</div>
              <div className="text-2xl font-semibold tabular-nums">${quote.price?.toFixed(8)}</div>
            </div>
            <div className="rounded-2xl border border-white/10 p-4">
              <div className="opacity-50 text-xs">Market cap</div>
              <div className="text-2xl font-semibold tabular-nums">${Math.round(quote.market_cap || 0).toLocaleString()}</div>
            </div>
            <div className="rounded-2xl border border-white/10 p-4">
              <div className="opacity-50 text-xs">Liquidity</div>
              <div className="text-2xl font-semibold tabular-nums">${Math.round(quote.liquidity || 0).toLocaleString()}</div>
            </div>
          </div>
        )}

        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
          {[
            { href: '/developers/docs', t: 'Market data', d: 'CMC-style quotes, listings, OHLCV. Envelope with status + data.' },
            { href: '/developers/docs#tap', t: 'TAP', d: 'Trips, packages, food. TAPSHOP listings. TAPMATCH Fast Connect / long-term. Not games.' },
            { href: '/developers/docs', t: 'Token tracker', d: 'Mint, pool, holders, chart — Solana Tracker-shaped paths.' },
            { href: '/sdk/mt-play.js', t: 'Play SDK', d: 'Wallets, portal login, scores inside the catalog play bar.' },
            { href: '/cli/mt.js', t: 'CLI', d: 'node mt.js quotes · tap · holders · chart · scores' },
            { href: '/studio', t: 'Studio', d: '$MT shop, editor, titles API.' },
            { href: '/developers/docs', t: 'Wallet & MT-Chain', d: 'Preview routes. Same host when Infinite Wallet and MT-Chain go live.' },
          ].map((c) => (
            <Link key={c.t} href={c.href} className="rounded-2xl border border-white/10 p-5 hover:border-emerald-400/40">
              <div className="font-semibold mb-1">{c.t}</div>
              <p className="text-sm opacity-70">{c.d}</p>
            </Link>
          ))}
        </section>

        <section className="mb-14">
          <div className="flex items-center justify-between gap-3 mb-2">
            <h2 className="text-2xl font-semibold">Quickstart</h2>
            <Copy text={CURL} />
          </div>
          <pre className="bg-black/70 border border-white/10 rounded-2xl p-4 text-xs overflow-auto">{CURL}</pre>
        </section>

        <section id="cli" className="mb-14">
          <h2 className="text-2xl font-semibold mb-3">CLI</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between gap-3 mb-2">
                <h3 className="text-sm font-semibold">Windows PowerShell</h3>
                <Copy text={CLI_WIN} />
              </div>
              <pre className="bg-black/70 border border-white/10 rounded-2xl p-4 text-xs overflow-auto whitespace-pre-wrap">{CLI_WIN}</pre>
            </div>
            <div>
              <div className="flex items-center justify-between gap-3 mb-2">
                <h3 className="text-sm font-semibold">macOS / Linux</h3>
                <Copy text={CLI_UNIX} />
              </div>
              <pre className="bg-black/70 border border-white/10 rounded-2xl p-4 text-xs overflow-auto whitespace-pre-wrap">{CLI_UNIX}</pre>
            </div>
          </div>
        </section>

        <section className="mb-14">
          <h2 className="text-2xl font-semibold mb-3">Auth</h2>
          <p className="text-sm opacity-80 max-w-2xl">
            Market, tracker, and TAP reads are keyless. TAP writes, portal, studio, chat, and claims use the site session cookie.
            Staff routes need the nights pin. Header <code>X-MT-API-KEY</code> is reserved for paid / chain launch — send it later, ignore it today.
          </p>
        </section>

        <section id="list" className="rounded-3xl border border-emerald-400/25 p-6 bg-emerald-400/5">
          <h2 className="text-xl font-semibold mb-2">List a game</h2>
          <p className="text-sm opacity-80 mb-4">
            HTTPS play URL, 16:9 cover, one-line blurb.{' '}
            <a className="text-emerald-400" href="mailto:support@futuret3ch.com.au">support@futuret3ch.com.au</a>
          </p>
          <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3">
            <input required value={form.gameId} onChange={(e) => setForm({ ...form, gameId: e.target.value })} placeholder="gameId" className="rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-sm" />
            <input required type="url" value={form.playUrl} onChange={(e) => setForm({ ...form, playUrl: e.target.value })} placeholder="https://…" className="rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-sm" />
            <input type="url" value={form.coverUrl} onChange={(e) => setForm({ ...form, coverUrl: e.target.value })} placeholder="Cover URL" className="rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-sm" />
            <input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="Email or Telegram" className="rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-sm" />
            <textarea required rows={2} value={form.blurb} onChange={(e) => setForm({ ...form, blurb: e.target.value })} placeholder="One-line blurb" className="sm:col-span-2 rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-sm" />
            <button type="submit" disabled={busy} className="sm:col-span-2 rounded-full bg-emerald-400 text-black font-bold py-2">
              {busy ? 'Sending…' : 'Queue listing'}
            </button>
          </form>
          {msg && <p className="text-sm mt-3 opacity-80">{msg}</p>}
        </section>
      </div>
    </main>
  );
}
