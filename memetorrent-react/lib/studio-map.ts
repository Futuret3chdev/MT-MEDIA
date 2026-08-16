export const TILE = {
  empty: 0,
  ground: 1,
  hazard: 2,
  coin: 3,
  spawn: 4,
  exit: 5,
  enemy: 6,
  spring: 7,
} as const;

export type TileId = (typeof TILE)[keyof typeof TILE];

export type ThemeId = 'night' | 'forest' | 'city' | 'space';

export type MapSpec = {
  type: 'platformer';
  name: string;
  blurb: string;
  theme: ThemeId;
  cols: number;
  rows: number;
  tiles: number[];
  gravity: number;
  jump: number;
  speed: number;
  time: number;
  events?: { when: string; do: string }[];
};

export const THEMES: Record<ThemeId, { bg: string; ground: string; accent: string; hazard: string; coin: string }> = {
  night: { bg: '#0b1020', ground: '#2a3348', accent: '#00ff99', hazard: '#ff4d6a', coin: '#ffd166' },
  forest: { bg: '#0d1a12', ground: '#2d5a3d', accent: '#9ef01a', hazard: '#e85d04', coin: '#ffe66d' },
  city: { bg: '#140c18', ground: '#3d2b56', accent: '#ff4dff', hazard: '#ff006e', coin: '#00f5d4' },
  space: { bg: '#070712', ground: '#1b2744', accent: '#48cae4', hazard: '#c77dff', coin: '#f4d35e' },
};

export const BRUSHES: { id: TileId; label: string }[] = [
  { id: TILE.empty, label: 'Erase' },
  { id: TILE.ground, label: 'Ground' },
  { id: TILE.hazard, label: 'Spike' },
  { id: TILE.coin, label: 'Coin' },
  { id: TILE.spawn, label: 'Start' },
  { id: TILE.exit, label: 'Exit' },
  { id: TILE.enemy, label: 'Enemy' },
  { id: TILE.spring, label: 'Spring' },
];

export function blankMap(): MapSpec {
  const cols = 40;
  const rows = 18;
  const tiles = new Array(cols * rows).fill(TILE.empty);
  for (let x = 0; x < cols; x++) tiles[(rows - 1) * cols + x] = TILE.ground;
  for (let x = 8; x < 14; x++) tiles[(rows - 4) * cols + x] = TILE.ground;
  for (let x = 18; x < 24; x++) tiles[(rows - 7) * cols + x] = TILE.ground;
  for (let x = 28; x < 36; x++) tiles[(rows - 5) * cols + x] = TILE.ground;
  tiles[(rows - 2) * cols + 2] = TILE.spawn;
  tiles[(rows - 6) * cols + 34] = TILE.exit;
  tiles[(rows - 5) * cols + 10] = TILE.coin;
  tiles[(rows - 8) * cols + 20] = TILE.coin;
  tiles[(rows - 6) * cols + 22] = TILE.coin;
  tiles[(rows - 6) * cols + 30] = TILE.enemy;
  tiles[(rows - 2) * cols + 16] = TILE.hazard;
  tiles[(rows - 2) * cols + 17] = TILE.hazard;
  return {
    type: 'platformer',
    name: 'Night Run',
    blurb: 'Jump, grab coins, reach the exit.',
    theme: 'night',
    cols,
    rows,
    tiles,
    gravity: 0.55,
    jump: 9.2,
    speed: 3.4,
    time: 90,
    events: [
      { when: 'Player touches Coin', do: 'Add 1 to Score' },
      { when: 'Player touches Spike', do: 'Restart scene' },
      { when: 'Player touches Exit', do: 'Win the game' },
      { when: 'Player jumps on Enemy', do: 'Remove Enemy' },
    ],
  };
}

export function idx(spec: MapSpec, x: number, y: number) {
  return y * spec.cols + x;
}

export function getTile(spec: MapSpec, x: number, y: number): TileId {
  if (x < 0 || y < 0 || x >= spec.cols || y >= spec.rows) return TILE.ground;
  return spec.tiles[idx(spec, x, y)] as TileId;
}
