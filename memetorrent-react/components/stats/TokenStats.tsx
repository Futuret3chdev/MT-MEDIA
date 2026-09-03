'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getTokenStats, MTStatsLive, getTopHolders, TopHolder, getTokenSecurity, TokenSecurity } from '@/lib/api';

// 100+ chains we plan to bridge with. Binance prominently included. Real images (not just names).
const BRIDGE_CHAINS: string[] = [
  'Binance Smart Chain (BSC)',
  'Solana', 'Ethereum', 'Base', 'Arbitrum', 'Optimism', 'Polygon', 'Avalanche',
  'Bitcoin', 'Cardano', 'Polkadot', 'Cosmos', 'Near', 'Aptos', 'Sui', 'Sei',
  'TON', 'Tron', 'Fantom', 'Gnosis', 'Linea', 'Scroll', 'Blast', 'Mode',
  'Mantle', 'zkSync', 'Starknet', 'Celestia', 'Injective', 'Osmosis', 'dYdX', 'Juno',
  'Kava', 'Akash', 'Secret', 'Persistence', 'Stride', 'Quicksilver', 'Neutron', 'Archway',
  'Berachain', 'Monad', 'Movement', 'Eclipse', 'Hyperliquid', 'Kamino', 'Jito', 'Drift',
  'Tensor', 'Magic Eden', 'Metaplex', 'Helium', 'Render', 'Akord', 'Filecoin', 'Arweave',
  'The Graph', 'Chainlink', 'Pyth', 'Wormhole', 'LayerZero', 'Axelar', 'CCIP', 'deBridge',
  'Across', 'Synapse', 'Hop', 'Connext', 'Orbiter', 'Socket', 'LI.FI', 'Rango',
  '1inch', '0x', 'Paraswap', 'CowSwap', 'Uniswap', 'Sushi', 'Curve', 'Balancer',
  'Aave', 'Compound', 'Maker', 'Spark', 'Morpho', 'Pendle', 'Ethena', 'EigenLayer',
  'Symbiotic', 'Karak', 'Renzo', 'Puffer', 'Zora', 'Farcaster', 'Lens', 'Friend.tech',
  'Pump.fun', 'Moonshot', 'Believe', 'Clanker', 'Bags', 'Moon',
  // More L1s/L2s/DeFi + infra to reach 100+
  'Cronos', 'OKX Chain', 'Celo', 'Moonbeam', 'Harmony', 'Klaytn', 'IoTeX', 'VeChain',
  'Flow', 'Tezos', 'Algorand', 'Hedera', 'Theta', 'EOS', 'Waves', 'ICON',
  'Qtum', 'NEO', 'Zilliqa', 'Elrond', 'Astar', 'Shiden', 'Karura', 'Acala',
  'Phala', 'Unique', 'Quartz', 'Bifrost', 'Interlay', 'Parallel', 'Centrifuge', 'Nodle',
  'Subspace', 'Aleph Zero', 'Kusama', 'Rococo', 'Westend', 'Litentry', 'Robonomics',
  'And dozens more L1s, L2s, app-chains & bridges via our self-built verifier...'
];

function getChainLogo(chain: string): string {
  const key = chain.toLowerCase().replace(/[^a-z]/g, '');
  const logos: Record<string, string> = {
    binancesmartchainbsc: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png',
    solana: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
    ethereum: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
    base: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png',
    arbitrum: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png',
    optimism: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png',
    polygon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png',
    avalanche: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png',
    bitcoin: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png',
    cardano: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/cardano/info/logo.png',
    polkadot: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polkadot/info/logo.png',
    cosmos: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/cosmos/info/logo.png',
    near: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/near/info/logo.png',
    aptos: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/aptos/info/logo.png',
    sui: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/sui/info/logo.png',
    sei: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/sei/info/logo.png',
    tron: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/tron/info/logo.png',
    fantom: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/fantom/info/logo.png',
    gnosis: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/gnosis/info/logo.png',
    linea: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/linea/info/logo.png',
    scroll: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/scroll/info/logo.png',
    blast: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/blast/info/logo.png',
    mantle: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/mantle/info/logo.png',
    zksync: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/zksync/info/logo.png',
    starknet: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/starknet/info/logo.png',
    celestia: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/celestia/info/logo.png',
    injective: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/injective/info/logo.png',
    osmosis: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/osmosis/info/logo.png',
    dydx: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/dydx/info/logo.png',
    juno: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/juno/info/logo.png',
    kava: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/kava/info/logo.png',
    akash: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/akash/info/logo.png',
    filecoin: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/filecoin/info/logo.png',
    arweave: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arweave/info/logo.png',
    thegraph: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/graph/info/logo.png',
    chainlink: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/chainlink/info/logo.png',
    pyth: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/pyth/info/logo.png',
    wormhole: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/wormhole/info/logo.png',
    layerzero: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/layerzero/info/logo.png',
    axelar: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/axelar/info/logo.png',
    // add more as trustwallet/assets grows; fallback to symbol for the rest
  };
  return logos[key] || '';
}

