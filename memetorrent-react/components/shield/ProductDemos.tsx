'use client';

import { useMemo, useState } from 'react';
import { CATALOG } from '@/lib/mt-catalog';
import { PRODUCT_TABS } from '@/lib/productTabs';
import servicesData from '@/app/status/services.json';

export default function ProductDemos({ children }: { children: React.ReactNode }) {
  const [tab, setTab] = useState('shield');
  const games = useMemo(
    () => CATALOG.filter((g) => g.rated !== '18+' && g.kind !== 'adult').slice(0, 8),
    []
  );
  const bots = servicesData.services.filter((s) => /bot/i.test(s.key + s.name));

  return (
    <div className="mt-10">
      <p className="text-[11px] tracking-[0.22em] uppercase text-cyan-300/80 mb-3">Products · demos</p>
      <div className="flex flex-wrap gap-2 mb-6">
        {PRODUCT_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
              tab === t.id
                ? 'border-cyan-400/70 bg-cyan-400/15 text-cyan-200'
                : 'border-white/15 opacity-70 hover:opacity-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'shield' && <div>{children}</div>}

      {tab === 'developers' && (
        <Demo
          title="Developers API"
          body="MT-Connect, social login, and wallets."
          href="/developers"
          cta="Open /developers"
        >
          <div className="grid sm:grid-cols-3 gap-2 text-sm">
            {['Facebook', 'Instagram', 'TikTok', 'Google', 'Microsoft', 'Wallet sign'].map((n) => (
              <div key={n} className="rounded-xl border border-white/10 px-3 py-2 opacity-80">
                Demo · {n}
              </div>
            ))}
          </div>
        </Demo>
      )}

      {tab === 'stats' && (
        <Demo title="Stats" body="Live public service feed." href="/status" cta="Open status">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat n={servicesData.services.length} l="Services" />
            <Stat n={servicesData.services.filter((s) => s.status === 'online').length} l="Online" />
            <Stat n={bots.length} l="Bots tracked" />
            <Stat n={String(servicesData.overall_status)} l="Overall" />
          </div>
        </Demo>
      )}

      {tab === 'tap' && (
        <Demo title="TAP" body="Shop, Match, Transport, Studio — play and earn." href="/#tap" cta="Open TAP">
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            {['TAP Shop', 'TAP Match', 'TAP Transport', 'TAP Studio'].map((n) => (
              <div key={n} className="rounded-xl border border-white/10 p-3">
                <div className="font-semibold">{n}</div>
                <a href="/tap" className="text-cyan-300 text-xs">
                  Play MT Tap →
                </a>
              </div>
            ))}
          </div>
        </Demo>
      )}

      {tab === 'bot' && (
        <Demo
          title="Bots"
          body="Telegram, verification, TagMe, message bot. Growth: more bots under the same login."
          href="/bot"
          cta="Open Bot"
        >
          <ul className="text-sm space-y-1 opacity-80">
            {bots.map((b) => (
              <li key={b.key}>
                {b.name} · {b.public_status}
              </li>
            ))}
          </ul>
          <a
            className="inline-block mt-3 text-cyan-300 text-sm"
            href="https://t.me/+hxWzh5DZbfhiYWM9"
            target="_blank"
            rel="noopener"
          >
            Telegram portal →
          </a>
        </Demo>
      )}

      {tab === 'games' && (
        <Demo title="Games" body="Live catalog. Click a cover to play (login if needed)." href="/catalog" cta="Full catalog">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {games.map((g) => (
              <a key={g.id} href={`/catalog/${g.id}`} className="block rounded-xl overflow-hidden border border-white/10">
                <img src={g.img} alt="" className="w-full h-24 object-cover" />
                <div className="px-2 py-1.5 text-xs font-semibold">{g.name}</div>
              </a>
            ))}
          </div>
        </Demo>
      )}

      {tab === 'wallet' && (
        <Demo
          title="INFINITE WALLET"
          body="Self-custodial. Keys stay on the device."
          href="https://mt.futuret3ch.com.au/"
          cta="Open wallet"
          external
        >
          <p className="text-sm opacity-70">Create, import, send, mint NFTs, Rockets. Preview is on mt.futuret3ch.com.au.</p>
        </Demo>
      )}

      {tab === 'studio' && (
        <Demo title="Studio" body="Make maps and publish mini-games." href="/studio" cta="Open Studio" />
      )}

      {tab === 'software' && (
        <Demo title="Software" body="Browser security and game software." href="/software" cta="Open Software" />
      )}

      {tab === 'chat' && (
        <Demo title="MT Chat" body="Same login as portal. Rooms, DMs, games in chat." href="/chat" cta="Open Chat" />
      )}
    </div>
  );
}

function Stat({ n, l }: { n: number | string; l: string }) {
  return (
    <div className="rounded-xl border border-white/10 p-3">
      <div className="text-2xl font-semibold">{n}</div>
      <div className="text-[10px] tracking-widest uppercase opacity-50">{l}</div>
    </div>
  );
}

function Demo({
  title,
  body,
  href,
  cta,
  external,
  children,
}: {
  title: string;
  body: string;
  href: string;
  cta: string;
  external?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-sm opacity-70 mt-2 max-w-2xl">{body}</p>
      {children ? <div className="mt-4">{children}</div> : null}
      <a
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener' : undefined}
        className="inline-block mt-5 px-4 py-2 rounded-full bg-cyan-400 text-black text-sm font-semibold"
      >
        {cta}
      </a>
    </div>
  );
}
