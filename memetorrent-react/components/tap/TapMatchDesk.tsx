'use client';

import { useCallback, useEffect, useState } from 'react';
import TapMatchApp from '@/components/tap/tapmatch/TapMatchApp';

export default function TapMatchDesk({
  user,
}: {
  user: { username: string; is_admin?: boolean } | null;
}) {
  const [staff, setStaff] = useState(false);
  const [checking, setChecking] = useState(true);
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [gateMsg, setGateMsg] = useState('');
  const [gateBusy, setGateBusy] = useState(false);

  const loadStaff = useCallback(async () => {
    try {
      const r = await fetch('/api/v1/tapmatch/staff', { credentials: 'include', cache: 'no-store' });
      const d = await r.json();
      setStaff(Boolean(d?.data?.staff) || Boolean(user?.is_admin) || user?.username === '376937');
    } catch {
      setStaff(Boolean(user?.is_admin) || user?.username === '376937');
    } finally {
      setChecking(false);
    }
  }, [user]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  async function staffLogin(e: React.FormEvent) {
    e.preventDefault();
    setGateBusy(true);
    setGateMsg('');
    try {
      const r = await fetch('/api/v1/tapmatch/staff', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, password }),
      });
      const d = await r.json();
      if (!r.ok || !d?.data?.staff) {
        setGateMsg(d?.status?.error_message || 'Wrong admin user or password');
        return;
      }
      setStaff(true);
      setPin('');
      setPassword('');
    } catch {
      setGateMsg('Could not reach TAPMATCH staff gate');
    } finally {
      setGateBusy(false);
    }
  }

  if (checking) {
    return <div className="opacity-60 text-sm">Checking TAPMATCH staff access…</div>;
  }

  if (!staff) {
    return (
      <section className="rounded-3xl border border-sky-400/30 bg-sky-400/5 p-6 sm:p-8 max-w-lg">
        <div className="text-[10px] tracking-[3px] text-sky-400 mb-2">STAFF PREVIEW</div>
        <h2 className="text-xl font-semibold mb-2">TAPMATCH is closed</h2>
        <p className="text-sm opacity-70 mb-6">
          Work matching is in staff preview. Public accounts stay on the TAP desk. Staff sign in here
          with the admin user.
        </p>
        <form onSubmit={staffLogin} className="space-y-3">
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            autoComplete="username"
            placeholder="Admin user"
            className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-sm"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="Password"
            className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={gateBusy}
            className="w-full rounded-full bg-sky-400 text-black font-bold py-2"
          >
            {gateBusy ? 'Checking…' : 'Open TAPMATCH'}
          </button>
        </form>
        {gateMsg && <p className="text-sm mt-3 text-amber-200">{gateMsg}</p>}
      </section>
    );
  }

  return <TapMatchApp user={user} />;
}
