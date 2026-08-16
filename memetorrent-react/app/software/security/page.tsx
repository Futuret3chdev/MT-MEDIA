import Link from 'next/link';

export default function SoftwareSecurityPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/" className="opacity-70 hover:opacity-100">← Home</Link>
        <Link href="/software" className="opacity-70 hover:opacity-100">← Software</Link>
      </div>
      <div className="uppercase text-xs tracking-[3px] text-emerald-400 mt-4 mb-2">Software · Security</div>
      <h1 className="text-4xl font-semibold tracking-tight mb-4">Security software.</h1>
      <p className="opacity-70 mb-8">
        Security products from Futuret3ch and MemeTorrent.
      </p>
      <ul className="space-y-3 text-sm opacity-80 mb-8">
        <li>• Our own client and server security tools</li>
        <li>• Network protection we operate and sign</li>
        <li>• Downloads and docs when a release is ready</li>
      </ul>
      <p className="text-sm opacity-70">Releases will appear here.</p>
    </div>
  );
}
