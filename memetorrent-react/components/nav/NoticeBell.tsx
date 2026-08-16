'use client';

import { useEffect, useState } from 'react';

type Item = {
  id: string;
  kind: string;
  title: string;
  href: string | null;
  from_email: string | null;
  from_username: string | null;
};

export default function NoticeBell() {
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);

  const load = () => {
    fetch('/api/chat/notices', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setItems(d.items || []);
      })
      .catch(() => {});
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 2000);
    const onFriends = () => load();
    window.addEventListener('mt-friends', onFriends);
    return () => {
      clearInterval(t);
      window.removeEventListener('mt-friends', onFriends);
    };
  }, []);

  const mark = async (id: string) => {
    await fetch('/api/chat/notices', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setItems((list) => list.filter((x) => x.id !== id));
  };

  const answer = async (fromEmail: string, action: 'accept' | 'decline', id: string) => {
    await fetch('/api/chat/friends', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: fromEmail, action }),
    });
    await mark(id);
    window.dispatchEvent(new Event('mt-friends'));
    load();
  };

  const count = items.length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative p-1 text-sm opacity-90 hover:opacity-100"
        title="Notifications"
        aria-label="Notifications"
      >
        <span className="text-base leading-none">🔔</span>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-emerald-400 text-black text-[10px] font-bold flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-[80] w-72 max-h-80 overflow-y-auto rounded-2xl border border-white/15 bg-[#12141c] shadow-2xl p-2 text-xs">
          {!items.length && <div className="px-2 py-3 opacity-50">No new notifications</div>}
          {items.map((it) => (
            <div key={it.id} className="px-2 py-2 border-b border-white/10 last:border-0">
              <div className="mb-1">{it.title}</div>
              {it.kind === 'friend_request' && it.from_email ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="text-emerald-400 font-semibold"
                    onClick={() => answer(it.from_email!, 'accept', it.id)}
                  >
                    Accept
                  </button>
                  <button type="button" className="opacity-50" onClick={() => answer(it.from_email!, 'decline', it.id)}>
                    Decline
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  {it.href && (
                    <a href={it.href} className="text-emerald-400" onClick={() => mark(it.id)}>
                      Open
                    </a>
                  )}
                  <button type="button" className="opacity-50" onClick={() => mark(it.id)}>
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
