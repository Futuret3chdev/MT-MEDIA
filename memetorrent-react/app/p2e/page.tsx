import Link from 'next/link';
import GameCard from '@/components/games/GameCard';
import TapBoard from '@/components/games/TapBoard';
import { getGame, p2eGames } from '@/lib/mt-catalog';

const WORLD = ['mt-world-pocket', 'mt-world-gallery']
  .map((id) => getGame(id))
  .filter(Boolean);

export default function P2EPage() {
  const rest = p2eGames().filter((g) => !g.id.startsWith('mt-world-'));
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex flex-wrap gap-4 text-sm mb-6">
        <Link href="/catalog" className="opacity-70 hover:opacity-100">← Games</Link>
        <Link href="/" className="opacity-70 hover:opacity-100">← Home</Link>
      </div>
      <div className="uppercase text-xs tracking-[3px] text-emerald-400 mb-2">Play to earn</div>
      <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-1.6px] mb-3">One library. Real games.</h1>
      <p className="opacity-70 max-w-2xl mb-10 text-sm sm:text-base">
        MT WORLD is first. Then the rest of the shelf — cover, name, Play.
      </p>

      <h2 className="text-xl font-semibold mb-4">MT WORLD</h2>
      <div className="grid sm:grid-cols-2 gap-4 mb-12">
        {WORLD.map((g) => g && <GameCard key={g.id} game={g} />)}
      </div>

      <h2 className="text-xl font-semibold mb-4">Also playable</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rest.map((g) => (
          <GameCard key={g.id} game={g} />
        ))}
      </div>
      <TapBoard />
    </div>
  );
}
