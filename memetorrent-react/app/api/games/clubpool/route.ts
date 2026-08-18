import { NextRequest } from 'next/server';
import { getUserDb } from '@/lib/rewards-db';
import { readSessionToken, userBySession } from '@/lib/portal-auth';
import { sendMtFromTreasury, treasuryConfigured } from '@/lib/treasury-send';

async function ensure(conn: Awaited<ReturnType<typeof getUserDb>>) {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS mt_clubpool_tables (
      code VARCHAR(32) NOT NULL PRIMARY KEY,
      host_email VARCHAR(190) NULL,
      host_name VARCHAR(80) NOT NULL,
      stake INT NOT NULL DEFAULT 0,
      mode VARCHAR(16) NOT NULL DEFAULT '8ball',
      listed TINYINT NOT NULL DEFAULT 1,
      friends_only TINYINT NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS mt_clubpool_locks (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(32) NOT NULL,
      email VARCHAR(190) NULL,
      username VARCHAR(80) NOT NULL,
      wallet VARCHAR(64) NOT NULL,
      amount INT NOT NULL,
      sig VARCHAR(120) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY seat (code, wallet)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

export async function GET(request: NextRequest) {
  const names = request.nextUrl.searchParams.get('names');
  const conn = await getUserDb();
  try {
    await ensure(conn);
    if (names) {
      const list = names
        .split(',')
        .map((n) => n.trim())
        .filter(Boolean)
        .slice(0, 8);
      if (!list.length) return Response.json({ ok: true, avatars: [] });
      const ph = list.map(() => '?').join(',');
      const [rows] = await conn.execute(
        `SELECT username, avatar_url FROM portal_users WHERE username IN (${ph})`,
        list
      );
      return Response.json({ ok: true, avatars: rows });
    }
    const me = await userBySession(await readSessionToken());
    const [tables] = await conn.execute(
      `SELECT code, host_name, stake, mode, listed, friends_only, created_at
       FROM mt_clubpool_tables
       WHERE listed = 1
       ORDER BY created_at DESC
       LIMIT 40`
    );
    return Response.json({
      ok: true,
      tables,
      treasury: await treasuryConfigured(),
      me: me ? { username: me.username, avatar_url: me.avatar_url } : null,
    });
  } finally {
    await conn.end();
  }
}

export async function POST(request: NextRequest) {
  const me = await userBySession(await readSessionToken());
  let body: {
    action?: string;
    code?: string;
    stake?: number;
    mode?: string;
    listed?: boolean;
    friendsOnly?: boolean;
    wallet?: string;
    sig?: string;
    winnerWallet?: string;
    hostName?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const action = String(body.action || '');
  const code = String(body.code || '').trim().slice(0, 32);
  const conn = await getUserDb();
  try {
    await ensure(conn);
    if (action === 'open') {
      if (!code) return Response.json({ ok: false, error: 'Missing table' }, { status: 400 });
      const stake = Math.max(0, Math.min(25, Math.floor(Number(body.stake) || 0)));
      const mode = ['8ball', '9ball', 'race'].includes(String(body.mode)) ? String(body.mode) : '8ball';
      await conn.execute(
        `INSERT INTO mt_clubpool_tables (code, host_email, host_name, stake, mode, listed, friends_only)
         VALUES (?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE stake = VALUES(stake), mode = VALUES(mode), listed = VALUES(listed), friends_only = VALUES(friends_only)`,
        [
          code,
          me?.email || null,
          me?.username || String(body.hostName || 'Host').slice(0, 80),
          stake,
          mode,
          body.listed === false ? 0 : 1,
          body.friendsOnly ? 1 : 0,
        ]
      );
      return Response.json({ ok: true, code, stake, mode });
    }
    if (action === 'lock') {
      if (!code || !body.wallet) return Response.json({ ok: false, error: 'Need table and wallet' }, { status: 400 });
      const amount = Math.max(1, Math.min(25, Math.floor(Number(body.stake) || 0)));
      await conn.execute(
        `INSERT INTO mt_clubpool_locks (code, email, username, wallet, amount, sig)
         VALUES (?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE amount = VALUES(amount), sig = VALUES(sig)`,
        [
          code,
          me?.email || null,
          me?.username || 'Player',
          String(body.wallet).slice(0, 64),
          amount,
          String(body.sig || '').slice(0, 120) || null,
        ]
      );
      return Response.json({ ok: true, locked: amount });
    }
    if (action === 'payout') {
      if (!code || !body.winnerWallet) {
        return Response.json({ ok: false, error: 'Need winner wallet' }, { status: 400 });
      }
      const [locks] = await conn.execute('SELECT wallet, amount FROM mt_clubpool_locks WHERE code = ?', [code]);
      const seats = locks as { wallet: string; amount: number }[];
      if (seats.length < 2) {
        return Response.json({ ok: false, error: 'Both seats must lock $MT first' }, { status: 400 });
      }
      const pot = seats.reduce((n, s) => n + Number(s.amount || 0), 0);
      if (!(await treasuryConfigured())) {
        return Response.json({ ok: true, paid: false, pot, note: 'Pot recorded. Treasury payout when configured.' });
      }
      try {
        const sent = await sendMtFromTreasury(String(body.winnerWallet), pot);
        return Response.json({ ok: true, paid: true, pot, signature: sent.signature });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Payout failed';
        return Response.json({ ok: true, paid: false, pot, error: message });
      }
    }
    return Response.json({ ok: false, error: 'Unknown action' }, { status: 400 });
  } finally {
    await conn.end();
  }
}
