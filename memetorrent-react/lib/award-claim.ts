import type mysql from 'mysql2/promise';
import { getTrackingDb, getUserDb, logReward, WALLET_RE } from '@/lib/rewards-db';

export async function resolveWallet(
  conn: mysql.Connection,
  username: string
): Promise<string | null> {
  const name = username.trim();
  if (!name) return null;
  const [w] = await conn.execute(
    'SELECT wallet FROM mt_game_wallets WHERE username = ? ORDER BY id DESC LIMIT 1',
    [name]
  );
  const fromGame = (w as { wallet: string }[])[0]?.wallet;
  if (fromGame && WALLET_RE.test(fromGame)) return fromGame;
  const [p] = await conn.execute(
    'SELECT wallet_address FROM portal_users WHERE username = ? LIMIT 1',
    [name]
  );
  const fromPortal = ((p as { wallet_address: string | null }[])[0]?.wallet_address || '').trim();
  if (fromPortal && WALLET_RE.test(fromPortal)) return fromPortal;
  const [u] = await conn.execute(
    'SELECT wallet_address FROM user_details WHERE username = ? LIMIT 1',
    [name]
  );
  const fromUd = ((u as { wallet_address: string | null }[])[0]?.wallet_address || '').trim();
  if (fromUd && WALLET_RE.test(fromUd)) return fromUd;
  return null;
}

export async function saveGameWallet(username: string, wallet: string, email?: string | null) {
  const addr = wallet.trim();
  if (!WALLET_RE.test(addr)) throw new Error('Invalid Solana wallet');
  const conn = await getUserDb();
  try {
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS mt_game_wallets (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(80) NOT NULL,
        wallet VARCHAR(64) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY username (username)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    await conn.execute('INSERT INTO mt_game_wallets (username, wallet) VALUES (?,?)', [
      username.slice(0, 80),
      addr,
    ]);
    if (email) {
      await conn.execute('UPDATE portal_users SET wallet_address = ? WHERE email = ?', [
        addr,
        email.toLowerCase(),
      ]);
    }
  } finally {
    await conn.end();
  }
}

export async function awardClaimableMt(opts: {
  username: string;
  amount: number;
  wallet?: string;
  note?: string;
}) {
  const amount = Number(opts.amount);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Amount must be > 0');
  const userConn = await getUserDb();
  let trackConn: mysql.Connection | null = null;
  try {
    const wallet = (opts.wallet || (await resolveWallet(userConn, opts.username)) || '').trim();
    if (!wallet || !WALLET_RE.test(wallet)) {
      throw new Error('That player has no wallet connected yet');
    }

    let [found] = await userConn.execute(
      'SELECT id, username, wallet_address FROM user_details WHERE wallet_address = ? OR username = ? LIMIT 1',
      [wallet, opts.username]
    );
    let user = (found as { id: number | string; username: string; wallet_address: string }[])[0];
    if (!user) {
      await userConn.execute(
        'INSERT INTO user_details (username, wallet_address) VALUES (?, ?)',
        [opts.username.slice(0, 80), wallet]
      );
      const [again] = await userConn.execute(
        'SELECT id, username, wallet_address FROM user_details WHERE wallet_address = ? LIMIT 1',
        [wallet]
      );
      user = (again as { id: number | string; username: string; wallet_address: string }[])[0];
    } else if (!user.wallet_address || user.wallet_address !== wallet) {
      await userConn.execute('UPDATE user_details SET wallet_address = ? WHERE id = ?', [wallet, user.id]);
    }
    if (!user) throw new Error('Could not attach claim user');

    const userId = String(user.id);
    trackConn = await getTrackingDb();
    await trackConn.beginTransaction();
    const [existing] = await trackConn.execute(
      'SELECT claimable_mt FROM daily_checkins WHERE user_id = ? FOR UPDATE',
      [userId]
    );
    const prev = Number((existing as { claimable_mt: number }[])[0]?.claimable_mt) || 0;
    const next = prev + amount;
    if (!(existing as object[]).length) {
      await trackConn.execute(
        `INSERT INTO daily_checkins
          (user_id, claimable_mt, last_checkin, current_streak, max_streak, total_checkins)
         VALUES (?, ?, CURDATE(), 0, 0, 0)`,
        [userId, next]
      );
    } else {
      await trackConn.execute(
        'UPDATE daily_checkins SET claimable_mt = ?, updated_at = NOW() WHERE user_id = ?',
        [next, userId]
      );
    }
    await logReward(userConn, {
      platform: 'web',
      user_id: userId,
      username: opts.username,
      recipient_wallet: wallet,
      amount_mt: amount,
      tx_signature: 'EMOJI_AWARD',
      sender_wallet: 'emoji_desk',
      note: opts.note || `Emoji night award ${amount} $MT`,
    });
    await trackConn.commit();
    return { username: opts.username, wallet, claimable_mt: next, added: amount };
  } catch (err) {
    if (trackConn) {
      try {
        await trackConn.rollback();
      } catch {
        /* */
      }
    }
    throw err;
  } finally {
    await userConn.end();
    if (trackConn) await trackConn.end();
  }
}
