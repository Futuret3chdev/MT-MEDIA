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

export type MTStatsLive = MTStatsRaw & {
  ok?: boolean;
  priceNum?: number;
  marketCap?: number;
  volume24h?: number;
  liquidityNum?: number;
  fdvNum?: number;
  change1h?: number;
  change6h?: number;
  change24h?: number;
  pair?: string;
  createdAt?: string;
  points24h?: number[];
  points7d?: number[];
};

export async function getTokenStats(): Promise<MTStatsLive> {
  const res = await fetch('/api/mt-stats', { cache: 'no-store' });
  if (!res.ok) throw new Error('stats');
  const data = (await res.json()) as MTStatsLive;
  if (!data?.ok && !data?.price) throw new Error('stats');
  return data;
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
