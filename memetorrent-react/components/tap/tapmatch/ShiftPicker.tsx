'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const HOURS = Array.from({ length: 24 }, (_, h) => h);
const MINS = [0, 15, 30, 45];
const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function parseValue(v: string) {
  const m = String(v || '').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  return { y: Number(m[1]), mo: Number(m[2]) - 1, d: Number(m[3]), h: Number(m[4]), min: Number(m[5]) };
}

function toValue(y: number, mo: number, d: number, h: number, min: number) {
  return `${y}-${pad(mo + 1)}-${pad(d)}T${pad(h)}:${pad(min)}`;
}

function labelOf(v: string) {
  const p = parseValue(v);
  if (!p) return '';
  const dt = new Date(p.y, p.mo, p.d, p.h, p.min);
  return dt.toLocaleString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function monthGrid(y: number, mo: number) {
  const first = new Date(y, mo, 1);
  let wd = first.getDay();
  wd = wd === 0 ? 6 : wd - 1;
  const days = new Date(y, mo + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < wd; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7) cells.push(null);
  return cells;
}

export default function ShiftPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const parsed = parseValue(value);
  const now = new Date();
  const [open, setOpen] = useState(false);
  const [y, setY] = useState(parsed?.y || now.getFullYear());
  const [mo, setMo] = useState(parsed?.mo ?? now.getMonth());
  const [d, setD] = useState(parsed?.d || now.getDate());
  const [h, setH] = useState(parsed?.h ?? (label.toLowerCase().includes('end') ? 17 : 9));
  const [min, setMin] = useState(parsed?.min ?? 0);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const p = parseValue(value);
    if (!p) return;
    setY(p.y);
    setMo(p.mo);
    setD(p.d);
    setH(p.h);
    setMin(p.min);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const cells = useMemo(() => monthGrid(y, mo), [y, mo]);
  const title = new Date(y, mo, 1).toLocaleString('en-AU', { month: 'long', year: 'numeric' });

  function commit(next: { y?: number; mo?: number; d?: number; h?: number; min?: number }) {
    const ny = next.y ?? y;
    const nmo = next.mo ?? mo;
    const nd = next.d ?? d;
    const nh = next.h ?? h;
    const nmin = next.min ?? min;
    onChange(toValue(ny, nmo, nd, nh, nmin));
  }

  return (
    <div ref={box} className="relative">
      <div className="text-[10px] tracking-[2px] text-sky-400 mb-1">{label}</div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-sm"
      >
        {value ? labelOf(value) : 'Pick date and time'}
      </button>
      {open && (
        <div className="absolute z-30 mt-2 w-[min(100%,20rem)] rounded-2xl border border-sky-400/30 bg-[#0b0d12] p-3 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              className="px-2 py-1 text-sm opacity-70"
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
              className="px-2 py-1 text-sm opacity-70"
              onClick={() => {
                const dt = new Date(y, mo + 1, 1);
                setY(dt.getFullYear());
                setMo(dt.getMonth());
              }}
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAYS.map((day) => (
              <div key={day} className="text-[10px] text-center opacity-40 py-1">
                {day}
              </div>
            ))}
            {cells.map((day, i) => {
              const on = day === d;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={!day}
                  onClick={() => {
                    if (!day) return;
                    setD(day);
                    commit({ d: day, y, mo });
                  }}
                  className={`h-8 rounded-lg text-xs ${
                    !day ? 'opacity-0' : on ? 'bg-sky-400 text-black font-bold' : 'hover:bg-white/10'
                  }`}
                >
                  {day || ''}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 mt-3">
            <select
              className="flex-1 rounded-xl bg-white/5 border border-white/15 px-2 py-2 text-sm"
              value={h}
              onChange={(e) => {
                const nh = Number(e.target.value);
                setH(nh);
                commit({ h: nh });
              }}
            >
              {HOURS.map((hr) => (
                <option key={hr} value={hr}>
                  {new Date(2000, 0, 1, hr).toLocaleTimeString('en-AU', { hour: 'numeric' })}
                </option>
              ))}
            </select>
            <select
              className="w-24 rounded-xl bg-white/5 border border-white/15 px-2 py-2 text-sm"
              value={min}
              onChange={(e) => {
                const nmin = Number(e.target.value);
                setMin(nmin);
                commit({ min: nmin });
              }}
            >
              {MINS.map((m) => (
                <option key={m} value={m}>
                  {pad(m)}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="mt-3 w-full rounded-full bg-sky-400 text-black font-bold text-sm py-1.5"
            onClick={() => {
              commit({});
              setOpen(false);
            }}
          >
            Set {label.toLowerCase()}
          </button>
        </div>
      )}
    </div>
  );
}
