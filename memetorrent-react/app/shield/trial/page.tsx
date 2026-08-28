'use client';

import { useEffect, useState } from 'react';
import BackLink from '../BackLink';

type Me = { username?: string; email?: string } | null;

export default function ShieldTrialPage() {
  const [me, setMe] = useState<Me>(undefined as unknown as Me);
  useEffect(() => {
    fetch('/api/portal/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) {
          window.location.replace('/login?next=/shield/trial&from=shield-trial');
          return;
        }
        setMe(d.user);
      })
      .catch(() => {
        window.location.replace('/login?next=/shield/trial&from=shield-trial');
      });
  }, []);

  if (!me) {
    return (
      <main className="min-h-screen bg-black text-white px-4 py-16 text-sm opacity-70">
        Checking account…
      </main>
    );
  }

  const start = new Date();
  const end = new Date(start.getTime() + 14 * 86400000);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <BackLink label="Back" />
        <p className="text-[11px] tracking-[0.28em] text-cyan-300 font-bold mt-8">SHIELD PERSONAL</p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-2">14-day trial is on</h1>
        <p className="mt-4 text-sm opacity-80 leading-relaxed">
          Signed in as <strong>{me.username || me.email || 'your account'}</strong>. This is a Shield
          Personal 14-day trial.
        </p>
        <ul className="mt-6 space-y-2 text-sm opacity-80">
          <li>Starts {start.toLocaleDateString()} · ends {end.toLocaleDateString()} (14 days).</li>
          <li>Includes Pro + all five personal add-ons for the trial window.</li>
          <li>Live grid and live tracking are core. Nothing on screen is fake.</li>
          <li>
            Business seats are a separate product ($149 / 1 seat and up). This trial does not put you on
            Business.
          </li>
          <li>
            Billing: PayID now. Credit cards, Send, and all other billing — coming soon. Sales:{' '}
            <a className="text-cyan-300" href="mailto:sales@futuret3ch.com.au">
              sales@futuret3ch.com.au
            </a>
          </li>
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="/shield"
            className="px-4 py-2 rounded-full bg-cyan-400 text-black font-semibold text-sm"
          >
            Stay on Shield
          </a>
          <a href="/shield/business" className="px-4 py-2 rounded-full border border-white/20 text-sm">
            See Business (not this trial)
          </a>
        </div>
        <p className="mt-8 text-xs opacity-50">
          support@futuret3ch.com.au · safety@futuret3ch.com.au · never support@memetorrent.com.au
        </p>
      </div>
    </main>
  );
}
