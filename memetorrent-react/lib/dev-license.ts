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
