import type { CatalogGame } from '@/lib/mt-catalog';
import PlayLink from '@/components/auth/PlayLink';

export default function GameCard({ game }: { game: CatalogGame }) {
  const external = game.play.startsWith('http');
  return (
    <article className="rounded-2xl overflow-hidden border border-white/10 bg-zinc-950/70 flex flex-col">
      <a href={`/catalog/${game.id}`} className="block h-44 bg-black/50 shrink-0">
        <img
          src={game.img}
          alt={game.name}
          className="w-full h-full object-cover"
        />
      </a>
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-lg leading-tight">{game.name}</h3>
            <span className="text-[10px] uppercase tracking-wider text-emerald-400 shrink-0">
              {game.rated === '18+' ? '18+' : game.kind}
            </span>
          </div>
          <p className="text-sm opacity-70 mt-1">{game.blurb}</p>
        </div>
        <div className="mt-auto flex gap-2">
          <PlayLink
            href={game.id === 'mtgames' ? game.play : `/play/${game.id}`}
            external={game.id === 'mtgames' && external}
            className="inline-flex items-center justify-center font-semibold text-black bg-emerald-400 hover:bg-emerald-300 px-4 py-2 rounded-full text-sm"
          >
            Play
          </PlayLink>
          <a
            href={`/catalog/${game.id}`}
            className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-white/15 text-sm opacity-80 hover:opacity-100"
          >
            Details
          </a>
        </div>
      </div>
    </article>
  );
}
