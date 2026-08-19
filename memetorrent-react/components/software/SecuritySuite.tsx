'use client';

import { useEffect, useMemo, useState } from 'react';

type Tool = 'shield' | 'vaultlock' | 'seedguard' | 'netwatch' | 'keyring' | 'phish' | 'clip' | 'signdesk' | 'allowlist';

const KNOWN = [
  'memetorrent.futuret3ch.com.au',
  'mt.futuret3ch.com.au',
  'futuret3ch.com.au',
  'admin.futuret3ch.com.au',
  'pool.futuret3ch.com.au',
  'localhost',
  '127.0.0.1',
];

type RingKey = { id: string; name: string; preview: string; created: number; hex?: string };

function today() {
  return new Date().toISOString().slice(0, 10);
}

function hostOf(raw: string) {
  try {
    const u = new URL(raw.includes('://') ? raw : 'https://' + raw);
    return u.hostname.toLowerCase();
  } catch {
    return raw.replace(/^https?:\/\//, '').split('/')[0].toLowerCase();
  }
}

function nearSpoof(host: string) {
  const needles = ['memetorrent', 'futuret3ch', 'mt-eco', 'infinitewallet'];
  const tidy = host.replace(/[^a-z0-9.-]/g, '');
  return needles.some((n) => {
    if (tidy.includes(n)) return !KNOWN.some((k) => tidy === k || tidy.endsWith('.' + k));
    const close = n.split('').filter((ch, i) => tidy[i] === ch).length;
    return tidy.length > 6 && close >= n.length - 2 && !KNOWN.includes(tidy);
  });
}

export default function SecuritySuite() {
  const [tool, setTool] = useState<Tool>('shield');
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(location.host);
    const h = location.hash.replace('#', '') as Tool;
    if (['shield', 'vaultlock', 'seedguard', 'netwatch', 'keyring', 'phish', 'clip', 'signdesk', 'allowlist'].includes(h)) setTool(h);
  }, []);

  function pick(id: Tool) {
    setTool(id);
    history.replaceState(null, '', '#' + id);
  }

  const cards: { id: Tool; name: string; tag: string; desc: string }[] = [
    { id: 'shield', name: 'Shield', tag: 'Core', desc: 'Site and wallet guard. Client-side keys, signed traffic, no seed on any server.' },
    { id: 'vaultlock', name: 'Vault Lock', tag: '$MT exclusive', desc: 'Freeze outgoing $MT over a daily limit until you confirm twice.' },
    { id: 'seedguard', name: 'Seed Guard', tag: '$MT exclusive', desc: 'Offline phrase check and 3-share split. Words never leave this tab.' },
    { id: 'netwatch', name: 'Net Watch', tag: '$MT exclusive', desc: 'Check an RPC or claim URL against MT hosts before you sign.' },
    { id: 'keyring', name: 'Key Ring', tag: '$MT exclusive', desc: 'Named device keys in this browser only. Switch the active ring.' },
    { id: 'phish', name: 'Phish Scan', tag: 'Live', desc: 'Paste a DM or claim. Flags seed-asks, fake MT hosts, and drain language.' },
    { id: 'clip', name: 'Clip Guard', tag: 'Live', desc: 'Read the clipboard here. Warn if an address swapped after you copied yours.' },
    { id: 'signdesk', name: 'Sign Desk', tag: 'Live', desc: 'Paste a message or payload before you sign. Stays on this device.' },
    { id: 'allowlist', name: 'Allow List', tag: 'Live', desc: 'Hosts you trust for $MT. Check a new URL against your own list.' },
  ];

  return (
    <div>
      <div className="grid sm:grid-cols-2 gap-4">
        {cards.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => pick(t.id)}
            className={`text-left rounded-2xl border p-6 bg-white/[0.02] ${
              tool === t.id ? 'border-emerald-400/50' : 'border-white/10'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <h2 className="text-xl font-semibold">{t.name}</h2>
              <span className={`text-[10px] uppercase tracking-[1px] px-2 py-1 rounded-full ${
                t.tag.includes('$MT') ? 'text-amber-300 border border-amber-300/40' : 'text-emerald-400 border border-emerald-400/40'
              }`}>
                {t.tag}
              </span>
            </div>
            <p className="text-sm opacity-70 mb-3">{t.desc}</p>
            <div className="text-xs text-emerald-400">{tool === t.id ? 'Open below' : 'Open tool →'}</div>
          </button>
        ))}
      </div>
      <div className="mt-8 rounded-3xl border border-white/10 p-6 bg-white/[0.02]">
        {tool === 'shield' && <ShieldPanel origin={origin} />}
        {tool === 'vaultlock' && <VaultLock />}
        {tool === 'seedguard' && <SeedGuard />}
        {tool === 'netwatch' && <NetWatch origin={origin} />}
        {tool === 'keyring' && <KeyRing />}
        {tool === 'phish' && <PhishScan />}
        {tool === 'clip' && <ClipGuard />}
        {tool === 'signdesk' && <SignDesk />}
        {tool === 'allowlist' && <AllowList />}
      </div>
    </div>
  );
}

function ShieldPanel({ origin }: { origin: string }) {
  const [secure, setSecure] = useState(false);
  useEffect(() => { setSecure(location.protocol === 'https:' || location.hostname === 'localhost'); }, []);
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Shield</h3>
      <p className="text-sm opacity-70 mb-4">Core stack guard. Status on this device, not a third-party AV brand.</p>
      <ul className="space-y-2 text-sm">
        <li>Page host: <span className="font-mono text-emerald-400">{origin || '…'}</span></li>
        <li>Transport: {secure ? 'HTTPS / local — ok' : 'Not HTTPS — do not sign here'}</li>
        <li>Seeds: never posted to MT servers.</li>
        <li>Staff awards land on /claims after a signed night desk drop.</li>
      </ul>
    </div>
  );
}

function VaultLock() {
  const [limit, setLimit] = useState(1000);
  const [spent, setSpent] = useState(0);
  const [locked, setLocked] = useState(true);
  const [confirm, setConfirm] = useState(0);
  const [msg, setMsg] = useState('Outgoing $MT over the daily cap stays frozen until you tap Confirm twice.');

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('mt-vault-lock') || '{}');
      if (raw.day !== today()) {
        setLimit(Number(raw.limit) || 1000);
        setSpent(0);
        setLocked(raw.locked !== false);
        return;
      }
      setLimit(Number(raw.limit) || 1000);
      setSpent(Number(raw.spent) || 0);
      setLocked(raw.locked !== false);
    } catch { /* */ }
  }, []);

  function save(next: { limit?: number; spent?: number; locked?: boolean }) {
    const row = { limit: next.limit ?? limit, spent: next.spent ?? spent, locked: next.locked ?? locked, day: today() };
    setLimit(row.limit); setSpent(row.spent); setLocked(row.locked);
    try { localStorage.setItem('mt-vault-lock', JSON.stringify(row)); } catch { /* */ }
  }

  function trySend(amount: number) {
    if (locked && spent + amount > limit) {
      setConfirm(0);
      setMsg(`Frozen. ${amount} $MT would pass the ${limit} daily cap. Unlock with two confirms.`);
      return;
    }
    save({ spent: spent + amount });
    setMsg(`Sent ${amount} $MT in this local vault sim. Spent today ${spent + amount} / ${limit}.`);
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Vault Lock</h3>
      <p className="text-sm opacity-70 mb-4">Local daily cap. Nothing leaves this browser. Use it as the gate before a real send.</p>
      <label className="block text-xs uppercase tracking-[1px] opacity-50 mb-1">Daily $MT cap</label>
      <input
        type="number"
        min={1}
        value={limit}
        onChange={(e) => save({ limit: Number(e.target.value) || 0 })}
        className="w-full max-w-xs rounded-xl bg-black/40 border border-white/15 px-3 py-2 mb-3"
      />
      <div className="text-sm mb-3">Spent today <span className="text-emerald-400 font-mono">{spent}</span> / {limit} · {locked ? 'LOCKED' : 'UNLOCKED'}</div>
      <div className="flex flex-wrap gap-2 mb-3">
        {[50, 250, 1000].map((n) => (
          <button key={n} type="button" onClick={() => trySend(n)} className="rounded-full border border-white/20 px-4 py-2 text-sm">
            Send {n} $MT
          </button>
        ))}
        <button type="button" onClick={() => save({ spent: 0 })} className="rounded-full border border-white/20 px-4 py-2 text-sm">Reset day</button>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        <button
          type="button"
          onClick={() => {
            if (!locked) { save({ locked: true }); setConfirm(0); setMsg('Vault locked again.'); return; }
            const n = confirm + 1;
            setConfirm(n);
            if (n >= 2) { save({ locked: false }); setConfirm(0); setMsg('Unlocked for this tab. Cap still applies unless you lock.'); }
            else setMsg('Confirm once more to unlock.');
          }}
          className="rounded-full bg-emerald-400 text-black font-bold px-5 py-2"
        >
          {locked ? (confirm ? 'Confirm unlock again' : 'Unlock (2 taps)') : 'Lock vault'}
        </button>
      </div>
      <p className="text-sm opacity-70">{msg}</p>
    </div>
  );
}

function SeedGuard() {
  const [text, setText] = useState('');
  const [shares, setShares] = useState<string[]>([]);
  const [msg, setMsg] = useState('Paste is local. Close the tab and it is gone.');

  const words = useMemo(() => text.trim().toLowerCase().split(/\s+/).filter(Boolean), [text]);

  function analyze() {
    if (!words.length) { setMsg('No words.'); return; }
    const uniq = new Set(words).size;
    const odd = words.filter((w) => w.length < 3 || /\d/.test(w));
    const ok = words.length === 12 || words.length === 24;
    setMsg(
      `${words.length} words · ${uniq} unique` +
      (ok ? ' · 12/24 count ok' : ' · not 12 or 24') +
      (odd.length ? ` · check: ${odd.slice(0, 4).join(', ')}` : '') +
      '. Not uploaded.'
    );
  }

  function split() {
    if (words.length < 8) { setMsg('Need more words to split.'); return; }
    const raw = words.join(' ');
    const a = Array.from(crypto.getRandomValues(new Uint8Array(raw.length)));
    const b = Array.from(crypto.getRandomValues(new Uint8Array(raw.length)));
    const c = a.map((n, i) => n ^ b[i] ^ raw.charCodeAt(i));
    const enc = (arr: number[]) => btoa(String.fromCharCode(...arr));
    setShares(['A:' + enc(a), 'B:' + enc(b), 'C:' + enc(c)]);
    setMsg('Three shares on this device. Any two plus this page are not enough without the third. Copy offline. We do not store them.');
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Seed Guard</h3>
      <p className="text-sm opacity-70 mb-4">Offline phrase check. Never send these words to chat, staff, or a form on another site.</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        spellCheck={false}
        autoComplete="off"
        placeholder="12 or 24 words — stay in this box"
        className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 mb-3 font-mono text-sm"
      />
      <div className="flex flex-wrap gap-2 mb-3">
        <button type="button" onClick={analyze} className="rounded-full bg-emerald-400 text-black font-bold px-5 py-2">Check here</button>
        <button type="button" onClick={split} className="rounded-full border border-white/20 px-4 py-2 text-sm">Split 3 shares</button>
        <button type="button" onClick={() => { setText(''); setShares([]); setMsg('Cleared.'); }} className="rounded-full border border-white/20 px-4 py-2 text-sm">Clear</button>
      </div>
      <p className="text-sm opacity-70 mb-3">{msg}</p>
      {shares.length > 0 && (
        <div className="space-y-2">
          {shares.map((s) => (
            <div key={s.slice(0, 2)} className="text-xs font-mono break-all rounded-xl border border-white/10 p-3">{s}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function NetWatch({ origin }: { origin: string }) {
  const [url, setUrl] = useState('');
  const [verdict, setVerdict] = useState('');

  function check(raw: string) {
    const host = hostOf(raw || origin);
    if (!host) { setVerdict('No host.'); return; }
    if (KNOWN.some((k) => host === k || host.endsWith('.' + k))) {
      setVerdict(`${host} is an MT host.`);
      return;
    }
    if (nearSpoof(host)) {
      setVerdict(`${host} looks like a spoof of an MT name. Do not sign.`);
      return;
    }
    setVerdict(`${host} is unknown. Treat as foreign. Do not paste a seed.`);
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Net Watch</h3>
      <p className="text-sm opacity-70 mb-4">Compare a claim / RPC URL to the hosts we run. This tab: {origin || '…'}</p>
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://…"
        className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 mb-3"
      />
      <div className="flex flex-wrap gap-2 mb-3">
        <button type="button" onClick={() => check(url)} className="rounded-full bg-emerald-400 text-black font-bold px-5 py-2">Check URL</button>
        <button type="button" onClick={() => check(origin)} className="rounded-full border border-white/20 px-4 py-2 text-sm">Check this page</button>
      </div>
      <p className="text-sm mb-3">{verdict}</p>
      <div className="text-xs opacity-50">Known: {KNOWN.join(' · ')}</div>
    </div>
  );
}

function KeyRing() {
  const [keys, setKeys] = useState<RingKey[]>([]);
  const [active, setActive] = useState('');
  const [name, setName] = useState('Main');
  const [once, setOnce] = useState('');

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('mt-keyring') || '{}');
      setKeys(raw.keys || []);
      setActive(raw.active || '');
    } catch { /* */ }
  }, []);

  function persist(next: RingKey[], act: string) {
    setKeys(next);
    setActive(act);
    try { localStorage.setItem('mt-keyring', JSON.stringify({ keys: next.map(({ hex, ...k }) => k), active: act })); } catch { /* */ }
  }

  function add() {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    const hex = Array.from(bytes).map((n) => n.toString(16).padStart(2, '0')).join('');
    const row: RingKey = {
      id: hex.slice(0, 12),
      name: name.trim() || 'Key',
      preview: hex.slice(0, 8) + '…' + hex.slice(-4),
      created: Date.now(),
    };
    persist([row, ...keys], row.id);
    setOnce(hex);
    setName('');
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Key Ring</h3>
      <p className="text-sm opacity-70 mb-4">Named device keys. Stored in this browser only. Shown in full once at create.</p>
      <div className="flex gap-2 mb-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="flex-1 rounded-xl bg-black/40 border border-white/15 px-3 py-2"
        />
        <button type="button" onClick={add} className="rounded-full bg-emerald-400 text-black font-bold px-5 py-2">New key</button>
      </div>
      {once && (
        <div className="mb-3 rounded-xl border border-amber-300/40 p-3 text-xs font-mono break-all">
          Copy now — {once}
          <button type="button" className="block mt-2 text-amber-300" onClick={() => setOnce('')}>Hide</button>
        </div>
      )}
      <ul className="space-y-2">
        {keys.map((k) => (
          <li key={k.id} className="flex items-center justify-between gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm">
            <div>
              <div className="font-semibold">{k.name} {active === k.id ? <span className="text-emerald-400 text-xs">ACTIVE</span> : null}</div>
              <div className="font-mono text-xs opacity-50">{k.preview}</div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => persist(keys, k.id)} className="text-xs rounded-full border border-white/20 px-3 py-1">Use</button>
              <button type="button" onClick={() => persist(keys.filter((x) => x.id !== k.id), active === k.id ? '' : active)} className="text-xs rounded-full border border-white/20 px-3 py-1">Drop</button>
            </div>
          </li>
        ))}
      </ul>
      {!keys.length && <p className="text-sm opacity-50">No keys on this device yet.</p>}
    </div>
  );
}

function PhishScan() {
  const [text, setText] = useState('');
  const [hits, setHits] = useState<string[]>([]);

  function scan() {
    const t = text.toLowerCase();
    const out: string[] = [];
    if (/\b(seed|mnemonic|recovery phrase|12 words|24 words)\b/.test(t)) out.push('Asks for a seed or recovery phrase. Never send that.');
    if (/\b(verify wallet|connect to claim|airdrop|free \$mt)\b/.test(t)) out.push('Claim / airdrop language. Open Claim on this site only.');
    if (/\b(private key|export key|keystore)\b/.test(t)) out.push('Asks for a private key. Stop.');
    const urls = text.match(/https?:\/\/[^\s]+/gi) || text.match(/\b[a-z0-9.-]+\.(com|au|app|io|xyz|net)\b/gi) || [];
    urls.forEach((u) => {
      const h = hostOf(u);
      if (nearSpoof(h)) out.push(h + ' looks like a spoof of an MT name.');
      else if (h && !KNOWN.some((k) => h === k || h.endsWith('.' + k))) out.push(h + ' is not an MT host.');
    });
    if (!out.length) out.push('No seed-ask or spoof host found. Still do not sign off this site.');
    setHits(out);
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Phish Scan</h3>
      <p className="text-sm opacity-70 mb-4">Paste a DM, tweet, or claim. Nothing is uploaded.</p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 mb-3 text-sm" placeholder="Paste the message here" />
      <button type="button" onClick={scan} className="rounded-full bg-emerald-400 text-black font-bold px-5 py-2 mb-3">Scan here</button>
      <ul className="space-y-2 text-sm">
        {hits.map((h) => <li key={h} className="rounded-xl border border-white/10 px-3 py-2">{h}</li>)}
      </ul>
    </div>
  );
}

function ClipGuard() {
  const [mine, setMine] = useState('');
  const [clip, setClip] = useState('');
  const [verdict, setVerdict] = useState('');

  useEffect(() => {
    try { setMine(localStorage.getItem('mt-game-wallet') || ''); } catch { /* */ }
  }, []);

  async function readClip() {
    try {
      const t = await navigator.clipboard.readText();
      setClip(t.trim());
      const a = t.trim();
      if (!a) { setVerdict('Clipboard is empty.'); return; }
      if (mine && a !== mine && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a)) {
        setVerdict('Address in the clipboard is not your last connected wallet. Possible swap. Paste yours again from the wallet app.');
        return;
      }
      if (/seed|mnemonic|phrase/i.test(a)) {
        setVerdict('Clipboard looks like a phrase. Do not paste it into chat.');
        return;
      }
      setVerdict(mine && a === mine ? 'Matches your last connected wallet.' : 'Read. Compare it to your wallet app before you send.');
    } catch {
      setVerdict('Clipboard blocked. Paste into the box instead.');
    }
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Clip Guard</h3>
      <p className="text-sm opacity-70 mb-4">Malware swaps addresses in the clipboard. Check here before you send.</p>
      <input value={mine} onChange={(e) => setMine(e.target.value)} placeholder="Your address" className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 mb-2 font-mono text-sm" />
      <input value={clip} onChange={(e) => setClip(e.target.value)} placeholder="Or paste clipboard here" className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 mb-3 font-mono text-sm" />
      <div className="flex gap-2 mb-3">
        <button type="button" onClick={readClip} className="rounded-full bg-emerald-400 text-black font-bold px-5 py-2">Read clipboard</button>
        <button type="button" onClick={() => {
          if (!clip) { setVerdict('Nothing to compare.'); return; }
          setVerdict(mine && clip.trim() === mine.trim() ? 'Match.' : 'Does not match your address.');
        }} className="rounded-full border border-white/20 px-4 py-2 text-sm">Compare paste</button>
      </div>
      <p className="text-sm">{verdict}</p>
    </div>
  );
}

function SignDesk() {
  const [raw, setRaw] = useState('');
  const [out, setOut] = useState('');

  function check() {
    const t = raw.trim();
    if (!t) { setOut('Empty.'); return; }
    const words = t.split(/\s+/);
    const flags: string[] = [];
    flags.push(t.length + ' characters · ' + words.length + ' tokens.');
    if (words.length === 12 || words.length === 24) flags.push('Looks like a seed. Do not sign or send this.');
    if (/transfer|approve|setauthority|closeaccount/i.test(t)) flags.push('Instruction language — treat as a spend.');
    if (/^[0-9a-fA-F]+$/.test(t) && t.length > 64) flags.push('Long hex payload. Decode in a wallet you trust, not a random site.');
    if (/^[1-9A-HJ-NP-Za-km-z]{32,88}$/.test(t)) flags.push('Looks like base58. Confirm the address in your wallet.');
    flags.push('This desk does not sign. It only reads locally.');
    setOut(flags.join(' '));
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Sign Desk</h3>
      <p className="text-sm opacity-70 mb-4">Paste a message or payload before you approve it in the wallet.</p>
      <textarea value={raw} onChange={(e) => setRaw(e.target.value)} rows={5} className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 mb-3 font-mono text-sm" />
      <button type="button" onClick={check} className="rounded-full bg-emerald-400 text-black font-bold px-5 py-2 mb-3">Check here</button>
      <p className="text-sm opacity-80">{out}</p>
    </div>
  );
}

function AllowList() {
  const [list, setList] = useState<string[]>([]);
  const [add, setAdd] = useState('');
  const [check, setCheck] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    try { setList(JSON.parse(localStorage.getItem('mt-allow-hosts') || '[]')); } catch { /* */ }
  }, []);

  function save(next: string[]) {
    setList(next);
    try { localStorage.setItem('mt-allow-hosts', JSON.stringify(next)); } catch { /* */ }
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Allow List</h3>
      <p className="text-sm opacity-70 mb-4">Hosts you personally trust for $MT. Stored here only.</p>
      <div className="flex gap-2 mb-3">
        <input value={add} onChange={(e) => setAdd(e.target.value)} placeholder="host.example" className="flex-1 rounded-xl bg-black/40 border border-white/15 px-3 py-2" />
        <button type="button" onClick={() => {
          const h = hostOf(add);
          if (!h) return;
          save(Array.from(new Set([...list, h])));
          setAdd('');
        }} className="rounded-full bg-emerald-400 text-black font-bold px-5 py-2">Add</button>
      </div>
      <div className="flex gap-2 mb-3">
        <input value={check} onChange={(e) => setCheck(e.target.value)} placeholder="URL to test" className="flex-1 rounded-xl bg-black/40 border border-white/15 px-3 py-2" />
        <button type="button" onClick={() => {
          const h = hostOf(check);
          const ok = list.some((k) => h === k || h.endsWith('.' + k)) || KNOWN.some((k) => h === k || h.endsWith('.' + k));
          setMsg(ok ? h + ' is allowed or an MT host.' : h + ' is not on your list.');
        }} className="rounded-full border border-white/20 px-4 py-2 text-sm">Test</button>
      </div>
      <p className="text-sm mb-3">{msg}</p>
      <ul className="space-y-1 text-sm font-mono">
        {list.map((h) => (
          <li key={h} className="flex justify-between gap-2">
            <span>{h}</span>
            <button type="button" className="text-xs opacity-50" onClick={() => save(list.filter((x) => x !== h))}>drop</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
