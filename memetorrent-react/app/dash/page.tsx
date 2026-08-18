import Link from 'next/link';
import MtDash from '@/components/games/MtDash';

export default function DashPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-wrap gap-4 text-sm mb-6">
        <Link href="/" className="opacity-70 hover:opacity-100">
          ← Home
        </Link>
        <Link href="/catalog" className="opacity-70 hover:opacity-100">
          ← Games
        </Link>
        <Link href="/boards?game=dash" className="opacity-70 hover:opacity-100">
          Dash board
        </Link>
      </div>
      <div className="text-xs uppercase tracking-[3px] text-emerald-400 mb-2">P2E jumper</div>
      <h1 className="text-4xl font-semibold tracking-tight mb-2">MT Dash</h1>
      <p className="opacity-70 mb-6 max-w-2xl">
        Bounce the night towers. Grab $MT. Dodge rugs. Wallet + staff desk same as the other nights.
      </p>
      <MtDash />
    </div>
  );
}
