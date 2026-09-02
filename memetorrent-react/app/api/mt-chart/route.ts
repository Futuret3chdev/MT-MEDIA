import { fetchMtMarket } from '@/lib/mt-market';

export const revalidate = 30;

export async function GET() {
  try {
    const m = await fetchMtMarket();
    return Response.json({
      ok: true,
      price: m.price,
      marketCap: m.marketCap,
      volume: m.volume24h,
      change: m.change24h,
      pair: m.pair,
      points: m.points24h.length ? m.points24h : m.points7d,
    });
  } catch {
    return Response.json({ ok: false, error: 'Chart unavailable' }, { status: 502 });
  }
}
