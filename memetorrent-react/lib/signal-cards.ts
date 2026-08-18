export const SIGNAL_CARDS = [
  { id: 'btc', glyphs: '🅱️🪙🟠', answers: ['btc', 'bitcoin', 'xbt'] },
  { id: 'eth', glyphs: '💎🔷⛽', answers: ['eth', 'ethereum'] },
  { id: 'sol', glyphs: '☀️🟣🚀', answers: ['sol', 'solana'] },
  { id: 'doge', glyphs: '🐶🪙😂', answers: ['doge', 'dogecoin'] },
  { id: 'pepe', glyphs: '🐸🟩🪙', answers: ['pepe'] },
  { id: 'mt', glyphs: '🟢♾️🪙', answers: ['mt', '$mt', 'memetorrent'] },
  { id: 'bonk', glyphs: '🐶💥🪙', answers: ['bonk'] },
  { id: 'wif', glyphs: '🐶🎩', answers: ['wif', 'dogwifhat'] },
  { id: 'link', glyphs: '🔗📡', answers: ['link', 'chainlink'] },
  { id: 'xrp', glyphs: '❌💧', answers: ['xrp', 'ripple'] },
  { id: 'ada', glyphs: '🌸₳', answers: ['ada', 'cardano'] },
  { id: 'avax', glyphs: '🔺❄️', answers: ['avax', 'avalanche'] },
  { id: 'bnb', glyphs: '🟡🔶', answers: ['bnb', 'binance'] },
  { id: 'sui', glyphs: '💧🌀', answers: ['sui'] },
  { id: 'ton', glyphs: '✈️💎', answers: ['ton', 'toncoin'] },
];

export function signalHit(id: string, guess: string) {
  const card = SIGNAL_CARDS.find((c) => c.id === id);
  if (!card) return false;
  const g = guess.toLowerCase().replace(/[^a-z0-9$]/g, '');
  return card.answers.some((a) => a.replace(/[^a-z0-9$]/g, '') === g);
}
