import { MT_MINT, fetchMtMarket } from '@/lib/mt-market';

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-MT-API-KEY',
};

export function v1ok(data: unknown) {
  return Response.json(
    {
      status: {
        timestamp: new Date().toISOString(),
        error_code: 0,
        error_message: null,
        credit_count: 1,
        notice: 'Keyless public API. X-MT-API-KEY reserved for MT-chain / Infinite Wallet launch.',
      },
      data,
    },
    { headers: CORS }
  );
}

export function v1err(message: string, http = 400, code = http) {
  return Response.json(
    {
      status: {
        timestamp: new Date().toISOString(),
        error_code: code,
        error_message: message,
        credit_count: 0,
      },
      data: null,
    },
    { status: http, headers: CORS }
  );
}

export function resolveMint(symbolOrMint?: string | null) {
  const s = String(symbolOrMint || 'MT').trim();
  if (!s || /^mt$|^\$mt$|^memetorrent$/i.test(s)) return MT_MINT;
  return s;
}

export async function quotePayload(mint = MT_MINT) {
  const m = await fetchMtMarket();
  if (mint !== MT_MINT) {
    return { mint, tracked: false, notice: 'Only $MT is live. MT-chain tokens land at launch.' };
  }
  return {
    id: 'mt',
    name: m.name,
    symbol: m.symbol,
    mint: MT_MINT,
    chain: 'solana',
    pool: m.pair,
    decimals: m.decimals,
    quote: {
      USD: {
        price: m.price,
        market_cap: m.marketCap,
        fully_diluted_market_cap: m.fdv,
        volume_24h: m.volume24h,
        liquidity: m.liquidity,
        percent_change_1h: m.change1h,
        percent_change_6h: m.change6h,
        percent_change_24h: m.change24h,
        last_updated: new Date().toISOString(),
      },
    },
    supply: m.supply,
    circulating_supply: m.supply,
    chart: {
      h24: m.points24h,
      d7: m.points7d,
    },
  };
}
