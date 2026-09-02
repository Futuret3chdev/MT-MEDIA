import Link from 'next/link';
import type { Metadata } from 'next';
import BackLink from '../BackLink';

export const metadata: Metadata = {
  title: 'Shield downloads · Futuret3ch',
  description: 'Install Shield on Mac, Windows, browser, iPhone, and Android.',
};

const FILES = [
  {
    id: 'android',
    label: 'Android APK (Play / sideload)',
    file: '/downloads/shield/Shield-android.apk',
    note: 'Install on a phone to test. For Play Console, open the android/ folder in Android Studio, generate a signed AAB (package au.com.futuret3ch.shield).',
  },
  {
    id: 'ios',
    label: 'iOS Xcode project (App Store)',
    file: '/downloads/shield/Shield-ios-xcode.zip',
    note: 'Must archive on a Mac with Xcode + Apple Developer. Product → Archive → App Store Connect. Linux cannot sign an IPA.',
  },
  {
    id: 'chrome',
    label: 'Chrome / Edge / Brave extension',
    file: '/downloads/shield/Shield-chrome-extension.zip',
    note: 'Unzip → chrome://extensions → Developer mode → Load unpacked. Zip is Web Store upload-ready (icons 16/48/128).',
  },
  {
    id: 'firefox',
    label: 'Firefox extension',
    file: '/downloads/shield/Shield-firefox-extension.zip',
    note: 'Unzip to test. Upload the zip at addons.mozilla.org (id shield@futuret3ch.com.au).',
  },
  {
    id: 'win',
    label: 'Windows (system app source)',
    file: '/downloads/shield/STORE.md',
    note: 'Electron desktop: on a Windows PC run npm install && npm run pack:win in shield-native. Produces Shield.exe with tray + local grid.',
  },
  {
    id: 'mac',
    label: 'Mac (system app source)',
    file: '/downloads/shield/STORE.md',
    note: 'On a Mac: npm run pack:mac then sign/notarize. Unsigned zip: right-click Open.',
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
                download={/\.(zip|apk|txt)$/.test(f.file)}
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
