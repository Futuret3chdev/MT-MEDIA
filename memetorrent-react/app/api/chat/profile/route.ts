import { NextRequest } from 'next/server';
import { getUserDb } from '@/lib/rewards-db';
import { listWallets, migrateLegacyWallet } from '@/lib/user-wallets';

export async function GET(request: NextRequest) {
  const username = String(request.nextUrl.searchParams.get('username') || '').trim();
  if (!username || username.startsWith('0xStealth')) {
    return Response.json({ ok: false, error: 'Hidden' }, { status: 404 });
  }
  const conn = await getUserDb();
  try {
    const [rows] = await conn.execute(
      `SELECT username, email, bio, avatar_url, wallet_address,
              CAST(telegram_id AS CHAR) AS telegram_id,
              CAST(discord_id AS CHAR) AS discord_id
       FROM portal_users WHERE username = ? LIMIT 1`,
      [username]
    );
    const u = (rows as Record<string, string | null>[])[0];
    if (!u) return Response.json({ ok: false, error: 'Not found' }, { status: 404 });
    await migrateLegacyWallet(conn, String(u.email), u.wallet_address);
    const wallets = await listWallets(conn, String(u.email));
    return Response.json({
      ok: true,
      profile: {
        username: u.username,
        bio: u.bio,
        avatar_url: u.avatar_url,
        telegram_id: u.telegram_id,
        discord_id: u.discord_id,
        wallets: wallets.map((w) => ({ kind: w.kind, address: w.address, primary: !!w.is_primary })),
      },
    });
  } finally {
    await conn.end();
  }
}
