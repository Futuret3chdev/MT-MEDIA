import type { Metadata } from 'next';
import BackLink from '../BackLink';

export const metadata: Metadata = {
  title: 'Shield API · Futuret3ch',
  description: 'Shield public API reference. Hub: memetorrent.futuret3ch.com.au/shield',
};

const ENDPOINTS = [
  ['POST /v1/auth/signup', 'Email + password. Returns session.'],
  ['POST /v1/auth/login', 'Email + password.'],
  ['POST /v1/auth/oauth/google', 'Google sign-in. Avatar stored for the cog.'],
  ['POST /v1/auth/oauth/facebook', 'Facebook sign-in. Avatar stored for the cog.'],
  ['GET /v1/me', 'Profile, plan, trial clock, add-ons, threat level.'],
  ['PATCH /v1/me/threat-level', 'everyday | elevated | stalking | child'],
  ['GET /v1/me/devices', 'Licensed devices for this account.'],
  ['POST /v1/devices/:id/heartbeat', 'OS, Shield version, last scan.'],
  ['POST /v1/devices/:id/diagnostics', 'User-approved upload only.'],
  ['GET /v1/scans', 'Scan history. Real results, nothing invented.'],
  ['POST /v1/scans', 'Start an on-demand scan on a licensed device.'],
  ['POST /v1/guide/chat', 'Guide AI. Threat-level playbooks. Refuses attack advice.'],
  ['POST /v1/family/link', 'Create a visible guardian link code.'],
  ['POST /v1/family/accept', 'Child accepts. Banner always shown. Child can unlink.'],
  ['GET /v1/family/children/:id/presence', 'Last seen. Location only if Location Share is on.'],
  ['POST /v1/support/sessions', 'User creates. Staff join only after Allow.'],
  ['GET /v1/addons', 'Realtime AV, Network Ops, Family Link, Breach Watch, Concierge.'],
];

export default function ShieldApiPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <BackLink label="Back" />
        <a
          href="/developers"
          className="mt-8 inline-flex items-center gap-2 rounded-2xl border border-emerald-400/50 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-300"
        >
          ← Developers API is still at /developers (MT-Connect, wallets, social login)
        </a>
        <p className="text-[11px] tracking-[0.28em] text-cyan-300 font-bold mt-8">SHIELD PRODUCT API ONLY</p>
        <h1 className="text-4xl font-semibold tracking-tight mt-2">Shield product endpoints</h1>
        <p className="mt-4 text-sm opacity-80 leading-relaxed">
          This page does <strong>not</strong> replace the Developers API. The real site API is{' '}
          <a className="text-cyan-300 font-semibold" href="/developers">
            https://memetorrent.futuret3ch.com.au/developers
          </a>
          . Below is only Shield (licenses, scans, Guide). Hub:{' '}
          <a className="text-cyan-300" href="https://memetorrent.futuret3ch.com.au/shield">
            /shield
          </a>
          . Support:{' '}
          <a className="text-cyan-300" href="mailto:support@futuret3ch.com.au">
            support@futuret3ch.com.au
          </a>
          .
        </p>
        <p className="mt-3 text-sm opacity-70">
          Auth: user Bearer token or Head Office key. Billing checkout is not live — PayID now; cards, Send,
          and all other billing coming soon.
        </p>
        <ul className="mt-8 space-y-3 text-sm">
          {ENDPOINTS.map(([path, blurb]) => (
            <li key={path} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="font-mono text-cyan-300 text-xs sm:text-sm">{path}</div>
              <div className="opacity-70 mt-1">{blurb}</div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
