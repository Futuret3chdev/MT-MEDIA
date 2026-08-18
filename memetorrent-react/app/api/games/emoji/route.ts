import { NextRequest } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import bcrypt from 'bcryptjs';
import { getUserDb } from '@/lib/rewards-db';
import { EMOJI_PUZZLES, publicPuzzle } from '@/lib/emoji-puzzles';

const PIN = process.env.EMOJI_STAFF_PIN || '376937';
const PASS_HASH =
  process.env.EMOJI_STAFF_HASH || '$2b$10$MLq2YyrbFq.1PZ92oQ9IiezGi4LlvmQLjVSO7/RvwbvMlT4UB1zqu';
const COOKIE = 'mt_emoji_staff';
const SECRET = process.env.EMOJI_STAFF_SECRET || 'mt-emoji-staff-v1';

function staffToken() {
  return createHmac('sha256', SECRET).update('emoji-ok').digest('hex');
}

function isStaff(request: NextRequest) {
  const raw = request.cookies.get(COOKIE)?.value || '';
  const want = staffToken();
  try {
    return raw.length === want.length && timingSafeEqual(Buffer.from(raw), Buffer.from(want));
  } catch {
    return false;
  }
}

async function ensure(conn: Awaited<ReturnType<typeof getUserDb>>) {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS mt_emoji_event (
      id TINYINT NOT NULL PRIMARY KEY,
      prize VARCHAR(180) NOT NULL DEFAULT '',
      note VARCHAR(240) NOT NULL DEFAULT '',
      starts_at VARCHAR(40) NOT NULL DEFAULT '',
      live TINYINT NOT NULL DEFAULT 1,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await conn.execute(
    `INSERT IGNORE INTO mt_emoji_event (id, prize, note, starts_at, live) VALUES (1, '', 'Community emoji night', '', 1)`
  );
}

export async function GET(request: NextRequest) {
  const conn = await getUserDb();
  try {
    await ensure(conn);
    const [rows] = await conn.execute('SELECT prize, note, starts_at, live FROM mt_emoji_event WHERE id = 1');
    const ev = (rows as { prize: string; note: string; starts_at: string; live: number }[])[0];
    return Response.json({
      ok: true,
      staff: isStaff(request),
      prize: ev?.prize || '',
      note: ev?.note || '',
      starts_at: ev?.starts_at || '',
      live: ev ? ev.live === 1 : true,
      puzzles: EMOJI_PUZZLES.map(publicPuzzle),
    });
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
  const action = String(body.action || '');

  if (action === 'login') {
    const pin = String(body.pin || '');
    const password = String(body.password || '');
    const pinOk = pin === PIN;
    const passOk = await bcrypt.compare(password, PASS_HASH);
    if (!pinOk || !passOk) {
      return Response.json({ ok: false, error: 'Wrong pin or password' }, { status: 401 });
    }
    const res = Response.json({ ok: true, staff: true });
    res.headers.append(
      'Set-Cookie',
      `${COOKIE}=${staffToken()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
    );
    return res;
  }

  if (!isStaff(request)) {
    return Response.json({ ok: false, error: 'Staff only' }, { status: 401 });
  }

  if (action === 'prize') {
    const conn = await getUserDb();
    try {
      await ensure(conn);
      await conn.execute(
        'UPDATE mt_emoji_event SET prize = ?, note = ?, starts_at = ?, live = ? WHERE id = 1',
        [
          String(body.prize || '').slice(0, 180),
          String(body.note || '').slice(0, 240),
          String(body.starts_at || '').slice(0, 40),
          body.live === false ? 0 : 1,
        ]
      );
      return Response.json({ ok: true });
    } finally {
      await conn.end();
    }
  }

  return Response.json({ ok: false, error: 'Unknown action' }, { status: 400 });
}
