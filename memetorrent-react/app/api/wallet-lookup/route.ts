import { NextRequest } from 'next/server';
import mysql from 'mysql2/promise';

const DB_HOST = '50.6.160.248';
const DB_USER = 'tcvkxete_admin';
const DB_PASS = 'Shinhwa1@@';
const STAFF_KEY = process.env.STAFF_REWARD_KEY || 'Hiptonic1@@';

function verifyStaffKey(request: NextRequest): boolean {
  const key =
    request.headers.get('x-staff-key') ||
    new URL(request.url).searchParams.get('staff_key');
  return key === STAFF_KEY;
}

const WALLET_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export async function GET(request: NextRequest) {
  if (!verifyStaffKey(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const platform = (searchParams.get('platform') || '').toLowerCase();
  const userId = (searchParams.get('user_id') || '').trim();

  if (!userId || !['telegram', 'discord'].includes(platform)) {
    return Response.json(
      { error: 'platform (telegram|discord) and user_id are required' },
      { status: 400 }
    );
  }

  let conn: mysql.Connection | null = null;

  try {
    if (platform === 'telegram') {
      conn = await mysql.createConnection({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASS,
        database: 'tcvkxete_userdb',
        connectTimeout: 8000
      });

      const [rows] = await conn.execute(
        `SELECT id, username, wallet_address, verified
         FROM user_details
         WHERE id = ?
         LIMIT 1`,
        [userId]
      );

      const row = (rows as any[])[0];
      const wallet = row?.wallet_address?.trim() || null;
      const valid = wallet && WALLET_RE.test(wallet);

      return Response.json({
        platform: 'telegram',
        user_id: userId,
        username: row?.username || null,
        wallet_address: valid ? wallet : null,
        verified: !!row?.verified,
        linked: !!valid
      });
    }

    conn = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASS,
      database: 'tcvkxete_discord_members',
      connectTimeout: 8000
    });

    const [rows] = await conn.execute(
      `SELECT discord_id, username, wallet_address, verified
       FROM discord_users
       WHERE discord_id = ?
       LIMIT 1`,
      [userId]
    );

    const row = (rows as any[])[0];
    const wallet = row?.wallet_address?.trim() || null;
    const valid = wallet && wallet !== 'Not set' && WALLET_RE.test(wallet);

    return Response.json({
      platform: 'discord',
      user_id: userId,
      username: row?.username || null,
      wallet_address: valid ? wallet : null,
      verified: !!row?.verified,
      linked: !!valid
    });
  } catch (err: any) {
    console.error('wallet-lookup error', err?.message);
    return Response.json({ error: 'database_error' }, { status: 500 });
  } finally {
    if (conn) {
      try {
        await conn.end();
      } catch {}
    }
  }
}