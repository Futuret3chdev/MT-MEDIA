import type mysql from 'mysql2/promise';

export async function ensureNotices(conn: mysql.Connection) {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS mt_chat_notices (
      id BIGINT NOT NULL AUTO_INCREMENT,
      to_email VARCHAR(190) NOT NULL,
      kind VARCHAR(32) NOT NULL,
      title VARCHAR(180) NOT NULL,
      href VARCHAR(240) NULL,
      from_email VARCHAR(190) NULL,
      from_username VARCHAR(80) NULL,
      seen TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY to_seen (to_email, seen, id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

export async function addNotice(
  conn: mysql.Connection,
  row: {
    to_email: string;
    kind: string;
    title: string;
    href?: string | null;
    from_email?: string | null;
    from_username?: string | null;
  }
) {
  await ensureNotices(conn);
  await conn.execute(
    'INSERT INTO mt_chat_notices (to_email, kind, title, href, from_email, from_username) VALUES (?,?,?,?,?,?)',
    [
      row.to_email.toLowerCase(),
      row.kind,
      row.title.slice(0, 180),
      row.href || null,
      row.from_email || null,
      row.from_username || null,
    ]
  );
}
