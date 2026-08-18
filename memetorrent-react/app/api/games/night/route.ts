import { NextRequest } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { readSessionToken, userBySession } from '@/lib/portal-auth';
import { awardClaimableMt, saveGameWallet } from '@/lib/award-claim';
import { WALLET_RE } from '@/lib/rewards-db';

const SECRET = process.env.EMOJI_STAFF_SECRET || 'mt-emoji-staff-v1';

function token(kind: string) {
  return createHmac('sha256', SECRET).update(kind).digest('hex');
}

function isStaff(request: NextRequest) {
  const cookies = [request.cookies.get('mt_emoji_staff')?.value, request.cookies.get('mt_royale_staff')?.value];
  const wants = [token('emoji-ok'), token('royale-ok')];
  return cookies.some((raw) =>
    wants.some((want) => {
      try {
        return !!raw && raw.length === want.length && timingSafeEqual(Buffer.from(raw), Buffer.from(want));
      } catch {
        return false;
      }
    })
  );
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const action = String(body.action || '');

  if (action === 'wallet') {
    const me = await userBySession(await readSessionToken());
    const name = (me?.username || String(body.name || '')).trim().slice(0, 80);
    const wallet = String(body.wallet || '').trim();
    if (!name) return Response.json({ ok: false, error: 'Need a handle' }, { status: 400 });
    if (!WALLET_RE.test(wallet)) return Response.json({ ok: false, error: 'Invalid wallet' }, { status: 400 });
    try {
      await saveGameWallet(name, wallet, me?.email);
      return Response.json({ ok: true, name, wallet });
    } catch (err) {
      return Response.json({ ok: false, error: err instanceof Error ? err.message : 'Save failed' }, { status: 400 });
    }
  }

  if (action === 'award') {
    if (!isStaff(request)) return Response.json({ ok: false, error: 'Staff only' }, { status: 401 });
    try {
      const result = await awardClaimableMt({
        username: String(body.name || '').trim(),
        amount: Number(body.amount),
        wallet: body.wallet ? String(body.wallet) : undefined,
        note: String(body.note || 'Emoji night prize'),
      });
      return Response.json({ ok: true, ...result });
    } catch (err) {
      return Response.json({ ok: false, error: err instanceof Error ? err.message : 'Award failed' }, { status: 400 });
    }
  }

  return Response.json({ ok: false, error: 'Unknown action' }, { status: 400 });
}
