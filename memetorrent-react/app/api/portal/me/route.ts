import { getUserDb } from '@/lib/rewards-db';
import { publicUser, readSessionToken, userBySession } from '@/lib/portal-auth';
import { hydrateFromHeldRecords } from '@/lib/user-wallets';

export async function GET() {
  const user = await userBySession(await readSessionToken());
  if (!user) {
    return Response.json({ ok: false, user: null }, { status: 401 });
  }
  const conn = await getUserDb();
  try {
    const extra = await hydrateFromHeldRecords(conn, user);
    user.telegram_id = extra.telegram_id;
    user.telegram_username = extra.telegram_username;
    user.discord_id = extra.discord_id;
    return Response.json({
      ok: true,
      user: publicUser(user),
      wallets: extra.wallets,
    });
  } finally {
    await conn.end();
  }
}
