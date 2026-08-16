import { cookies } from 'next/headers';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import type mysql from 'mysql2/promise';
import { getUserDb } from '@/lib/rewards-db';
import { ensureDevLicenseTable, makeLicenseKey } from '@/lib/dev-license';

export const SESSION_COOKIE = 'session_token';
const WEEK = 60 * 60 * 24 * 7;

export type PortalUser = {
  id: number;
  username: string;
  email: string;
  wallet_address: string | null;
  license_key: string | null;
  license_tier: string | null;
  bio: string | null;
  avatar_url: string | null;
  telegram_id: string | null;
  discord_id: string | null;
};

export function cookieDomain(): string | undefined {
  // Shared across memetorrent / wallet / admin on this domain.
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    return '.futuret3ch.com.au';
  }
  return undefined;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function checkPassword(plain: string, hash: string): Promise<boolean> {
  const normalized = hash.startsWith('$2y$') ? `$2a$${hash.slice(4)}` : hash;
  return bcrypt.compare(plain, normalized);
}

export async function ensurePortalColumns(conn: mysql.Connection) {
  const alters = [
    'ALTER TABLE portal_users ADD COLUMN license_key VARCHAR(40) NULL',
    'ALTER TABLE portal_users ADD COLUMN license_tier VARCHAR(16) NULL',
    'ALTER TABLE mt_dev_licenses ADD COLUMN user_id BIGINT NULL',
    'ALTER TABLE mt_dev_licenses MODIFY COLUMN user_id BIGINT NULL',
  ];
  for (const sql of alters) {
    try {
      await conn.execute(sql);
    } catch {
      /* already exists */
    }
  }
}

export async function attachLicense(
  conn: mysql.Connection,
  user: { id: number; username: string; email: string }
): Promise<{ license_key: string; license_tier: string }> {
  await ensureDevLicenseTable(conn);
  await ensurePortalColumns(conn);
  const [rows] = await conn.execute(
    'SELECT license_key, license_tier FROM portal_users WHERE id = ? LIMIT 1',
    [user.id]
  );
  const cur = (rows as { license_key: string | null; license_tier: string | null }[])[0];
  if (cur?.license_key) {
    return { license_key: cur.license_key, license_tier: cur.license_tier || 'free' };
  }
  const [byEmail] = await conn.execute(
    'SELECT license_key, tier FROM mt_dev_licenses WHERE email = ? LIMIT 1',
    [user.email.toLowerCase()]
  );
  const existing = (byEmail as { license_key: string; tier: string }[])[0];
  const email = user.email.toLowerCase();
  const uid = String(user.id);
  if (existing?.license_key) {
    await conn.execute(
      'UPDATE portal_users SET license_key = ?, license_tier = ? WHERE email = ?',
      [existing.license_key, existing.tier || 'free', email]
    );
    await conn.execute('UPDATE mt_dev_licenses SET user_id = ? WHERE license_key = ?', [
      uid,
      existing.license_key,
    ]);
    return { license_key: existing.license_key, license_tier: existing.tier || 'free' };
  }
  const license_key = makeLicenseKey('free');
  await conn.execute(
    'UPDATE portal_users SET license_key = ?, license_tier = ? WHERE email = ?',
    [license_key, 'free', email]
  );
  await conn.execute(
    'INSERT INTO mt_dev_licenses (name, email, handle, license_key, tier, user_id) VALUES (?,?,?,?,?,?)',
    [user.username, email, null, license_key, 'free', uid]
  );
  return { license_key, license_tier: 'free' };
}

export async function userBySession(token: string | undefined | null): Promise<PortalUser | null> {
  if (!token) return null;
  const conn = await getUserDb();
  try {
    await ensurePortalColumns(conn);
    const [rows] = await conn.execute(
      'SELECT id, username, email, wallet_address, license_key, license_tier, bio, avatar_url, telegram_id, discord_id FROM portal_users WHERE session_token = ? LIMIT 1',
      [token]
    );
    const user = (rows as PortalUser[])[0];
    if (!user) return null;
    if (!user.license_key) {
      const lic = await attachLicense(conn, user);
      user.license_key = lic.license_key;
      user.license_tier = lic.license_tier;
    }
    return user;
  } finally {
    await conn.end();
  }
}

export async function writeSessionCookie(token: string) {
  const jar = await cookies();
  const base = {
    httpOnly: true,
    secure: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: WEEK,
  };
  // Host-only cookie first so login works on this site even if
  // parent-domain cookies are blocked.
  jar.set(SESSION_COOKIE, token, base);
  const domain = cookieDomain();
  if (domain) {
    try {
      jar.set(SESSION_COOKIE, token, { ...base, domain });
    } catch {
      /* host-only cookie is enough */
    }
  }
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    domain: cookieDomain(),
  });
}

export async function readSessionToken(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value;
}

export function newSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function publicUser(user: PortalUser) {
  return {
    id: String(user.id),
    username: user.username,
    email: user.email,
    wallet_address: user.wallet_address,
    license_key: user.license_key,
    license_tier: user.license_tier || 'free',
    bio: user.bio,
    avatar_url: user.avatar_url,
    telegram_id: user.telegram_id ? String(user.telegram_id) : null,
    discord_id: user.discord_id ? String(user.discord_id) : null,
  };
}
