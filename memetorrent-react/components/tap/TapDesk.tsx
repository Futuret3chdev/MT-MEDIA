'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { TAP_APPS, type TapAppId } from '@/lib/tap-apps';
import TapMatchDesk from '@/components/tap/TapMatchDesk';

type User = { username: string; email: string; avatar_url: string | null; is_admin?: boolean };

export default function TapDesk({ app }: { app: TapAppId }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const current = TAP_APPS.find((a) => a.id === app) || TAP_APPS[0];

  useEffect(() => {
    fetch('/api/portal/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setUser(d.user || null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading && app !== 'tapmatch') {
    return <div className="max-w-6xl mx-auto px-4 py-20 opacity-60">Opening TAP desk…</div>;
  }

  if (!user && app !== 'tapmatch') {
    return (
      <div className="max-w-xl mx-auto px-4 py-20">
        <div className="uppercase text-xs tracking-[3px] text-sky-400 mb-2">TAP desk</div>
        <h1 className="text-4xl font-semibold tracking-tight mb-4">Sign in to the portal first</h1>
        <p className="opacity-70 mb-6">
          Your community account already includes TAP, TAPSHOP, and TAPMATCH. Use the account icon
          in the top bar — then open this desk from the portal.
        </p>
        <Link href="/portal" className="text-sky-400 hover:opacity-80">
          ← Portal
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] border-t border-sky-400/20 bg-gradient-to-b from-sky-950/40 via-black to-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <div className="uppercase text-[10px] tracking-[4px] text-sky-400 mb-2">TAP desk</div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">{current.name}</h1>
            <p className="text-sm opacity-60 mt-1">
              {user ? `@${user.username} · TAP account included with your portal login` : 'Staff preview'}
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/developers/docs#tap" className="text-sky-400 hover:opacity-80">
              TAP API
            </Link>
            <Link href="/portal" className="opacity-60 hover:opacity-100">
              ← Community portal
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-10">
          {TAP_APPS.map((a) => {
            const on = a.id === app;
            return (
              <Link
                key={a.id}
                href={a.href}
                className={`px-5 py-2.5 rounded-2xl text-sm font-semibold tracking-wide border ${
                  on
                    ? 'border-sky-400 bg-sky-400 text-black'
                    : 'border-sky-400/30 bg-sky-400/5 opacity-80 hover:opacity-100'
                }`}
              >
                {a.name}
                <span className="ml-2 text-[10px] font-normal tracking-[1px] opacity-70">{a.tag}</span>
              </Link>
            );
          })}
        </div>

        {app === 'tap' && (
          <section className="rounded-3xl border border-sky-400/30 bg-sky-400/5 p-6 sm:p-8">
            <h2 className="text-xl font-semibold mb-2">Trips · Packages · Food</h2>
            <p className="text-sm opacity-70 max-w-xl mb-6">
              TAP is rides, parcels, and food deliveries — Uber, Dasher, and Panda style. Not games.
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-white/10 p-4">
                <div className="text-[10px] tracking-[2px] text-sky-400 mb-1">TRIPS</div>
                <div className="font-semibold">Rides</div>
                <p className="text-sm opacity-60 mt-1">Pick up and drop off. Live trips, like a ride network.</p>
              </div>
              <div className="rounded-2xl border border-white/10 p-4">
                <div className="text-[10px] tracking-[2px] text-sky-400 mb-1">PACKAGES</div>
                <div className="font-semibold">Drop-offs</div>
                <p className="text-sm opacity-60 mt-1">Send and receive parcels. Local and last-mile.</p>
              </div>
              <div className="rounded-2xl border border-white/10 p-4">
                <div className="text-[10px] tracking-[2px] text-sky-400 mb-1">FOOD</div>
                <div className="font-semibold">Deliveries</div>
                <p className="text-sm opacity-60 mt-1">Restaurant and grocery runs. Dasher-style food delivery.</p>
              </div>
            </div>
          </section>
        )}

        {app === 'tapshop' && (
          <section className="rounded-3xl border border-sky-400/30 bg-sky-400/5 p-6 sm:p-8">
            <h2 className="text-xl font-semibold mb-2">Trade</h2>
            <p className="text-sm opacity-70 max-w-xl mb-4">
              TAPSHOP is your trade account — items, $MT, and Rockets. Floor opens here; it is not mixed
              with portal profile or chat.
            </p>
            <div className="text-xs tracking-[2px] text-sky-300">Marketplace floor — building out</div>
          </section>
        )}

        {app === 'tapmatch' && <TapMatchDesk user={user} />}
      </div>
    </div>
  );
}
