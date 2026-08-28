import type { Metadata } from 'next';
import Link from 'next/link';
import servicesData from '@/app/status/services.json';

export const metadata: Metadata = {
  title: 'Bots · MT ECO SYSTEM',
  description: 'Telegram, verification, TagMe, and message bots.',
};

export default function BotPage() {
  const bots = servicesData.services.filter((s) => /bot/i.test(s.key + s.name));
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/shield" className="text-sm opacity-60 hover:opacity-100">
          ← Products
        </Link>
        <h1 className="text-4xl font-semibold mt-6">Bots</h1>
        <p className="mt-3 text-sm opacity-70">
          Growth layer: Telegram portal, verification, TagMe, message bot. Same MT login where it applies.
        </p>
        <ul className="mt-8 space-y-2 text-sm">
          {bots.map((b) => (
            <li key={b.key} className="rounded-xl border border-white/10 px-4 py-3">
              <strong>{b.name}</strong>
              <span className="opacity-60"> · {b.public_status}</span>
            </li>
          ))}
        </ul>
        <a
          href="https://t.me/+hxWzh5DZbfhiYWM9"
          className="inline-block mt-8 px-4 py-2 rounded-full bg-emerald-400 text-black font-semibold text-sm"
          target="_blank"
          rel="noopener"
        >
          Open Telegram portal
        </a>
      </div>
    </main>
  );
}
