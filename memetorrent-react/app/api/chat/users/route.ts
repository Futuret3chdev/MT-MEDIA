import { NextRequest } from 'next/server';
import { getUserDb } from '@/lib/rewards-db';
import { readSessionToken, userBySession } from '@/lib/portal-auth';

export async function GET(request: NextRequest) {
  const me = await userBySession(await readSessionToken());
  if (!me) return Response.json({ ok: false, users: [] }, { status: 401 });
  const q = String(request.nextUrl.searchParams.get('q') || '').trim();
  if (q.length < 2) return Response.json({ ok: true, users: [] });
  const conn = await getUserDb();
  try {
    const [rows] = await conn.execute(
      `SELECT username, email, avatar_url, wallet_address
       FROM portal_users
       WHERE username LIKE ? OR email LIKE ?
       ORDER BY username ASC
       LIMIT 12`,
      [`%${q}%`, `%${q}%`]
    );
    return Response.json({
      ok: true,
      users: (rows as { username: string; email: string; avatar_url: string | null; wallet_address: string | null }[]).map(
        (u) => ({
          username: u.username,
          email: u.email,
          avatar_url: u.avatar_url,
          wallet: u.wallet_address,
          self: u.email === me.email,
        })
      ),
    });
  } finally {
    await conn.end();
  }
}
