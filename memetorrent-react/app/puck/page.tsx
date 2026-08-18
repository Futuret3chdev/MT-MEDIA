import Link from 'next/link';
import NightDesk from '@/components/games/NightDesk';
import NightWallet from '@/components/games/NightWallet';

export default function PuckPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-wrap gap-4 text-sm mb-6">
        <Link href="/" className="opacity-70 hover:opacity-100">
          ← Home
        </Link>
        <Link href="/catalog" className="opacity-70 hover:opacity-100">
          ← Games
        </Link>
        <Link href="/boards?game=puck" className="opacity-70 hover:opacity-100">
          Puck board
        </Link>
      </div>
      <div className="text-xs uppercase tracking-[3px] text-emerald-400 mb-2">3D rink</div>
      <h1 className="text-4xl font-semibold tracking-tight mb-2">MT Puck</h1>
      <p className="opacity-70 mb-6 max-w-2xl">
        You skate. You move the puck. The crowd hops when you score. First to 5 or the clock.
      </p>
      <iframe
        src="/games/puck3d/index.html"
        title="MT Puck"
        className="w-full border-0 rounded-3xl bg-black"
        style={{ height: 'min(70vh, 720px)', minHeight: 480 }}
        allow="autoplay"
      />
      <p className="mt-2 text-xs opacity-50">WASD / drag to skate · Space or click through the ice to shoot</p>
      <div className="mt-6 max-w-md">
        <NightWallet name="" />
      </div>
      <NightDesk />
    </div>
  );
}
