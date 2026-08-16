import type mysql from 'mysql2/promise';
import crypto from 'crypto';

export const SYSTEM_ROOMS = [
  { slug: 'trades', name: 'Trades', kind: 'public', sub: 'Fills and pairs' },
  { slug: 'signals', name: 'Signals', kind: 'public', sub: 'Calls and alerts' },
  { slug: 'otc', name: 'OTC', kind: 'secret', sub: 'Size and desk' },
  { slug: 'general', name: 'General', kind: 'public', sub: 'The floor' },
  { slug: 'support', name: 'Support', kind: 'public', sub: 'Help' },
];

export async function ensureChat(conn: mysql.Connection) {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS mt_chat_channels (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(48) NOT NULL UNIQUE,
      name VARCHAR(80) NOT NULL,
      kind VARCHAR(16) NOT NULL DEFAULT 'public',
      owner_email VARCHAR(190) NULL,
      gate_note VARCHAR(160) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS mt_crypto_chat (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      room VARCHAR(48) NOT NULL,
      username VARCHAR(255) NOT NULL,
      body VARCHAR(800) NOT NULL,
      burn_at DATETIME NULL,
      no_forward TINYINT(1) NOT NULL DEFAULT 0,
      kind VARCHAR(16) NOT NULL DEFAULT 'text',
      owner_email VARCHAR(190) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY room_time (room, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS mt_chat_events (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      room VARCHAR(48) NOT NULL,
      event_name VARCHAR(64) NOT NULL,
      payload TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY room_time (room, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  for (const col of [
    'ALTER TABLE mt_crypto_chat ADD COLUMN burn_at DATETIME NULL',
    'ALTER TABLE mt_crypto_chat ADD COLUMN no_forward TINYINT(1) NOT NULL DEFAULT 0',
    'ALTER TABLE mt_crypto_chat ADD COLUMN kind VARCHAR(16) NOT NULL DEFAULT "text"',
    'ALTER TABLE mt_crypto_chat ADD COLUMN owner_email VARCHAR(190) NULL',
  ]) {
    try {
      await conn.execute(col);
    } catch {
      /* exists */
    }
  }
  for (const r of SYSTEM_ROOMS) {
    await conn.execute(
      'INSERT IGNORE INTO mt_chat_channels (slug, name, kind, owner_email, gate_note) VALUES (?,?,?,?,?)',
      [r.slug, r.name, r.kind, null, r.sub]
    );
  }
}

export function slugifyChannel(name: string) {
  const s = name
    .toLowerCase()
    .replace(/^#/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return s || 'room';
}

export function pairEmails(a: string, b: string): [string, string] {
  return [a.trim().toLowerCase(), b.trim().toLowerCase()].sort() as [string, string];
}

export function dmSlug(emailA: string, emailB: string) {
  const [x, y] = pairEmails(emailA, emailB);
  const h = crypto.createHash('sha1').update(`${x}\n${y}`).digest('hex').slice(0, 24);
  return `dm-${h}`;
}

export function isDmSlug(room: string) {
  return room.startsWith('dm-');
}

export async function ensureDmChannel(
  conn: mysql.Connection,
  meEmail: string,
  otherEmail: string,
  label = 'Direct'
) {
  const [x, y] = pairEmails(meEmail, otherEmail);
  const slug = dmSlug(meEmail, otherEmail);
  await conn.execute(
    'INSERT IGNORE INTO mt_chat_channels (slug, name, kind, owner_email, gate_note) VALUES (?,?,?,?,?)',
    [slug, label.slice(0, 80), 'dm', x, y]
  );
  return slug;
}

export async function dmParticipant(
  conn: mysql.Connection,
  room: string,
  email: string
): Promise<boolean> {
  if (!isDmSlug(room)) return true;
  const [rows] = await conn.execute(
    'SELECT kind, owner_email, gate_note FROM mt_chat_channels WHERE slug = ? LIMIT 1',
    [room]
  );
  const ch = (rows as { kind: string; owner_email: string | null; gate_note: string | null }[])[0];
  if (!ch || ch.kind !== 'dm') return false;
  const e = email.trim().toLowerCase();
  return ch.owner_email === e || ch.gate_note === e;
}
