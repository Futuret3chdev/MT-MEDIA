'use client';

import GameCard from '@/components/games/GameCard';
import { CATALOG } from '@/lib/mt-catalog';
import { TAP_APPS } from '@/lib/tap-apps';

const FEATURED = ['mt-world-pocket', 'mt-world-gallery', 'soccer-pro', 'puck', 'mte-pop', 'metro-vice', 'starfleet'];

export default function TapEcosystem() {
  const featured = FEATURED.map((id) => CATALOG.find((g) => g.id === id)).filter(Boolean);
  const rest = CATALOG.filter((g) => !FEATURED.includes(g.id) && g.rated !== '18+' && g.kind !== 'adult');

  return (
    <section id="tap" className="py-12 sm:py-20 border-t border-white/10 bg-black scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-xs tracking-[3px] text-emerald-400 mb-3">TAP ECO SYSTEM</div>
        <div className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-[-1.5px] max-w-3xl mb-8 sm:mb-10">
          TAP. TAPSHOP. TAPMATCH.
        </div>

        <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 mb-10 sm:mb-16">
          {TAP_APPS.map((app) => (
            <a
              key={app.id}
              href={app.href}
              id={app.id === 'tap' ? 'tap-play' : app.id}
              className="rounded-3xl border border-sky-400/40 p-7 bg-white/[0.015] scroll-mt-28 hover:bg-sky-400/10 block"
            >
              <div className="text-[10px] tracking-[2px] text-emerald-400 mb-2">{app.tag}</div>
              <div className="font-semibold text-2xl mb-2 tracking-tight">{app.name}</div>
              <p className="text-sm opacity-70 leading-relaxed">{app.desc}</p>
            </a>
          ))}
        </div>

        <div id="games" className="scroll-mt-24">
          <div className="uppercase text-xs tracking-[3px] opacity-60 mb-4">Featured</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {featured.map((g) => g && <GameCard key={g.id} game={g} />)}
          </div>
          <div className="uppercase text-xs tracking-[3px] opacity-60 mb-4">Full catalog</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rest.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </div>
          <div className="text-center text-xs mt-6 opacity-50">
            <a href="/catalog" className="text-emerald-400">Open the full catalog →</a>
          </div>
        </div>
      </div>
    </section>
  );
}
