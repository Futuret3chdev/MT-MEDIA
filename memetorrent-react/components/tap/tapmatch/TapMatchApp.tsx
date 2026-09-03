'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BUSINESS_PREF_SECTIONS,
  TAPMATCH_CITIES,
  TAPMATCH_SKILLS,
  WORKER_CATEGORIES,
} from '@/lib/tapmatch-catalog';

type Seat = 'worker' | 'business';
type View =
  | 'home'
  | 'match'
  | 'manager'
  | 'profile'
  | 'edit'
  | 'prefs'
  | 'settings'
  | 'post'
  | 'applicants'
  | 'job';

type Profile = {
  setup?: boolean;
  seat?: Seat | null;
  first_name?: string;
  last_name?: string;
  phone?: string;
  bio?: string;
  location?: string;
  rate?: string;
  skills?: string[];
  connectTypes?: string[];
  categories?: Record<string, boolean>;
  notes?: string;
  business_name?: string;
  status?: string;
  username?: string;
};

type Job = {
  id: string;
  connect: string;
  role: string;
  blurb?: string | null;
  location?: string | null;
  pay?: string | null;
  skills?: string[];
  commitment?: string | null;
  username?: string | null;
  demo?: boolean;
  match?: { matchPct: number; reasons: string[]; hidden?: boolean };
};

type AppRow = {
  id: number;
  job_id: string;
  username?: string;
  note?: string;
  status: string;
  role?: string;
  connect?: string;
  location?: string;
  pay?: string;
  blurb?: string;
  employer?: string;
};

const input = 'w-full rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-sm';
const btn = 'rounded-full bg-sky-400 text-black font-bold text-sm px-4 py-2 disabled:opacity-50';
const ghost = 'rounded-2xl border border-white/15 px-3 py-2 text-sm';

