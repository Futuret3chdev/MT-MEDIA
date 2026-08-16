const MINT = 'ELywDcVX2WumHm4xEfqF8NdEKaeGCAaq9JmwtjE8pump';

export async function GET() {
  let price = 0;
  let marketCap = 0;
  let volume = 0;
  let change = 0;
  let pair = '';
  const points: number[] = [];

  try {
    const dex = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${MINT}`, { cache: 'no-store' });
    if (dex.ok) {
      const data = await dex.json();
      const p = data.pairs?.[0];
      if (p) {
        price = parseFloat(p.priceUsd || '0');
        marketCap = parseFloat(p.marketCap || p.fdv || '0');
        volume = parseFloat(p.volume?.h24 || '0');
        change = parseFloat(p.priceChange?.h24 || '0');
        pair = p.pairAddress || '';
      }
    }
  } catch {
    /* continue */
  }

  try {
    const gecko = await fetch(
      `https://api.geckoterminal.com/api/v2/networks/solana/tokens/${MINT}/ohlcv/hour?aggregate=1&limit=48`,
      { cache: 'no-store', headers: { accept: 'application/json' } }
    );
    if (gecko.ok) {
      const g = await gecko.json();
      const list = g.data?.attributes?.ohlcv_list as number[][] | undefined;
      if (Array.isArray(list)) {
        for (const row of list) {
          const close = Number(row[4]);
          if (Number.isFinite(close)) points.push(close);
        }
      }
    }
  } catch {
    /* optional */
  }

  return Response.json({
    ok: true,
    price,
    marketCap,
    volume,
    change,
    pair,
    points,
  });
}
