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
    id: 'mt-world-pocket',
    name: 'MT WORLD — Pocket',
    kind: 'p2e',
    status: 'live',
    play: '/games/pocket/index.html',
    img: '/games/covers/pocket.jpg',
    blurb: 'Live 8-ball. Wallet connect, free tables or $MT stakes, Pixabay EDM on the cloth, Quick Match, rematch, and challenge from Chat.',
  },
  {
    id: 'mt-world-gallery',
    name: 'MT WORLD — Gallery',
    kind: 'multiplayer',
    status: 'live',
    play: 'https://futuret3ch.com.au/software/gallery/',
    img: '/games/covers/gallery.jpg',
    blurb: 'Walk the gallery with other players. Hang art. Live room.',
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
    name: 'Puck',
    kind: 'p2e',
    status: 'live',
    play: '/games/unix/puck/index.html',
    img: '/games/covers/puck.jpg',
    blurb: 'Ice hockey from the bot catalog.',
  },
  {
    id: 'mte-pop',
    name: 'MTE POP',
    kind: 'arcade',
    status: 'live',
    play: 'https://mte-pop.vercel.app',
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
    name: 'Tap Tap',
    kind: 'p2e',
    status: 'live',
    play: '/games/unix/tap/index.html',
    img: '/games/covers/tap.jpg',
    blurb: 'Core TAP loop from the bot.',
  },
  {
    id: 'pacman',
    name: 'Pac-Man',
    kind: 'arcade',
    status: 'live',
    play: '/games/unix/1/index.html',
    img: '/games/covers/pacman.png',
    blurb: 'Classic maze. High scores on your profile.',
  },
  {
    id: 'tetris',
    name: 'Tetris',
    kind: 'arcade',
    status: 'live',
    play: '/games/2/index.html',
    img: '/games/covers/tetris.jpg',
    blurb: 'Stack and clear. Bot + web.',
  },
  {
    id: 'tetrismob',
    name: 'Tetris Mob',
    kind: 'arcade',
    status: 'live',
    play: '/games/unix/taptap/index.html',
    img: '/games/covers/tetrismob.jpg',
    blurb: 'Mobile tetris from /tetrismob.',
  },
  {
    id: 'racer',
    name: 'Racer',
    kind: 'p2e',
    status: 'live',
    play: '/games/racer/index.html',
    img: '/games/covers/racer.jpg',
    blurb: 'Race results feed the P2E board.',
  },
  {
    id: 'fruit',
    name: 'Fruit Ninja',
    kind: 'arcade',
    status: 'live',
    play: '/games/unix/fruitninja/index.html',
    img: '/games/covers/fruitninja.jpg',
    blurb: 'Slice combos. Arcade score.',
  },
  {
    id: 'dash',
    name: 'Dash',
    kind: 'p2e',
    status: 'live',
    play: '/games/unix/dash/index.html',
    img: '/games/covers/dash.jpg',
    blurb: 'Endless runner. Distance on the season board.',
  },
  {
    id: 'chicken',
    name: 'Chicken',
    kind: 'arcade',
    status: 'live',
    play: '/games/unix/chicken/index.html',
    img: '/games/covers/chicken.jpg',
    blurb: 'Quick farm run from the bot.',
  },
  {
    id: 'mtjump',
    name: 'MT Jump',
    kind: 'arcade',
    status: 'live',
    play: 'https://admin.futuret3ch.com.au/static/games/mt-mario/index.html?v=7',
    img: '/games/covers/mtjump.jpg',
    blurb: 'Platformer party mini-game. /mtjump',
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

export function getGame(id: string) {
  return CATALOG.find((g) => g.id === id);
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
