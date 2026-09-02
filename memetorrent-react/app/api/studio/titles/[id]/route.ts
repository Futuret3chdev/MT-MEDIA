import { NextRequest } from 'next/server';
import { getUserDb } from '@/lib/rewards-db';
import { readSessionToken, userBySession } from '@/lib/portal-auth';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const conn = await getUserDb();
  try {
    const [rows] = await conn.execute(
      'SELECT id, name, blurb, play_url, kind, config, username FROM mt_studio_titles WHERE id = ? LIMIT 1',
      [id]
    );
    const row = (rows as Record<string, unknown>[])[0];
    if (!row) return Response.json({ ok: false, error: 'Not found' }, { status: 404 });
    let config = null;
    try {
      config = row.config ? JSON.parse(String(row.config)) : null;
    } catch {
      config = null;
    }
    return Response.json({ ok: true, title: { ...row, config } });
  } catch (err) {
    console.error('studio title', err);
    return Response.json({ ok: false, error: 'Unavailable' }, { status: 500 });
  } finally {
    await conn.end();
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await userBySession(await readSessionToken());
  if (!user) return Response.json({ ok: false, error: 'Sign in' }, { status: 401 });
  const { id } = await params;
  let body: { name?: string; blurb?: string; config?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const name = String(body.name || '').trim().slice(0, 80);
  const blurb = String(body.blurb || '').trim().slice(0, 280);
  const config = body.config ? JSON.stringify(body.config).slice(0, 20000) : null;
  if (name.length < 2) return Response.json({ ok: false, error: 'Name is required.' }, { status: 400 });
  const conn = await getUserDb();
  try {
    const [found] = await conn.execute(
      'SELECT id FROM mt_studio_titles WHERE id = ? AND email = ? LIMIT 1',
      [id, user.email]
    );
    if (!(found as { id: unknown }[]).length) {
      return Response.json({ ok: false, error: 'Not your title' }, { status: 404 });
    }
    await conn.execute(
      'UPDATE mt_studio_titles SET name = ?, blurb = ?, config = ? WHERE id = ? AND email = ?',
      [name, blurb, config, id, user.email]
    );
    return Response.json({ ok: true, id: Number(id), play_url: `/studio/play/${id}` });
  } catch (err) {
    console.error('studio put', err);
    return Response.json({ ok: false, error: 'Could not update' }, { status: 500 });
  } finally {
    await conn.end();
  }
}
