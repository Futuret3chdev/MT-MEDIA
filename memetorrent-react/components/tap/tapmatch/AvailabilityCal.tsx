'use client';

import { useMemo, useState } from 'react';

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function ymd(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export default function AvailabilityCal({
  value,
  onChange,
  readOnly,
}: {
  value: Record<string, boolean>;
  onChange?: (next: Record<string, boolean>) => void;
  readOnly?: boolean;
}) {
  const now = new Date();
  const [y, setY] = useState(now.getFullYear());
  const [mo, setMo] = useState(now.getMonth());
  const title = new Date(y, mo, 1).toLocaleString('en-AU', { month: 'long', year: 'numeric' });
  const cells = useMemo(() => {
    const first = new Date(y, mo, 1);
    let wd = first.getDay();
    wd = wd === 0 ? 6 : wd - 1;
    const days = new Date(y, mo + 1, 0).getDate();
    const out: (number | null)[] = [];
    for (let i = 0; i < wd; i++) out.push(null);
    for (let d = 1; d <= days; d++) out.push(d);
    while (out.length % 7) out.push(null);
    return out;
  }, [y, mo]);

  return (
    <div className="rounded-2xl border border-white/10 p-3">
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          className="px-2 opacity-70"
          onClick={() => {
            const dt = new Date(y, mo - 1, 1);
            setY(dt.getFullYear());
            setMo(dt.getMonth());
          }}
        >
          ‹
        </button>
        <div className="text-sm font-semibold">{title}</div>
        <button
          type="button"
          className="px-2 opacity-70"
          onClick={() => {
            const dt = new Date(y, mo + 1, 1);
            setY(dt.getFullYear());
            setMo(dt.getMonth());
          }}
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {DAYS.map((d) => (
          <div key={d} className="text-[10px] text-center opacity-40 py-1">
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const key = ymd(y, mo, day);
          const on = value[key] !== false;
          const past = new Date(y, mo, day) < new Date(now.getFullYear(), now.getMonth(), now.getDate());
          return (
            <button
              key={key}
              type="button"
              disabled={readOnly || past}
              onClick={() => {
                if (!onChange) return;
                const next = { ...value };
                if (on) next[key] = false;
                else delete next[key];
                onChange(next);
              }}
              className={`h-8 rounded-lg text-xs ${
                past ? 'opacity-30' : on ? 'bg-emerald-400/20 text-emerald-200' : 'bg-red-400/15 text-red-200'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
      <p className="text-[10px] opacity-40 mt-2">Green available · red off. Tap a day to flip.</p>
    </div>
  );
}
