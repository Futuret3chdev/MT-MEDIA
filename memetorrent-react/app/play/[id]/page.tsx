import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { CATALOG, getGame, isStaticPlay } from '@/lib/mt-catalog';

export function generateStaticParams() {
  return CATALOG.map((g) => ({ id: g.id }));
}

export default async function PlayGamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = getGame(id);
  if (!g) notFound();
  if (!isStaticPlay(g.play)) {
    redirect(g.play.startsWith('http') ? `/catalog/${g.id}` : g.play);
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap gap-4 text-sm">
        <Link href="/" className="opacity-70 hover:opacity-100">
          ← Home
        </Link>
        <Link href="/catalog" className="opacity-70 hover:opacity-100">
          ← Games
        </Link>
        <Link href={`/catalog/${g.id}`} className="opacity-70 hover:opacity-100">
          {g.name}
        </Link>
      </div>
      <iframe
        src={g.play}
        title={g.name}
        className="block w-full border-0 bg-black"
        style={{ height: 'calc(100dvh - 15rem)', minHeight: 520 }}
        allow="clipboard-write; fullscreen"
      />
    </div>
  );
}
