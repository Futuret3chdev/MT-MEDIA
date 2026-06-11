import { NextRequest } from 'next/server';
import mysql from 'mysql2/promise';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start_date') || new Date().toISOString().slice(0, 10);
  const end = searchParams.get('end_date') || start;

  // Melbourne dates for daily/monthly
  const tz = 'Australia/Melbourne';
  const now = new Date();
  const today = now.toLocaleDateString('sv-SE', { timeZone: tz });
  const month = today.slice(0, 7);
  const lastUpdated = now.toLocaleString('sv-SE', { timeZone: tz }) + ' AEST';

  const response: any = {
    timestamp: lastUpdated,
    telegram: { range: [], daily: [], monthly: [] },
    discord: { range: [], daily: [], monthly: [] }
  };

  const baseConfig = {
    host: process.env.DB_HOST || '50.6.160.248',
    user: process.env.DB_USER || 'tcvkxete_admin',
    password: process.env.DB_PASS || 'Shinhwa1@@',
    connectTimeout: 8000,
  };

  // Telegram
  try {
    const conn = await mysql.createConnection({ ...baseConfig, database: 'tcvkxete_message_tracking' });

    // Custom range
    const [rangeTg] = await conn.execute(
      `SELECT user_id, username, SUM(message_count) AS message_count
       FROM daily_message_counts
       WHERE date BETWEEN ? AND ?
       GROUP BY user_id, username
       ORDER BY message_count DESC`,
      [start, end]
    );
    response.telegram.range = rangeTg;

    // Daily (today)
    const [dailyTg] = await conn.execute(
      `SELECT user_id, username, message_count
       FROM daily_message_counts
       WHERE date = ? ORDER BY message_count DESC`,
      [today]
    );
    response.telegram.daily = dailyTg;

    // Monthly
    const [monthlyTg] = await conn.execute(
      `SELECT user_id, username, total_message_count
       FROM monthly_message_totals
       WHERE month = ? ORDER BY total_message_count DESC`,
      [month]
    );
    response.telegram.monthly = monthlyTg;

    await conn.end();
  } catch (e) {
    console.error('Telegram DB error:', e);
  }

  // Discord
  try {
    const conn = await mysql.createConnection({ ...baseConfig, database: 'tcvkxete_discord_members' });

    // Custom range
    const [rangeDc] = await conn.execute(
      `SELECT author_id AS user_id,
             COALESCE(author_username, 'Unknown') AS username,
             COUNT(*) AS message_count
       FROM messages
       WHERE DATE(CONVERT_TZ(timestamp, '+00:00', '+10:00')) BETWEEN ? AND ?
       GROUP BY author_id, author_username
       ORDER BY message_count DESC`,
      [start, end]
    );
    response.discord.range = rangeDc;

    // Daily (today)
    const [dailyDc] = await conn.execute(
      `SELECT author_id AS user_id,
             COALESCE(author_username, 'Unknown') AS username,
             COUNT(*) AS message_count
       FROM messages
       WHERE DATE(CONVERT_TZ(timestamp, '+00:00', '+10:00')) = ?
       GROUP BY author_id, author_username
       ORDER BY message_count DESC`,
      [today]
    );
    response.discord.daily = dailyDc;

    // Monthly
    const [monthlyDc] = await conn.execute(
      `SELECT author_id AS user_id,
             COALESCE(author_username, 'Unknown') AS username,
             COUNT(*) AS total_message_count
       FROM messages
       WHERE DATE_FORMAT(CONVERT_TZ(timestamp, '+00:00', '+10:00'), '%Y-%m') = ?
       GROUP BY author_id, author_username
       ORDER BY total_message_count DESC`,
      [month]
    );
    response.discord.monthly = monthlyDc;

    await conn.end();
  } catch (e) {
    console.error('Discord DB error:', e);
  }

  return new Response(JSON.stringify(response), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
