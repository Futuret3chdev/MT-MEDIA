'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { API_CATS } from '@/lib/mt-api-catalog';

const ORIGIN = 'https://memetorrent.futuret3ch.com.au';
const MINT = 'ELywDcVX2WumHm4xEfqF8NdEKaeGCAaq9JmwtjE8pump';

function Copy({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setOk(true);
          setTimeout(() => setOk(false), 1200);
        } catch { /* */ }
      }}
      className="text-[10px] font-bold rounded-full px-2 py-0.5 bg-emerald-400 text-black"
    >
      {ok ? 'Copied' : 'Copy'}
    </button>
  );
}

function Try({ path }: { path: string }) {
  const [out, setOut] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <div className="mt-2">
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            const r = await fetch(path);
            const t = await r.text();
            try {
              setOut(JSON.stringify(JSON.parse(t), null, 2));
            } catch {
              setOut(t.slice(0, 2000));
            }
          } catch (e) {
            setOut(String(e));
          } finally {
            setBusy(false);
          }
        }}
        className="text-xs rounded-full border border-emerald-400/40 px-3 py-1 text-emerald-400"
      >
        {busy ? 'Calling…' : 'Try it'}
      </button>
      {out && (
        <pre className="mt-2 max-h-56 overflow-auto rounded-xl bg-black/70 border border-white/10 p-3 text-[11px] whitespace-pre-wrap">
          {out}
        </pre>
      )}
    </div>
  );
}

export default function DocsPage() {
  const [cat, setCat] = useState(API_CATS[0].id);
  const current = useMemo(() => API_CATS.find((c) => c.id === cat) || API_CATS[0], [cat]);
  const curlQuotes = `curl "${ORIGIN}/api/v1/cryptocurrency/quotes/latest?symbol=MT"`;

  return (
    <div className="min-h-screen bg-[#0b0d12] text-[#e8eaf0]">
      <header className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-4 text-sm">
          <Link href="/developers" className="font-semibold">
            <span className="text-emerald-400">MT</span> Docs
          </Link>
          <Link href="/developers" className="opacity-60">Landing</Link>
          <Link href="/cli/mt.ps1" className="opacity-60">CLI (Windows)</Link>
          <Link href="/cli/mt.js" className="opacity-60">CLI (Node)</Link>
          <a href="/llms.txt" className="opacity-60">llms.txt</a>
          <Link href="/studio" className="ml-auto text-emerald-400">Studio</Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-[220px_1fr] gap-8">
        <nav className="text-sm space-y-1 lg:sticky lg:top-4 h-fit">
          <div className="text-[10px] uppercase tracking-[2px] opacity-40 mb-2">Reference</div>
          {API_CATS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCat(c.id)}
              className={`block w-full text-left px-3 py-2 rounded-lg ${cat === c.id ? 'bg-white/10 text-emerald-400' : 'opacity-70 hover:opacity-100'}`}
            >
              {c.title}
            </button>
          ))}
        </nav>

        <article>
          <p className="text-xs text-emerald-400 tracking-[2px] uppercase mb-2">API reference</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">{current.title}</h1>
          <p className="opacity-70 mb-6 max-w-2xl">{current.blurb}</p>

          {cat === 'market' && (
            <div className="mb-8 rounded-2xl border border-white/10 p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <code className="text-xs">{curlQuotes}</code>
                <Copy text={curlQuotes} />
              </div>
              <Try path="/api/v1/cryptocurrency/quotes/latest?symbol=MT" />
            </div>
          )}

          {cat === 'tracker' && (
            <div className="mb-8 rounded-2xl border border-white/10 p-4 text-sm">
              <p className="opacity-70 mb-2">Default mint <code className="text-emerald-400 break-all">{MINT}</code></p>
              <Try path={`/api/v1/token/${MINT}/chart?range=24h`} />
            </div>
          )}

          <div className="space-y-3">
            {current.rows.map((row) => (
              <div key={row.method + row.path} className="rounded-2xl border border-white/10 p-4">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${row.method === 'GET' ? 'bg-emerald-400/20 text-emerald-300' : 'bg-amber-400/20 text-amber-200'}`}>
                    {row.method}
                  </span>
                  <code className="text-sm break-all">{row.path}</code>
                  {row.auth && row.auth !== 'none' && (
                    <span className="text-[10px] uppercase tracking-wide opacity-50">{row.auth}</span>
                  )}
                </div>
                <p className="text-sm opacity-75">{row.summary}</p>
                {row.method === 'GET' && row.path.startsWith('/api/') && !row.path.includes('{') && row.auth !== 'session' && row.auth !== 'staff' && (
                  <Try path={row.path} />
                )}
              </div>
            ))}
          </div>

          {cat === 'upcoming' && (
            <div className="mt-8 rounded-2xl border border-emerald-400/25 bg-emerald-400/5 p-5 text-sm">
              <p>
                When MT-Chain and Infinite Wallet launch, keep the same host and add{' '}
                <code>chain=mt-chain</code> plus header <code>X-MT-API-KEY</code>. Quotes, holders, and wallet
                balance routes will not change names.
              </p>
            </div>
          )}

          {cat === 'play' && (
            <div className="mt-8 text-sm">
              <p className="mb-2">
                Browser SDK: <a className="text-emerald-400" href="/sdk/mt-play.js">/sdk/mt-play.js</a>
              </p>
              <p>
                CLI scores: <code>node mt.js scores --game tap</code>
              </p>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
