export type ApiRow = {
  method: 'GET' | 'POST' | 'PUT';
  path: string;
  summary: string;
  auth?: 'none' | 'session' | 'staff' | 'upcoming';
  live?: boolean;
};

export type ApiCat = {
  id: string;
  title: string;
  blurb: string;
  rows: ApiRow[];
};

export const API_CATS: ApiCat[] = [
  {
    id: 'market',
    title: 'Market data',
    blurb: 'CoinMarketCap-style quotes, listings, and candles for $MT. Keyless.',
    rows: [
      { method: 'GET', path: '/api/v1/status', summary: 'API health, version, products' },
      { method: 'GET', path: '/api/v1/cryptocurrency/quotes/latest?symbol=MT', summary: 'Price, mcap, FDV, liquidity, % change' },
      { method: 'GET', path: '/api/v1/cryptocurrency/listings/latest', summary: 'Tracked listings (today: $MT)' },
      { method: 'GET', path: '/api/v1/cryptocurrency/ohlcv?interval=1h', summary: 'OHLCV closes (1h or 1d)' },
      { method: 'GET', path: '/api/mt-stats', summary: 'Homepage stats payload' },
      { method: 'GET', path: '/api/mt-chart', summary: 'Mini-chart points' },
    ],
  },
  {
    id: 'tracker',
    title: 'Token tracker',
    blurb: 'Solana Tracker-style token, pool, holders, and chart by mint.',
    rows: [
      { method: 'GET', path: '/api/v1/token/{mint}', summary: 'Token overview (default $MT mint)' },
      { method: 'GET', path: '/api/v1/token/{mint}/holders', summary: 'Largest token accounts' },
      { method: 'GET', path: '/api/v1/token/{mint}/chart?range=24h', summary: '24h or 7d close series' },
      { method: 'GET', path: '/api/v1/pool/{address}', summary: 'Raydium $MT/SOL pool' },
      { method: 'GET', path: '/api/holders', summary: 'Raw largest accounts' },
    ],
  },
  {
    id: 'tap',
    title: 'TAP',
    blurb: 'Trips, packages, and food deliveries — Uber / Dasher / Panda style. Plus TAPSHOP trade and TAPMATCH work. Keyless reads. Portal session for writes. Not MT Tap the game.',
    rows: [
      { method: 'GET', path: '/api/v1/tap', summary: 'TAP products, lanes, docs' },
      { method: 'GET', path: '/api/v1/tap/lanes', summary: 'Trips, packages, food' },
      { method: 'GET', path: '/api/v1/tap/quote?lane=trips&from=Southbank&to=Docklands&km=3.2', summary: 'Fare estimate in USD and $MT' },
      { method: 'GET', path: '/api/v1/tap/jobs', summary: 'Open trips / packages / food' },
      { method: 'GET', path: '/api/v1/tap/jobs/{id}', summary: 'Job status' },
      { method: 'POST', path: '/api/v1/tap/jobs', summary: 'Create a trip, package, or food job', auth: 'session' },
      { method: 'GET', path: '/api/v1/tap/me', summary: 'TAP / TAPSHOP / TAPMATCH accounts on this portal login', auth: 'session' },
      { method: 'GET', path: '/api/v1/tapshop', summary: 'TAPSHOP trade desk' },
      { method: 'GET', path: '/api/v1/tapshop/listings', summary: 'Open listings ($MT / Rockets)' },
      { method: 'POST', path: '/api/v1/tapshop/listings', summary: 'List an item', auth: 'session' },
      { method: 'GET', path: '/api/v1/tapmatch', summary: 'TAPMATCH work desk — Fast Connect or long-term' },
      { method: 'GET', path: '/api/v1/tapmatch/staff', summary: 'Staff preview status', auth: 'session' },
      { method: 'POST', path: '/api/v1/tapmatch/staff', summary: 'Staff login — TAPMATCH desk is closed to the public', auth: 'staff' },
      { method: 'GET', path: '/api/v1/tapmatch/profile', summary: 'Worker or business profile', auth: 'staff' },
      { method: 'POST', path: '/api/v1/tapmatch/profile', summary: 'Save profile setup', auth: 'staff' },
      { method: 'GET', path: '/api/v1/tapmatch/home', summary: 'Home stats — pending, matches, posted roles', auth: 'staff' },
      { method: 'GET', path: '/api/v1/tapmatch/matches', summary: 'Ranked job matches for this profile', auth: 'staff' },
      { method: 'GET', path: '/api/v1/tapmatch/jobs', summary: 'Open roles' },
      { method: 'POST', path: '/api/v1/tapmatch/jobs', summary: 'Post a role (staff preview)', auth: 'staff' },
      { method: 'GET', path: '/api/v1/tapmatch/apps', summary: 'Applications — mine or posted', auth: 'staff' },
      { method: 'POST', path: '/api/v1/tapmatch/apply', summary: 'Apply / Tap to Connect (staff preview)', auth: 'staff' },
      { method: 'POST', path: '/api/v1/tapmatch/status', summary: 'Accept, decline, start, complete a match', auth: 'staff' },
    ],
  },
  {
    id: 'play',
    title: 'Play SDK & scores',
    blurb: 'Catalog games: wallet from the play bar, portal user, leaderboards.',
    rows: [
      { method: 'GET', path: '/sdk/mt-play.js', summary: 'Catalog Play SDK (iframe)' },
      { method: 'GET', path: '/sdk/mt-games.js', summary: 'Game software SDK (licensed clients)' },
      { method: 'GET', path: '/api/v1/games/license?key=', summary: 'Verify builder license' },
      { method: 'GET', path: '/software/games/sdk', summary: 'Games SDK docs' },
      { method: 'GET', path: '/sdk/example.html', summary: 'Play SDK tap example' },
      { method: 'GET', path: '/api/scores?game_id={id}', summary: 'Leaderboard', auth: 'none' },
      { method: 'POST', path: '/api/scores', summary: 'Post a score', auth: 'session' },
      { method: 'POST', path: '/api/sdk/submit', summary: 'Queue a catalog listing', auth: 'none' },
    ],
  },
  {
    id: 'portal',
    title: 'Portal & identity',
    blurb: 'Telegram / Discord / X login. Cookie session on .futuret3ch.com.au.',
    rows: [
      { method: 'GET', path: '/api/portal/me', summary: 'Current user', auth: 'session' },
      { method: 'POST', path: '/api/portal/login', summary: 'Sign in', auth: 'none' },
      { method: 'POST', path: '/api/portal/register', summary: 'Register', auth: 'none' },
      { method: 'POST', path: '/api/portal/logout', summary: 'Sign out', auth: 'session' },
      { method: 'POST', path: '/api/portal/profile', summary: 'Update profile', auth: 'session' },
      { method: 'GET', path: '/api/portal/wallets', summary: 'Linked wallets', auth: 'session' },
      { method: 'GET', path: '/api/portal/license', summary: 'Software license', auth: 'session' },
    ],
  },
  {
    id: 'solana',
    title: 'Solana RPC',
    blurb: 'Browser-safe RPC helpers used by Infinite Wallet today.',
    rows: [
      { method: 'POST', path: '/api/solana/rpc', summary: 'JSON-RPC proxy' },
      { method: 'GET', path: '/api/solana/balance?address=', summary: 'SOL lamports' },
      { method: 'GET', path: '/api/solana/blockhash', summary: 'Latest blockhash' },
      { method: 'GET', path: '/api/solana/account-info?address=', summary: 'Account info' },
      { method: 'GET', path: '/api/solana/signature-status?sig=', summary: 'Signature status' },
      { method: 'POST', path: '/api/solana/send-transaction', summary: 'Broadcast tx' },
      { method: 'GET', path: '/api/wallet-lookup?q=', summary: 'Wallet search' },
    ],
  },
  {
    id: 'studio',
    title: 'Studio',
    blurb: 'Level editor titles and $MT commerce.',
    rows: [
      { method: 'GET', path: '/api/studio/titles', summary: 'Your titles', auth: 'session' },
      { method: 'POST', path: '/api/studio/titles', summary: 'Create title', auth: 'session' },
      { method: 'GET', path: '/api/studio/titles/{id}', summary: 'Public play config' },
      { method: 'PUT', path: '/api/studio/titles/{id}', summary: 'Update title', auth: 'session' },
      { method: 'GET', path: '/api/studio/commerce', summary: 'Shop items', auth: 'session' },
      { method: 'POST', path: '/api/studio/commerce', summary: 'Checkout / fulfill', auth: 'session' },
    ],
  },
  {
    id: 'games',
    title: 'Live games',
    blurb: 'Emoji nights, royale, signal, raid, staff desk, pet world.',
    rows: [
      { method: 'GET', path: '/api/games/emoji', summary: 'Emoji night state' },
      { method: 'POST', path: '/api/games/emoji', summary: 'Emoji night action', auth: 'session' },
      { method: 'GET', path: '/api/games/royale', summary: 'Royale lobby' },
      { method: 'POST', path: '/api/games/royale', summary: 'Royale action' },
      { method: 'GET', path: '/api/games/signal', summary: 'Signal desk' },
      { method: 'POST', path: '/api/games/signal', summary: 'Signal action' },
      { method: 'GET', path: '/api/games/raid', summary: 'Raid the Rug' },
      { method: 'POST', path: '/api/games/raid', summary: 'Raid action' },
      { method: 'GET', path: '/api/games/night', summary: 'Night desk prize' },
      { method: 'POST', path: '/api/games/night', summary: 'Night staff', auth: 'staff' },
      { method: 'GET', path: '/api/games/staff', summary: 'Play-bar staff desk', auth: 'staff' },
      { method: 'POST', path: '/api/games/staff', summary: 'Save / award', auth: 'staff' },
      { method: 'GET', path: '/api/games/world', summary: 'Pet world' },
      { method: 'POST', path: '/api/games/world', summary: 'World action' },
    ],
  },
  {
    id: 'rewards',
    title: 'Rewards & claims',
    blurb: 'Claimable $MT, assignment, on-chain claim prepare/confirm.',
    rows: [
      { method: 'GET', path: '/api/claimable-rewards', summary: 'Your claimables', auth: 'session' },
      { method: 'GET', path: '/api/claimable-rewards/lookup', summary: 'Lookup by name' },
      { method: 'POST', path: '/api/claimable-rewards/assign', summary: 'Staff assign', auth: 'staff' },
      { method: 'POST', path: '/api/claimable-rewards/claim/prepare', summary: 'Prepare claim tx', auth: 'session' },
      { method: 'POST', path: '/api/claimable-rewards/claim/confirm', summary: 'Confirm claim', auth: 'session' },
      { method: 'POST', path: '/api/reward-log', summary: 'Log a reward', auth: 'staff' },
    ],
  },
  {
    id: 'chat',
    title: 'Chat',
    blurb: 'Rooms, DMs, media, friends, vault, translate. Session cookie.',
    rows: [
      { method: 'GET', path: '/api/chat', summary: 'Messages' },
      { method: 'POST', path: '/api/chat', summary: 'Send' },
      { method: 'GET', path: '/api/chat/channels', summary: 'Channels' },
      { method: 'GET', path: '/api/chat/events', summary: 'Live events' },
      { method: 'GET', path: '/api/chat/friends', summary: 'Friends' },
      { method: 'GET', path: '/api/chat/users', summary: 'User search' },
      { method: 'GET', path: '/api/chat/vault', summary: 'Vault' },
      { method: 'POST', path: '/api/chat/translate', summary: 'Translate' },
    ],
  },
  {
    id: 'upcoming',
    title: 'Infinite Wallet & MT-Chain',
    blurb: 'Same paths. chain=solana today. chain=mt-chain and wallet connect at launch.',
    rows: [
      { method: 'GET', path: '/api/v1/chain/info', summary: 'Live Solana + upcoming MT-Chain', live: true },
      { method: 'GET', path: '/api/v1/wallet/preview', summary: 'Infinite Wallet preview', auth: 'upcoming' },
    ],
  },
];
