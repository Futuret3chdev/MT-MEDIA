'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Signal = {
  id: number;
  room: string | null;
  from_email: string;
  to_email: string;
  kind: string;
  payload: string;
  from_username?: string | null;
  created_at?: string;
};

type Phase = 'idle' | 'outgoing' | 'incoming' | 'live';

export type CallTarget = { username: string; email?: string; n: number };

const ICE = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

function label(name?: string | null) {
  const n = String(name || '')
    .trim()
    .replace(/^@+/, '');
  if (!n || n === '@') return '';
  return `@${n}`;
}

export type CallView = 'dock' | 'overlay';

export default function CallDock({
  me,
  room,
  start,
  view,
  onView,
  recent,
}: {
  me: string;
  room: string;
  start: CallTarget | null;
  view: CallView;
  onView: (v: CallView) => void;
  recent?: { username: string; body: string; kind?: string }[];
}) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [peerName, setPeerName] = useState('');
  const [peerEmail, setPeerEmail] = useState('');
  const [muted, setMuted] = useState(false);
  const [cam, setCam] = useState(true);
  const [err, setErr] = useState('');
  const [line, setLine] = useState('');
  const since = useRef(0);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localRef = useRef<HTMLVideoElement | null>(null);
  const remoteRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef('');
  const pendingOffer = useRef<RTCSessionDescriptionInit | null>(null);

  const send = async (to: string, kind: string, payload: unknown = {}) => {
    await fetch('/api/chat/call', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, kind, payload, room }),
    });
  };

  const kill = useCallback(async (notify = true) => {
    const to = peerRef.current;
    pcRef.current?.getSenders().forEach((s) => s.track?.stop());
    pcRef.current?.close();
    pcRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (notify && to) await send(to, 'hangup');
    peerRef.current = '';
    setPhase('idle');
    setPeerEmail('');
    setPeerName('');
    setErr('');
    onView('dock');
  }, [room, onView]);

  const attach = (pc: RTCPeerConnection) => {
    pc.onicecandidate = (e) => {
      if (e.candidate && peerRef.current) send(peerRef.current, 'ice', e.candidate);
    };
    pc.ontrack = (e) => {
      if (remoteRef.current) remoteRef.current.srcObject = e.streams[0];
    };
  };

  const media = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    streamRef.current = stream;
    if (localRef.current) localRef.current.srcObject = stream;
    return stream;
  };

  const startCall = async (username: string, email?: string) => {
    const who = String(email || username || '').trim();
    if (!who || who === '@') return;
    setErr('');
    setPeerName(username || who);
    setPeerEmail(who);
    peerRef.current = who;
    setPhase('outgoing');
    try {
      const stream = await media();
      const pc = new RTCPeerConnection(ICE);
      pcRef.current = pc;
      attach(pc);
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      await send(email || username, 'invite', { username: me, video: true });
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await send(email || username, 'offer', offer);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Mic / camera blocked');
      await kill(false);
    }
  };

  const accept = async () => {
    setErr('');
    try {
      const stream = await media();
      const pc = new RTCPeerConnection(ICE);
      pcRef.current = pc;
      attach(pc);
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      if (pendingOffer.current) {
        await pc.setRemoteDescription(pendingOffer.current);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        if (peerRef.current) await send(peerRef.current, 'answer', answer);
        pendingOffer.current = null;
      }
      setPhase('live');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Mic / camera blocked');
      if (peerRef.current) await send(peerRef.current, 'reject');
      await kill(false);
    }
  };

  useEffect(() => {
    if (!start) return;
    const who = String(start.email || start.username || '').trim();
    if (!who || who === '@') return;
    startCall(start.username, start.email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start?.n]);

  useEffect(() => {
    const t = setInterval(async () => {
      const d = await fetch(`/api/chat/call?since=${since.current}`, { credentials: 'include' }).then((r) => r.json());
      if (!d.ok) return;
      for (const s of (d.signals || []) as Signal[]) {
        since.current = Math.max(since.current, Number(s.id));
        if (s.from_email === me) continue;
        let payload: Record<string, unknown> = {};
        try {
          payload = s.payload ? JSON.parse(s.payload) : {};
        } catch {
          payload = {};
        }
        if (s.kind === 'invite' && phase === 'idle') {
          const age = Date.now() - new Date(s.created_at || 0).getTime();
          if (!s.from_email || age > 90_000) continue;
          peerRef.current = s.from_email;
          setPeerEmail(s.from_email);
          setPeerName(s.from_username || s.from_email);
          setPhase('incoming');
        } else if (s.kind === 'offer') {
          if (!s.from_email) continue;
          pendingOffer.current = payload as unknown as RTCSessionDescriptionInit;
          if (phase === 'idle') {
            peerRef.current = s.from_email;
            setPeerEmail(s.from_email);
            setPeerName(s.from_username || s.from_email);
            setPhase('incoming');
            continue;
          }
          const pc = pcRef.current;
          if (!pc || phase !== 'incoming') continue;
          await pc.setRemoteDescription(payload as unknown as RTCSessionDescriptionInit);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await send(s.from_email, 'answer', answer);
          setPhase('live');
        } else if (s.kind === 'answer') {
          const pc = pcRef.current;
          if (!pc || phase !== 'outgoing') continue;
          if (!pc.currentRemoteDescription) {
            await pc.setRemoteDescription(payload as unknown as RTCSessionDescriptionInit);
          }
          setPhase('live');
        } else if (s.kind === 'ice') {
          try {
            await pcRef.current?.addIceCandidate(payload as RTCIceCandidateInit);
          } catch {
            /* late ice */
          }
        } else if (s.kind === 'hangup' || s.kind === 'reject') {
          await kill(false);
        }
      }
    }, 2000);
    return () => clearInterval(t);
  }, [me, phase, kill]);

  useEffect(() => {
    if (phase !== 'idle' && !label(peerName) && !peerEmail.includes('@')) {
      kill(false);
    }
  }, [phase, peerName, peerEmail, kill]);

  useEffect(() => {
    const s = streamRef.current;
    if (!s) return;
    s.getAudioTracks().forEach((t) => {
      t.enabled = !muted;
    });
    s.getVideoTracks().forEach((t) => {
      t.enabled = cam;
    });
  }, [muted, cam]);

  const who = label(peerName) || label(peerEmail.split('@')[0]);
  if (phase === 'idle' || !who) return null;

  const controls = (
    <div className="flex flex-wrap gap-1.5 text-[11px]">
      {phase === 'incoming' && (
        <button type="button" className="px-2 py-1 rounded-lg bg-emerald-400 text-black" onClick={accept}>
          Accept
        </button>
      )}
      <button type="button" className="px-2 py-1 rounded-lg border border-white/15" onClick={() => setMuted((m) => !m)}>
        {muted ? 'Unmute' : 'Mute'}
      </button>
      <button type="button" className="px-2 py-1 rounded-lg border border-white/15" onClick={() => setCam((c) => !c)}>
        {cam ? 'Cam off' : 'Cam on'}
      </button>
      <button
        type="button"
        className={`px-2 py-1 rounded-lg border ${view === 'overlay' ? 'border-emerald-400 text-emerald-400' : 'border-white/15'}`}
        onClick={() => onView(view === 'overlay' ? 'dock' : 'overlay')}
      >
        {view === 'overlay' ? 'Back to chat' : 'Full screen'}
      </button>
      <button type="button" className="px-2 py-1 rounded-lg border border-red-400/40 text-red-300" onClick={() => kill(true)}>
        Hang up
      </button>
    </div>
  );

  const sendLine = async () => {
    const t = line.trim();
    if (!t) return;
    setLine('');
    await fetch('/api/chat', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room, text: t }),
    });
  };

  const videosFill = (
    <>
      <video ref={remoteRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover bg-black" />
      <video
        ref={localRef}
        muted
        autoPlay
        playsInline
        className="absolute bottom-3 right-3 w-20 h-28 rounded-xl bg-black object-cover border border-white/20"
      />
    </>
  );

  if (view === 'overlay') {
    return (
      <div className="fixed inset-0 z-40 h-[100dvh] max-h-[100dvh] w-full bg-black">
        {videosFill}
        <div className="absolute top-2 left-2 right-2 flex flex-wrap items-center gap-2">
          <span className="text-xs text-emerald-400">
            {phase === 'outgoing' && `Calling ${who}…`}
            {phase === 'incoming' && `${who} is calling`}
            {phase === 'live' && `Live ${who}`}
          </span>
          {controls}
        </div>
        <div className="absolute inset-x-0 bottom-0 flex flex-col bg-gradient-to-t from-black/90 to-transparent pt-8">
          <div className="px-3 pb-1 text-xs space-y-0.5 max-h-[7.5rem] overflow-y-auto">
            {(recent || [])
              .filter((m) => m.kind !== 'fun' && m.kind !== 'react')
              .slice(-4)
              .map((m, i) => (
                <div key={i} className="text-white/90 truncate">
                  <span className="text-emerald-400">{m.username}</span> {m.body.slice(0, 120)}
                </div>
              ))}
          </div>
          <form
            className="flex gap-2 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              sendLine();
            }}
          >
            <input
              value={line}
              onChange={(e) => setLine(e.target.value)}
              placeholder="Text on the video"
              className="flex-1 px-3 py-2 rounded-xl bg-black/50 border border-white/20 text-sm"
            />
            <button type="submit" className="text-sm text-black bg-emerald-400 px-3 rounded-xl font-semibold">
              Send
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="shrink-0 border-t border-white/10 bg-[#12141c] px-2 py-1.5">
      <div className="flex items-center gap-2">
        <video ref={remoteRef} autoPlay playsInline className="w-12 h-9 rounded-md bg-black object-cover" />
        <video ref={localRef} muted autoPlay playsInline className="w-12 h-9 rounded-md bg-black object-cover" />
        <div className="text-xs text-emerald-400 flex-1 truncate">
          {phase === 'outgoing' && `Calling ${who}…`}
          {phase === 'incoming' && `${who} is calling`}
          {phase === 'live' && `Live ${who}`}
        </div>
        {controls}
      </div>
      {err && <div className="text-[11px] text-red-300 mt-1">{err}</div>}
    </div>
  );
}
