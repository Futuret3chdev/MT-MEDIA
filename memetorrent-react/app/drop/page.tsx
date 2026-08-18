import Link from 'next/link';
import MtDrop from '@/components/games/MtDrop';

export default function DropPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-wrap gap-4 text-sm mb-6">
        <Link href="/" className="opacity-70 hover:opacity-100">← Home</Link>
        <Link href="/catalog" className="opacity-70 hover:opacity-100">← Games</Link>
        <Link href="/boards?game=drop" className="opacity-70 hover:opacity-100">Drop board</Link>
      </div>
      <h1 className="text-4xl font-semibold tracking-tight mb-2">$MT Drop</h1>
      <p className="opacity-70 mb-6">Catch green. Dodge rugs. One thumb.</p>
      <MtDrop />
    </div>
  );
}
