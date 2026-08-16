'use client';

import GameCard from '@/components/games/GameCard';
import { CATALOG } from '@/lib/mt-catalog';

const TAP_FEATURES = [
  { name: 'TAP Shop', desc: 'In-game & cross-game item marketplace powered by INFINITE WALLET. Buy, sell, trade with $MT or Rockets.' },
  { name: 'TAP Match', desc: 'Skill-based PvP & co-op matchmaking. Earn Rockets on-chain. Anti-cheat via our node.' },
  { name: 'TAP Transport', desc: 'Seamless asset & identity bridging between games & chains. Self-built, no third parties.' },
  { name: 'TAP Studio', desc: 'Creator tools: mint NFTs, design Rockets rewards, launch mini-games. 1¢ fees.' },
];

const FEATURED = ['mt-world-pocket', 'mt-world-gallery', 'soccer-pro', 'puck', 'mte-pop', 'metro-vice', 'starfleet'];

export default function TapEcosystem() {
  const featured = FEATURED.map((id) => CATALOG.find((g) => g.id === id)).filter(Boolean);
  const rest = CATALOG.filter((g) => !FEATURED.includes(g.id));

  return (
    <section id="tap" className="py-12 sm:py-20 border-t border-white/10 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-xs tracking-[3px] text-emerald-400 mb-3">TAP ECO SYSTEM</div>
        <div className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-[-1.5px] max-w-3xl mb-3 sm:mb-4">
          Games. Cover. Play.
        </div>
        <p className="max-w-2xl opacity-70 mb-8 sm:mb-10 text-sm sm:text-base">
          Soccer Pro, Metro Vice, Starfleet and the rest of the library — image, name, play button.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10 sm:mb-16">
          {TAP_FEATURES.map((f) => (
            <div key={f.name} className="rounded-3xl border border-white/10 p-7 bg-white/[0.015]">
              <div className="font-semibold text-xl mb-2 tracking-tight">{f.name}</div>
              <p className="text-sm opacity-70 leading-relaxed">{f.desc}</p>
            </div>
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
