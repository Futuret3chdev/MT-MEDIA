'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type Seat = 'work' | 'hire';
type Connect = 'all' | 'fast' | 'longterm';

type Job = {
  id: string;
  connect: 'fast' | 'longterm' | string;
  role: string;
  blurb?: string | null;
  location?: string | null;
  pay?: string | null;
  skills?: string[];
  commitment?: string | null;
  status?: string;
  username?: string | null;
  demo?: boolean;
};

const SKILLS = [
  'Barista',
  'Bartending',
  'Waitstaff',
  'Kitchen Hand',
  'Chef / Cook',
  'Front of House',
  'Back of House',
  'Delivery Driver',
  'Cleaner',
  'Event Staff',
  'Hotel Reception',
  'Housekeeping',
];

const CITIES = ['Melbourne', 'Sydney', 'Brisbane', 'Adelaide', 'Perth'];

export default function TapMatchDesk({
  user,
}: {
  user: { username: string; is_admin?: boolean } | null;
}) {
  const [staff, setStaff] = useState(false);
  const [checking, setChecking] = useState(true);
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [gateMsg, setGateMsg] = useState('');
  const [gateBusy, setGateBusy] = useState(false);

  const [seat, setSeat] = useState<Seat>('work');
  const [connect, setConnect] = useState<Connect>('all');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applied, setApplied] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    role: '',
    blurb: '',
    location: 'Melbourne',
    pay: '',
    connect: 'fast' as 'fast' | 'longterm',
    commitment: 'part-time',
    skills: [] as string[],
  });

  const loadStaff = useCallback(async () => {
    try {
      const r = await fetch('/api/v1/tapmatch/staff', { credentials: 'include', cache: 'no-store' });
      const d = await r.json();
      setStaff(Boolean(d?.data?.staff) || Boolean(user?.is_admin) || user?.username === '376937');
    } catch {
      setStaff(Boolean(user?.is_admin) || user?.username === '376937');
    } finally {
      setChecking(false);
    }
  }, [user]);

  const loadJobs = useCallback(async (filter: Connect) => {
    const q = filter === 'all' ? '' : `?connect=${filter}`;
    const r = await fetch(`/api/v1/tapmatch/jobs${q}`, { credentials: 'include', cache: 'no-store' });
    const d = await r.json();
    setJobs(Array.isArray(d?.data?.jobs) ? d.data.jobs : []);
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  useEffect(() => {
    if (staff) loadJobs(connect).catch(() => setJobs([]));
  }, [staff, connect, loadJobs]);

  const shown = useMemo(
    () => jobs.filter((j) => connect === 'all' || j.connect === connect),
    [jobs, connect]
  );

  async function staffLogin(e: React.FormEvent) {
    e.preventDefault();
    setGateBusy(true);
    setGateMsg('');
    try {
      const r = await fetch('/api/v1/tapmatch/staff', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, password }),
      });
      const d = await r.json();
      if (!r.ok || !d?.data?.staff) {
        setGateMsg(d?.status?.error_message || 'Wrong admin user or password');
        return;
      }
      setStaff(true);
      setPin('');
      setPassword('');
    } catch {
      setGateMsg('Could not reach TAPMATCH staff gate');
    } finally {
      setGateBusy(false);
    }
  }

  async function apply(job: Job) {
    setBusy(true);
    setMsg('');
    try {
      const r = await fetch('/api/v1/tapmatch/apply', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: job.id,
          note: note || (job.connect === 'fast' ? 'Tap to Connect' : 'Applying'),
        }),
      });
      const d = await r.json();
      if (d?.status?.error_code) {
        setMsg(d.status.error_message || 'Could not apply');
        return;
      }
      setApplied((m) => ({ ...m, [job.id]: true }));
      setMsg(job.connect === 'fast' ? `Connected — ${job.role}` : `Applied — ${job.role}`);
      setNote('');
    } catch {
      setMsg('Network error');
    } finally {
      setBusy(false);
    }
  }

  async function postRole(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    try {
      const r = await fetch('/api/v1/tapmatch/jobs', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (d?.status?.error_code) {
        setMsg(d.status.error_message || 'Could not post');
        return;
      }
      setMsg(`Posted ${form.role}`);
      setForm({
        role: '',
        blurb: '',
        location: form.location,
        pay: '',
        connect: form.connect,
        commitment: 'part-time',
        skills: [],
      });
      await loadJobs(connect);
      setSeat('work');
    } catch {
      setMsg('Network error');
    } finally {
      setBusy(false);
    }
  }

  if (checking) {
    return <div className="opacity-60 text-sm">Checking TAPMATCH staff access…</div>;
  }

  if (!staff) {
    return (
      <section className="rounded-3xl border border-sky-400/30 bg-sky-400/5 p-6 sm:p-8 max-w-lg">
        <div className="text-[10px] tracking-[3px] text-sky-400 mb-2">STAFF PREVIEW</div>
        <h2 className="text-xl font-semibold mb-2">TAPMATCH is closed</h2>
        <p className="text-sm opacity-70 mb-6">
          Work matching is in staff preview — Fast Connect and long-term. Public accounts stay on
          the TAP desk. Staff sign in here with the admin user.
        </p>
        <form onSubmit={staffLogin} className="space-y-3">
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            autoComplete="username"
            placeholder="Admin user"
            className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-sm"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="Password"
            className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={gateBusy}
            className="w-full rounded-full bg-sky-400 text-black font-bold py-2"
          >
            {gateBusy ? 'Checking…' : 'Open TAPMATCH'}
          </button>
        </form>
        {gateMsg && <p className="text-sm mt-3 text-amber-200">{gateMsg}</p>}
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-sky-400/30 bg-sky-400/5 p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <div className="text-[10px] tracking-[3px] text-sky-400 mb-1">STAFF PREVIEW</div>
            <h2 className="text-xl font-semibold">Work — employees and employers</h2>
            <p className="text-sm opacity-70 mt-1 max-w-xl">
              Fast Connect for short-term shifts. Long-term for ongoing roles. Closed to the public.
            </p>
          </div>
          <div className="flex gap-2">
            {(['work', 'hire'] as Seat[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSeat(s)}
                className={`px-4 py-2 rounded-2xl text-sm font-semibold border ${
                  seat === s ? 'bg-sky-400 text-black border-sky-400' : 'border-sky-400/30 opacity-80'
                }`}
              >
                {s === 'work' ? 'Looking for work' : 'Hiring'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {([
            ['all', 'All'],
            ['fast', 'Fast Connect'],
            ['longterm', 'Long-term'],
          ] as [Connect, string][]).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setConnect(id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                connect === id ? 'bg-white text-black border-white' : 'border-white/20 opacity-70'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {msg && <p className="text-sm text-sky-300">{msg}</p>}

      {seat === 'hire' && (
        <form
          onSubmit={postRole}
          className="rounded-3xl border border-white/10 p-6 grid sm:grid-cols-2 gap-3"
        >
          <div className="sm:col-span-2 text-sm font-semibold">Post a role</div>
          <input
            required
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            placeholder="Role — barista, courier, floor cover"
            className="rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-sm"
          />
          <input
            value={form.pay}
            onChange={(e) => setForm({ ...form, pay: e.target.value })}
            placeholder="Pay — $32/hr"
            className="rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-sm"
          />
          <select
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-sm"
          >
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            {(['fast', 'longterm'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm({ ...form, connect: c })}
                className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold ${
                  form.connect === c ? 'bg-sky-400 text-black border-sky-400' : 'border-white/15'
                }`}
              >
                {c === 'fast' ? 'Fast Connect' : 'Long-term'}
              </button>
            ))}
          </div>
          {form.connect === 'longterm' && (
            <select
              value={form.commitment}
              onChange={(e) => setForm({ ...form, commitment: e.target.value })}
              className="rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-sm sm:col-span-2"
            >
              <option value="part-time">Part-time</option>
              <option value="full-time">Full-time</option>
              <option value="contract">Contract</option>
            </select>
          )}
          <textarea
            required
            rows={2}
            value={form.blurb}
            onChange={(e) => setForm({ ...form, blurb: e.target.value })}
            placeholder="What you need — shift time, start, who it suits"
            className="sm:col-span-2 rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-sm"
          />
          <div className="sm:col-span-2 flex flex-wrap gap-2">
            {SKILLS.map((s) => {
              const on = form.skills.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      skills: on ? form.skills.filter((x) => x !== s) : [...form.skills, s],
                    })
                  }
                  className={`text-[11px] rounded-full px-3 py-1 border ${
                    on ? 'bg-sky-400 text-black border-sky-400' : 'border-white/20 opacity-70'
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
          <button
            type="submit"
            disabled={busy}
            className="sm:col-span-2 rounded-full bg-sky-400 text-black font-bold py-2"
          >
            {busy ? 'Posting…' : 'Post role'}
          </button>
        </form>
      )}

      {seat === 'work' && (
        <div className="space-y-3">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note with your connect / apply"
            className="w-full rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-sm"
          />
          {shown.map((job) => {
            const fast = job.connect === 'fast';
            return (
              <article key={job.id} className="rounded-2xl border border-white/10 p-5">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${
                      fast ? 'bg-orange-400/20 text-orange-200' : 'bg-sky-400/20 text-sky-200'
                    }`}
                  >
                    {fast ? 'Fast Connect' : 'Long-term'}
                  </span>
                  {job.location && <span className="text-xs opacity-60">{job.location}</span>}
                  {job.pay && <span className="text-xs opacity-80">{job.pay}</span>}
                  {job.demo && <span className="text-[10px] opacity-40">sample</span>}
                </div>
                <h3 className="font-semibold">{job.role}</h3>
                {job.blurb && <p className="text-sm opacity-70 mt-1">{job.blurb}</p>}
                {!!job.skills?.length && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {job.skills.map((s) => (
                      <span key={s} className="text-[10px] rounded-full border border-white/15 px-2 py-0.5 opacity-70">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  disabled={busy || applied[job.id]}
                  onClick={() => apply(job)}
                  className="mt-4 rounded-full bg-sky-400 text-black font-bold text-sm px-4 py-1.5 disabled:opacity-50"
                >
                  {applied[job.id] ? 'Sent' : fast ? 'Tap to Connect' : 'Apply'}
                </button>
              </article>
            );
          })}
          {!shown.length && <p className="text-sm opacity-60">No roles in this lane yet.</p>}
        </div>
      )}
    </div>
  );
}
