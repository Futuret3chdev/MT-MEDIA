import Link from 'next/link';
import type { Metadata } from 'next';
import BackLink from '../BackLink';

export const metadata: Metadata = {
  title: 'Shield downloads · Futuret3ch',
  description: 'Install Shield on Mac, Windows, browser, iPhone, and Android.',
};

const FILES = [
  {
    id: 'mac',
    label: 'Mac',
    file: '/downloads/shield/Shield-mac.zip',
    note: 'Unzip → Shield.app → right-click Open. Opens the hub and trial.',
  },
  {
    id: 'windows',
    label: 'Windows',
    file: '/downloads/shield/Shield-windows.zip',
    note: 'Unzip → double-click Shield.cmd. Opens the hub and trial.',
  },
  {
    id: 'extension',
    label: 'Browser extension',
    file: '/downloads/shield/Shield-extension.zip',
    note: 'Chrome / Edge / Brave: chrome://extensions → Developer mode → Load unpacked (unzipped folder).',
  },
  {
    id: 'android',
    label: 'Android',
    file: '/downloads/shield/android/README.txt',
    note: 'Open the hub in Chrome → Add to Home screen. Native APK when the signed build is published.',
  },
  {
    id: 'ios',
    label: 'iPhone companion',
    file: '/shield',
    note: 'Safari → Share → Add to Home Screen. Companion only — Apple does not allow a full-disk AV.',
  },
];

export default function ShieldDownloadsPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <BackLink label="Back to Shield" />
        <h1 className="text-3xl font-semibold mt-8">Install files</h1>
        <p className="mt-3 text-sm opacity-70">
          Same portal login on every device. Trial:{' '}
          <Link href="/login?next=/shield/trial&from=shield-dl" className="text-cyan-300">
            14 days
          </Link>
          . Support:{' '}
          <a href="mailto:support@futuret3ch.com.au" className="text-cyan-300">
            support@futuret3ch.com.au
          </a>
        </p>
        <ul className="mt-8 space-y-4">
          {FILES.map((f) => (
            <li key={f.id} className="rounded-2xl border border-white/10 p-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[12rem]">
                <div className="font-semibold">{f.label}</div>
                <p className="text-sm opacity-70 mt-1">{f.note}</p>
              </div>
              <a
                href={f.file}
                download={f.file.endsWith('.zip') || f.file.endsWith('.txt')}
                className="px-4 py-2 rounded-full bg-cyan-400 text-black font-semibold text-sm"
              >
                Download
              </a>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