function Chip({
  on,
  children,
  onClick,
}: {
  on?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-[11px] rounded-full px-3 py-1 border ${
        on ? 'bg-sky-400 text-black border-sky-400' : 'border-white/20 opacity-70'
      }`}
    >
      {children}
    </button>
  );
}

export default function TapMatchApp({
  user,
}: {
  user: { username: string } | null;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('home');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [home, setHome] = useState<{
    badge?: { latestBadge: string };
    worker?: { pending: number; accepted: number; completed: number };
    business?: { open: number; applications: number };
  } | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [apps, setApps] = useState<AppRow[]>([]);
  const [posted, setPosted] = useState<Job[]>([]);
  const [connect, setConnect] = useState<'all' | 'fast' | 'longterm' | 'foryou'>('foryou');
  const [city, setCity] = useState('Any');
  const [picked, setPicked] = useState<Job | null>(null);
  const [draft, setDraft] = useState<Profile>({
    seat: 'worker',
    first_name: '',
    last_name: '',
    phone: '',
    bio: '',
    location: 'Melbourne',
    rate: '',
    skills: [],
    connectTypes: ['fast', 'longterm'],
    categories: {},
    notes: '',
    business_name: '',
    status: 'available',
  });

  const [post, setPost] = useState({
    role: '',
    blurb: '',
    location: 'Melbourne',
    pay: '',
    connect: 'fast' as 'fast' | 'longterm',
    commitment: 'part-time',
    skills: [] as string[],
  });

  const seat: Seat = profile?.seat === 'business' ? 'business' : 'worker';
  const name =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    profile?.business_name ||
    user?.username ||
    'Staff';

  const loadProfile = useCallback(async () => {
    const r = await fetch('/api/v1/tapmatch/profile', { credentials: 'include', cache: 'no-store' });
    const d = await r.json();
    const p = d?.data?.profile as Profile | undefined;
    setProfile(p || { setup: false, seat: null });
    if (p?.setup) setDraft({ ...p, seat: p.seat === 'business' ? 'business' : 'worker' });
    return p;
  }, []);

  const loadHome = useCallback(async () => {
    const r = await fetch('/api/v1/tapmatch/home', { credentials: 'include', cache: 'no-store' });
    const d = await r.json();
    setHome(d?.data || null);
    if (d?.data?.profile) setProfile(d.data.profile);
  }, []);

  const loadMatches = useCallback(async () => {
    const q = new URLSearchParams();
    if (connect === 'fast' || connect === 'longterm') q.set('connect', connect);
    if (city && city !== 'Any') q.set('location', city);
    const r = await fetch(`/api/v1/tapmatch/matches?${q}`, { credentials: 'include', cache: 'no-store' });
    const d = await r.json();
    setJobs(Array.isArray(d?.data?.jobs) ? d.data.jobs : []);
  }, [connect, city]);

  const loadMine = useCallback(async () => {
    const r = await fetch('/api/v1/tapmatch/apps?mine=1', { credentials: 'include', cache: 'no-store' });
    const d = await r.json();
    setApps(Array.isArray(d?.data?.applications) ? d.data.applications : []);
  }, []);

  const loadPosted = useCallback(async () => {
    const [jobsRes, appsRes] = await Promise.all([
      fetch('/api/v1/tapmatch/jobs', { credentials: 'include', cache: 'no-store' }),
      fetch('/api/v1/tapmatch/apps?posted=1', { credentials: 'include', cache: 'no-store' }),
    ]);
    const jd = await jobsRes.json();
    const ad = await appsRes.json();
    const list: Job[] = Array.isArray(jd?.data?.jobs) ? jd.data.jobs : [];
    setPosted(list.filter((j) => !j.demo));
    setApps(Array.isArray(ad?.data?.applications) ? ad.data.applications : []);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await loadProfile();
        await loadHome();
      } catch {
        /* */
      } finally {
        setLoading(false);
      }
    })();
  }, [loadHome, loadProfile]);

  useEffect(() => {
    if (!profile?.setup) return;
    if (view === 'match') loadMatches().catch(() => setJobs([]));
    if (view === 'manager' && seat === 'worker') loadMine().catch(() => setApps([]));
    if (view === 'manager' && seat === 'business') loadPosted().catch(() => {});
    if (view === 'applicants') loadPosted().catch(() => {});
    if (view === 'home') loadHome().catch(() => {});
  }, [view, profile?.setup, seat, loadMatches, loadMine, loadPosted, loadHome]);

  const shownJobs = useMemo(() => {
    if (connect === 'foryou') return jobs.filter((j) => !j.match?.hidden).sort((a, b) => (b.match?.matchPct || 0) - (a.match?.matchPct || 0));
    return jobs;
  }, [jobs, connect]);

  async function saveProfile(extra?: Partial<Profile>) {
    setBusy(true);
    setMsg('');
    try {
      const body = { ...draft, ...extra };
      const r = await fetch('/api/v1/tapmatch/profile', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (d?.status?.error_code) {
        setMsg(d.status.error_message || 'Could not save');
        return false;
      }
      setProfile(d.data.profile);
      setDraft(d.data.profile);
      setMsg('Saved');
      return true;
    } catch {
      setMsg('Network error');
      return false;
    } finally {
      setBusy(false);
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
          note: job.connect === 'fast' ? 'Tap to Connect' : 'Applying',
        }),
      });
      const d = await r.json();
      if (d?.status?.error_code) {
        setMsg(d.status.error_message || 'Could not apply');
        return;
      }
      setMsg(job.connect === 'fast' ? `Connected — ${job.role}` : `Applied — ${job.role}`);
      await loadMine();
    } catch {
      setMsg('Network error');
    } finally {
      setBusy(false);
    }
  }

  async function setAppStatus(id: number, status: string) {
    setBusy(true);
    try {
      await fetch('/api/v1/tapmatch/status', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (seat === 'worker') await loadMine();
      else await loadPosted();
      setMsg(status);
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
        body: JSON.stringify(post),
      });
      const d = await r.json();
      if (d?.status?.error_code) {
        setMsg(d.status.error_message || 'Could not post');
        return;
      }
      setMsg(`Posted ${post.role}`);
      setPost({ ...post, role: '', blurb: '', pay: '', skills: [] });
      setView('manager');
    } catch {
      setMsg('Network error');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="opacity-60 text-sm">Loading TAPMATCH…</div>;

  if (!profile?.setup) {
    return (
      <section className="rounded-3xl border border-sky-400/30 bg-sky-400/5 p-6 sm:p-8 space-y-4 max-w-xl">
        <div className="text-[10px] tracking-[3px] text-sky-400">PROFILE SETUP</div>
        <h2 className="text-xl font-semibold">Who are you on TAPMATCH?</h2>
        <p className="text-sm opacity-70">Same as the original app — employee or employer first, then your profile.</p>
        <div className="flex gap-2">
          {(['worker', 'business'] as Seat[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setDraft({ ...draft, seat: s })}
              className={`${ghost} flex-1 ${draft.seat === s ? 'bg-sky-400 text-black border-sky-400' : ''}`}
            >
              {s === 'worker' ? 'Employee' : 'Employer'}
            </button>
          ))}
        </div>
        {draft.seat === 'business' ? (
          <input
            className={input}
            placeholder="Business name"
            value={draft.business_name || ''}
            onChange={(e) => setDraft({ ...draft, business_name: e.target.value })}
          />
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            <input className={input} placeholder="First name" value={draft.first_name || ''} onChange={(e) => setDraft({ ...draft, first_name: e.target.value })} />
            <input className={input} placeholder="Last name" value={draft.last_name || ''} onChange={(e) => setDraft({ ...draft, last_name: e.target.value })} />
          </div>
        )}
        <select className={input} value={draft.location || 'Melbourne'} onChange={(e) => setDraft({ ...draft, location: e.target.value })}>
          {TAPMATCH_CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {draft.seat === 'worker' && (
          <input className={input} placeholder="Hourly rate — 32" value={draft.rate || ''} onChange={(e) => setDraft({ ...draft, rate: e.target.value })} />
        )}
        <div className="flex flex-wrap gap-2">
          {(['fast', 'longterm'] as const).map((c) => (
            <Chip
              key={c}
              on={(draft.connectTypes || []).includes(c)}
              onClick={() => {
                const cur = new Set(draft.connectTypes || []);
                if (cur.has(c)) cur.delete(c);
                else cur.add(c);
                setDraft({ ...draft, connectTypes: Array.from(cur) });
              }}
            >
              {c === 'fast' ? 'Fast Connect' : 'Long-term'}
            </Chip>
          ))}
        </div>
        <button
          type="button"
          disabled={busy}
          className={btn + ' w-full'}
          onClick={async () => {
            const ok = await saveProfile();
            if (ok) setView('home');
          }}
        >
          {busy ? 'Saving…' : 'Save and open TAPMATCH'}
        </button>
        {msg && <p className="text-sm text-sky-300">{msg}</p>}
      </section>
    );
  }

  const nav =
    seat === 'business'
      ? ([
          ['home', 'Home'],
          ['post', 'Post'],
          ['manager', 'Manager'],
          ['profile', 'Profile'],
        ] as [View, string][])
      : ([
          ['home', 'Home'],
          ['match', 'Match'],
          ['manager', 'Manager'],
          ['profile', 'Profile'],
        ] as [View, string][]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {nav.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setView(id)}
            className={`px-4 py-2 rounded-2xl text-sm font-semibold border ${
              view === id ? 'bg-sky-400 text-black border-sky-400' : 'border-sky-400/30 opacity-80'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {msg && <p className="text-sm text-sky-300">{msg}</p>}

      {view === 'home' && (
        <section className="rounded-3xl border border-sky-400/30 bg-sky-400/5 p-6 sm:p-8 space-y-5">
          <div>
            <div className="text-[10px] tracking-[3px] text-sky-400">
              {seat === 'business' ? 'EMPLOYER' : 'EMPLOYEE'}
            </div>
            <h2 className="text-2xl font-semibold mt-1">{name}</h2>
            <p className="text-sm opacity-60">{profile.location || 'Set your city in profile'}</p>
            {home?.badge?.latestBadge && (
              <p className="text-sm text-sky-300 mt-1">{home.badge.latestBadge}</p>
            )}
          </div>
          {seat === 'worker' ? (
            <div className="grid sm:grid-cols-3 gap-3">
              <Stat label="Completed" value={home?.worker?.completed ?? 0} />
              <Stat label="Pending" value={home?.worker?.pending ?? 0} />
              <Stat label="Accepted" value={home?.worker?.accepted ?? 0} />
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              <Stat label="Open roles" value={home?.business?.open ?? 0} />
              <Stat label="Applications" value={home?.business?.applications ?? 0} />
            </div>
          )}
          {seat === 'worker' && profile.rate && (
            <div className="rounded-2xl border border-white/10 p-4">
              <div className="text-[10px] tracking-[2px] text-sky-400">HOURLY RATE</div>
              <div className="text-xl font-semibold">AUD {profile.rate}/hr</div>
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-2">
            {seat === 'worker' ? (
              <>
                <button className={ghost} onClick={() => setView('match')}>Job search / Match</button>
                <button className={ghost} onClick={() => setView('manager')}>Job manager</button>
                <button className={ghost} onClick={() => setView('profile')}>Profile</button>
                <button className={ghost} onClick={() => setView('settings')}>Settings</button>
              </>
            ) : (
              <>
                <button className={ghost} onClick={() => setView('post')}>Post a role</button>
                <button className={ghost} onClick={() => setView('manager')}>Job manager</button>
                <button className={ghost} onClick={() => setView('profile')}>Business profile</button>
                <button className={ghost} onClick={() => setView('settings')}>Settings</button>
              </>
            )}
          </div>
        </section>
      )}

      {view === 'match' && (
        <section className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {([
              ['foryou', 'For you'],
              ['fast', 'Fast Connect'],
              ['longterm', 'Long-term'],
            ] as const).map(([id, label]) => (
              <Chip key={id} on={connect === id} onClick={() => setConnect(id)}>
                {label}
              </Chip>
            ))}
            <select className={input + ' !w-auto'} value={city} onChange={(e) => setCity(e.target.value)}>
              <option>Any</option>
              {TAPMATCH_CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          {shownJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onOpen={() => {
                setPicked(job);
                setView('job');
              }}
              onApply={() => apply(job)}
              busy={busy}
            />
          ))}
          {!shownJobs.length && <p className="text-sm opacity-60">No matching roles yet. Post from the employer seat or widen filters.</p>}
        </section>
      )}

      {view === 'job' && picked && (
        <section className="rounded-3xl border border-white/10 p-6 space-y-3">
          <button className="text-sm opacity-60" onClick={() => setView('match')}>← Match</button>
          <JobCard job={picked} onApply={() => apply(picked)} busy={busy} />
        </section>
      )}

      {view === 'manager' && seat === 'worker' && (
        <ManagerList
          apps={apps}
          tabs={['pending', 'accepted', 'inprogress', 'completed', 'cancelled']}
          onStatus={setAppStatus}
        />
      )}

      {view === 'manager' && seat === 'business' && (
        <section className="space-y-3">
          <p className="text-sm opacity-70">Open roles you posted. Open applicants to accept a match.</p>
          {posted.map((job) => (
            <article key={job.id} className="rounded-2xl border border-white/10 p-5">
              <div className="font-semibold">{job.role}</div>
              <p className="text-sm opacity-60">{job.location} · {job.pay || 'Pay on request'}</p>
              <button
                className={btn + ' mt-3'}
                onClick={() => {
                  setPicked(job);
                  setView('applicants');
                }}
              >
                Applicants
              </button>
            </article>
          ))}
          {!posted.length && <p className="text-sm opacity-60">No posted roles yet.</p>}
        </section>
      )}

      {view === 'applicants' && picked && (
        <section className="space-y-3">
          <button className="text-sm opacity-60" onClick={() => setView('manager')}>← Manager</button>
          <h3 className="font-semibold">Applicants — {picked.role}</h3>
          {apps
            .filter((a) => a.job_id === picked.id)
            .map((a) => (
              <article key={a.id} className="rounded-2xl border border-white/10 p-5">
                <div className="font-semibold">@{a.username}</div>
                <p className="text-sm opacity-70">{a.note || 'No note'}</p>
                <p className="text-xs opacity-50 mt-1 capitalize">{a.status}</p>
                <div className="flex gap-2 mt-3">
                  <button className={btn} disabled={busy} onClick={() => setAppStatus(a.id, 'accepted')}>
                    Accept match
                  </button>
                  <button className={ghost} disabled={busy} onClick={() => setAppStatus(a.id, 'declined')}>
                    Decline
                  </button>
                </div>
              </article>
            ))}
          {!apps.filter((a) => a.job_id === picked.id).length && (
            <p className="text-sm opacity-60">No applicants yet.</p>
          )}
        </section>
      )}

      {view === 'post' && (
        <form onSubmit={postRole} className="rounded-3xl border border-white/10 p-6 grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2 font-semibold">Post a role</div>
          <input required className={input} placeholder="Role" value={post.role} onChange={(e) => setPost({ ...post, role: e.target.value })} />
          <input className={input} placeholder="Pay — $32/hr" value={post.pay} onChange={(e) => setPost({ ...post, pay: e.target.value })} />
          <select className={input} value={post.location} onChange={(e) => setPost({ ...post, location: e.target.value })}>
            {TAPMATCH_CITIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <div className="flex gap-2">
            {(['fast', 'longterm'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setPost({ ...post, connect: c })}
                className={`${ghost} flex-1 ${post.connect === c ? 'bg-sky-400 text-black border-sky-400' : ''}`}
              >
                {c === 'fast' ? 'Fast Connect' : 'Long-term'}
              </button>
            ))}
          </div>
          {post.connect === 'longterm' && (
            <select className={input + ' sm:col-span-2'} value={post.commitment} onChange={(e) => setPost({ ...post, commitment: e.target.value })}>
              <option value="part-time">Part-time</option>
              <option value="full-time">Full-time</option>
              <option value="contract">Contract</option>
            </select>
          )}
          <textarea required rows={2} className={input + ' sm:col-span-2'} placeholder="What you need" value={post.blurb} onChange={(e) => setPost({ ...post, blurb: e.target.value })} />
          <div className="sm:col-span-2 flex flex-wrap gap-2">
            {TAPMATCH_SKILLS.map((s) => (
              <Chip
                key={s}
                on={post.skills.includes(s)}
                onClick={() =>
                  setPost({
                    ...post,
                    skills: post.skills.includes(s) ? post.skills.filter((x) => x !== s) : [...post.skills, s],
                  })
                }
              >
                {s}
              </Chip>
            ))}
          </div>
          <button type="submit" disabled={busy} className={btn + ' sm:col-span-2'}>
            {busy ? 'Posting…' : 'Post role'}
          </button>
        </form>
      )}

      {view === 'profile' && (
        <section className="rounded-3xl border border-sky-400/30 bg-sky-400/5 p-6 space-y-4">
          <h2 className="text-xl font-semibold">{name}</h2>
          <p className="text-sm opacity-70">{profile.bio || 'No bio yet.'}</p>
          <p className="text-sm opacity-60">{profile.location} {profile.rate ? `· AUD ${profile.rate}/hr` : ''}</p>
          <div className="flex flex-wrap gap-2">
            {(profile.skills || []).map((s) => (
              <span key={s} className="text-[11px] rounded-full border border-white/15 px-2 py-0.5 opacity-80">{s}</span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button className={btn} onClick={() => setView('edit')}>Edit profile</button>
            <button className={ghost} onClick={() => setView('prefs')}>Preferences</button>
            <button className={ghost} onClick={() => setView('settings')}>Settings</button>
          </div>
        </section>
      )}

      {view === 'edit' && (
        <form
          className="rounded-3xl border border-white/10 p-6 grid sm:grid-cols-2 gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await saveProfile()) setView('profile');
          }}
        >
          <div className="sm:col-span-2 font-semibold">Edit profile</div>
          {seat === 'business' ? (
            <input className={input + ' sm:col-span-2'} placeholder="Business name" value={draft.business_name || ''} onChange={(e) => setDraft({ ...draft, business_name: e.target.value })} />
          ) : (
            <>
              <input className={input} placeholder="First name" value={draft.first_name || ''} onChange={(e) => setDraft({ ...draft, first_name: e.target.value })} />
              <input className={input} placeholder="Last name" value={draft.last_name || ''} onChange={(e) => setDraft({ ...draft, last_name: e.target.value })} />
            </>
          )}
          <input className={input} placeholder="Phone" value={draft.phone || ''} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
          <input className={input} placeholder="Rate" value={draft.rate || ''} onChange={(e) => setDraft({ ...draft, rate: e.target.value })} />
          <select className={input} value={draft.location || 'Melbourne'} onChange={(e) => setDraft({ ...draft, location: e.target.value })}>
            {TAPMATCH_CITIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select className={input} value={draft.status || 'available'} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>
            <option value="available">Available</option>
            <option value="busy">Busy</option>
            <option value="unavailable">Unavailable</option>
            <option value="offline">Offline</option>
          </select>
          <textarea rows={3} className={input + ' sm:col-span-2'} placeholder="Bio" value={draft.bio || ''} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} />
          <div className="sm:col-span-2 flex flex-wrap gap-2">
            {TAPMATCH_SKILLS.map((s) => (
              <Chip
                key={s}
                on={(draft.skills || []).includes(s)}
                onClick={() => {
                  const cur = new Set(draft.skills || []);
                  if (cur.has(s)) cur.delete(s);
                  else cur.add(s);
                  setDraft({ ...draft, skills: Array.from(cur) });
                }}
              >
                {s}
              </Chip>
            ))}
          </div>
          <button type="submit" disabled={busy} className={btn + ' sm:col-span-2'}>{busy ? 'Saving…' : 'Save profile'}</button>
        </form>
      )}

      {view === 'prefs' && (
        <section className="rounded-3xl border border-white/10 p-6 space-y-4">
          <h3 className="font-semibold">Preferences</h3>
          <div className="flex flex-wrap gap-2">
            {(['fast', 'longterm'] as const).map((c) => (
              <Chip
                key={c}
                on={(draft.connectTypes || []).includes(c)}
                onClick={() => {
                  const cur = new Set(draft.connectTypes || []);
                  if (cur.has(c)) cur.delete(c);
                  else cur.add(c);
                  setDraft({ ...draft, connectTypes: Array.from(cur) });
                }}
              >
                {c === 'fast' ? 'Fast Connect' : 'Long-term'}
              </Chip>
            ))}
          </div>
          {seat === 'worker' ? (
            <div className="flex flex-wrap gap-2">
              {WORKER_CATEGORIES.map((c) => (
                <Chip
                  key={c.key}
                  on={Boolean(draft.categories?.[c.key])}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      categories: { ...draft.categories, [c.key]: !draft.categories?.[c.key] },
                    })
                  }
                >
                  {c.title}
                </Chip>
              ))}
            </div>
          ) : (
            BUSINESS_PREF_SECTIONS.map((sec) => (
                <div key={sec.key}>
                  <div className="text-xs opacity-50 mb-2">{sec.key}</div>
                  <div className="flex flex-wrap gap-2">
                    {sec.items.map((item) => (
                      <Chip
                        key={item}
                        on={Boolean(draft.categories?.[item])}
                        onClick={() =>
                          setDraft({
                            ...draft,
                            categories: { ...draft.categories, [item]: !draft.categories?.[item] },
                          })
                        }
                      >
                        {item}
                      </Chip>
                    ))}
                  </div>
                </div>
              ))
          )}
          <textarea className={input} rows={2} placeholder="Notes" value={draft.notes || ''} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
          <button className={btn} disabled={busy} onClick={() => saveProfile()}>
            Save preferences
          </button>
        </section>
      )}

      {view === 'settings' && (
        <section className="rounded-3xl border border-white/10 p-6 space-y-3">
          <h3 className="font-semibold">Settings</h3>
          <p className="text-sm opacity-70">Switch seat without leaving TAPMATCH. Portal login stays the same.</p>
          <div className="flex gap-2">
            {(['worker', 'business'] as Seat[]).map((s) => (
              <button
                key={s}
                type="button"
                className={`${ghost} ${seat === s ? 'bg-sky-400 text-black border-sky-400' : ''}`}
                onClick={async () => {
                  await saveProfile({ seat: s });
                  setView('home');
                }}
              >
                {s === 'worker' ? 'Employee' : 'Employer'}
              </button>
            ))}
          </div>
          <button className={ghost} onClick={() => setView('prefs')}>Preferences</button>
          <button className={ghost} onClick={() => setView('edit')}>Edit profile</button>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 p-4">
      <div className="text-[10px] tracking-[2px] text-sky-400">{label.toUpperCase()}</div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function JobCard({
  job,
  onApply,
  onOpen,
  busy,
}: {
  job: Job;
  onApply: () => void;
  onOpen?: () => void;
  busy: boolean;
}) {
  const fast = job.connect === 'fast';
  return (
    <article className="rounded-2xl border border-white/10 p-5">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${fast ? 'bg-orange-400/20 text-orange-200' : 'bg-sky-400/20 text-sky-200'}`}>
          {fast ? 'Fast Connect' : 'Long-term'}
        </span>
        {job.match && <span className="text-xs text-sky-300">{job.match.matchPct}% match</span>}
        {job.location && <span className="text-xs opacity-60">{job.location}</span>}
        {job.pay && <span className="text-xs opacity-80">{job.pay}</span>}
      </div>
      <h3 className="font-semibold">{job.role}</h3>
      {job.blurb && <p className="text-sm opacity-70 mt-1">{job.blurb}</p>}
      {!!job.match?.reasons?.length && (
        <p className="text-xs opacity-50 mt-1">{job.match.reasons.join(' · ')}</p>
      )}
      <div className="flex gap-2 mt-4">
        <button type="button" disabled={busy} onClick={onApply} className={btn}>
          {fast ? 'Tap to Connect' : 'Apply'}
        </button>
        {onOpen && (
          <button type="button" onClick={onOpen} className={ghost}>
            Details
          </button>
        )}
      </div>
    </article>
  );
}

function ManagerList({
  apps,
  tabs,
  onStatus,
}: {
  apps: AppRow[];
  tabs: string[];
  onStatus: (id: number, status: string) => void;
}) {
  const [tab, setTab] = useState(tabs[0]);
  const list = apps.filter((a) => String(a.status || 'pending').toLowerCase() === tab);
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Chip key={t} on={tab === t} onClick={() => setTab(t)}>
            {t}
          </Chip>
        ))}
      </div>
      {list.map((a) => (
        <article key={a.id} className="rounded-2xl border border-white/10 p-5">
          <div className="font-semibold">{a.role || a.job_id}</div>
          <p className="text-sm opacity-60">{a.employer ? `@${a.employer}` : ''} {a.location} {a.pay}</p>
          <div className="flex gap-2 mt-3">
            {tab === 'pending' && (
              <button className={ghost} onClick={() => onStatus(a.id, 'cancelled')}>
                Cancel
              </button>
            )}
            {tab === 'accepted' && (
              <button className={btn} onClick={() => onStatus(a.id, 'inprogress')}>
                Start shift
              </button>
            )}
            {tab === 'inprogress' && (
              <button className={btn} onClick={() => onStatus(a.id, 'completed')}>
                Complete
              </button>
            )}
          </div>
        </article>
      ))}
      {!list.length && <p className="text-sm opacity-60">Nothing in {tab}.</p>}
    </section>
  );
}
