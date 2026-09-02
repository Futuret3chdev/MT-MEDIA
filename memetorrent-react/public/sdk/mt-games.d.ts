export type MTGamesClient = {
  version: string;
  origin: string;
  gameId: string;
  license(): string;
  setLicense(key: string): void;
  verify(key?: string): Promise<{ ok: boolean; license_key?: string; tier?: string; error?: string }>;
  me(): Promise<{ ok: boolean; user?: unknown; license_key?: string; error?: string }>;
  postScore(score: number, extra?: { gameId?: string; room?: string; party?: string }): Promise<{ ok: boolean; error?: string }>;
  scores(query?: { gameId?: string; limit?: number }): Promise<{ ok: boolean; scores?: unknown[] }>;
  partyCode(): string;
  apkUrl(): string;
  tools: Record<string, string>;
};

declare const MTGames: {
  version: string;
  origin: string;
  init(opts?: { origin?: string; gameId?: string; license?: string }): MTGamesClient;
};
export default MTGames;