function chartPath(pts: number[], w = 640, h = 160) {
  if (pts.length < 2) return '';
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const span = max - min || 1;
  return pts
    .map((p, i) => {
      const x = (i / (pts.length - 1)) * w;
      const y = h - ((p - min) / span) * (h - 12) - 6;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

function pct(n: number) {
  if (!Number.isFinite(n)) return '0.0%';
  const s = `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
  return s;
}

export default function TokenStats() {
  const [stats, setStats] = useState<MTStatsLive | null>(null);
  const [topHolders, setTopHolders] = useState<TopHolder[]>([]);
  const [security, setSecurity] = useState<TokenSecurity | null>(null);
  const [range, setRange] = useState<'24h' | '7d'>('24h');
  const [copied, setCopied] = useState(false);

  // Only chains that have actual logo images (no names at all in the UI)
  const displayChains = BRIDGE_CHAINS.filter(
    (c) => !c.toLowerCase().includes('more') && !c.toLowerCase().includes('dozens')
  );
  const logoChains = displayChains.filter((c) => !!getChainLogo(c));

  useEffect(() => {
    getTokenStats().then(setStats).catch(console.error);
    getTopHolders().then(setTopHolders).catch(console.error);
    getTokenSecurity().then(setSecurity).catch(console.error);

    const i = setInterval(() => {
      getTokenStats().then(setStats).catch(console.error);
      getTopHolders().then(setTopHolders).catch(console.error);
      getTokenSecurity().then(setSecurity).catch(console.error);
    }, 15000);

    return () => clearInterval(i);
  }, []);

  const safeStats = stats || {
    price: '—',
    market_cap: '—',
    current_supply: '—',
    name: 'MemeTorrent',
    symbol: '$MT',
    total_buys: '0',
    total_sells: '0',
    total_buy_volume: '—',
    total_sell_volume: '—',
    liquidity: '—',
    fdv: '—',
  };

  const priceNum = stats?.priceNum ?? parseFloat(safeStats.price || '0');
  const up = (stats?.change24h || 0) >= 0;
  const points = range === '7d' ? (stats?.points7d || []) : (stats?.points24h || []);
  const path = chartPath(points);

  return (
    <section id="stats" className="py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-6xl mx-auto px-6"
      >
        <div
          className="rounded-3xl p-5 sm:p-8 border border-white/10 bg-white/[0.015]"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-y-3 mb-6">
            <div>
              <div className="text-emerald-400 text-xs tracking-[3px] mb-1">LIVE ON SOLANA • RAYDIUM $MT/SOL</div>
              <div className="text-3xl sm:text-4xl font-semibold tracking-tight">MT Token Stats</div>
              <div className="text-xs opacity-60 mt-1">Live from GeckoTerminal · auto-refresh 15s{stats ? '' : ' · loading…'}</div>
              <div className="mt-3 p-3 rounded-xl border border-emerald-400/30 bg-emerald-400/5">
                <div className="text-[10px] opacity-70 mb-0.5 tracking-widest">CONTRACT ADDRESS (COPY)</div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('ELywDcVX2WumHm4xEfqF8NdEKaeGCAaq9JmwtjE8pump');
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1200);
                  }}
                  className="font-mono text-sm sm:text-base text-emerald-400 hover:text-emerald-300 active:text-white font-semibold break-all text-left w-full"
                  title="Click to copy full $MT contract"
                >
                  {copied ? 'Copied' : 'ELywDcVX2WumHm4xEfqF8NdEKaeGCAaq9JmwtjE8pump'}
                </button>
              </div>
            </div>
            <div className="text-left sm:text-right text-xs opacity-60">
              {safeStats.name} ({safeStats.symbol})<br />
              24h Buys/Sells: {safeStats.total_buys || 0}/{safeStats.total_sells || 0}
            </div>
          </div>

          <div className="mb-6 rounded-2xl border border-white/10 bg-black/40 p-4 sm:p-5">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
              <div>
                <div className="text-xs uppercase tracking-wide opacity-60">Price</div>
                <div className="text-3xl sm:text-4xl font-semibold tabular-nums">
                  {priceNum > 0 ? `$${priceNum.toFixed(8).replace(/0+$/, '')}` : (stats ? '—' : '…')}
                </div>
                <div className={`text-sm font-semibold ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {pct(stats?.change24h || 0)} 24h
                  <span className="opacity-60 font-normal ml-2">{pct(stats?.change6h || 0)} 6h · {pct(stats?.change1h || 0)} 1h</span>
                </div>
              </div>
              <div className="flex gap-1">
                {(['24h', '7d'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRange(r)}
                    className={`px-3 py-1 rounded-full text-xs font-bold ${range === r ? 'bg-emerald-400 text-black' : 'border border-white/15 opacity-70'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <svg viewBox="0 0 640 160" className="w-full h-36 sm:h-44" preserveAspectRatio="none">
              {path ? (
                <>
                  <path d={`${path} L640,160 L0,160 Z`} fill={up ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)'} />
                  <path d={path} fill="none" stroke={up ? '#34d399' : '#f87171'} strokeWidth="2.2" />
                </>
              ) : (
                <text x="12" y="84" fill="#64748b" fontSize="14">{stats ? 'No candle history yet' : 'Loading chart…'}</text>
              )}
            </svg>
            <div className="text-[10px] opacity-50 mt-1">{range === '24h' ? 'Hourly closes' : 'Daily closes'} · Raydium pool {stats?.pair?.slice(0, 4)}…{stats?.pair?.slice(-4)}</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Stat label="Market Cap" value={safeStats.market_cap} sub="Price × supply" />
            <Stat label="FDV" value={safeStats.fdv || '—'} sub="Fully diluted" />
            <Stat label="Liquidity" value={safeStats.liquidity || '—'} sub="Raydium pool (both sides)" />
            <Stat
              label="24h Volume"
              value={safeStats.total_buy_volume ?? '—'}
              sub={`Buys ${safeStats.total_buys || 0} / Sells ${safeStats.total_sells || 0}`}
            />
            <Stat label="Supply" value={safeStats.current_supply} sub={`${safeStats.decimals ?? 6} decimals`} />
            <Stat label="Per 1B $MT" value={priceNum > 0 ? `$${Math.round(priceNum * 1_000_000_000).toLocaleString()}` : '—'} sub="USD value of 1,000,000,000" />
            <Stat label="Holders" value={security?.holder_count || '—'} sub="On-chain accounts" />
            <Stat label="Pool created" value={stats?.createdAt ? stats.createdAt.slice(0, 10) : '2025-02-07'} sub="UTC" />
          </div>

          {/* On-chain data rendered directly here using public APIs (GoPlus for security, Birdeye/DexScreener for others) — no external links */}

          {security && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="text-xs uppercase tracking-[3px] opacity-60 mb-2">Token Security (GoPlus)</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div>Mintable: <span className={security.mintable === '0' ? 'text-emerald-400' : 'text-red-400'}>{security.mintable === '0' ? 'No' : 'Yes'}</span></div>
                <div>Freezable: <span className={security.freezable === '0' ? 'text-emerald-400' : 'text-red-400'}>{security.freezable === '0' ? 'No' : 'Yes'}</span></div>
                <div>Closable: <span className={security.closable === '0' ? 'text-emerald-400' : 'text-red-400'}>{security.closable === '0' ? 'No' : 'Yes'}</span></div>
                <div>Metadata Mutable: <span className={security.metadata_mutable === '0' ? 'text-emerald-400' : 'text-red-400'}>{security.metadata_mutable === '0' ? 'No' : 'Yes'}</span></div>
                <div>Holders: {security.holder_count}</div>
                {security.lp_holder_count && <div>LP Holders: {security.lp_holder_count}</div>}
                {security.buy_tax && <div>Buy Tax: {security.buy_tax}</div>}
                {security.sell_tax && <div>Sell Tax: {security.sell_tax}</div>}
                {security.trusted_token !== undefined && <div>Trusted: {security.trusted_token ? 'Yes' : 'No'}</div>}
              </div>
            </div>
          )}

          {topHolders.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="text-xs uppercase tracking-[3px] opacity-60 mb-2">Top Holders (Birdeye)</div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left opacity-60 border-b border-white/10">
                      <th className="py-1 pr-2">#</th>
                      <th className="py-1 pr-2">Address</th>
                      <th className="py-1 pr-2">Amount</th>
                      <th className="py-1">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topHolders.slice(0, 8).map((h, i) => (
                      <tr key={i} className="border-b border-white/5 last:border-0">
                        <td className="py-1 pr-2 opacity-60">{i + 1}</td>
                        <td className="py-1 pr-2 font-mono text-[10px]">{h.owner.slice(0, 4)}...{h.owner.slice(-4)}</td>
                        <td className="py-1 pr-2 tabular-nums">{h.amount.toLocaleString()}</td>
                        <td className="py-1 tabular-nums">{h.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <div className="uppercase tracking-[3px] opacity-60 mb-1">Token Metadata</div>
              <div>Name: {safeStats.name}</div>
              <div>Symbol: {safeStats.symbol}</div>
              <div>Decimals: {safeStats.decimals ?? 6}</div>
              <div>Total Supply: {safeStats.current_supply}</div>
              <div>Authority: Pump.fun Token Mint Authority</div>
              <div>First Mint: 08:51:57 Feb 07, 2025 (UTC)</div>
              <div>Tags: Meme, Pump.fun</div>
              <div>Token Extensions: False</div>
            </div>
            <div>
              <div className="uppercase tracking-[3px] opacity-60 mb-1">Markets</div>
              <div>Primary: Raydium (WSOL-$MT) Pool</div>
              <div>Liquidity: {safeStats.liquidity || '$0'}</div>
              <div>FDV: {safeStats.fdv || '$0'}</div>
              <div>Market Cap: {safeStats.market_cap}</div>
              <div className="mt-1 text-[10px] opacity-50">Live from public on-chain indexers (DexScreener, Birdeye, GoPlus). No external site links.</div>
            </div>
          </div>

          {/* Pure icon logos marquee - only actual logos, no names. Very slow floating + gentle dancing bobs */}
          <div className="mt-8 pt-6 border-t border-white/10 overflow-hidden">
            <div className="text-xs uppercase tracking-[3px] opacity-60 mb-3">COMING SOON: SELF-BUILT BRIDGES TO 100+ CHAINS</div>
            <div className="relative flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_10%,white_90%,transparent)] py-2">
              <div className="flex gap-10 text-sm opacity-75 whitespace-nowrap marquee-scroll">
                {[...logoChains, ...logoChains].map((chain, idx) => {
                  const logo = getChainLogo(chain);
                  if (!logo) return null;
                  return (
                    <img
                      key={idx}
                      src={logo}
                      alt={chain}
                      className="w-7 h-7 md:w-8 md:h-8 object-contain logo-dance"
                      style={{ animationDelay: `-${((idx % 9) * 0.35)}s` }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  );
                })}
              </div>
            </div>
            <div className="text-[10px] mt-2 opacity-50 text-center">TAP • TAPSHOP • TAPMATCH</div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 p-4 sm:p-5 bg-black/30">
      <div className="text-xs uppercase tracking-wide opacity-60 mb-1">{label}</div>
      <div className="text-2xl sm:text-3xl font-semibold tabular-nums tracking-[-1px]">{value}</div>
      {sub && <div className="text-xs opacity-50 mt-1">{sub}</div>}
    </div>
  );
}
