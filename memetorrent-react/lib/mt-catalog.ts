export type GameKind = 'arcade' | 'p2e' | 'action' | 'multiplayer' | 'studio';

export type CatalogGame = {
  id: string;
  name: string;
  kind: GameKind;
  status: 'live' | 'beta' | 'soon';
  play: string;
  img: string;
  blurb: string;
  source?: string;
};

export const CATALOG: CatalogGame[] = [
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
    play: '/games/unix/puck/',
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
    id: 'pocket',
    name: 'Pocket',
    kind: 'multiplayer',
    status: 'live',
    play: 'https://admin.futuret3ch.com.au/play/pocket/',
    img: '/games/covers/pocket.jpg',
    blurb: 'Live multiplayer pocket arena on our servers.',
  },
  {
    id: 'gallery',
    name: 'Gallery',
    kind: 'multiplayer',
    status: 'live',
    play: 'https://admin.futuret3ch.com.au/play/gallery/',
    img: '/games/covers/gallery.jpg',
    blurb: 'Walk the gallery with other players.',
  },
  {
    id: 'tap',
    name: 'Tap Tap',
    kind: 'p2e',
    status: 'live',
    play: '/games/unix/tap/',
    img: '/games/covers/tap.jpg',
    blurb: 'Core TAP loop from the bot.',
  },
  {
    id: 'pacman',
    name: 'Pac-Man',
    kind: 'arcade',
    status: 'live',
    play: '/games/unix/1/',
    img: '/games/covers/pacman.png',
    blurb: 'Classic maze. High scores on your profile.',
  },
  {
    id: 'tetris',
    name: 'Tetris',
    kind: 'arcade',
    status: 'live',
    play: '/games/2',
    img: '/games/covers/tetris.jpg',
    blurb: 'Stack and clear. Bot + web.',
  },
  {
    id: 'tetrismob',
    name: 'Tetris Mob',
    kind: 'arcade',
    status: 'live',
    play: '/games/unix/taptap/',
    img: '/games/covers/tetrismob.jpg',
    blurb: 'Mobile tetris from /tetrismob.',
  },
  {
    id: 'racer',
    name: 'Racer',
    kind: 'p2e',
    status: 'live',
    play: '/games/racer/',
    img: '/games/covers/racer.jpg',
    blurb: 'Race results feed the P2E board.',
  },
  {
    id: 'fruit',
    name: 'Fruit Ninja',
    kind: 'arcade',
    status: 'live',
    play: '/games/unix/fruitninja/',
    img: '/games/covers/fruitninja.jpg',
    blurb: 'Slice combos. Arcade score.',
  },
  {
    id: 'dash',
    name: 'Dash',
    kind: 'p2e',
    status: 'live',
    play: '/games/unix/dash/',
    img: '/games/covers/dash.jpg',
    blurb: 'Endless runner. Distance on the season board.',
  },
  {
    id: 'chicken',
    name: 'Chicken',
    kind: 'arcade',
    status: 'live',
    play: '/games/unix/chicken/',
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
  return CATALOG.filter((g) => g.status !== 'soon');
}

export function p2eGames() {
  return CATALOG.filter((g) => g.kind === 'p2e' || g.kind === 'arcade' || g.kind === 'action');
}

export function casinoGames() {
  return CATALOG.filter((g) => g.kind === 'multiplayer');
}
