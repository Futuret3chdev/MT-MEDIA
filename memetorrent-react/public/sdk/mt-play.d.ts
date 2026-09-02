export type MTUser = {
  username: string;
  email?: string;
  is_admin?: boolean;
} | null;

export type MTPlayClient = {
  version: string;
  origin: string;
  gameId: string;
  on(event: 'wallet' | 'user' | 'wallet-request', fn: (data: unknown) => void): () => void;
  wallet(): string;
  setWallet(addr: string): void;
  requestWallet(kind?: 'phantom' | 'solflare' | 'backpack'): void;
  me(): Promise<MTUser>;
  postScore(score: number, extra?: { gameId?: string; room?: string }): Promise<{ ok?: boolean }>;
  scores(query?: { gameId?: string; limit?: number }): Promise<{ ok?: boolean; scores?: unknown[] }>;
  loginUrl(next?: string): string;
};

export type MTPlay = {
  version: string;
  origin: string;
  init(opts?: { origin?: string; gameId?: string }): MTPlayClient;
  create(opts?: { origin?: string; gameId?: string }): MTPlayClient;
};

declare const MTPlay: MTPlay;
export default MTPlay;
