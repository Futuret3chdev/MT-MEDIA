import { NextRequest } from 'next/server';
import { getUserDb } from '@/lib/rewards-db';
import { publicUser, readSessionToken, userBySession } from '@/lib/portal-auth';

export async function POST(request: NextRequest) {
  const user = await userBySession(await readSessionToken());
  if (!user) {
    return Response.json({ ok: false, error: 'Not signed in.' }, { status: 401 });
  }
  let body: { bio?: string; avatar_url?: string; wallet_address?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const conn = await getUserDb();
  try {
    const bio = body.bio !== undefined ? String(body.bio).slice(0, 2000) : user.bio;
    const avatar_url =
      body.avatar_url !== undefined ? String(body.avatar_url).slice(0, 255) : user.avatar_url;
    const wallet_address =
      body.wallet_address !== undefined
        ? String(body.wallet_address).trim().slice(0, 44) || null
        : user.wallet_address;
    await conn.execute(
      'UPDATE portal_users SET bio = ?, avatar_url = ?, wallet_address = ? WHERE email = ?',
      [bio, avatar_url, wallet_address, user.email]
    );
    const next = {
      ...user,
      bio,
      avatar_url,
      wallet_address,
    };
    return Response.json({ ok: true, user: publicUser(next) });
  } catch (err) {
    console.error('portal profile', err);
    return Response.json({ ok: false, error: 'Could not save profile.' }, { status: 500 });
  } finally {
    await conn.end();
  }
}
