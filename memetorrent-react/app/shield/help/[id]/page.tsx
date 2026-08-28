import { notFound } from 'next/navigation';
import BackLink from '../../BackLink';
import { articleById, renderShieldMd, SHIELD_ARTICLES } from '@/lib/shieldHelp';

export function generateStaticParams() {
  return SHIELD_ARTICLES.map((a) => ({ id: a.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = articleById(id);
  return { title: a ? `${a.title} · Shield Help` : 'Shield Help' };
}

export default async function ShieldHelpArticle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = articleById(id);
  if (!a) notFound();
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="flex flex-wrap gap-4 text-sm">
          <BackLink label="Back" />
          <a href="/shield/help" className="opacity-60 hover:opacity-100">
            All guides
          </a>
        </div>
        <p className="text-[11px] tracking-[0.22em] uppercase text-cyan-300/80 mt-8">{a.group}</p>
        {a.image ? (
          <img
            src={a.image}
            alt=""
            className="mt-4 w-full rounded-2xl border border-white/10 object-cover max-h-72"
          />
        ) : null}
        <article
          className="mt-6"
          dangerouslySetInnerHTML={{ __html: renderShieldMd(a.body) }}
        />
        <p className="mt-12 text-xs opacity-50">
          support@futuret3ch.com.au · safety@futuret3ch.com.au · sales@futuret3ch.com.au
        </p>
      </div>
    </main>
  );
}
