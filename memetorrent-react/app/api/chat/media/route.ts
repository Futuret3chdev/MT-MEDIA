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
  if (file.size > 4_000_000) return Response.json({ ok: false, error: 'File too large (4MB max)' }, { status: 400 });
  const mime = file.type || 'application/octet-stream';
  const ok =
    mime.startsWith('image/') ||
    mime.startsWith('audio/') ||
    mime.startsWith('video/') ||
    mime === 'application/pdf' ||
    mime === 'application/zip' ||
    mime === 'text/plain' ||
    mime === 'application/json';
  if (!ok) return Response.json({ ok: false, error: 'That file type is not allowed.' }, { status: 400 });
  const kind = mime.startsWith('image/')
    ? 'image'
    : mime.startsWith('audio/')
      ? 'audio'
      : mime.startsWith('video/')
        ? 'video'
        : 'file';
  const filename = (file instanceof File ? file.name : 'upload').slice(0, 160);
  const buf = Buffer.from(await file.arrayBuffer());
  const conn = await getUserDb();
  try {
    await ensure(conn);
    try {
      await conn.execute('ALTER TABLE mt_chat_media ADD COLUMN filename VARCHAR(160) NULL');
    } catch {
      /* exists */
    }
    await conn.execute('INSERT INTO mt_chat_media (email, mime, data, filename) VALUES (?,?,?,?)', [
      user.email,
      mime,
      buf,
      filename,
    ]);
    const [rows] = await conn.execute(
      'SELECT id FROM mt_chat_media WHERE email = ? ORDER BY id DESC LIMIT 1',
      [user.email]
    );
    const id = String((rows as { id: string | number }[])[0]?.id || '');
    return Response.json({ ok: true, url: `/api/chat/media/${id}`, kind, name: filename });
  } catch (err) {
    console.error('media', err);
    return Response.json({ ok: false, error: 'Upload failed' }, { status: 500 });
  } finally {
    await conn.end();
  }
}
