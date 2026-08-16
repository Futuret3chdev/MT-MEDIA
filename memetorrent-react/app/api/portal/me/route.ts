import { publicUser, readSessionToken, userBySession } from '@/lib/portal-auth';

export async function GET() {
  const user = await userBySession(await readSessionToken());
  if (!user) {
    return Response.json({ ok: false, user: null }, { status: 401 });
  }
  return Response.json({ ok: true, user: publicUser(user) });
}
