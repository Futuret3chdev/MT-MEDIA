import type mysql from 'mysql2/promise';
import { getUserDb } from '@/lib/rewards-db';
import crypto from 'crypto';

export type DevTier = 'free' | 'pro';

export type DevLicense = {
  id: number;
  name: string;
  email: string;
  handle: string | null;
  license_key: string;
  tier: DevTier;
  created_at: string;
};

export async function verifyLicenseKey(key: string): Promise<{
  ok: boolean;
  license_key?: string;
  tier?: DevTier;
  handle?: string | null;
  error?: string;
}> {
  const license_key = String(key || '').trim();
  if (!/^MT-(FREE|PRO)-[A-F0-9]{10}$/i.test(license_key)) {
    return { ok: false, error: 'Bad license key' };
  }
  const conn = await getUserDb();
  try {
    await ensureDevLicenseTable(conn);
    const [rows] = await conn.execute(
      'SELECT license_key, tier, handle FROM mt_dev_licenses WHERE license_key = ? LIMIT 1',
      [license_key]
    );
    const row = (rows as { license_key: string; tier: DevTier; handle: string | null }[])[0];
    if (!row) return { ok: false, error: 'Unknown license' };
    return { ok: true, license_key: row.license_key, tier: (row.tier as DevTier) || 'free', handle: row.handle };
  } finally {
    await conn.end();
  }
}

export function makeLicenseKey(tier: DevTier = 'free'): string {
  const body = crypto.randomBytes(5).toString('hex').toUpperCase();
  return `MT-${tier === 'pro' ? 'PRO' : 'FREE'}-${body}`;
}

export async function ensureDevLicenseTable(conn: mysql.Connection) {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS mt_dev_licenses (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(190) NOT NULL,
      handle VARCHAR(80) NULL,
      license_key VARCHAR(40) NOT NULL UNIQUE,
      tier VARCHAR(16) NOT NULL DEFAULT 'free',
      user_id BIGINT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

export async function issueFreeLicense(input: {
  name: string;
  email: string;
  handle?: string;
}): Promise<{ license: DevLicense; created: boolean }> {
  const conn = await getUserDb();
  try {
    await ensureDevLicenseTable(conn);
    const email = input.email.trim().toLowerCase();
    const [existing] = await conn.execute(
      'SELECT id, name, email, handle, license_key, tier, created_at FROM mt_dev_licenses WHERE email = ? LIMIT 1',
      [email]
    );
    const rows = existing as DevLicense[];
    if (rows[0]) {
      return { license: rows[0], created: false };
    }
    const license_key = makeLicenseKey('free');
    await conn.execute(
      'INSERT INTO mt_dev_licenses (name, email, handle, license_key, tier) VALUES (?,?,?,?,?)',
      [input.name.trim().slice(0, 120), email, (input.handle || '').trim().slice(0, 80) || null, license_key, 'free']
    );
    const [fresh] = await conn.execute(
      'SELECT id, name, email, handle, license_key, tier, created_at FROM mt_dev_licenses WHERE email = ? LIMIT 1',
      [email]
    );
    return { license: (fresh as DevLicense[])[0], created: true };
  } finally {
    await conn.end();
  }
}

export async function upgradeToPro(email: string, name?: string): Promise<{ license_key: string; license_tier: 'pro' }> {
  const conn = await getUserDb();
  try {
    await ensureDevLicenseTable(conn);
    const addr = email.trim().toLowerCase();
    const [rows] = await conn.execute(
      'SELECT license_key, tier FROM mt_dev_licenses WHERE email = ? LIMIT 1',
      [addr]
    );
    const cur = (rows as { license_key: string; tier: string }[])[0];
    if (cur?.tier === 'pro' && String(cur.license_key || '').includes('PRO')) {
      await conn.execute('UPDATE portal_users SET license_key = ?, license_tier = ? WHERE email = ?', [
        cur.license_key,
        'pro',
        addr,
      ]);
      return { license_key: cur.license_key, license_tier: 'pro' };
    }
    const license_key = makeLicenseKey('pro');
    if (cur) {
      await conn.execute('UPDATE mt_dev_licenses SET license_key = ?, tier = ? WHERE email = ?', [
        license_key,
        'pro',
        addr,
      ]);
    } else {
      await conn.execute(
        'INSERT INTO mt_dev_licenses (name, email, handle, license_key, tier) VALUES (?,?,?,?,?)',
        [(name || addr).slice(0, 120), addr, null, license_key, 'pro']
      );
    }
    await conn.execute('UPDATE portal_users SET license_key = ?, license_tier = ? WHERE email = ?', [
      license_key,
      'pro',
      addr,
    ]);
    return { license_key, license_tier: 'pro' };
  } finally {
    await conn.end();
  }
}
