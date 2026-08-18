'use client';

import { useState } from 'react';

export default function NightWallet({
  name,
  onBound,
}: {
  name: string;
  onBound?: (addr: string) => void;
}) {
  const [addr, setAddr] = useState('');
  const [handle, setHandle] = useState(name);
  const [msg, setMsg] = useState('Connect here so staff can drop $MT on Claim.');

  async function connect(type: string) {
    const p =
      type === 'solflare'
        ? window.solflare
        : type === 'backpack'
          ? window.backpack
          : window.phantom?.solana || window.solana || window.solflare || window.backpack;
    if (!p?.connect) {
      setMsg('Install Phantom, Solflare, or Backpack, then tap in this box.');
      return;
    }
    try {
      const res = await p.connect();
      const pk = res?.publicKey || p.publicKey;
      const wallet = pk && (typeof pk.toString === 'function' ? pk.toString() : String(pk));
      if (!wallet) throw new Error('No address');
      const who = (name || handle).trim();
      if (!who) {
        setMsg('Type your handle first, then connect.');
        return;
      }
      const save = await fetch('/api/games/night', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'wallet', name: who, wallet }),
      });
      const d = await save.json();
      if (!d.ok) {
        setMsg(d.error || 'Could not save wallet');
        return;
      }
      setAddr(wallet);
      setMsg('Wallet saved. Wins can land on Claim $MT.');
      onBound?.(wallet);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Wallet closed');
    }
  }

  return (
    <div className="rounded-2xl border border-emerald-400/35 bg-emerald-400/5 p-4 text-left">
      <h3 className="text-sm font-bold text-emerald-400 mb-1">Connect wallet</h3>
      <p className="text-xs opacity-70 mb-3">{msg}</p>
      {!name && (
        <input
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder="Handle"
          className="w-full mb-2 rounded-lg bg-black/40 border border-white/15 px-3 py-2 text-sm"
        />
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => connect('phantom')} className="px-3 py-2 rounded-full bg-emerald-400 text-black text-xs font-bold">
          Phantom
        </button>
        <button type="button" onClick={() => connect('solflare')} className="px-3 py-2 rounded-full border border-white/20 text-xs">
          Solflare
        </button>
        <button type="button" onClick={() => connect('backpack')} className="px-3 py-2 rounded-full border border-white/20 text-xs">
          Backpack
        </button>
      </div>
      {addr && <p className="mt-2 text-xs text-emerald-300 break-all">{addr.slice(0, 6)}…{addr.slice(-4)}</p>}
    </div>
  );
}

declare global {
  interface Window {
    solana?: { connect: () => Promise<{ publicKey?: { toString: () => string } }>; publicKey?: { toString: () => string } };
    solflare?: { connect: () => Promise<{ publicKey?: { toString: () => string } }>; publicKey?: { toString: () => string } };
    backpack?: { connect: () => Promise<{ publicKey?: { toString: () => string } }>; publicKey?: { toString: () => string } };
    phantom?: { solana?: Window['solana'] };
  }
}
