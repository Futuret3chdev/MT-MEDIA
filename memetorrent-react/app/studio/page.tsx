'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Item = { sku: string; name: string; price_mt: number; kind: string; project?: string };
type Inv = { sku: string; qty: number };
type Project = { id: number; name: string; slug: string; api_key: string };

const SNIPPET = `// 1. Authenticate  2. Load catalog  3. Purchase  4. Fulfill
const me = await fetch('/api/portal/me', { credentials: 'include' }).then(r => r.json());
const shop = await fetch('/api/studio/commerce').then(r => r.json());
const buy = await fetch('/api/studio/commerce', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'buy', sku: 'ROCKET_PACK' })
}).then(r => r.json());
// buy.fulfilled is now in the player's inventory`;

export default function StudioPage() {
  const [user, setUser] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<Item[]>([]);
  const [inventory, setInventory] = useState<Inv[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [log, setLog] = useState('Ready. Sign in, then run the four calls.');
  const [projName, setProjName] = useState('');
  const [sku, setSku] = useState('ROCKET_PACK');
  const [itemName, setItemName] = useState('Rocket pack');
  const [price, setPrice] = useState(10);

  const load = () => {
    fetch('/api/studio/commerce', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        setCatalog(d.catalog || []);
        setInventory(d.inventory || []);
        setProjects(d.projects || []);
        setUser(d.user || null);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const post = async (body: object, label: string) => {
    setLog(label + '…');
    const res = await fetch('/api/studio/commerce', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setLog(JSON.stringify(data, null, 2));
    load();
    return data;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-wrap gap-4 text-sm mb-6">
        <Link href="/" className="opacity-70 hover:opacity-100">← Home</Link>
        <Link href="/catalog" className="opacity-70 hover:opacity-100">← Games</Link>
      </div>

      <div className="uppercase text-xs tracking-[3px] text-emerald-400 mb-2">MT Studio SDK</div>
      <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-1.6px] mb-3">
        Monetize the game.<br />We handle login, catalog, pay, deliver.
      </h1>
      <p className="opacity-70 max-w-2xl mb-8 text-sm sm:text-base">
        Like Xsolla — for this ecosystem. Players use the portal account and $MT.
        Four API calls. No second backend. Infinite Wallet checkout is{' '}
        <a href="https://mt.futuret3ch.com.au/" className="text-emerald-400">mt.futuret3ch.com.au</a>.
      </p>

      <div className="grid sm:grid-cols-4 gap-3 mb-10">
        {[
          ['1. Authenticate', 'Portal session. Same user on web, Android, Windows.'],
          ['2. Load catalog', 'SKUs you create. Price in $MT.'],
          ['3. Purchase', 'One POST. We record the order.'],
          ['4. Fulfill', 'Item lands in player inventory.'],
        ].map(([t, d]) => (
          <div key={t} className="rounded-2xl border border-white/10 p-4">
            <div className="font-semibold mb-1">{t}</div>
            <div className="text-xs opacity-60">{d}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-12">
        <div className="rounded-2xl border border-white/10 p-5">
          <h2 className="font-semibold text-xl mb-2">Live explorer</h2>
          <p className="text-xs opacity-60 mb-3">
            {user ? `Signed in as ${user}` : 'Sign in with 👤 — same as the rest of the site.'}
          </p>
          <pre className="text-[11px] bg-black/50 rounded-xl p-3 overflow-auto mb-3 whitespace-pre-wrap">{SNIPPET}</pre>
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              type="button"
              onClick={() => post({ action: 'project', name: projName || 'My game' }, 'Create project')}
              className="px-3 py-1.5 rounded-full bg-emerald-400 text-black text-sm font-semibold"
            >
              1. Create project
            </button>
            <button
              type="button"
              onClick={() =>
                post({ action: 'item', sku, name: itemName, price_mt: price, kind: 'pack' }, 'Add SKU')
              }
              className="px-3 py-1.5 rounded-full border border-white/15 text-sm"
            >
              2. Add SKU
            </button>
            <button
              type="button"
              onClick={() => post({ action: 'buy', sku }, 'Purchase')}
              className="px-3 py-1.5 rounded-full border border-white/15 text-sm"
            >
              3–4. Buy + fulfill
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
            <input value={projName} onChange={(e) => setProjName(e.target.value)} placeholder="Project name" className="px-3 py-2 rounded-xl bg-black/40 border border-white/15" />
            <input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SKU" className="px-3 py-2 rounded-xl bg-black/40 border border-white/15" />
            <input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="Item name" className="px-3 py-2 rounded-xl bg-black/40 border border-white/15" />
            <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="px-3 py-2 rounded-xl bg-black/40 border border-white/15" />
          </div>
          <pre className="text-[11px] bg-black/60 rounded-xl p-3 min-h-[80px] overflow-auto">{log}</pre>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 p-5">
            <h2 className="font-semibold mb-2">Catalog</h2>
            {!catalog.length && <p className="text-sm opacity-50">No SKUs yet. Create a project and add one.</p>}
            <ul className="text-sm space-y-2">
              {catalog.map((i) => (
                <li key={i.sku} className="flex justify-between gap-2 border-b border-white/10 pb-2">
                  <span>
                    <b>{i.name}</b> <span className="opacity-50">{i.sku}</span>
                  </span>
                  <span className="text-emerald-400">{i.price_mt} $MT</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 p-5">
            <h2 className="font-semibold mb-2">Your inventory</h2>
            {!inventory.length && <p className="text-sm opacity-50">Buy an item to see it land here.</p>}
            <ul className="text-sm space-y-1">
              {inventory.map((i) => (
                <li key={i.sku} className="font-mono">
                  {i.sku} × {i.qty}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 p-5">
            <h2 className="font-semibold mb-2">API keys</h2>
            {!projects.length && <p className="text-sm opacity-50">Create a project to get a key.</p>}
            {projects.map((p) => (
              <div key={p.slug} className="text-xs mb-2">
                <div className="font-semibold">{p.name}</div>
                <div className="font-mono break-all opacity-70">{p.api_key}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 text-sm">
        <div className="rounded-2xl border border-white/10 p-4">
          <div className="font-semibold mb-1">Web · Android · Windows</div>
          <p className="opacity-60">One integration. Portal login. Public wallet at mt.futuret3ch.com.au.</p>
        </div>
        <div className="rounded-2xl border border-white/10 p-4">
          <div className="font-semibold mb-1">$MT checkout</div>
          <p className="opacity-60">Price in $MT. Orders stored. Chain settle comes next on Infinite Wallet.</p>
        </div>
        <div className="rounded-2xl border border-white/10 p-4">
          <div className="font-semibold mb-1">Prototype kit</div>
          <p className="opacity-60 mb-2">Need a playable mock? The level editor is still here.</p>
          <Link href="/studio/maker" className="text-emerald-400">Open maker →</Link>
        </div>
      </div>
    </div>
  );
}
