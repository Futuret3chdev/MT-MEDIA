'use client';

import { useCallback, useEffect, useState } from 'react';

export default function PlayStaffMenu({ gameId, gameName }: { gameId: string; gameName: string }) {
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState(false);
  const [staff, setStaff] = useState(false);
  const [pin, setPin] = useState('');
  const [pw, setPw] = useState('');
  const [note, setNote] = useState('');
  const [prize, setPrize] = useState('');
  const [awardName, setAwardName] = useState('');
  const [awardAmt, setAwardAmt] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/games/staff?game=${encodeURIComponent(gameId)}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (!d?.ok) return;
        setStaff(!!d.staff);
        if (typeof d.note === 'string') setNote(d.note);
        if (typeof d.prize === 'string') setPrize(d.prize);
      })
      .catch(() => {});
  }, [gameId]);

  useEffect(() => {
    load();
  }, [load]);

  async function call(body: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await fetch('/api/games/staff', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!d.ok) {
        setMsg(d.error || 'Failed');
        return d;
      }
      setMsg('');
      return d;
    } catch {
      setMsg('Network error');
      return { ok: false };
    } finally {
      setBusy(false);
    }
  }

  async function login(e: React.FormEvent) {
    e.preventDefault();
    const d = await call({ action: 'login', pin, password: pw });
    if (d?.ok) {
      setStaff(true);
      setPw('');
      setPin('');
      setPanel(true);
      load();
    }
  }

  async function resave() {
    const d = await call({ action: 'save', game: gameId, note, prize });
    if (d?.ok) setMsg('Saved');
  }

  async function award(e: React.FormEvent) {
    e.preventDefault();
    const d = await call({
      action: 'award',
      name: awardName,
      amount: Number(awardAmt),
      note: prize || `${gameName} award`,
    });
    if (d?.ok) {
      setMsg(`Awarded ${d.added ?? awardAmt} $MT`);
      setAwardAmt('');
    }
  }

  function hide() {
    setOpen(false);
    setPanel(false);
  }

  function edit() {
    setOpen(false);
    setPanel(true);
  }

  const btn: React.CSSProperties = {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    background: 'transparent',
    color: '#fff',
    border: 0,
    padding: '8px 12px',
    fontSize: 12,
    cursor: 'pointer',
  };

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: open || panel ? '#04140c' : '#fbbf24',
          background: open || panel ? '#fbbf24' : 'rgba(251,191,36,.12)',
          border: '1px solid rgba(251,191,36,.45)',
          borderRadius: 999,
          padding: '6px 14px',
          cursor: 'pointer',
        }}
      >
        Staff
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: '50%',
            transform: 'translateX(-50%)',
            minWidth: 148,
            background: '#111113',
            border: '1px solid rgba(255,255,255,.16)',
            borderRadius: 10,
            zIndex: 40,
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,.45)',
          }}
        >
          <button type="button" style={btn} onClick={edit}>
            Edit
          </button>
          <button
            type="button"
            style={btn}
            onClick={() => {
              if (!staff) edit();
              else {
                resave();
                setOpen(false);
              }
            }}
            disabled={busy}
          >
            Resave
          </button>
          <button type="button" style={btn} onClick={hide}>
            Hide
          </button>
        </div>
      )}

      {panel && (
        <div
          style={{
            position: 'fixed',
            top: 44,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'min(360px, calc(100vw - 16px))',
            zIndex: 39,
            background: 'rgba(9,9,11,.97)',
            border: '1px solid rgba(255,255,255,.14)',
            borderRadius: 12,
            padding: 12,
            color: '#fff',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong style={{ fontSize: 12, color: '#fbbf24' }}>{gameName} desk</strong>
            <button type="button" onClick={hide} style={{ background: 'none', border: 0, color: '#aaa', cursor: 'pointer', fontSize: 12 }}>
              Hide
            </button>
          </div>

          {!staff ? (
            <form onSubmit={login} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p style={{ fontSize: 11, opacity: 0.7, margin: 0 }}>Staff pin + password (same as the nights).</p>
              <input value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Pin" style={inp} />
              <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password" style={inp} />
              <button type="submit" disabled={busy} style={saveBtn}>
                Open
              </button>
            </form>
          ) : (
            <>
              <label style={lab}>Note</label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} style={{ ...inp, resize: 'vertical' }} />
              <label style={lab}>Prize</label>
              <input value={prize} onChange={(e) => setPrize(e.target.value)} placeholder="Prize line" style={inp} />
              <div style={{ display: 'flex', gap: 6, margin: '8px 0' }}>
                <button type="button" onClick={resave} disabled={busy} style={saveBtn}>
                  Resave
                </button>
                <button type="button" onClick={hide} style={{ ...saveBtn, background: 'transparent', color: '#ccc', border: '1px solid #444' }}>
                  Hide
                </button>
              </div>
              <form onSubmit={award} style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid #333', paddingTop: 8 }}>
                <label style={lab}>Award $MT</label>
                <input value={awardName} onChange={(e) => setAwardName(e.target.value)} placeholder="Username" style={inp} />
                <input value={awardAmt} onChange={(e) => setAwardAmt(e.target.value)} placeholder="Amount" type="number" min="0" style={inp} />
                <button type="submit" disabled={busy} style={saveBtn}>
                  Drop on Claim
                </button>
              </form>
              <a href="https://testers.futuret3ch.com.au/" style={{ display: 'block', marginTop: 8, fontSize: 11, color: '#fbbf24' }}>
                Testers desk
              </a>
            </>
          )}
          {msg && <p style={{ fontSize: 11, opacity: 0.75, margin: '6px 0 0' }}>{msg}</p>}
        </div>
      )}
    </div>
  );
}

const inp: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,.06)',
  border: '1px solid rgba(255,255,255,.14)',
  borderRadius: 8,
  color: '#fff',
  padding: '7px 9px',
  fontSize: 12,
  boxSizing: 'border-box',
};

const lab: React.CSSProperties = { fontSize: 10, opacity: 0.55, textTransform: 'uppercase', letterSpacing: 0.6 };

const saveBtn: React.CSSProperties = {
  flex: 1,
  background: '#19d37e',
  color: '#04140c',
  border: 0,
  borderRadius: 999,
  fontWeight: 800,
  fontSize: 12,
  padding: '7px 12px',
  cursor: 'pointer',
};
