import { NextRequest } from 'next/server';
import { getUserDb } from '@/lib/rewards-db';
import { readSessionToken, userBySession } from '@/lib/portal-auth';

async function ensure(conn: Awaited<ReturnType<typeof getUserDb>>) {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS mt_world_presence (
      sid VARCHAR(64) NOT NULL PRIMARY KEY,
      username VARCHAR(80) NOT NULL,
      x FLOAT NOT NULL DEFAULT 0,
      z FLOAT NOT NULL DEFAULT 0,
      yaw FLOAT NOT NULL DEFAULT 0,
      body VARCHAR(16) NOT NULL DEFAULT '19d37e',
      shirt VARCHAR(16) NOT NULL DEFAULT '1a3d2a',
      hat TINYINT NOT NULL DEFAULT 0,
      acc VARCHAR(16) NOT NULL DEFAULT 'none',
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS mt_world_bars (
      id VARCHAR(32) NOT NULL PRIMARY KEY,
      owner VARCHAR(80) NOT NULL,
      name VARCHAR(80) NOT NULL,
      x FLOAT NOT NULL,
      z FLOAT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS mt_world_houses (
      id VARCHAR(32) NOT NULL PRIMARY KEY,
      owner VARCHAR(80) NOT NULL,
      title VARCHAR(80) NOT NULL,
      x FLOAT NOT NULL,
      z FLOAT NOT NULL,
      kind VARCHAR(12) NOT NULL DEFAULT 'rent',
      mates TINYINT NOT NULL DEFAULT 1,
      seeking TINYINT NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS mt_world_social (
      a VARCHAR(80) NOT NULL,
      b VARCHAR(80) NOT NULL,
      kind VARCHAR(12) NOT NULL,
      status VARCHAR(12) NOT NULL DEFAULT 'pending',
      PRIMARY KEY (a, b, kind)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS mt_world_stands (
      slot TINYINT NOT NULL PRIMARY KEY,
      owner VARCHAR(80) NOT NULL,
      title VARCHAR(80) NOT NULL,
      pitch VARCHAR(160) NOT NULL DEFAULT '',
      url VARCHAR(240) NOT NULL DEFAULT '',
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS mt_world_party (
      id VARCHAR(32) NOT NULL PRIMARY KEY,
      host VARCHAR(80) NOT NULL,
      guest VARCHAR(80) NOT NULL,
      game VARCHAR(16) NOT NULL DEFAULT 'rps',
      state VARCHAR(40) NOT NULL DEFAULT 'invite',
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

function pair(a: string, b: string) {
  return a < b ? [a, b] : [b, a];
}

export async function GET(request: NextRequest) {
  const meName = request.nextUrl.searchParams.get('me') || '';
  const conn = await getUserDb();
  try {
    await ensure(conn);
    await conn.execute('DELETE FROM mt_world_presence WHERE updated_at < (NOW() - INTERVAL 20 SECOND)');
    await conn.execute('DELETE FROM mt_world_party WHERE updated_at < (NOW() - INTERVAL 3 MINUTE)');
    const [players] = await conn.execute(
      'SELECT sid, username, x, z, yaw, body, shirt, hat, acc FROM mt_world_presence ORDER BY updated_at DESC LIMIT 40'
    );
    const [bars] = await conn.execute('SELECT id, owner, name, x, z FROM mt_world_bars ORDER BY created_at DESC LIMIT 30');
    const [houses] = await conn.execute(
      'SELECT id, owner, title, x, z, kind, mates, seeking FROM mt_world_houses ORDER BY created_at DESC LIMIT 40'
    );
    const [stands] = await conn.execute(
      'SELECT slot, owner, title, pitch, url FROM mt_world_stands ORDER BY slot ASC'
    );
    let social: unknown[] = [];
    let parties: unknown[] = [];
    if (meName) {
      const [s] = await conn.execute(
        'SELECT a, b, kind, status FROM mt_world_social WHERE a = ? OR b = ?',
        [meName, meName]
      );
      social = s as unknown[];
      const [p] = await conn.execute(
        'SELECT id, host, guest, game, state FROM mt_world_party WHERE host = ? OR guest = ?',
        [meName, meName]
      );
      parties = p as unknown[];
    }
    return Response.json({ ok: true, players, bars, houses, stands, social, parties });
  } finally {
    await conn.end();
  }
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const action = String(body.action || 'here');
  const conn = await getUserDb();
  try {
    await ensure(conn);
    const me = await userBySession(await readSessionToken());
    const name = (me?.username || String(body.name || 'Guest')).slice(0, 80);

    if (action === 'here') {
      const sid = String(body.sid || '').slice(0, 64);
      if (!sid) return Response.json({ ok: false, error: 'Need sid' }, { status: 400 });
      await conn.execute(
        `INSERT INTO mt_world_presence (sid, username, x, z, yaw, body, shirt, hat, acc)
         VALUES (?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE username=VALUES(username), x=VALUES(x), z=VALUES(z), yaw=VALUES(yaw),
           body=VALUES(body), shirt=VALUES(shirt), hat=VALUES(hat), acc=VALUES(acc)`,
        [
          sid,
          name,
          Number(body.x) || 0,
          Number(body.z) || 0,
          Number(body.yaw) || 0,
          String(body.body || '19d37e').replace(/[^0-9a-f]/gi, '').slice(0, 16) || '19d37e',
          String(body.shirt || '1a3d2a').replace(/[^0-9a-f]/gi, '').slice(0, 16) || '1a3d2a',
          body.hat ? 1 : 0,
          String(body.acc || 'none').slice(0, 16),
        ]
      );
      return Response.json({ ok: true, name });
    }

    if (action === 'bar') {
      const id = String(body.id || `bar-${Date.now()}`).slice(0, 32);
      await conn.execute(
        `INSERT INTO mt_world_bars (id, owner, name, x, z) VALUES (?,?,?,?,?)
         ON DUPLICATE KEY UPDATE name=VALUES(name), x=VALUES(x), z=VALUES(z)`,
        [id, name, String(body.barName || `${name}'s Bar`).slice(0, 80), Number(body.x) || 0, Number(body.z) || 0]
      );
      return Response.json({ ok: true, id });
    }

    if (action === 'house') {
      const id = String(body.id || `home-${Date.now()}`).slice(0, 32);
      const kind = body.kind === 'buy' ? 'buy' : 'rent';
      await conn.execute(
        `INSERT INTO mt_world_houses (id, owner, title, x, z, kind, mates, seeking)
         VALUES (?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE title=VALUES(title), seeking=VALUES(seeking), mates=VALUES(mates)`,
        [
          id,
          name,
          String(body.title || `${name}'s place`).slice(0, 80),
          Number(body.x) || 0,
          Number(body.z) || 0,
          kind,
          Math.max(1, Math.min(4, Number(body.mates) || 1)),
          body.seeking ? 1 : 0,
        ]
      );
      return Response.json({ ok: true, id });
    }

    if (action === 'social') {
      const other = String(body.other || '').slice(0, 80);
      const kind = body.kind === 'love' ? 'love' : 'friend';
      if (!other || other === name) return Response.json({ ok: false, error: 'Need another player' }, { status: 400 });
      const [lo, hi] = pair(name, other);
      const [rows] = await conn.execute(
        'SELECT status FROM mt_world_social WHERE a = ? AND b = ? AND kind = ?',
        [lo, hi, kind]
      );
      const cur = (rows as { status: string }[])[0];
      if (!cur) {
        await conn.execute(
          'INSERT INTO mt_world_social (a, b, kind, status) VALUES (?,?,?,?)',
          [lo, hi, kind, 'pending']
        );
        return Response.json({ ok: true, status: 'pending' });
      }
      if (cur.status === 'pending') {
        await conn.execute(
          'UPDATE mt_world_social SET status = ? WHERE a = ? AND b = ? AND kind = ?',
          ['ok', lo, hi, kind]
        );
        return Response.json({ ok: true, status: 'ok' });
      }
      return Response.json({ ok: true, status: cur.status });
    }

    if (action === 'stand') {
      const slot = Math.max(0, Math.min(7, Math.floor(Number(body.slot))));
      await conn.execute(
        `INSERT INTO mt_world_stands (slot, owner, title, pitch, url) VALUES (?,?,?,?,?)
         ON DUPLICATE KEY UPDATE owner=VALUES(owner), title=VALUES(title), pitch=VALUES(pitch), url=VALUES(url)`,
        [
          slot,
          name,
          String(body.title || `${name}'s stand`).slice(0, 80),
          String(body.pitch || '').slice(0, 160),
          String(body.url || '').slice(0, 240),
        ]
      );
      return Response.json({ ok: true, slot });
    }

    if (action === 'party') {
      const other = String(body.other || '').slice(0, 80);
      const id = String(body.id || `pty-${Date.now()}`).slice(0, 32);
      const state = String(body.state || 'invite').slice(0, 40);
      if (!other) return Response.json({ ok: false, error: 'Need a guest' }, { status: 400 });
      await conn.execute(
        `INSERT INTO mt_world_party (id, host, guest, game, state) VALUES (?,?,?,?,?)
         ON DUPLICATE KEY UPDATE state=VALUES(state)`,
        [id, name, other, 'rps', state]
      );
      return Response.json({ ok: true, id, state });
    }

    return Response.json({ ok: false, error: 'Unknown action' }, { status: 400 });
  } finally {
    await conn.end();
  }
}
