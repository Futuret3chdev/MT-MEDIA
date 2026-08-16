import { getUserDb } from '@/lib/rewards-db';
import { clearSessionCookie, readSessionToken } from '@/lib/portal-auth';

export async function POST() {
  const token = await readSessionToken();
  if (token) {
    const conn = await getUserDb();
    try {
      await conn.execute(
        'UPDATE portal_users SET session_token = NULL WHERE session_token = ? OR session_token = ?',
        [token, String(token)]
      );
    } catch {
      /* ignore */
    } finally {
      await conn.end();
    }
  }
  await clearSessionCookie();
  return Response.json({ ok: true });
}
