/** Art + animated FX per game card (Nova Mirage lobby). */
export const GAME_ART = {
  'free-ai':       { image: '/casino-floor/assets/games/free-ai.jpg',       fx: 'neon' },
  'free-multi':    { image: '/casino-floor/assets/games/free-multi.jpg',    fx: 'electric' },
  'mt-ai':         { image: '/casino-floor/assets/games/mt-ai.jpg',         fx: 'crystal' },
  'mt-multi':      { image: '/casino-floor/assets/games/mt-multi.jpg',    fx: 'fire' },
  turbo:           { image: '/casino-floor/assets/games/turbo.jpg',         fx: 'fire' },
  sitngo:          { image: '/casino-floor/assets/games/sitngo.jpg',        fx: 'gold' },
  'lucky-reels':   { image: '/casino-floor/assets/games/lucky-reels.jpg',   fx: 'jackpot' },
  'meme-jackpot':  { image: '/casino-floor/assets/games/meme-jackpot.jpg',  fx: 'gold' },
  'starfall-spins':{ image: '/casino-floor/assets/games/starfall-spins.jpg',fx: 'stars' },
  'diamond-drift': { image: '/casino-floor/assets/games/diamond-drift.jpg', fx: 'ice' },
  'torrent-treasures': { image: '/casino-floor/assets/games/torrent-treasures.jpg', fx: 'wave' },
  blackjack:       { image: '/casino-floor/assets/games/blackjack.jpg',     fx: 'neon' },
  roulette:        { image: '/casino-floor/assets/games/roulette.jpg',      fx: 'fire' },
  baccarat:        { image: '/casino-floor/assets/games/baccarat.jpg',      fx: 'gold' },
  craps:           { image: '/casino-floor/assets/games/craps.jpg',         fx: 'fire' },
  'video-poker':   { image: '/casino-floor/assets/games/video-poker.jpg',   fx: 'electric' },
  keno:            { image: '/casino-floor/assets/games/keno.jpg',          fx: 'stars' },
  wheel:           { image: '/casino-floor/assets/games/wheel.jpg',         fx: 'jackpot' },
  crash:           { image: '/casino-floor/assets/games/crash.jpg',         fx: 'fire' },
  plinko:          { image: '/casino-floor/assets/games/plinko.jpg',        fx: 'neon' }
};

export function artForGame(gameId) {
  const base = String(gameId || '').replace(/-(free|mt)$/, '');
  return GAME_ART[gameId] || GAME_ART[base] || { image: null, fx: 'neon' };
}