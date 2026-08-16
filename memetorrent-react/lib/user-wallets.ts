import type mysql from 'mysql2/promise';

export type WalletKind = 'phantom' | 'infinite' | 'solana' | 'other';

export type LinkedWallet = {
  id: number;
  kind: WalletKind;
  address: string;
  is_primary: number;
};

export async function ensureWalletTable(conn: mysql.Connection) {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS mt_user_wallets (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(190) NOT NULL,
      kind VARCHAR(24) NOT NULL,
      address VARCHAR(80) NOT NULL,
      is_primary TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY email_addr (email, address),
      KEY email_kind (email, kind)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

export async function migrateLegacyWallet(
  conn: mysql.Connection,
  email: string,
  legacy: string | null
) {
  await ensureWalletTable(conn);
  const addr = (legacy || '').trim();
  if (!addr || addr.toLowerCase() === 'not set') return;
  await conn.execute(
    `INSERT IGNORE INTO mt_user_wallets (email, kind, address, is_primary)
     VALUES (?, 'solana', ?, 1)`,
    [email, addr.slice(0, 80)]
  );
}

export async function listWallets(conn: mysql.Connection, email: string): Promise<LinkedWallet[]> {
  await ensureWalletTable(conn);
  const [rows] = await conn.execute(
    'SELECT id, kind, address, is_primary FROM mt_user_wallets WHERE email = ? ORDER BY is_primary DESC, id ASC',
    [email]
  );
  return rows as LinkedWallet[];
}

export async function addWallet(
  conn: mysql.Connection,
  email: string,
  kind: WalletKind,
  address: string,
  makePrimary: boolean
): Promise<LinkedWallet[]> {
  await ensureWalletTable(conn);
  const addr = address.trim().slice(0, 80);
  if (addr.length < 32) throw new Error('That does not look like a wallet address.');
  if (makePrimary) {
    await conn.execute('UPDATE mt_user_wallets SET is_primary = 0 WHERE email = ?', [email]);
  }
  await conn.execute(
    `INSERT INTO mt_user_wallets (email, kind, address, is_primary)
     VALUES (?,?,?,?)
     ON DUPLICATE KEY UPDATE kind = VALUES(kind), is_primary = VALUES(is_primary)`,
    [email, kind, addr, makePrimary ? 1 : 0]
  );
  if (makePrimary) {
    await conn.execute('UPDATE portal_users SET wallet_address = ? WHERE email = ?', [addr, email]);
  }
  return listWallets(conn, email);
}

export async function removeWallet(conn: mysql.Connection, email: string, id: number) {
  await conn.execute('DELETE FROM mt_user_wallets WHERE email = ? AND id = ?', [email, id]);
  return listWallets(conn, email);
}
