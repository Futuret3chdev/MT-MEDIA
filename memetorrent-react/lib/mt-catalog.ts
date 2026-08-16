export type GameKind = 'arcade' | 'p2e' | 'casino' | 'studio';

export type CatalogGame = {
  id: string;
  name: string;
  kind: GameKind;
  status: 'live' | 'beta' | 'soon';
  play: string;
  img?: string;
  blurb: string;
};

/** One list. Portal, P2E, casino and studio all read this. */
export const CATALOG: CatalogGame[] = [
  {
    id: 'tetris',
    name: 'Tetris',
    kind: 'arcade',
    status: 'live',
    play: '/games/2',
    img: '/games/tetris.jpg',
    blurb: 'Stack, clear lines, climb the board.',
  },
  {
    id: 'pacman',
    name: 'Pac-Man',
    kind: 'arcade',
    status: 'live',
    play: '/games/unix/1/',
    img: '/games/unix/1/promo/promo-1.png',
    blurb: 'Classic maze. High score stays on your profile.',
  },
  {
    id: 'tap',
    name: 'Tap Tap',
    kind: 'p2e',
    status: 'live',
    play: '/games/unix/tap/',
    img: '/games/taptap.jpg',
    blurb: 'Core TAP loop. Rockets and $MT later settle here.',
  },
  {
    id: 'fruit',
    name: 'Fruit Ninja',
    kind: 'arcade',
    status: 'live',
    play: '/games/unix/fruitninja/',
    img: '/games/fruitninja.jpg',
    blurb: 'Slice combos. Arcade score in the library.',
  },
  {
    id: 'dash',
    name: 'Dash',
    kind: 'p2e',
    status: 'live',
    play: '/games/unix/dash/',
    img: '/games/dash.jpg',
    blurb: 'Runner. Distance scores feed P2E season boards.',
  },
  {
    id: 'chicken',
    name: 'Chicken',
    kind: 'arcade',
    status: 'live',
    play: '/games/unix/chicken/',
    img: '/games/chicken.jpg',
    blurb: 'Quick farm run.',
  },
  {
    id: 'racer',
    name: 'Racer',
    kind: 'p2e',
    status: 'live',
    play: '/games/racer/',
    img: '/games/racer.jpg',
    blurb: 'Race results will pay $MT when the season is on.',
  },
  {
    id: 'mtgames',
    name: 'MT Games (Android)',
    kind: 'studio',
    status: 'beta',
    play: '/software/games',
    img: '/games/sub.png',
    blurb: 'Sideload client. Needs a portal developer license.',
  },
];

export function liveGames() {
  return CATALOG.filter((g) => g.status !== 'soon');
}

export function p2eGames() {
  return CATALOG.filter((g) => g.kind === 'p2e' || g.kind === 'arcade');
}

export function casinoGames() {
  return CATALOG.filter((g) => g.kind === 'casino');
}
