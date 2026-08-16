import Link from 'next/link';
import { CATALOG } from '@/lib/mt-catalog';

const KINDS = ['all', 'p2e', 'arcade', 'action', 'multiplayer', 'studio'] as const;

export default function GamesCatalogPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <div className="uppercase text-xs tracking-[3px] text-emerald-400 mb-2">Catalog</div>
      <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-1.6px] mb-3">All games</h1>
      <p className="opacity-70 max-w-2xl mb-8 text-sm">
        Bot titles, Soccer Pro, Metro Vice, Starfleet, MTE POP, Pocket, Gallery and the
        studio client — one shelf. Same list as P2E and the portal library.
      </p>
      <div className="flex flex-wrap gap-2 mb-8 text-xs">
        {KINDS.map((k) => (
          <span key={k} className="px-3 py-1 rounded-full border border-white/15 capitalize opacity-70">
            {k}
          </span>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CATALOG.map((g) => (
          <Link
            key={g.id}
            href={`/catalog/${g.id}`}
            className="rounded-2xl overflow-hidden border border-white/10 hover:border-emerald-400/40 bg-zinc-950/60"
          >
            <div className="h-40 bg-black/50">
              <img src={g.img} alt={g.name} className="w-full h-full object-cover" />
            </div>
            <div className="p-4">
              <div className="flex justify-between gap-2 items-start">
                <h2 className="font-semibold">{g.name}</h2>
                <span className="text-[10px] uppercase tracking-wider text-emerald-400">{g.kind}</span>
              </div>
              <p className="text-sm opacity-70 mt-1 line-clamp-2">{g.blurb}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
