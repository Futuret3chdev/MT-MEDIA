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

export default function CallDock({
  me,
  room,
  start,
}: {
  me: string;
  room: string;
  start: CallTarget | null;
}) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [peerName, setPeerName] = useState('');
  const [peerEmail, setPeerEmail] = useState('');
  const [muted, setMuted] = useState(false);
  const [cam, setCam] = useState(true);
  const [err, setErr] = useState('');
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
  }, [room]);

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
          const age = Date.now() - new Date(s.created_at).getTime();
          if (!s.from_email || age > 90_000) continue;
          peerRef.current = s.from_email;
          setPeerEmail(s.from_email);
          setPeerName(s.from_username || s.from_email);
          setPhase('incoming');
        } else if (s.kind === 'offer') {
          pendingOffer.current = payload as unknown as RTCSessionDescriptionInit;
          const pc = pcRef.current;
          if (!pc) continue;
          await pc.setRemoteDescription(payload as unknown as RTCSessionDescriptionInit);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await send(s.from_email, 'answer', answer);
          setPhase('live');
        } else if (s.kind === 'answer') {
          const pc = pcRef.current;
          if (pc && !pc.currentRemoteDescription) {
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
    }, 900);
    return () => clearInterval(t);
  }, [me, phase, kill]);

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

  if (phase === 'idle') return null;

  return (
    <div className="fixed bottom-4 right-4 z-[210] w-72 rounded-2xl border border-white/15 bg-[#12141c] p-3 shadow-2xl">
      <div className="text-xs text-emerald-400 mb-2">
        {phase === 'outgoing' && `Calling @${peerName}…`}
        {phase === 'incoming' && `@${peerName} is calling`}
        {phase === 'live' && `Live with @${peerName}`}
      </div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <video ref={localRef} muted autoPlay playsInline className="w-full h-20 rounded-lg bg-black object-cover" />
        <video ref={remoteRef} autoPlay playsInline className="w-full h-20 rounded-lg bg-black object-cover" />
      </div>
      {err && <div className="text-[11px] text-red-300 mb-2">{err}</div>}
      <div className="flex flex-wrap gap-2 text-[11px]">
        {phase === 'incoming' && (
          <button type="button" className="px-2 py-1 rounded-lg bg-emerald-400 text-black" onClick={accept}>
            Accept
          </button>
        )}
        <button type="button" className="px-2 py-1 rounded-lg border border-white/15" onClick={() => setMuted((m) => !m)}>
          {muted ? 'Unmute' : 'Mute'}
        </button>
        <button type="button" className="px-2 py-1 rounded-lg border border-white/15" onClick={() => setCam((c) => !c)}>
          {cam ? 'Camera off' : 'Camera on'}
        </button>
        <button type="button" className="px-2 py-1 rounded-lg border border-red-400/40 text-red-300" onClick={() => kill(true)}>
          Hang up
        </button>
      </div>
    </div>
  );
}
