'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Project = { name: string; slug: string; api_key: string };

export default function PublisherPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [who, setWho] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  const load = () => {
    fetch('/api/studio/commerce', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        setWho(d.user || null);
        setProjects(d.projects || []);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    const path = mode === 'login' ? '/api/portal/login' : '/api/portal/register';
    const res = await fetch(path, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username: username || email.split('@')[0] }),
    });
    const data = await res.json();
    setBusy(false);
    if (!data.ok) {
      setErr(data.error || 'Could not continue');
      return;
    }
    load();
  };

  if (who) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/studio" className="text-sm opacity-60">← MT Studio SDK</Link>
        <h1 className="text-3xl font-semibold mt-3 mb-2">Publisher account</h1>
        <p className="text-sm opacity-70 mb-8">Signed in as {who}</p>
        <div className="rounded-2xl border border-white/10 p-5 mb-6">
          <h2 className="font-semibold mb-3">Projects</h2>
          {!projects.length && <p className="text-sm opacity-50">No projects yet. Open the SDK demo to create one.</p>}
          {projects.map((p) => (
            <div key={p.slug} className="border-b border-white/10 py-3 text-sm">
              <div className="font-semibold">{p.name}</div>
              <div className="font-mono text-xs break-all opacity-60">{p.api_key}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/studio/demo" className="px-5 py-2 rounded-xl bg-emerald-400 text-black font-semibold text-sm">
            Open SDK demo
          </Link>
          <a href="https://mt.futuret3ch.com.au/" className="px-5 py-2 rounded-xl border border-white/20 text-sm">
            Infinite Wallet
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] grid lg:grid-cols-2">
      <div className="px-5 sm:px-14 py-10 sm:py-16 flex flex-col justify-center">
        <Link href="/studio" className="text-sm opacity-60 mb-8 w-fit">← MT Studio SDK</Link>
        <h1 className="text-4xl font-semibold tracking-tight mb-4">
          Publisher account
        </h1>
        <p className="opacity-70 max-w-md mb-6">
          One account for developers and publishers. Authenticate players, load catalog,
          process $MT purchases. No extra backend.
        </p>
        <ul className="text-sm opacity-70 space-y-2">
          <li>Web, Android and Windows from one integration</li>
          <li>Hosted checkout via Infinite Wallet</li>
          <li>Inventory delivered to the player profile</li>
        </ul>
      </div>
      <div className="bg-[#0c0e14] border-t lg:border-t-0 lg:border-l border-white/10 px-5 sm:px-14 py-10 sm:py-16 flex flex-col justify-center">
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`px-3 py-1 rounded-lg text-sm ${mode === 'signup' ? 'bg-white text-black' : 'opacity-60'}`}
          >
            Sign up
          </button>
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`px-3 py-1 rounded-lg text-sm ${mode === 'login' ? 'bg-white text-black' : 'opacity-60'}`}
          >
            Log in
          </button>
        </div>
        <form onSubmit={submit} className="max-w-sm space-y-3">
          {mode === 'signup' && (
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Publisher name"
              className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-sm"
            />
          )}
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-sm"
          />
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-sm"
          />
          {err && <div className="text-sm text-red-400">{err}</div>}
          <button disabled={busy} className="w-full py-2.5 rounded-xl bg-emerald-400 text-black font-semibold text-sm">
            {mode === 'signup' ? 'Create publisher account' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  );
}
