import Link from 'next/link';
import GameCard from '@/components/games/GameCard';
import { CATALOG } from '@/lib/mt-catalog';

export default function GamesCatalogPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/" className="opacity-70 hover:opacity-100">← Home</Link>
        <Link href="/studio" className="opacity-70 hover:opacity-100">← Studio</Link>
      </div>
      <div className="uppercase text-xs tracking-[3px] text-emerald-400 mt-4 mb-2">Catalog</div>
      <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-1.6px] mb-3">All games</h1>
      <p className="opacity-70 max-w-2xl mb-8 text-sm">
        The full MT game library.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CATALOG.map((g) => (
          <GameCard key={g.id} game={g} />
        ))}
      </div>
    </div>
  );
}
