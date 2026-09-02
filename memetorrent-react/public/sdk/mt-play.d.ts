export type MTUser = {
  username: string;
  email?: string;
  is_admin?: boolean;
} | null;

export type MTResult<T = Record<string, unknown>> = { ok: true } & T | { ok: false; error: string };

export type MTPlayClient = {
  version: string;
  origin: string;
  gameId: string;
  on(event: 'wallet' | 'user' | 'wallet-request' | 'pause' | 'resume' | 'visibility', fn: (data: unknown) => void): () => void;
  wallet(): string;
  setWallet(addr: string): void;
  requestWallet(kind?: 'phantom' | 'solflare' | 'backpack'): void;
  me(): Promise<MTResult<{ user: MTUser }>>;
  postScore(score: number, extra?: { gameId?: string; room?: string; playerName?: string }): Promise<MTResult>;
  scores(query?: { gameId?: string; limit?: number; period?: string; room?: string }): Promise<MTResult<{ scores?: unknown[] }>>;
  loginUrl(next?: string): string;
  openLogin(): void;
  inPlayShell(): boolean;
  isFramed(): boolean;
  paused(): boolean;
  exit(): void;
  openCatalog(): void;
  ping(): { ok: true; version: string; framed: boolean; gameId: string };
};

export type MTPlay = {
  version: string;
  origin: string;
  init(opts?: { origin?: string; gameId?: string }): MTPlayClient;
  create(opts?: { origin?: string; gameId?: string }): MTPlayClient;
};

declare const MTPlay: MTPlay;
export default MTPlay;
