import { fetchMtMarket, money } from '@/lib/mt-market';

export const revalidate = 30;

export async function GET() {
  try {
    const m = await fetchMtMarket();
    return Response.json({
      ok: true,
      price: m.price > 0 ? m.price.toFixed(10).replace(/0+$/, '').replace(/\.$/, '') : '0',
      priceNum: m.price,
      market_cap: money(m.marketCap),
      marketCap: m.marketCap,
      current_supply: m.supply > 0 ? Math.round(m.supply).toLocaleString() : '0',
      supply: m.supply,
      name: m.name,
      symbol: m.symbol,
      total_buys: String(m.buys24h),
      total_sells: String(m.sells24h),
      total_buy_volume: money(m.volume24h),
      total_sell_volume: money(m.volume24h),
      volume24h: m.volume24h,
      liquidity: money(m.liquidity),
      liquidityNum: m.liquidity,
      fdv: money(m.fdv),
      fdvNum: m.fdv,
      decimals: m.decimals,
      change1h: m.change1h,
      change6h: m.change6h,
      change24h: m.change24h,
      pair: m.pair,
      createdAt: m.createdAt,
      points24h: m.points24h,
      points7d: m.points7d,
    });
  } catch (err) {
    console.error('mt-stats', err);
    return Response.json({ ok: false, error: 'Stats unavailable' }, { status: 502 });
  }
}
