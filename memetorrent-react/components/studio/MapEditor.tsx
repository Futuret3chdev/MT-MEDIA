'use client';

import { BRUSHES, TILE, THEMES, type MapSpec, type TileId } from '@/lib/studio-map';

const CELL = 18;

export default function MapEditor({
  spec,
  brush,
  onBrush,
  onPaint,
}: {
  spec: MapSpec;
  brush: TileId;
  onBrush: (b: TileId) => void;
  onPaint: (x: number, y: number) => void;
}) {
  const th = THEMES[spec.theme];
  const color = (t: TileId) => {
    if (t === TILE.ground) return th.ground;
    if (t === TILE.hazard) return th.hazard;
    if (t === TILE.coin) return th.coin;
    if (t === TILE.spawn) return th.accent;
    if (t === TILE.exit) return '#ffffff';
    if (t === TILE.enemy) return '#ff8fab';
    if (t === TILE.spring) return '#90e0ef';
    return 'transparent';
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-3">
        {BRUSHES.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => onBrush(b.id)}
            className={`px-2 py-1 rounded-lg text-xs ${
              brush === b.id ? 'bg-emerald-400 text-black font-semibold' : 'border border-white/15 opacity-80'
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>
      <div
        className="overflow-auto rounded-xl border border-white/10"
        style={{ background: th.bg, maxHeight: 380 }}
      >
        <div
          className="grid"
          style={{
            width: spec.cols * CELL,
            gridTemplateColumns: `repeat(${spec.cols}, ${CELL}px)`,
          }}
          onPointerDown={(e) => {
            const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            const x = Math.floor((e.clientX - r.left) / CELL);
            const y = Math.floor((e.clientY - r.top) / CELL);
            onPaint(x, y);
          }}
          onPointerMove={(e) => {
            if (e.buttons !== 1) return;
            const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            const x = Math.floor((e.clientX - r.left) / CELL);
            const y = Math.floor((e.clientY - r.top) / CELL);
            onPaint(x, y);
          }}
        >
          {spec.tiles.map((t, i) => (
            <div
              key={i}
              style={{
                width: CELL,
                height: CELL,
                background: color(t as TileId),
                outline: '1px solid rgba(255,255,255,0.04)',
              }}
              title={`${i % spec.cols},${Math.floor(i / spec.cols)}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
