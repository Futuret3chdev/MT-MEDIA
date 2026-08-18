import Link from 'next/link';
import SecuritySuite from '@/components/software/SecuritySuite';

export default function SoftwareSecurityPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/" className="opacity-70 hover:opacity-100">
          ← Home
        </Link>
        <Link href="/software" className="opacity-70 hover:opacity-100">
          ← Software
        </Link>
      </div>
      <div className="uppercase text-xs tracking-[3px] text-emerald-400 mt-4 mb-2">Software · Security</div>
      <h1 className="text-4xl font-semibold tracking-tight mb-4">Security software.</h1>
      <p className="opacity-70 mb-10 max-w-2xl">
        Shield is the core. Beside it: Vault Lock, Seed Guard, Net Watch, Key Ring — live in this browser. No third-party antivirus brand. Keys stay on the device.
      </p>
      <SecuritySuite />
    </div>
  );
}
