import { getUserDb } from '@/lib/rewards-db';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const conn = await getUserDb();
  try {
    const [rows] = await conn.execute('SELECT mime, data FROM mt_chat_media WHERE id = ? LIMIT 1', [id]);
    const row = (rows as { mime: string; data: Buffer }[])[0];
    if (!row) return new Response('Not found', { status: 404 });
    return new Response(new Uint8Array(row.data), {
      headers: {
        'Content-Type': row.mime || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } finally {
    await conn.end();
  }
}
