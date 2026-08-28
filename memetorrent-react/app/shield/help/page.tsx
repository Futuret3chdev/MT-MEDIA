import type { Metadata } from 'next';
import BackLink from '../BackLink';
import HelpIndex from './HelpIndex';
import { SHIELD_ARTICLES } from '@/lib/shieldHelp';

export const metadata: Metadata = {
  title: `Shield Help · ${SHIELD_ARTICLES.length} guides`,
  description: 'Every Shield help guide from the Mac product, on the public hub.',
};

export default function ShieldHelpPage() {
  const slim = SHIELD_ARTICLES.map(({ id, title, group, body }) => ({
    id,
    title,
    group,
    body,
  }));
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <BackLink label="Back" />
        <p className="text-[11px] tracking-[0.28em] text-cyan-300 font-bold mt-8">SHIELD HELP</p>
        <h1 className="text-4xl font-semibold tracking-tight mt-2">
          {SHIELD_ARTICLES.length} guides
        </h1>
        <p className="mt-3 text-sm opacity-70 max-w-2xl">
          Install, grid, map, safety, Family Link, Business seats, and more. Support:{' '}
          <a className="text-cyan-300" href="mailto:support@futuret3ch.com.au">
            support@futuret3ch.com.au
          </a>{' '}
          · Safety:{' '}
          <a className="text-cyan-300" href="mailto:safety@futuret3ch.com.au">
            safety@futuret3ch.com.au
          </a>
          .
        </p>
        <div className="mt-10">
          <HelpIndex articles={slim} />
        </div>
      </div>
    </main>
  );
}
