import { NextRequest } from 'next/server';
import { createHmac } from 'crypto';
import bcrypt from 'bcryptjs';
import { isNightStaff } from '@/app/api/games/night/route';
import { readSessionToken, userBySession } from '@/lib/portal-auth';
import { getUserDb } from '@/lib/rewards-db';
import { awardClaimableMt } from '@/lib/award-claim';

const PIN = process.env.EMOJI_STAFF_PIN || '376937';
const PASS_HASH =
  process.env.EMOJI_STAFF_HASH || '$2b$10$MLq2YyrbFq.1PZ92oQ9IiezGi4LlvmQLjVSO7/RvwbvMlT4UB1zqu';
const SECRET = process.env.EMOJI_STAFF_SECRET || 'mt-emoji-staff-v1';

function nightTok() {
  return createHmac('sha256', SECRET).update('night-ok').digest('hex');
}

async function isPlayStaff(request: NextRequest) {
  if (isNightStaff(request)) return true;
  const me = await userBySession(await readSessionToken());
  return Boolean((me as { is_admin?: boolean | number } | null)?.is_admin);
}

async function ensure(conn: Awaited<ReturnType<typeof getUserDb>>) {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS mt_play_staff (
      game_id VARCHAR(80) NOT NULL PRIMARY KEY,
      note VARCHAR(400) NOT NULL DEFAULT '',
      prize VARCHAR(180) NOT NULL DEFAULT '',
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

export async function GET(request: NextRequest) {
  const game = (request.nextUrl.searchParams.get('game') || '').slice(0, 80);
  const staff = await isPlayStaff(request);
  let note = '';
  let prize = '';
  if (game) {
    const conn = await getUserDb();
    try {
      await ensure(conn);
      const [rows] = await conn.execute(
        'SELECT note, prize FROM mt_play_staff WHERE game_id = ? LIMIT 1',
        [game]
      );
      const row = (rows as { note: string; prize: string }[])[0];
      note = row?.note || '';
      prize = row?.prize || '';
    } catch {
      /* table may be missing on first hit */
    } finally {
      await conn.end();
    }
  }
  return Response.json({ ok: true, staff, note, prize });
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
    const pinOk = String(body.pin || '') === PIN;
    const passOk = await bcrypt.compare(String(body.password || ''), PASS_HASH);
    if (!pinOk || !passOk) return Response.json({ ok: false, error: 'Wrong pin or password' }, { status: 401 });
    const res = Response.json({ ok: true, staff: true });
    res.headers.append(
      'Set-Cookie',
      `mt_night_staff=${nightTok()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
    );
    return res;
  }

  if (!(await isPlayStaff(request))) {
    return Response.json({ ok: false, error: 'Staff only' }, { status: 401 });
  }

  if (action === 'save') {
    const game = String(body.game || '').trim().slice(0, 80);
    if (!game) return Response.json({ ok: false, error: 'Need a game' }, { status: 400 });
    const note = String(body.note || '').slice(0, 400);
    const prize = String(body.prize || '').slice(0, 180);
    const conn = await getUserDb();
    try {
      await ensure(conn);
      await conn.execute(
        `INSERT INTO mt_play_staff (game_id, note, prize) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE note = VALUES(note), prize = VALUES(prize)`,
        [game, note, prize]
      );
      return Response.json({ ok: true, saved: true, note, prize });
    } finally {
      await conn.end();
    }
  }

  if (action === 'award') {
    try {
      const result = await awardClaimableMt({
        username: String(body.name || '').trim(),
        amount: Number(body.amount),
        note: String(body.note || 'Play staff award'),
      });
      return Response.json({ ok: true, ...result });
    } catch (err) {
      return Response.json({ ok: false, error: err instanceof Error ? err.message : 'Award failed' }, { status: 400 });
    }
  }

  return Response.json({ ok: false, error: 'Unknown action' }, { status: 400 });
}
