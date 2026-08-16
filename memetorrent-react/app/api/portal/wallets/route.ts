import { NextRequest } from 'next/server';
import { getUserDb } from '@/lib/rewards-db';
import { readSessionToken, userBySession } from '@/lib/portal-auth';
import { addWallet, listWallets, migrateLegacyWallet, removeWallet, type WalletKind } from '@/lib/user-wallets';

const KINDS = new Set(['phantom', 'infinite', 'solana', 'other']);

export async function GET() {
  const user = await userBySession(await readSessionToken());
  if (!user) return Response.json({ ok: false, error: 'Sign in' }, { status: 401 });
  const conn = await getUserDb();
  try {
    await migrateLegacyWallet(conn, user.email, user.wallet_address);
    const wallets = await listWallets(conn, user.email);
    return Response.json({
      ok: true,
      wallets,
      telegram_id: user.telegram_id,
      discord_id: user.discord_id,
    });
  } finally {
    await conn.end();
  }
}

export async function POST(request: NextRequest) {
  const user = await userBySession(await readSessionToken());
  if (!user) return Response.json({ ok: false, error: 'Sign in' }, { status: 401 });
  let body: { kind?: string; address?: string; primary?: boolean; remove_id?: number };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const conn = await getUserDb();
  try {
    if (body.remove_id) {
      const wallets = await removeWallet(conn, user.email, Number(body.remove_id));
      return Response.json({ ok: true, wallets });
    }
    const kind = (body.kind || 'solana') as WalletKind;
    if (!KINDS.has(kind)) {
      return Response.json({ ok: false, error: 'Unknown wallet type.' }, { status: 400 });
    }
    const wallets = await addWallet(conn, user.email, kind, String(body.address || ''), !!body.primary);
    return Response.json({ ok: true, wallets });
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'Could not save wallet';
    return Response.json({ ok: false, error: detail }, { status: 400 });
  } finally {
    await conn.end();
  }
}
