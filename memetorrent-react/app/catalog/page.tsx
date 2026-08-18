import Link from 'next/link';
import GameCard from '@/components/games/GameCard';
import { familyGames } from '@/lib/mt-catalog';

export default function GamesCatalogPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/" className="opacity-70 hover:opacity-100">← Home</Link>
        <Link href="/studio" className="opacity-70 hover:opacity-100">← Studio</Link>
        <Link href="/casino" className="opacity-70 hover:opacity-100">18+ games →</Link>
      </div>
      <div className="uppercase text-xs tracking-[3px] text-emerald-400 mt-4 mb-2">Catalog</div>
      <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-1.6px] mb-3">All games</h1>
      <p className="opacity-70 max-w-2xl mb-8 text-sm">
        All-ages library. 18+ tables live in their own section.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {familyGames().map((g) => (
          <GameCard key={g.id} game={g} />
        ))}
      </div>
      <p className="mt-10 text-sm opacity-60">
        18+ card and table games are on{' '}
        <Link href="/casino" className="text-emerald-400 hover:underline">
          Adult games
        </Link>
        .
      </p>
    </div>
  );
}
