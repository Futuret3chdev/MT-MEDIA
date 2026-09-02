export type GameKind = 'arcade' | 'p2e' | 'action' | 'multiplayer' | 'studio' | 'adult';

export type CatalogGame = {
  id: string;
  name: string;
  kind: GameKind;
  status: 'live' | 'beta' | 'soon';
  play: string;
  img: string;
  blurb: string;
  source?: string;
  rated?: '18+';
};

export const CATALOG: CatalogGame[] = [
  {
    id: 'clubpool',
    name: 'Clubpool',
    kind: 'p2e',
    status: 'live',
    play: '/games/pocket/index.html',
    img: '/games/covers/clubpool.jpg',
    blurb: 'Live 8-ball in the club. Wallet connect, free tables or $MT stakes, Pixabay EDM, Quick Match, rematch, and challenge from Chat.',
  },
  {
    id: 'mt-world-gallery',
    name: 'MT WORLD — Gallery',
    kind: 'multiplayer',
    status: 'live',
    play: '/games/gallery/index.html',
    img: '/games/covers/gallery.jpg',
    blurb: 'Dusk plaza, chase cam so you see your skin. Shop spends ¢. Mint token head, gold cape, pets, jobs, houses.',
  },
  {
    id: 'soccer-pro',
    name: 'Soccer Pro',
    kind: 'p2e',
    status: 'live',
    play: 'https://soccer-pro-inky.vercel.app',
    img: '/games/covers/soccer-pro.jpg',
    blurb: 'FIFA-style 3D soccer with career management.',
    source: 'https://github.com/Futuret3chdev/soccer-pro',
  },
  {
    id: 'puck',
    name: 'MT Puck',
    kind: 'p2e',
    status: 'live',
    play: '/games/puck3d/index.html',
    img: '/games/covers/puck.jpg',
    blurb: '3D rink. You skate the puck, crowd in the stands, hit sounds. Wallet + staff award.',
  },
  {
    id: 'mte-pop',
    name: 'MTE POP',
    kind: 'arcade',
    status: 'live',
    play: 'https://mte-pop.vercel.app/?play=1',
    img: '/games/covers/mte-pop.jpg',
    blurb: 'Puzzle pop — MTECOSYSTEM match adventure.',
    source: 'https://github.com/Futuret3chdev/mte-pop',
  },
  {
    id: 'metro-vice',
    name: 'Metro Vice',
    kind: 'action',
    status: 'live',
    play: 'https://metro-vice.vercel.app',
    img: '/games/covers/metro-vice.jpg',
    blurb: 'Open-world city. Drive, roam, cause trouble.',
    source: 'https://github.com/Futuret3chdev/metro-vice',
  },
  {
    id: 'starfleet',
    name: 'Starfleet',
    kind: 'action',
    status: 'live',
    play: 'https://starfeet.vercel.app',
    img: '/games/covers/starfleet.jpg',
    blurb: '3D space colony strategy.',
    source: 'https://github.com/Futuret3chdev/starfleet',
  },
  {
    id: 'tap',
    name: 'MT Tap',
    kind: 'p2e',
    status: 'live',
    play: '/tap/embed',
    img: '/games/covers/tap.jpg',
    blurb: 'Six modes. Green MT, gold, freeze, boss. Combos light $MT. Wallet + staff award.',
  },
  {
    id: 'pacman',
    name: 'Pac-Man',
    kind: 'arcade',
    status: 'live',
    play: '/pacman/embed',
    img: '/games/covers/pacman.png?v=4',
    blurb: 'Full arcade menu. $MT Pac is a mint hex token, not the yellow pie. Play / Turbo / Practice / Cutscenes / High scores.',
  },
  {
    id: 'tetris',
    name: 'Tetris',
    kind: 'arcade',
    status: 'live',
    play: '/tetris/embed',
    img: '/games/covers/tetris.jpg?v=2',
    blurb: 'Menu: Classic, Sprint 40, Ultra 2m, $MT Fever, Zen. Hold, next-3, ghost, hard drop, DAS, 180.',
  },
  {
    id: 'tetrismob',
    name: 'Tetris Mob',
    kind: 'arcade',
    status: 'live',
    play: '/tetrismob/embed',
    img: '/games/covers/tetrismob.jpg?v=2',
    blurb: 'Same modes on thumbs. Swipe, hold pads, 180, DAS repeat. Wallet + staff.',
  },
  {
    id: 'racer',
    name: 'MT Racer',
    kind: 'p2e',
    status: 'live',
    play: '/games/racer3d/index.html',
    img: '/games/covers/racer.jpg',
    blurb: '3D night highway. Choose a car, pass traffic, $MT nitro. Wallet + staff award.',
  },
  {
    id: 'fruit',
    name: 'MT Fruit',
    kind: 'arcade',
    status: 'live',
    play: '/games/unix/fruitninja/index.html',
    img: '/games/covers/fruitninja.jpg',
    blurb: 'High tosses, fat swipe, 5 lives. Freeze / gold / heart specials. Wallet unlocks the $MT gold blade.',
  },
  {
    id: 'emoji',
    name: 'Emoji Guess',
    kind: 'arcade',
    status: 'live',
    play: '/emoji/embed',
    img: '/games/covers/emoji.jpg',
    blurb: 'Community night. Decode the emoji. Streaks go neon $MT. Staff set the prize from the desk.',
  },
  {
    id: 'emoji-royale',
    name: 'Emoji Royale',
    kind: 'multiplayer',
    status: 'live',
    play: '/royale/embed',
    img: '/games/covers/royale.jpg',
    blurb: 'Live pit. One card, one clock, whole room locks in. Staff run live + prize. Own board.',
  },
  {
    id: 'signal',
    name: 'Signal',
    kind: 'multiplayer',
    status: 'live',
    play: '/signal/embed',
    img: '/games/covers/signal.jpg',
    blurb: 'Four glyphs, one ticker. Lock BTC, SOL, $MT… Wallet + staff award on Claim.',
  },
  {
    id: 'drop',
    name: '$MT Drop',
    kind: 'p2e',
    status: 'live',
    play: '/drop/embed',
    img: '/games/covers/drop.jpg',
    blurb: 'Catch $MT and rockets. Dodge rugs and the tax man. One thumb.',
  },
  {
    id: 'raid',
    name: 'Raid the Rug',
    kind: 'multiplayer',
    status: 'live',
    play: '/raid/embed',
    img: '/games/covers/raid.jpg',
    blurb: '2–4 players. One intern is rugging. Eight minutes. Vote them out.',
  },
  {
    id: 'jam',
    name: 'Studio Jam',
    kind: 'studio',
    status: 'live',
    play: '/jam/embed',
    img: '/games/covers/jam.jpg',
    blurb: 'Four-bar pad loop. Play it loud. Staff can prize the night.',
  },
  {
    id: 'taxi',
    name: 'Radio Taxi',
    kind: 'arcade',
    status: 'live',
    play: '/taxi/embed',
    img: '/games/covers/taxi.jpg',
    blurb: 'Drive the plaza. Drop fares at Gallery, Studio, Museum, Casino.',
  },
  {
    id: 'dash',
    name: 'MT Dash',
    kind: 'p2e',
    status: 'live',
    play: '/dash/embed',
    img: '/games/covers/dash.jpg',
    blurb: 'Neon jumper. Green pads, gold boosts, pink breaks, $MT coins, rugs. Wallet + staff award.',
  },
  {
    id: 'chicken',
    name: 'Chicken',
    kind: 'arcade',
    status: 'live',
    play: '/chicken/embed',
    img: '/games/covers/chicken.jpg',
    blurb: '3 lives, 🟢 $MT, 🛡 shield, trucks, night/day. Far side wraps with a bonus.',
  },
  {
    id: 'mtjump',
    name: 'MT Jump',
    kind: 'arcade',
    status: 'live',
    play: '/games/mtjump/index.html',
    img: '/games/covers/mtjump.jpg?v=3',
    blurb: 'Mint token runner. Three worlds. Skins and shop buy with coins. Air hop, dash, springs, ? blocks.',
  },
  {
    id: 'mtgames',
    name: 'MT Games (Android)',
    kind: 'studio',
    status: 'beta',
    play: '/software/games',
    img: '/games/covers/pocket.jpg',
    blurb: 'Sideload client. Needs a portal developer license.',
  },
];

const GAME_ALIASES: Record<string, string> = {
  'mt-world-pocket': 'clubpool',
  pocket: 'clubpool',
};

/** Static HTML under /games — safe to iframe. Next app routes are not. */
export function isStaticPlay(play: string) {
  if (!play || play.startsWith('http')) return false;
  return play.includes('/games/') || play.endsWith('.html');
}

export function getGame(id: string) {
  const key = GAME_ALIASES[id] || id;
  return CATALOG.find((g) => g.id === key);
}

export function liveGames() {
  return CATALOG.filter((g) => g.status !== 'soon' && g.rated !== '18+');
}

export function p2eGames() {
  return CATALOG.filter(
    (g) =>
      g.rated !== '18+' &&
      (g.kind === 'p2e' || g.kind === 'arcade' || g.kind === 'action' || g.kind === 'multiplayer')
  );
}

export function casinoGames() {
  return CATALOG.filter((g) => g.rated === '18+' || g.kind === 'adult');
}

export function familyGames() {
  return CATALOG.filter((g) => g.rated !== '18+' && g.kind !== 'adult');
}
