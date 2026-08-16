'use client';

import { useEffect, useState } from 'react';

export type RoomExtra = {
  slug: string;
  name: string;
  kind: string;
  owner_email?: string | null;
  topic?: string | null;
  background?: string | null;
  music_url?: string | null;
  show_chart?: boolean;
  collab_note?: string | null;
  invite_code?: string | null;
  media_playing?: boolean;
  media_started?: string | null;
  my_role?: 'owner' | 'admin' | 'mod' | 'member' | null;
};

const BACKGROUNDS = [
  { id: '', label: 'Default' },
  { id: 'linear-gradient(180deg,#052e1a 0%,#0b0d12 70%)', label: 'Emerald' },
  { id: 'linear-gradient(180deg,#1a1033 0%,#0b0d12 70%)', label: 'Violet' },
  { id: 'linear-gradient(180deg,#1a0a0a 0%,#0b0d12 70%)', label: 'Ember' },
  { id: 'linear-gradient(180deg,#0a1a2a 0%,#0b0d12 70%)', label: 'Night' },
];

export default function RoomStudio({
  room,
  extra,
  isOwner,
  canEdit,
  vaultSlug,
  onClose,
  onSaved,
  onCancelled,
}: {
  room: string;
  extra: RoomExtra;
  isOwner: boolean;
  canEdit: boolean;
  vaultSlug?: string;
  onClose: () => void;
  onSaved: (c: RoomExtra) => void;
  onCancelled?: () => void;
}) {
  const [name, setName] = useState(extra.name || '');
  const [kind, setKind] = useState(extra.kind === 'secret' ? 'private' : extra.kind || 'public');
  const [topic, setTopic] = useState(extra.topic || '');
  const [background, setBackground] = useState(extra.background || '');
  const [music, setMusic] = useState(extra.music_url || '');
  const [chart, setChart] = useState(!!extra.show_chart);
  const [note, setNote] = useState(extra.collab_note || '');
  const [invite, setInvite] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [staff, setStaff] = useState<{ email: string; role: string; username: string | null }[]>([]);
  const [staffUser, setStaffUser] = useState('');
  const [staffRole, setStaffRole] = useState<'admin' | 'mod'>('mod');

  const save = async (patch: Record<string, unknown>) => {
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch('/api/chat/channels', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: room, ...patch }),
      });
      const d = await res.json();
      if (!d.ok) {
        setMsg(d.error || 'Could not save');
        return;
      }
      onSaved(d.channel);
      setMsg('Saved');
    } finally {
      setBusy(false);
    }
  };

  const canCancel =
    isOwner && extra.kind !== 'dm' && extra.kind !== 'vault' && !['trades', 'signals', 'otc', 'general', 'support'].includes(room);

  const setImageBg = async (file: File) => {
    setBusy(true);
    setMsg('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const up = await fetch('/api/chat/media', { method: 'POST', credentials: 'include', body: fd }).then((r) =>
        r.json()
      );
      if (!up.ok) {
        setMsg(up.error || 'Upload failed');
        return;
      }
      setBackground(up.url);
      await save({ background: up.url });
    } finally {
      setBusy(false);
    }
  };

  const cancelRoom = async () => {
    if (!canCancel) return;
    if (!window.confirm(`Cancel #${extra.name}? Messages in this room are removed.`)) return;
    setBusy(true);
    const res = await fetch(`/api/chat/channels?slug=${encodeURIComponent(room)}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    const d = await res.json();
    setBusy(false);
    if (!d.ok) {
      setMsg(d.error || 'Could not cancel');
      return;
    }
    onCancelled?.();
  };

  const loadStaff = () => {
    fetch(`/api/chat/staff?room=${encodeURIComponent(room)}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => d.ok && setStaff(d.staff || []))
      .catch(() => {});
  };

  useEffect(() => {
    if (canEdit) loadStaff();
  }, [room, canEdit]);

  const addStaff = async () => {
    setMsg('');
    const res = await fetch('/api/chat/staff', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room, username: staffUser, role: staffRole }),
    });
    const d = await res.json();
    if (!d.ok) {
      setMsg(d.error || 'Could not add staff');
      return;
    }
    setStaffUser('');
    setMsg(`${d.username || d.email} is now ${d.role}`);
    loadStaff();
  };

  const dropStaff = async (email: string) => {
    await fetch('/api/chat/staff', {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room, email }),
    });
    loadStaff();
  };

  const mintInvite = async () => {
    const res = await fetch('/api/chat/invite', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room }),
    });
    const d = await res.json();
    if (!d.ok) {
      setMsg(d.error || 'Could not make invite');
      return;
    }
    const url = `${window.location.origin}${d.path}`;
    setInvite(url);
    try {
      await navigator.clipboard.writeText(url);
      setMsg('Invite copied');
    } catch {
      setMsg('Invite ready — copy it below');
    }
  };

  return (
    <div className="border-b border-white/10 bg-black/70 p-3 sm:p-4 space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Settings</div>
        <button type="button" className="opacity-60" onClick={onClose}>
          Close
        </button>
      </div>
      <p className="text-xs opacity-60">
        Vault, friends and this room live here. Invite people, switch public/private, set a photo as the background, or cancel a room you own.
      </p>
      <div className="flex flex-wrap gap-2 text-xs">
        {vaultSlug && (
          <a
            href={`/chat?room=${encodeURIComponent(vaultSlug)}`}
            className="px-3 py-1.5 rounded-full border border-emerald-400/40 text-emerald-400"
          >
            Vault
          </a>
        )}
        <a href="/portal" className="px-3 py-1.5 rounded-full border border-white/15">
          Friends
        </a>
        <a href="/chat" className="px-3 py-1.5 rounded-full border border-white/15">
          Chat
        </a>
      </div>
      {!canEdit && extra.kind !== 'vault' && extra.kind !== 'dm' && (
        <p className="text-xs text-amber-200/80">Only the host can edit this channel. Hosts can add admins and mods to help.</p>
      )}
      {(canEdit || extra.kind === 'vault' || extra.kind === 'dm') && (
      <div className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block text-xs">
          <span className="opacity-50">Name</span>
          <input
            value={name}
            disabled={!isOwner && !!extra.owner_email}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full px-2 py-1.5 rounded-lg bg-black/40 border border-white/15"
          />
        </label>
        <label className="block text-xs">
          <span className="opacity-50">Visibility</span>
          <select
            value={kind === 'vault' ? 'vault' : kind}
            disabled={kind === 'dm' || kind === 'vault' || (!isOwner && !!extra.owner_email)}
            onChange={(e) => setKind(e.target.value)}
            className="mt-1 w-full px-2 py-1.5 rounded-lg bg-black/40 border border-white/15"
          >
            <option value="public">Public — anyone can find it</option>
            <option value="private">Private — invite only</option>
            <option value="vault">Personal vault — only you</option>
          </select>
        </label>
      </div>
      <label className="block text-xs">
        <span className="opacity-50">Room text / topic</span>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="What this room is about"
          className="mt-1 w-full px-2 py-1.5 rounded-lg bg-black/40 border border-white/15"
        />
      </label>
      <div className="text-xs">
        <div className="opacity-50 mb-1">Background</div>
        <div className="flex flex-wrap gap-2">
          {BACKGROUNDS.map((b) => (
            <button
              key={b.label}
              type="button"
              onClick={() => setBackground(b.id)}
              className={`px-2 py-1 rounded-lg border text-[11px] ${
                background === b.id ? 'border-emerald-400 text-emerald-400' : 'border-white/15'
              }`}
            >
              {b.label}
            </button>
          ))}
          <label className="px-2 py-1 rounded-lg border border-white/15 cursor-pointer text-[11px]">
            Image…
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setImageBg(f);
                e.target.value = '';
              }}
            />
          </label>
        </div>
        {background && (background.startsWith('/') || background.startsWith('http')) && (
          <img src={background} alt="" className="mt-2 h-16 w-28 object-cover rounded-lg border border-white/10" />
        )}
      </div>
      <label className="block text-xs">
        <span className="opacity-50">Live music (YouTube or audio URL)</span>
        <input
          value={music}
          onChange={(e) => setMusic(e.target.value)}
          placeholder="https://youtu.be/… or uploaded audio URL"
          className="mt-1 w-full px-2 py-1.5 rounded-lg bg-black/40 border border-white/15 font-mono"
        />
      </label>
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={chart} onChange={(e) => setChart(e.target.checked)} />
        Pin MT chart in this room
      </label>
      <label className="block text-xs">
        <span className="opacity-50">Collaboration pad — shared notes</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          className="mt-1 w-full px-2 py-1.5 rounded-lg bg-black/40 border border-white/15"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            save({
              name,
              kind,
              topic,
              background,
              music_url: music,
              show_chart: chart,
              collab_note: note,
            })
          }
          className="font-semibold text-black bg-emerald-400 px-3 py-1.5 rounded-full text-xs disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Save room'}
        </button>
        {kind !== 'dm' && kind !== 'vault' && (
          <button type="button" onClick={mintInvite} className="px-3 py-1.5 rounded-full border border-white/15 text-xs">
            Invite link
          </button>
        )}
        {canCancel && (
          <button
            type="button"
            disabled={busy}
            onClick={cancelRoom}
            className="px-3 py-1.5 rounded-full border border-red-400/40 text-red-300 text-xs"
          >
            Cancel room
          </button>
        )}
      </div>
      {invite && (
        <div className="text-[11px] break-all font-mono text-emerald-400">{invite}</div>
      )}
      {msg && <div className="text-xs opacity-70">{msg}</div>}
      </div>
      )}
      {canEdit && extra.kind !== 'dm' && extra.kind !== 'vault' && (isOwner || extra.my_role === 'admin') && (
        <div className="pt-2 border-t border-white/10 space-y-2">
          <div className="text-xs font-semibold">Admins and mods</div>
          <p className="text-[11px] opacity-50">They can play/stop the room video and edit settings. You stay host.</p>
          {staff.map((s) => (
            <div key={s.email} className="flex justify-between text-xs">
              <span>
                @{s.username || s.email} · {s.role}
              </span>
              {s.role !== 'owner' && (
                <button type="button" className="opacity-50" onClick={() => dropStaff(s.email)}>
                  Remove
                </button>
              )}
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <input
              value={staffUser}
              onChange={(e) => setStaffUser(e.target.value)}
              placeholder="Username"
              className="flex-1 min-w-[120px] px-2 py-1.5 rounded-lg bg-black/40 border border-white/15 text-xs"
            />
            <select
              value={staffRole}
              onChange={(e) => setStaffRole(e.target.value as 'admin' | 'mod')}
              className="px-2 py-1.5 rounded-lg bg-black/40 border border-white/15 text-xs"
            >
              {isOwner && <option value="admin">Admin</option>}
              <option value="mod">Mod</option>
            </select>
            <button type="button" onClick={addStaff} className="text-xs text-emerald-400">
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function youtubeId(url: string) {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
  return m?.[1] || '';
}
