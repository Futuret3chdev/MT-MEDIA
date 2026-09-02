export const MT_MINT = 'ELywDcVX2WumHm4xEfqF8NdEKaeGCAaq9JmwtjE8pump';
export const MT_POOL = 'E3kdauLD47xLHAisLuvGTAnqD5MWWJojJYNMCoEvTHi7';

export type MtMarket = {
  name: string;
  symbol: string;
  price: number;
  marketCap: number;
  fdv: number;
  liquidity: number;
  volume24h: number;
  supply: number;
  decimals: number;
  change1h: number;
  change6h: number;
  change24h: number;
  buys24h: number;
  sells24h: number;
  pair: string;
  createdAt: string;
  points24h: number[];
  points7d: number[];
};

function num(v: unknown): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''));
  return Number.isFinite(n) ? n : 0;
}

function closes(list: unknown): number[] {
  if (!Array.isArray(list)) return [];
  const out: number[] = [];
  for (const row of list) {
    const close = Array.isArray(row) ? num(row[4]) : 0;
    if (close > 0) out.push(close);
  }
  return out.reverse();
}

export async function fetchMtMarket(): Promise<MtMarket> {
  const market: MtMarket = {
    name: 'MemeTorrent',
    symbol: '$MT',
    price: 0,
    marketCap: 0,
    fdv: 0,
    liquidity: 0,
    volume24h: 0,
    supply: 0,
    decimals: 6,
    change1h: 0,
    change6h: 0,
    change24h: 0,
    buys24h: 0,
    sells24h: 0,
    pair: MT_POOL,
    createdAt: '2025-02-07T08:51:57Z',
    points24h: [],
    points7d: [],
  };

  const geckoToken = fetch(`https://api.geckoterminal.com/api/v2/networks/solana/tokens/${MT_MINT}`, {
    cache: 'no-store',
    headers: { accept: 'application/json' },
  }).then((r) => (r.ok ? r.json() : null)).catch(() => null);

  const geckoPools = fetch(`https://api.geckoterminal.com/api/v2/networks/solana/tokens/${MT_MINT}/pools`, {
    cache: 'no-store',
    headers: { accept: 'application/json' },
  }).then((r) => (r.ok ? r.json() : null)).catch(() => null);

  const ohlcvH = fetch(
    `https://api.geckoterminal.com/api/v2/networks/solana/pools/${MT_POOL}/ohlcv/hour?aggregate=1&limit=48`,
    { cache: 'no-store', headers: { accept: 'application/json' } },
  ).then((r) => (r.ok ? r.json() : null)).catch(() => null);

  const ohlcvD = fetch(
    `https://api.geckoterminal.com/api/v2/networks/solana/pools/${MT_POOL}/ohlcv/day?aggregate=1&limit=30`,
    { cache: 'no-store', headers: { accept: 'application/json' } },
  ).then((r) => (r.ok ? r.json() : null)).catch(() => null);

  const pump = fetch(`https://frontend-api-v3.pump.fun/coins/${MT_MINT}`, { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);

  const dex = fetch(`https://api.dexscreener.com/latest/dex/tokens/${MT_MINT}`, { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);

  const raydium = fetch(`https://api-v3.raydium.io/pools/info/ids?ids=${MT_POOL}`, { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);

  const [tokenJ, poolsJ, hourJ, dayJ, pumpJ, dexJ, rayJ] = await Promise.all([
    geckoToken, geckoPools, ohlcvH, ohlcvD, pump, dex, raydium,
  ]);

  const ta = tokenJ?.data?.attributes || {};
  if (ta.name) market.name = ta.name;
  if (ta.symbol) market.symbol = ta.symbol;
  if (ta.decimals) market.decimals = Number(ta.decimals) || 6;
  market.price = num(ta.price_usd);
  market.fdv = num(ta.fdv_usd);
  market.volume24h = num(ta.volume_usd?.h24);
  market.supply = num(ta.normalized_total_supply);
  if (market.supply <= 0 && num(ta.total_supply) > 0) {
    market.supply = num(ta.total_supply) / 10 ** market.decimals;
  }

  const pool = poolsJ?.data?.[0]?.attributes || {};
  if (!market.price) market.price = num(pool.token_price_usd || pool.base_token_price_usd);
  if (!market.fdv) market.fdv = num(pool.fdv_usd);
  market.liquidity = num(pool.reserve_in_usd);
  if (pool.address) market.pair = pool.address;
  if (pool.pool_created_at) market.createdAt = pool.pool_created_at;
  const ch = pool.price_change_percentage || {};
  market.change1h = num(ch.h1);
  market.change6h = num(ch.h6);
  market.change24h = num(ch.h24);
  const tx = pool.transactions?.h24 || {};
  market.buys24h = num(tx.buys);
  market.sells24h = num(tx.sells);

  if (pumpJ && typeof pumpJ === 'object') {
    if (!market.price && num(pumpJ.usd_market_cap) && num(pumpJ.total_supply)) {
      const raw = num(pumpJ.total_supply);
      const sup = raw > 1e12 ? raw / 1e6 : raw;
      market.supply = market.supply || sup;
      market.marketCap = num(pumpJ.usd_market_cap);
      if (!market.price && sup) market.price = market.marketCap / sup;
    }
    if (!market.marketCap) market.marketCap = num(pumpJ.usd_market_cap);
  }

  const ray = rayJ?.data?.[0];
  if (ray) {
    const tvl = num(ray.tvl);
    if (tvl > 0) market.liquidity = tvl;
    const vol = num(ray.day?.volume);
    if (vol > market.volume24h) market.volume24h = vol;
  }

  const pair = dexJ?.pairs?.[0];
  if (pair) {
    if (!market.price) market.price = num(pair.priceUsd);
    if (!market.fdv) market.fdv = num(pair.fdv);
    if (!market.liquidity) market.liquidity = num(pair.liquidity?.usd);
    if (!market.volume24h) market.volume24h = num(pair.volume?.h24);
    if (!market.buys24h) market.buys24h = num(pair.txns?.h24?.buys);
    if (!market.sells24h) market.sells24h = num(pair.txns?.h24?.sells);
    if (!market.change24h) market.change24h = num(pair.priceChange?.h24);
    if (pair.pairAddress) market.pair = pair.pairAddress;
  }

  if (!market.marketCap) {
    market.marketCap = market.fdv || (market.price && market.supply ? market.price * market.supply : 0);
  }

  market.points24h = closes(hourJ?.data?.attributes?.ohlcv_list);
  market.points7d = closes(dayJ?.data?.attributes?.ohlcv_list);

  if (market.points24h.length >= 2 && !market.change24h) {
    const a = market.points24h[0];
    const b = market.points24h[market.points24h.length - 1];
    if (a > 0) market.change24h = ((b - a) / a) * 100;
  }

  return market;
}

export function money(n: number, digits = 0) {
  if (!Number.isFinite(n) || n <= 0) return '$0';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${n.toLocaleString(undefined, { maximumFractionDigits: digits })}`;
  if (n >= 1) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(8)}`.replace(/0+$/, '').replace(/\.$/, '');
}
