'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const ORIGIN = 'https://memetorrent.futuret3ch.com.au';

const SNIPPET = `<script src="${ORIGIN}/sdk/mt-play.js"></script>
<script>
  const mt = MTPlay.init({ gameId: 'my-game' });

  mt.on('wallet', (addr) => console.log('wallet', addr));
  mt.on('pause', () => { /* stop audio */ });
  mt.on('resume', () => {});

  mt.me().then((d) => console.log(d.ok ? d.user : 'guest'));
  document.getElementById('connect').onclick = () => mt.requestWallet('phantom');

  // After a run — optional room for Raid-style matches
  mt.postScore(1200, { room: 'night-1' });
  mt.scores({ limit: 10, period: 'week' }).then(console.log);

  if (mt.inPlayShell()) {
    // hide your own Exit — the play bar already has one
  }
</script>`;

const CSP = `Content-Security-Policy: frame-ancestors 'self' https://memetorrent.futuret3ch.com.au https://*.futuret3ch.com.au https://*.vercel.app`;

const NPM = `{
  "name": "@futuret3ch/mt-play",
  "version": "1.1.0",
  "main": "mt-play.js",
  "types": "mt-play.d.ts"
}`;

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
  const [user, setUser] = useState<{ username?: string } | null>(null);
  const [wallet, setWallet] = useState('');
  const [board, setBoard] = useState<{ username: string; score: number }[]>([]);
  const [form, setForm] = useState({ gameId: '', playUrl: '', coverUrl: '', blurb: '', contact: '' });
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/portal/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => { if (d?.ok) setUser(d.user); })
      .catch(() => {});
    try { setWallet(localStorage.getItem('mt-game-wallet') || ''); } catch { /* */ }
    fetch('/api/scores?game_id=tap&limit=5', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => { if (d?.ok && Array.isArray(d.scores)) setBoard(d.scores.slice(0, 5)); })
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
      setMsg(d.ok ? `Queued ${d.gameId}. We’ll add it to the Games switcher.` : (d.error || 'Failed'));
    } catch {
      setMsg('Network error');
    } finally {
      setBusy(false);
    }
  }

  const field = (key: keyof typeof form, placeholder: string, extra?: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
      value={form[key]}
      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
      placeholder={placeholder}
      className="w-full rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-sm"
      {...extra}
    />
  );

  return (
    <main className="min-h-screen">
      <div className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          <Link href="/" className="font-semibold tracking-tight">
            <span className="text-emerald-400">MT</span> Developers
          </Link>
          <div className="flex flex-wrap gap-4">
            <a href="#example">Example</a>
            <a href="#list">Get listed</a>
            <Link href="/studio" className="opacity-70 hover:opacity-100">Studio ($MT shop)</Link>
            <a href="/sdk/mt-play.js" className="text-emerald-400 font-medium">mt-play.js</a>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="uppercase text-xs tracking-[3px] text-emerald-400 mb-2">Play SDK v1.1</div>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-4">Ship a game into MemeTorrent play.</h1>
        <p className="opacity-70 max-w-2xl mb-8">
          Catalog path is this SDK. Monetization path is <Link href="/studio" className="text-emerald-400">Studio</Link> (auth, store, $MT checkout).
          Don’t mix a second wallet or staff desk into the iframe — the play bar already has both, plus the mobile Games switcher.
        </p>

        <div className="grid sm:grid-cols-4 gap-3 mb-12 text-sm">
          <a href="#install" className="rounded-2xl border border-white/10 p-4 hover:border-emerald-400/40">Install</a>
          <a href="#example" className="rounded-2xl border border-white/10 p-4 hover:border-emerald-400/40">Working example</a>
          <a href="#checklist" className="rounded-2xl border border-white/10 p-4 hover:border-emerald-400/40">Checklist</a>
          <a href="#list" className="rounded-2xl border border-white/10 p-4 hover:border-emerald-400/40">Submit listing</a>
        </div>

        <section id="install" className="mb-12">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-2xl font-semibold">Install</h2>
            <Copy text={SNIPPET} />
          </div>
          <p className="text-sm opacity-70 mb-3">
            Script tag. Files: <a className="text-emerald-400" href="/sdk/mt-play.js">/sdk/mt-play.js</a>
            {' · '}<a className="text-emerald-400" href="/sdk/mt-play.d.ts">types</a>
            {' · '}<a className="text-emerald-400" href="/sdk/package.json">package.json</a> if you vendor it as <code>@futuret3ch/mt-play</code>.
          </p>
          <pre className="bg-black/70 border border-white/10 rounded-2xl p-4 text-xs overflow-auto whitespace-pre-wrap">{SNIPPET}</pre>
        </section>

        <section id="example" className="mb-12">
          <h2 className="text-2xl font-semibold mb-3">Working example</h2>
          <p className="text-sm opacity-70 mb-3">
            Tiny tap game that posts a score and talks to the play-bar wallet.{' '}
            <a className="text-emerald-400" href="/sdk/example.html">Open /sdk/example.html</a>
            {' · '}
            <Link className="text-emerald-400" href="/play/tap">see it in Play</Link>
          </p>
          <iframe
            title="SDK example"
            src="/sdk/example.html"
            className="w-full h-72 rounded-2xl border border-white/15 bg-black"
          />
        </section>

        <section id="checklist" className="mb-12">
          <h2 className="text-2xl font-semibold mb-3">Checklist to get listed</h2>
          <ul className="text-sm space-y-2 opacity-90">
            <li>✓ HTTPS play URL that loads in an iframe</li>
            <li>✓ Cover 16:9, at least 1280×720, no text-in-logo mush</li>
            <li>✓ One-line blurb, unique <code>gameId</code> (letters, numbers, dash)</li>
            <li>✓ CSP below — never <code>X-Frame-Options: SAMEORIGIN</code></li>
            <li>✓ SDK included; no second Connect Wallet or Staff desk</li>
            <li>✓ Audio stops on <code>mt.on(&apos;pause&apos;)</code> when they open the Games switcher</li>
          </ul>
          <div className="flex items-center justify-between gap-3 mt-4 mb-2">
            <h3 className="font-semibold">vercel.json / headers</h3>
            <Copy text={CSP} />
          </div>
          <pre className="bg-black/70 border border-white/10 rounded-2xl p-4 text-xs overflow-auto">{CSP}</pre>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-3">Do / don’t</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="rounded-2xl border border-emerald-400/30 p-5">
              <div className="text-emerald-400 text-xs tracking-[2px] mb-2">DO</div>
              <ul className="space-y-1.5 opacity-80">
                <li>Listen for <code>wallet</code> and <code>pause</code></li>
                <li>Use <code>mt.inPlayShell()</code> to hide duplicate Exit</li>
                <li>Post scores with a <code>room</code> for live matches</li>
                <li>Send guests to <code>mt.openLogin()</code></li>
              </ul>
            </div>
            <div className="rounded-2xl border border-rose-400/30 p-5">
              <div className="text-rose-300 text-xs tracking-[2px] mb-2">DON’T</div>
              <ul className="space-y-1.5 opacity-80">
                <li>Ship Phantom/Solflare/Backpack buttons again</li>
                <li>Put a staff pin box under the canvas</li>
                <li>Block framing or cache HTML with old XFO</li>
                <li>Keep music running after they switch games</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="api" className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">SDK methods</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="rounded-2xl border border-white/10 p-5">
              <div className="text-emerald-400 text-xs tracking-[2px] mb-2">WALLET</div>
              <p><code>mt.requestWallet(&apos;phantom&apos; | &apos;solflare&apos; | &apos;backpack&apos;)</code></p>
              <p className="opacity-70 mt-1">Parent postMessage <code>mt-wallet-request</code> / <code>mt-wallet-ok</code>.</p>
            </div>
            <div className="rounded-2xl border border-white/10 p-5">
              <div className="text-emerald-400 text-xs tracking-[2px] mb-2">IDENTITY</div>
              <p><code>await mt.me()</code> → <code>{'{ ok, user }'}</code> or <code>{'{ ok:false, error }'}</code></p>
              <p className="opacity-70 mt-1">Portal is Telegram / Discord / X on the play bar.</p>
            </div>
            <div className="rounded-2xl border border-white/10 p-5">
              <div className="text-emerald-400 text-xs tracking-[2px] mb-2">SCORES</div>
              <p><code>mt.postScore(n, {'{ room }'})</code> · <code>mt.scores({'{ period, room, limit }'})</code></p>
              <p className="opacity-70 mt-1">GET/POST <code>/api/scores</code>. Signed-in names attach automatically.</p>
            </div>
            <div className="rounded-2xl border border-white/10 p-5">
              <div className="text-emerald-400 text-xs tracking-[2px] mb-2">SHELL</div>
              <p><code>mt.inPlayShell()</code> · <code>mt.exit()</code> · <code>mt.openLogin()</code> · <code>mt.paused()</code></p>
              <p className="opacity-70 mt-1">Games switcher sends pause/resume. Stop audio on pause.</p>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 p-5 mt-4 text-sm">
            <div className="text-emerald-400 text-xs tracking-[2px] mb-2">THIS BROWSER</div>
            <p className="opacity-80">
              {user ? `@${user.username}` : 'not signed in'}
              {' · '}
              wallet {wallet ? `${wallet.slice(0, 4)}…${wallet.slice(-4)}` : 'none'}
            </p>
            {board.length > 0 && (
              <ol className="opacity-70 text-xs space-y-1 mt-2">
                {board.map((r, i) => (
                  <li key={i}>{i + 1}. {r.username} · {r.score}</li>
                ))}
              </ol>
            )}
          </div>
        </section>

        <section id="list" className="mb-12 rounded-3xl border border-emerald-400/25 p-6 bg-emerald-400/5">
          <h2 className="text-xl font-semibold mb-2">Submit a listing</h2>
          <p className="text-sm opacity-80 mb-4">
            We queue it and add it to the catalog / Games switcher. You can also email{' '}
            <a className="text-emerald-400" href="mailto:support@futuret3ch.com.au">support@futuret3ch.com.au</a>.
          </p>
          <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3">
            {field('gameId', 'gameId (my-game)', { required: true })}
            {field('playUrl', 'https://my-game.vercel.app', { type: 'url', required: true })}
            {field('coverUrl', 'Cover URL (16:9)', { type: 'url' })}
            {field('contact', 'Email or Telegram')}
            <textarea
              value={form.blurb}
              onChange={(e) => setForm((f) => ({ ...f, blurb: e.target.value }))}
              placeholder="One-line blurb"
              required
              rows={2}
              className="sm:col-span-2 w-full rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-sm"
            />
            <button type="submit" disabled={busy} className="sm:col-span-2 rounded-full bg-emerald-400 text-black font-bold py-2">
              {busy ? 'Sending…' : 'Queue listing'}
            </button>
          </form>
          {msg && <p className="text-sm mt-3 opacity-80">{msg}</p>}
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-3">Play vs Studio</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="rounded-2xl border border-white/10 p-5">
              <div className="font-semibold mb-1">Play SDK (this page)</div>
              <p className="opacity-70">Catalog iframe, Games switcher, bar wallet, portal login, scores.</p>
            </div>
            <div className="rounded-2xl border border-white/10 p-5">
              <div className="font-semibold mb-1">Studio</div>
              <p className="opacity-70">Auth, item catalog, $MT checkout, fulfill. <Link href="/studio" className="text-emerald-400">Open Studio</Link></p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-2xl font-semibold">Changelog</h2>
            <Copy text={NPM} />
          </div>
          <ul className="text-sm opacity-80 space-y-2">
            <li><strong>1.1.0</strong> — pause/resume, exit, openLogin, inPlayShell, room scores, listing form, example game.</li>
            <li><strong>1.0.0</strong> — wallet, me(), postScore, scores.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
