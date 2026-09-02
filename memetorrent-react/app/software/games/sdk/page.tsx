'use client';

import Link from 'next/link';
import { useState } from 'react';

const SNIP = `<script src="https://memetorrent.futuret3ch.com.au/sdk/mt-games.js"></script>
<script>
  const games = MTGames.init({ gameId: 'my-title' });

  // License from portal / Software → Developers
  await games.verify('MT-FREE-…');

  games.postScore(900, { room: games.partyCode() });
  games.scores({ limit: 10 });
</script>`;

export default function GamesSdkPage() {
  const [ok, setOk] = useState(false);
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/software/games" className="text-sm opacity-70">← Software · Games</Link>
      <p className="uppercase text-xs tracking-[3px] text-emerald-400 mt-6 mb-2">MT Games SDK v1.0</p>
      <h1 className="text-4xl font-semibold mb-4">Game software SDK</h1>
      <p className="opacity-70 mb-6">
        For the Android client and anything you ship under a builder license. Play SDK is the catalog iframe.
        This SDK is license + scores + party codes for <em>your</em> binary.
      </p>
      <div className="flex justify-end mb-2">
        <button
          type="button"
          className="text-xs font-bold rounded-full px-3 py-1 bg-emerald-400 text-black"
          onClick={async () => {
            await navigator.clipboard.writeText(SNIP);
            setOk(true);
            setTimeout(() => setOk(false), 1200);
          }}
        >
          {ok ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="bg-black/70 border border-white/10 rounded-2xl p-4 text-xs overflow-auto whitespace-pre-wrap">{SNIP}</pre>
      <ul className="mt-6 text-sm space-y-2 opacity-80">
        <li><code>verify(key)</code> → GET /api/v1/games/license</li>
        <li><code>me()</code> → portal session + license on the profile</li>
        <li><code>postScore / scores</code> → same boards as Play</li>
        <li><code>partyCode()</code> → four-letter room</li>
        <li><code>apkUrl()</code> → Android MT Games APK</li>
        <li>Browser tools: Skin Lab, Score Book, Pads… at /software/games</li>
      </ul>
      <p className="mt-6 text-sm">
        <a className="text-emerald-400" href="/sdk/mt-games.js">mt-games.js</a>
        {' · '}
        <a className="text-emerald-400" href="/sdk/games-example.html">example</a>
        {' · '}
        <Link className="text-emerald-400" href="/developers/docs">API reference</Link>
      </p>
    </div>
  );
}
