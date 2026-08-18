import Link from 'next/link';
import NightDesk from '@/components/games/NightDesk';
import NightWallet from '@/components/games/NightWallet';

export default function RacerPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-wrap gap-4 text-sm mb-6">
        <Link href="/" className="opacity-70 hover:opacity-100">
          ← Home
        </Link>
        <Link href="/catalog" className="opacity-70 hover:opacity-100">
          ← Games
        </Link>
        <Link href="/boards?game=racer" className="opacity-70 hover:opacity-100">
          Racer board
        </Link>
      </div>
      <div className="text-xs uppercase tracking-[3px] text-emerald-400 mb-2">Night highway</div>
      <h1 className="text-4xl font-semibold tracking-tight mb-2">MT Racer</h1>
      <p className="opacity-70 mb-6 max-w-2xl">
        Pick a body colour. Hit the highway. Pass traffic, bag $MT, Space for nitro. Same wallet and staff desk as the other nights.
      </p>
      <iframe
        src="/games/racer3d/index.html"
        title="MT Racer"
        className="w-full border-0 rounded-3xl bg-black"
        style={{ height: 'min(70vh, 720px)', minHeight: 480 }}
        allow="autoplay"
      />
      <div className="mt-6 max-w-md">
        <NightWallet name="" />
      </div>
      <NightDesk />
    </div>
  );
}
