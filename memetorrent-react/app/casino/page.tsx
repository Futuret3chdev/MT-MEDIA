import Link from 'next/link';
import GameCard from '@/components/games/GameCard';
import { p2eGames } from '@/lib/mt-catalog';

export default function CasinoPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex flex-wrap gap-4 text-sm mb-6">
        <Link href="/catalog" className="opacity-70 hover:opacity-100">
          ← Games
        </Link>
        <Link href="/" className="opacity-70 hover:opacity-100">
          ← Home
        </Link>
      </div>
      <div className="uppercase text-xs tracking-[3px] text-emerald-400 mb-2">Casino</div>
      <h1 className="text-4xl font-semibold tracking-tight mb-3">Our house. Our tables.</h1>
      <p className="opacity-70 max-w-2xl mb-8 text-sm">
        House tables and the playable library. Same catalog as Games.
      </p>
      <h2 className="font-semibold mb-4">Playable now</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {p2eGames().map((g) => (
          <GameCard key={g.id} game={g} />
        ))}
      </div>
    </div>
  );
}
