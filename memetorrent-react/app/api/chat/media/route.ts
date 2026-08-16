import { NextRequest } from 'next/server';
import { getUserDb } from '@/lib/rewards-db';
import { readSessionToken, userBySession } from '@/lib/portal-auth';

async function ensure(conn: Awaited<ReturnType<typeof getUserDb>>) {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS mt_chat_media (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(190) NOT NULL,
      mime VARCHAR(64) NOT NULL,
      data LONGBLOB NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

export async function POST(request: NextRequest) {
  const user = await userBySession(await readSessionToken());
  if (!user) return Response.json({ ok: false, error: 'Sign in' }, { status: 401 });
  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof Blob)) return Response.json({ ok: false, error: 'No file' }, { status: 400 });
  if (file.size > 1_500_000) return Response.json({ ok: false, error: 'Image too large (1.5MB max)' }, { status: 400 });
  const mime = file.type || 'image/jpeg';
  if (!mime.startsWith('image/')) return Response.json({ ok: false, error: 'Images only' }, { status: 400 });
  const buf = Buffer.from(await file.arrayBuffer());
  const conn = await getUserDb();
  try {
    await ensure(conn);
    await conn.execute('INSERT INTO mt_chat_media (email, mime, data) VALUES (?,?,?)', [
      user.email,
      mime,
      buf,
    ]);
    const [rows] = await conn.execute(
      'SELECT id FROM mt_chat_media WHERE email = ? ORDER BY id DESC LIMIT 1',
      [user.email]
    );
    const id = String((rows as { id: string | number }[])[0]?.id || '');
    return Response.json({ ok: true, url: `/api/chat/media/${id}` });
  } catch (err) {
    console.error('media', err);
    return Response.json({ ok: false, error: 'Upload failed' }, { status: 500 });
  } finally {
    await conn.end();
  }
}
