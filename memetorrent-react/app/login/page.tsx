'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/portal';
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/portal/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (d.user) router.replace(next);
      });
  }, [next, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    const path = mode === 'login' ? '/api/portal/login' : '/api/portal/register';
    const res = await fetch(path, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        username: username || email.split('@')[0],
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!data.ok) {
      setErr(data.error || 'Could not continue');
      return;
    }
    router.replace(next);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="flex flex-wrap gap-4 text-sm mb-6">
        <Link href="/" className="opacity-70 hover:opacity-100">
          ← Home
        </Link>
        <Link href="/portal" className="opacity-70 hover:opacity-100">
          ← Portal
        </Link>
      </div>
      <h1 className="text-3xl font-semibold tracking-tight mb-2">Log in</h1>
      <p className="text-sm opacity-70 mb-6">Same account as the portal, chat, and studio.</p>
      <div className="flex gap-2 mb-5">
        <button
          type="button"
          onClick={() => setMode('login')}
          className={`px-3 py-1.5 rounded-lg text-sm ${mode === 'login' ? 'bg-white text-black' : 'opacity-60'}`}
        >
          Log in
        </button>
        <button
          type="button"
          onClick={() => setMode('signup')}
          className={`px-3 py-1.5 rounded-lg text-sm ${mode === 'signup' ? 'bg-white text-black' : 'opacity-60'}`}
        >
          Create account
        </button>
      </div>
      <form onSubmit={submit} className="space-y-3">
        {mode === 'signup' && (
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
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
        <button
          disabled={busy}
          className="w-full py-2.5 rounded-xl bg-emerald-400 text-black font-semibold text-sm"
        >
          {mode === 'login' ? 'Enter' : 'Create account'}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="px-4 py-20 opacity-60">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
