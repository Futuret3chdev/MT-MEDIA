'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const SNIPPET = `<script src="https://memetorrent.futuret3ch.com.au/sdk/mt-play.js"></script>
<script>
  const mt = MTPlay.init({ gameId: 'my-game' });

  mt.on('wallet', (addr) => console.log('wallet', addr));
  mt.me().then((user) => console.log('portal', user));

  // Play-bar wallet (Phantom / Solflare / Backpack)
  document.getElementById('connect').onclick = () => mt.requestWallet('phantom');

  // After a run
  mt.postScore(1200);
  mt.scores({ limit: 10 }).then(console.log);
</script>`;

const EMBED = `<!-- Host the game without X-Frame-Options: SAMEORIGIN -->
<!-- Catalog Play URL should be your HTTPS game, e.g. https://my-game.vercel.app -->

<script src="https://memetorrent.futuret3ch.com.au/sdk/mt-play.js"></script>`;

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
      className="text-xs font-bold rounded-full px-3 py-1 bg-emerald-400 text-black"
    >
      {ok ? 'Copied' : 'Copy'}
    </button>
  );
}

export default function DevelopersPage() {
  const [user, setUser] = useState<{ username?: string } | null>(null);
  const [wallet, setWallet] = useState('');
  const [board, setBoard] = useState<{ username: string; score: number }[]>([]);

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

  return (
    <main className="min-h-screen">
      <div className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          <Link href="/" className="font-semibold tracking-tight">
            <span className="text-emerald-400">MT</span> Developers
          </Link>
          <div className="flex gap-4">
            <Link href="/catalog" className="opacity-70 hover:opacity-100">Catalog</Link>
            <Link href="/studio" className="opacity-70 hover:opacity-100">Studio</Link>
            <Link href="/portal" className="opacity-70 hover:opacity-100">Portal</Link>
            <a href="/sdk/mt-play.js" className="text-emerald-400 font-medium">Download SDK</a>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="uppercase text-xs tracking-[3px] text-emerald-400 mb-2">Play SDK</div>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-4">Ship a game into MemeTorrent play.</h1>
        <p className="opacity-70 max-w-2xl mb-8">
          One script. Wallet from the play bar, portal login, scores, and the mobile Games switcher.
          Host your title HTTPS, allow framing from futuret3ch.com.au, drop in the SDK.
        </p>

        <div className="grid sm:grid-cols-3 gap-3 mb-12 text-sm">
          <a href="#install" className="rounded-2xl border border-white/10 p-4 hover:border-emerald-400/40">1. Install the SDK</a>
          <a href="#embed" className="rounded-2xl border border-white/10 p-4 hover:border-emerald-400/40">2. Embed in Play</a>
          <a href="#api" className="rounded-2xl border border-white/10 p-4 hover:border-emerald-400/40">3. Wallet · identity · scores</a>
        </div>

        <section id="install" className="mb-12">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-2xl font-semibold">Install</h2>
            <Copy text={SNIPPET} />
          </div>
          <p className="text-sm opacity-70 mb-3">
            Script tag (no npm required). File: <code className="text-emerald-400">/sdk/mt-play.js</code> · types: <code className="text-emerald-400">/sdk/mt-play.d.ts</code>
          </p>
          <pre className="bg-black/70 border border-white/10 rounded-2xl p-4 text-xs overflow-auto whitespace-pre-wrap">{SNIPPET}</pre>
        </section>

        <section id="embed" className="mb-12">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-2xl font-semibold">Catalog Play</h2>
            <Copy text={EMBED} />
          </div>
          <ul className="text-sm opacity-80 space-y-2 mb-4 list-disc pl-5">
            <li>Game URL must load in an iframe (do not send <code>X-Frame-Options: SAMEORIGIN</code>).</li>
            <li>Allow <code>frame-ancestors</code> for <code>https://memetorrent.futuret3ch.com.au</code> and <code>https://*.futuret3ch.com.au</code>.</li>
            <li>Play chrome is the top bar: Games switcher, wallet, portal login, Staff, Exit.</li>
            <li>Do not add a second connect-wallet or staff desk inside the game.</li>
          </ul>
          <pre className="bg-black/70 border border-white/10 rounded-2xl p-4 text-xs overflow-auto">{EMBED}</pre>
        </section>

        <section id="api" className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">SDK methods</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="rounded-2xl border border-white/10 p-5">
              <div className="text-emerald-400 text-xs tracking-[2px] mb-2">WALLET</div>
              <p className="opacity-80 mb-2"><code>mt.requestWallet(&apos;phantom&apos; | &apos;solflare&apos; | &apos;backpack&apos;)</code> asks the play bar. Listen with <code>mt.on(&apos;wallet&apos;, addr =&gt; …)</code>.</p>
              <p className="opacity-60 text-xs">Same postMessage the catalog games already use: <code>mt-wallet-request</code> / <code>mt-wallet-ok</code>.</p>
            </div>
            <div className="rounded-2xl border border-white/10 p-5">
              <div className="text-emerald-400 text-xs tracking-[2px] mb-2">IDENTITY</div>
              <p className="opacity-80 mb-2"><code>await mt.me()</code> hits <code>GET /api/portal/me</code> with cookies. Portal login is Telegram / Discord / X on the play bar.</p>
              <p className="opacity-60 text-xs">Send players to <code>mt.loginUrl()</code> if they are guests.</p>
            </div>
            <div className="rounded-2xl border border-white/10 p-5">
              <div className="text-emerald-400 text-xs tracking-[2px] mb-2">SCORES</div>
              <p className="opacity-80 mb-2"><code>mt.postScore(n)</code> → <code>POST /api/scores</code>. <code>mt.scores()</code> reads the board for your <code>gameId</code>.</p>
              <p className="opacity-60 text-xs">Signed-in portal users attach their username automatically.</p>
            </div>
            <div className="rounded-2xl border border-white/10 p-5">
              <div className="text-emerald-400 text-xs tracking-[2px] mb-2">LIVE</div>
              <p className="opacity-80 mb-1">This browser: {user ? `@${user.username}` : 'not signed in'} · wallet {wallet ? `${wallet.slice(0, 4)}…${wallet.slice(-4)}` : 'none'}</p>
              {board.length > 0 && (
                <ol className="opacity-70 text-xs space-y-1 mt-2">
                  {board.map((r, i) => (
                    <li key={i}>{i + 1}. {r.username} · {r.score}</li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </section>

        <section className="mb-12 rounded-3xl border border-emerald-400/25 p-6 bg-emerald-400/5">
          <h2 className="text-xl font-semibold mb-2">Get listed</h2>
          <p className="text-sm opacity-80 mb-3">
            Email the HTTPS play URL, cover, and one-line blurb. We add it to the catalog so the mobile Games switcher can open it.
          </p>
          <p className="text-sm">
            <a className="text-emerald-400" href="mailto:Support@MemeTorrent.com">Support@MemeTorrent.com</a>
            {' · '}
            <Link className="text-emerald-400" href="/studio">Studio SDK</Link>
            {' · '}
            <Link className="text-emerald-400" href="/catalog">Live catalog</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
