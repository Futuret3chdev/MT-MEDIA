export type MTStatsRaw = {
  price: string;
  market_cap: string;
  current_supply: string;
  name?: string;
  symbol?: string;
  total_buys: string;
  total_sells: string;
  total_buy_volume: string;
  total_sell_volume: string;
  liquidity?: string;
  fdv?: string;
  decimals?: number;
};

export async function getTokenStats(): Promise<MTStatsRaw> {
  const MINT = 'ELywDcVX2WumHm4xEfqF8NdEKaeGCAaq9JmwtjE8pump';

  // DexScreener for price, volume, txns, liquidity, market data (very reliable, no key)
  const dexRes = await fetch(
    `https://api.dexscreener.com/latest/dex/tokens/${MINT}`,
    { cache: 'no-store' }
  );

  let price = 0;
  let marketCap = 0;
  let volume24h = 0;
  let buys = 0;
  let sells = 0;
  let liquidity = 0;
  let fdv = 0;
  let name = 'MemeTorrent';
  let symbol = '$MT';

  if (dexRes.ok) {
    const dexData = await dexRes.json();
    const pair = dexData.pairs?.[0];
    if (pair) {
      price = parseFloat(pair.priceUsd || '0');
      marketCap = parseFloat(pair.marketCap || pair.fdv || '0');
      volume24h = parseFloat(pair.volume?.h24 || '0');
      buys = pair.txns?.h24?.buys || 0;
      sells = pair.txns?.h24?.sells || 0;
      liquidity = parseFloat(pair.liquidity?.usd || '0');
      fdv = parseFloat(pair.fdv || '0');
      name = pair.baseToken?.name || name;
      symbol = pair.baseToken?.symbol || symbol;
    }
  }

  // Birdeye public API for accurate supply, decimals, and confirmation (no key for basic overview)
  let currentSupplyNum = 0;
  let decimals = 6;

  try {
    const birdeyeRes = await fetch(
      `https://public-api.birdeye.so/defi/token_overview?address=${MINT}`,
      { cache: 'no-store', headers: { 'accept': 'application/json' } }
    );
    if (birdeyeRes.ok) {
      const birdeye = await birdeyeRes.json();
      const d = birdeye.data;
      if (d) {
        currentSupplyNum = parseFloat(d.supply || d.circulatingSupply || '0');
        decimals = d.decimals || 6;
        if (d.name) name = d.name;
        if (d.symbol) symbol = d.symbol;
        if (!price && d.price) price = parseFloat(d.price);
        if (!marketCap && d.marketCap) marketCap = parseFloat(d.marketCap);
      }
    }
  } catch (e) {
    // silent fallback
  }

  // Fallback: calculate current supply from MC / price if Birdeye didn't provide
  if (currentSupplyNum <= 0 && price > 0 && marketCap > 0) {
    currentSupplyNum = Math.floor(marketCap / price);
  }

  return {
    price: price.toFixed(8).replace(/\.?0+$/, ''),
    market_cap: marketCap > 0 ? `$${marketCap.toLocaleString()}` : '$0',
    current_supply: currentSupplyNum > 0 ? currentSupplyNum.toLocaleString() : '0',
    name,
    symbol,
    total_buys: buys.toString(),
    total_sells: sells.toString(),
    total_buy_volume: volume24h > 0 ? `$${volume24h.toLocaleString()}` : '$0',
    total_sell_volume: volume24h > 0 ? `$${volume24h.toLocaleString()}` : '$0',
    liquidity: liquidity > 0 ? `$${liquidity.toLocaleString()}` : '$0',
    fdv: fdv > 0 ? `$${fdv.toLocaleString()}` : '$0',
    decimals,
  };
}

// Real top holders fetched via Birdeye public API (no third-party UI links)
export type TopHolder = {
  owner: string;
  amount: number;
  percentage: number;
};

export async function getTopHolders(mint: string = 'ELywDcVX2WumHm4xEfqF8NdEKaeGCAaq9JmwtjE8pump'): Promise<TopHolder[]> {
  try {
    const res = await fetch(
      `https://public-api.birdeye.so/defi/token_holders?address=${mint}&offset=0&limit=10`,
      { cache: 'no-store', headers: { accept: 'application/json' } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    const items = json.data?.items || [];
    const total = json.data?.total || 0;

    return items.map((item: any) => {
      const amt = parseFloat(item.amount || item.uiAmount || 0);
      const pct = total > 0 ? (amt / total) * 100 : 0;
      return {
        owner: item.owner || item.address || '',
        amount: amt,
        percentage: Math.round(pct * 100) / 100,
      };
    });
  } catch {
    return [];
  }
}

export type TokenSecurity = {
  holder_count: string;
  total_supply: string;
  mintable: string;
  freezable: string;
  closable: string;
  metadata_mutable: string;
  lp_holder_count?: string;
  trusted_token?: number;
  is_honeypot?: string;
  buy_tax?: string;
  sell_tax?: string;
};

export async function getTokenSecurity(mint: string = 'ELywDcVX2WumHm4xEfqF8NdEKaeGCAaq9JmwtjE8pump'): Promise<TokenSecurity | null> {
  try {
    const res = await fetch(
      `https://api.gopluslabs.io/api/v1/solana/token_security?contract_addresses=${mint}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const t = json.result?.[mint];
    if (!t) return null;
    return {
      holder_count: t.holder_count || '0',
      total_supply: t.total_supply || '0',
      mintable: t.mintable?.status || t.mintable || '0',
      freezable: t.freezable?.status || t.freezable || '0',
      closable: t.closable?.status || t.closable || '0',
      metadata_mutable: t.metadata_mutable?.status || t.metadata_mutable || '0',
      lp_holder_count: t.lp_holder_count,
      trusted_token: t.trusted_token,
      is_honeypot: t.is_honeypot,
      buy_tax: t.buy_tax,
      sell_tax: t.sell_tax,
    };
  } catch {
    return null;
  }
}
