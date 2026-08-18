import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CATALOG, getGame } from '@/lib/mt-catalog';
import PlayLink from '@/components/auth/PlayLink';

export function generateStaticParams() {
  return [
    ...CATALOG.map((g) => ({ id: g.id })),
    { id: 'mt-world-pocket' },
    { id: 'pocket' },
  ];
}

export default async function GameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = getGame(id);
  if (!g) notFound();
  const external = g.play.startsWith('http');
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/" className="opacity-70 hover:opacity-100">← Home</Link>
        <Link href="/catalog" className="opacity-70 hover:opacity-100">← Games</Link>
        {g.rated === '18+' && (
          <Link href="/casino" className="opacity-70 hover:opacity-100">← 18+ games</Link>
        )}
      </div>
      <div className="mt-4 rounded-3xl overflow-hidden border border-white/10">
        <div className="h-56 sm:h-72 bg-black">
          <img src={g.img} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="p-6 sm:p-8" style={{ background: 'var(--card)' }}>
          <div className="text-[11px] uppercase tracking-[2px] text-emerald-400 mb-2">
            {g.rated === '18+' ? '18+' : g.kind} · {g.status}
          </div>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">{g.name}</h1>
          <p className="opacity-70 max-w-2xl mb-6">{g.blurb}</p>
          <div className="flex flex-wrap gap-3">
            <PlayLink
              href={g.play}
              external={external}
              className="font-semibold text-black bg-emerald-400 hover:bg-emerald-300 px-5 py-2 rounded-full text-sm"
            >
              Play
            </PlayLink>
            <Link href="/p2e" className="px-5 py-2 rounded-full border border-white/15 text-sm">
              P2E board
            </Link>
            <Link href="/portal" className="px-5 py-2 rounded-full border border-white/15 text-sm">
              Library
            </Link>
            {g.source && (
              <a href={g.source} target="_blank" rel="noopener noreferrer" className="px-5 py-2 rounded-full border border-white/15 text-sm">
                Source
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
