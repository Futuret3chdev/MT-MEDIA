import { CORS, quotePayload, resolveMint, v1err, v1ok } from '@/lib/mt-v1';
import { MT_MINT, MT_POOL, fetchMtMarket } from '@/lib/mt-market';

export const revalidate = 30;

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const p = (path || []).join('/');
  const url = new URL(request.url);
  const q = url.searchParams;

  try {
    if (p === 'status' || p === '') {
      return v1ok({
        api: 'mt-v1',
        version: '1.0.0',
        keyless: true,
        products: ['market-data', 'token-tracker', 'play-sdk', 'studio', 'solana-rpc'],
        upcoming: ['infinite-wallet', 'mt-chain-rpc'],
        docs: 'https://memetorrent.futuret3ch.com.au/developers/docs',
      });
    }

    if (p === 'cryptocurrency/quotes/latest' || p === 'quotes/latest') {
      const mint = resolveMint(q.get('symbol') || q.get('mint') || q.get('id'));
      return v1ok(await quotePayload(mint));
    }

    if (p === 'cryptocurrency/listings/latest' || p === 'listings/latest') {
      const quote = await quotePayload(MT_MINT);
      return v1ok([quote]);
    }

    if (p === 'cryptocurrency/ohlcv' || p === 'ohlcv') {
      const m = await fetchMtMarket();
      const interval = (q.get('interval') || '1h').toLowerCase();
      const points = interval === '1d' || interval === '7d' || interval === 'd' ? m.points7d : m.points24h;
      return v1ok({
        mint: MT_MINT,
        interval: interval === '1d' || interval === '7d' || interval === 'd' ? '1d' : '1h',
        points,
      });
    }

    if (p === 'token' || p === `token/${MT_MINT}` || p.startsWith('token/')) {
      const parts = p.split('/');
      const mint = resolveMint(parts[1] || q.get('mint'));
      if (parts[2] === 'holders') {
        const holdersRes = await fetch(new URL('/api/holders', url.origin), { cache: 'no-store' });
        const holders = holdersRes.ok ? await holdersRes.json() : [];
        return v1ok({
          mint,
          holders: Array.isArray(holders)
            ? holders.map((h: { address?: string; uiAmount?: number }, i: number) => ({
                rank: i + 1,
                address: h.address,
                amount: h.uiAmount,
              }))
            : [],
        });
      }
      if (parts[2] === 'chart') {
        const m = await fetchMtMarket();
        const range = q.get('range') || '24h';
        return v1ok({
          mint,
          range,
          points: range === '7d' ? m.points7d : m.points24h,
        });
      }
      return v1ok(await quotePayload(mint));
    }

    if (p === 'pool' || p === `pool/${MT_POOL}`) {
      const m = await fetchMtMarket();
      return v1ok({
        address: m.pair || MT_POOL,
        name: '$MT / SOL',
        dex: 'raydium',
        chain: 'solana',
        liquidity: m.liquidity,
        volume_24h: m.volume24h,
        price: m.price,
      });
    }

    if (p === 'chain/info' || p === 'chain') {
      return v1ok({
        live: {
          id: 'solana',
          name: 'Solana',
          rpc: 'https://memetorrent.futuret3ch.com.au/api/solana/rpc',
          status: 'live',
        },
        upcoming: {
          id: 'mt-chain',
          name: 'MT Chain',
          rpc: null,
          status: 'upcoming',
          note: 'Same API paths. chain=mt-chain when the network is live.',
        },
      });
    }

    if (p === 'wallet/preview' || p === 'wallet') {
      return v1ok({
        product: 'Infinite Wallet',
        status: 'upcoming',
        connect: 'https://mt.futuret3ch.com.au/',
        note: 'Connect, sign, and $MT pay will use these routes at launch. Today use Play SDK requestWallet().',
        play_sdk: 'https://memetorrent.futuret3ch.com.au/sdk/mt-play.js',
      });
    }

    return v1err(`Unknown path /api/v1/${p}`, 404, 404);
  } catch (e) {
    console.error('v1', p, e);
    return v1err('Upstream unavailable', 502, 502);
  }
}
