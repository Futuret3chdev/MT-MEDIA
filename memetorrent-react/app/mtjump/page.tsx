import Link from 'next/link';
import NightDesk from '@/components/games/NightDesk';
import NightWallet from '@/components/games/NightWallet';

export default function MtJumpPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex gap-4 text-sm mb-6">
        <Link href="/" className="opacity-70 hover:opacity-100">← Home</Link>
        <Link href="/catalog" className="opacity-70 hover:opacity-100">← Games</Link>
        <Link href="/boards?game=mtjump" className="opacity-70 hover:opacity-100">Jump board</Link>
      </div>
      <h1 className="text-4xl font-semibold mb-2">MT Jump</h1>
      <p className="opacity-70 mb-6">Mint token runner. Three worlds, shop skins that actually buy, air hop, dash, springs, ? blocks. Wallet + staff desk.</p>
      <iframe
        src="/games/mtjump/index.html"
        title="MT Jump"
        className="block w-full rounded-3xl border border-emerald-400/30 bg-black"
        style={{ height: 'min(78vh, 760px)', minHeight: 560 }}
        allow="autoplay; fullscreen"
      />
      <div className="mt-6 max-w-md mx-auto"><NightWallet name="" /></div>
      <NightDesk />
    </div>
  );
}
