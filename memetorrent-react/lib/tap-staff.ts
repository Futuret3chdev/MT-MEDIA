import { createHash, createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

/** Staff pin — same admin id used on play desks. */
export const TAPMATCH_STAFF_PIN = process.env.TAPMATCH_STAFF_PIN || process.env.EMOJI_STAFF_PIN || '376937';

const PASS_SHA =
  process.env.TAPMATCH_STAFF_SHA256 ||
  '550ef7ce40696abbf0279008c4b3d208d88d820bd4fdaf214f3f21da2682cda7';
const PASS_HASH =
  process.env.EMOJI_STAFF_HASH || '$2b$10$MLq2YyrbFq.1PZ92oQ9IiezGi4LlvmQLjVSO7/RvwbvMlT4UB1zqu';
const SECRET = process.env.EMOJI_STAFF_SECRET || 'mt-emoji-staff-v1';

export const TAPMATCH_STAFF_COOKIE = 'mt_tapmatch_staff';

function hmac(kind: string) {
  return createHmac('sha256', SECRET).update(kind).digest('hex');
}

function safeEq(a: string, b: string) {
  try {
    const ba = Buffer.from(String(a));
    const bb = Buffer.from(String(b));
    return ba.length === bb.length && timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

export function tapMatchPinOk(pin: string) {
  const s = String(pin || '').trim();
  return s === TAPMATCH_STAFF_PIN;
}

export async function tapMatchPasswordOk(password: string) {
  const sha = createHash('sha256').update(String(password)).digest('hex');
  if (safeEq(sha, PASS_SHA)) return true;
  try {
    const bcrypt = (await import('bcryptjs')).default;
    if (await bcrypt.compare(String(password), PASS_HASH)) return true;
  } catch {
    /* bcrypt optional in local installs */
  }
  return false;
}

export async function readTapMatchStaffCookie() {
  const jar = await cookies();
  const raw =
    jar.get(TAPMATCH_STAFF_COOKIE)?.value ||
    jar.get('mt_night_staff')?.value ||
    '';
  if (!raw) return false;
  return safeEq(raw, hmac('tapmatch-ok')) || safeEq(raw, hmac('night-ok'));
}

export async function isTapMatchStaff(user?: { username?: string; is_admin?: boolean | number } | null) {
  if (user && (Boolean(user.is_admin) || String(user.username) === TAPMATCH_STAFF_PIN)) return true;
  return readTapMatchStaffCookie();
}

export function tapMatchStaffSetCookieHeaders() {
  const age = 'Max-Age=86400; Path=/; HttpOnly; SameSite=Lax';
  return [
    `${TAPMATCH_STAFF_COOKIE}=${hmac('tapmatch-ok')}; ${age}`,
    `mt_night_staff=${hmac('night-ok')}; ${age}`,
  ];
}
