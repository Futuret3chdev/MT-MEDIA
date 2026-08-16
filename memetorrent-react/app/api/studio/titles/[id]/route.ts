import { getUserDb } from '@/lib/rewards-db';

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
