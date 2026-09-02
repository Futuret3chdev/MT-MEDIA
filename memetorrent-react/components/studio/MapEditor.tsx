'use client';

import { THEMES, type MapSpec, type TileId } from '@/lib/studio-map';

export default function MapEditor({
  spec,
  brush,
  cell = 18,
  onPaint,
  onSample,
}: {
  spec: MapSpec;
  brush: TileId;
  cell?: number;
  onPaint: (x: number, y: number) => void;
  onSample?: (x: number, y: number) => void;
}) {
  const th = THEMES[spec.theme];
  const color = (t: TileId) => {
    if (t === 1) return th.ground;
    if (t === 2) return th.hazard;
    if (t === 3) return th.coin;
    if (t === 4) return th.accent;
    if (t === 5) return '#ffffff';
    if (t === 6) return '#ff8fab';
    if (t === 7) return '#90e0ef';
    return 'transparent';
  };

  const at = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.floor((e.clientX - r.left) / cell);
    const y = Math.floor((e.clientY - r.top) / cell);
    return { x, y };
  };

  return (
    <div
      className="overflow-auto rounded-xl border border-white/10 select-none touch-none"
      style={{ background: th.bg, maxHeight: 'min(70vh, 640px)' }}
    >
      <div
        className="grid"
        style={{
          width: spec.cols * cell,
          gridTemplateColumns: `repeat(${spec.cols}, ${cell}px)`,
        }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          const { x, y } = at(e);
          if (e.button === 2 || e.altKey) onSample?.(x, y);
          else onPaint(x, y);
        }}
        onPointerMove={(e) => {
          if (e.buttons !== 1) return;
          const { x, y } = at(e);
          onPaint(x, y);
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {spec.tiles.map((t, i) => (
          <div
            key={i}
            style={{
              width: cell,
              height: cell,
              background: color(t as TileId),
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
            }}
            title={`${i % spec.cols},${Math.floor(i / spec.cols)}`}
          />
        ))}
      </div>
    </div>
  );
}
