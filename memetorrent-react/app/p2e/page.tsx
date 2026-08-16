import Link from 'next/link';
import GameCard from '@/components/games/GameCard';
import { p2eGames } from '@/lib/mt-catalog';

export default function P2EPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <div className="uppercase text-xs tracking-[3px] text-emerald-400 mb-2">Play to earn</div>
      <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-1.6px] mb-3">One library. Real games.</h1>
      <p className="opacity-70 max-w-2xl mb-8 text-sm sm:text-base">
        Each card is a picture, the name, and a Play button. Same games as TAP and the portal.
      </p>
      <div className="flex flex-wrap gap-3 mb-10 text-sm">
        <Link href="/catalog" className="text-emerald-400">Full catalog →</Link>
        <Link href="/portal" className="text-emerald-400">Portal library →</Link>
        <Link href="/casino" className="text-emerald-400">Casino →</Link>
        <Link href="/studio" className="text-emerald-400">Game Studio →</Link>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {p2eGames().map((g) => (
          <GameCard key={g.id} game={g} />
        ))}
      </div>
    </div>
  );
}
