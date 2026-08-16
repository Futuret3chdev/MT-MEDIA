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

export async function hydrateFromHeldRecords(
  conn: mysql.Connection,
  user: { email: string; username?: string; wallet_address?: string | null; telegram_id?: string | null; discord_id?: string | null }
): Promise<{
  telegram_id: string | null;
  telegram_username: string | null;
  discord_id: string | null;
  wallets: LinkedWallet[];
}> {
  await migrateLegacyWallet(conn, user.email, user.wallet_address || null);
  const wallets = await listWallets(conn, user.email);
  const addrs = new Set(wallets.map((w) => w.address).filter(Boolean));
  if (user.wallet_address && user.wallet_address.toLowerCase() !== 'not set') {
    addrs.add(user.wallet_address);
  }

  let telegramId = user.telegram_id ? String(user.telegram_id) : null;
  let discordId = user.discord_id ? String(user.discord_id) : null;
  let telegramUsername: string | null = null;

  if (addrs.size) {
    const list = [...addrs];
    const ph = list.map(() => '?').join(',');
    const [sibs] = await conn.execute(
      `SELECT CAST(telegram_id AS CHAR) AS telegram_id, CAST(discord_id AS CHAR) AS discord_id, wallet_address
       FROM portal_users
       WHERE wallet_address IN (${ph})`,
      list
    );
    for (const s of sibs as { telegram_id: string | null; discord_id: string | null; wallet_address: string }[]) {
      if (!telegramId && s.telegram_id && s.telegram_id !== '0') telegramId = String(s.telegram_id);
      if (!discordId && s.discord_id && s.discord_id !== '0') discordId = String(s.discord_id);
    }
    try {
      const [held] = await conn.execute(
        `SELECT CAST(id AS CHAR) AS id, username, wallet_address FROM user_details WHERE wallet_address IN (${ph})`,
        list
      );
      for (const h of held as { id: string; username: string | null; wallet_address: string }[]) {
        if (h.wallet_address) {
          await conn.execute(
            `INSERT IGNORE INTO mt_user_wallets (email, kind, address, is_primary)
             VALUES (?, 'solana', ?, 0)`,
            [user.email, h.wallet_address.slice(0, 80)]
          );
        }
        if (!telegramId && h.id) telegramId = String(h.id);
        if (h.username && (!telegramUsername || h.username.toLowerCase() === String(user.username || '').toLowerCase())) {
          telegramUsername = h.username;
        }
      }
    } catch {
      /* user_details may be missing */
    }
  }

  if (telegramId || discordId) {
    await conn.execute(
      `UPDATE portal_users
       SET telegram_id = COALESCE(telegram_id, ?), discord_id = COALESCE(discord_id, ?)
       WHERE email = ?`,
      [telegramId, discordId, user.email]
    );
  }

  return {
    telegram_id: telegramId,
    telegram_username: telegramUsername,
    discord_id: discordId,
    wallets: await listWallets(conn, user.email),
  };
}

export async function removeWallet(conn: mysql.Connection, email: string, id: number) {
  await conn.execute('DELETE FROM mt_user_wallets WHERE email = ? AND id = ?', [email, id]);
  return listWallets(conn, email);
}
