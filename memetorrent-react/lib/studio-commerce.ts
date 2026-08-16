import type mysql from 'mysql2/promise';
import crypto from 'crypto';

export async function ensureCommerce(conn: mysql.Connection) {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS mt_studio_projects (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(190) NOT NULL,
      username VARCHAR(120) NOT NULL,
      name VARCHAR(80) NOT NULL,
      slug VARCHAR(80) NOT NULL,
      api_key VARCHAR(64) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY slug (slug),
      KEY email_idx (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS mt_studio_items (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      project_id BIGINT UNSIGNED NOT NULL,
      sku VARCHAR(64) NOT NULL,
      name VARCHAR(80) NOT NULL,
      price_mt INT NOT NULL DEFAULT 0,
      kind VARCHAR(24) NOT NULL DEFAULT 'item',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY proj_sku (project_id, sku)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS mt_studio_orders (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      project_id BIGINT UNSIGNED NOT NULL,
      buyer_email VARCHAR(190) NOT NULL,
      sku VARCHAR(64) NOT NULL,
      price_mt INT NOT NULL,
      status VARCHAR(16) NOT NULL DEFAULT 'paid',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY buyer (buyer_email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS mt_studio_inventory (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      buyer_email VARCHAR(190) NOT NULL,
      sku VARCHAR(64) NOT NULL,
      qty INT NOT NULL DEFAULT 1,
      UNIQUE KEY buyer_sku (buyer_email, sku)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

export function newApiKey() {
  return 'mt_' + crypto.randomBytes(18).toString('hex');
}

export function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'game'
  );
}
