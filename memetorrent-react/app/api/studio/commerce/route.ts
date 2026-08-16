import { NextRequest } from 'next/server';
import { getUserDb } from '@/lib/rewards-db';
import { readSessionToken, userBySession } from '@/lib/portal-auth';
import { ensureCommerce, newApiKey, slugify } from '@/lib/studio-commerce';

export async function GET() {
  const user = await userBySession(await readSessionToken());
  const conn = await getUserDb();
  try {
    await ensureCommerce(conn);
    const [items] = await conn.execute(
      'SELECT i.sku, i.name, i.price_mt, i.kind, p.name AS project FROM mt_studio_items i JOIN mt_studio_projects p ON p.id = i.project_id ORDER BY i.id DESC LIMIT 40'
    );
    let inventory: object[] = [];
    let projects: object[] = [];
    if (user) {
      const [inv] = await conn.execute(
        'SELECT sku, qty FROM mt_studio_inventory WHERE buyer_email = ?',
        [user.email]
      );
      inventory = inv as object[];
      const [proj] = await conn.execute(
        'SELECT id, name, slug, api_key FROM mt_studio_projects WHERE email = ? ORDER BY id DESC',
        [user.email]
      );
      projects = proj as object[];
    }
    return Response.json({ ok: true, catalog: items, inventory, projects, user: user ? user.username : null });
  } catch (err) {
    console.error('commerce get', err);
    return Response.json({ ok: false, error: 'Commerce unavailable' }, { status: 500 });
  } finally {
    await conn.end();
  }
}

export async function POST(request: NextRequest) {
  const user = await userBySession(await readSessionToken());
  if (!user) return Response.json({ ok: false, error: 'Sign in' }, { status: 401 });
  let body: { action?: string; name?: string; sku?: string; price_mt?: number; kind?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const conn = await getUserDb();
  try {
    await ensureCommerce(conn);
    if (body.action === 'seed') {
      const [have] = await conn.execute(
        'SELECT id FROM mt_studio_projects WHERE email = ? LIMIT 1',
        [user.email]
      );
      let projectId = (have as { id: string | number }[])[0]?.id;
      if (!projectId) {
        await conn.execute(
          'INSERT INTO mt_studio_projects (email, username, name, slug, api_key) VALUES (?,?,?,?,?)',
          [user.email, user.username, 'Demo Shop', 'demo-' + Date.now().toString(36), newApiKey()]
        );
        const [created] = await conn.execute(
          'SELECT id FROM mt_studio_projects WHERE email = ? ORDER BY id DESC LIMIT 1',
          [user.email]
        );
        projectId = (created as { id: string | number }[])[0]?.id;
      }
      const seeds = [
        ['ROCKET_PACK', 'Rocket pack', 10, 'currency'],
        ['SKIN_GOLD', 'Gold skin', 25, 'item'],
        ['BATTLE_PASS', 'Season pass', 50, 'pass'],
      ];
      for (const [s, n, p, k] of seeds) {
        await conn.execute(
          `INSERT IGNORE INTO mt_studio_items (project_id, sku, name, price_mt, kind) VALUES (?,?,?,?,?)`,
          [String(projectId), s, n, p, k]
        );
      }
      return Response.json({ ok: true, seeded: true });
    }
    if (body.action === 'project') {
      const name = String(body.name || '').trim().slice(0, 80);
      if (name.length < 2) return Response.json({ ok: false, error: 'Project name required' }, { status: 400 });
      const slug = slugify(name) + '-' + Date.now().toString(36).slice(-4);
      await conn.execute(
        'INSERT INTO mt_studio_projects (email, username, name, slug, api_key) VALUES (?,?,?,?,?)',
        [user.email, user.username, name, slug, newApiKey()]
      );
      return Response.json({ ok: true });
    }
    if (body.action === 'item') {
      const [proj] = await conn.execute(
        'SELECT id FROM mt_studio_projects WHERE email = ? ORDER BY id DESC LIMIT 1',
        [user.email]
      );
      const project = (proj as { id: string | number }[])[0];
      if (!project) return Response.json({ ok: false, error: 'Create a project first' }, { status: 400 });
      const sku = String(body.sku || '').trim().slice(0, 64);
      const name = String(body.name || '').trim().slice(0, 80);
      const price = Math.max(0, Math.floor(Number(body.price_mt) || 0));
      if (!sku || !name) return Response.json({ ok: false, error: 'SKU and name required' }, { status: 400 });
      await conn.execute(
        'INSERT INTO mt_studio_items (project_id, sku, name, price_mt, kind) VALUES (?,?,?,?,?)',
        [String(project.id), sku, name, price, String(body.kind || 'item').slice(0, 24)]
      );
      return Response.json({ ok: true });
    }
    if (body.action === 'buy') {
      const sku = String(body.sku || '').trim();
      const [found] = await conn.execute(
        'SELECT i.sku, i.name, i.price_mt, i.project_id FROM mt_studio_items i WHERE i.sku = ? LIMIT 1',
        [sku]
      );
      const item = (found as { sku: string; price_mt: number; project_id: string | number }[])[0];
      if (!item) return Response.json({ ok: false, error: 'Unknown SKU' }, { status: 404 });
      await conn.execute(
        'INSERT INTO mt_studio_orders (project_id, buyer_email, sku, price_mt, status) VALUES (?,?,?,?,?)',
        [String(item.project_id), user.email, item.sku, item.price_mt, 'paid']
      );
      await conn.execute(
        `INSERT INTO mt_studio_inventory (buyer_email, sku, qty) VALUES (?,?,1)
         ON DUPLICATE KEY UPDATE qty = qty + 1`,
        [user.email, item.sku]
      );
      return Response.json({ ok: true, fulfilled: item.sku, price_mt: item.price_mt });
    }
    return Response.json({ ok: false, error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('commerce post', err);
    return Response.json({ ok: false, error: 'Could not complete' }, { status: 500 });
  } finally {
    await conn.end();
  }
}
