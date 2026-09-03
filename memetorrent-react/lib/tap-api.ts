import { v1err, v1ok } from '@/lib/mt-v1';
import { fetchMtMarket } from '@/lib/mt-market';
import { getUserDb } from '@/lib/rewards-db';
import { readSessionToken, userBySession } from '@/lib/portal-auth';

export const TAP_LANES = [
  {
    id: 'trips',
    name: 'Trips',
    tag: 'Rides',
    like: 'Uber',
    desc: 'Pick up and drop off. Live trips on a ride network.',
  },
  {
    id: 'packages',
    name: 'Packages',
    tag: 'Drop-offs',
    like: 'Panda',
    desc: 'Send and receive parcels. Local and last-mile.',
  },
  {
    id: 'food',
    name: 'Food',
    tag: 'Deliveries',
    like: 'Dasher',
    desc: 'Restaurant and grocery runs. Food delivery.',
  },
] as const;

export const TAP_PRODUCTS = [
  {
    id: 'tap',
    name: 'TAP',
    desk: '/portal/tap',
    tag: 'Trips · Packages · Food',
    desc: 'Rides, parcels, and food deliveries. Not games.',
  },
  {
    id: 'tapshop',
    name: 'TAPSHOP',
    desk: '/portal/tapshop',
    tag: 'Trade',
    desc: 'Buy, sell, and trade items with $MT and Rockets.',
  },
  {
    id: 'tapmatch',
    name: 'TAPMATCH',
    desk: '/portal/tapmatch',
    tag: 'Work',
    desc: 'Employees and employers. Fast Connect or long-term roles.',
  },
] as const;

const DEMO_JOBS = [
  {
    id: 'tap_demo_trip_1',
    product: 'tap',
    lane: 'trips',
    status: 'open',
    pickup: 'Southbank',
    dropoff: 'Docklands',
    km: 3.2,
    quote: { usd: 7.44, mt: null as number | null, currency: 'USD' },
    demo: true,
  },
  {
    id: 'tap_demo_pkg_1',
    product: 'tap',
    lane: 'packages',
    status: 'open',
    pickup: 'Collingwood',
    dropoff: 'Fitzroy',
    km: 1.8,
    quote: { usd: 5.27, mt: null as number | null, currency: 'USD' },
    demo: true,
  },
  {
    id: 'tap_demo_food_1',
    product: 'tap',
    lane: 'food',
    status: 'open',
    pickup: 'Chin Chin, Flinders Lane',
    dropoff: 'Richmond',
    km: 4.1,
    quote: { usd: 8.4, mt: null as number | null, currency: 'USD' },
    demo: true,
  },
];

const DEMO_LISTINGS = [
  {
    id: 'shop_demo_1',
    product: 'tapshop',
    title: 'MT rocket pin',
    blurb: 'Enamel pin. Pay in $MT.',
    price_mt: 2500,
    status: 'open',
    demo: true,
  },
];

const DEMO_WORK = [
  {
    id: 'match_demo_fast_1',
    product: 'tapmatch',
    connect: 'fast',
    role: 'Evening floor cover',
    blurb: 'Hospitality shift tonight. Fast Connect.',
    status: 'open',
    demo: true,
  },
  {
    id: 'match_demo_long_1',
    product: 'tapmatch',
    connect: 'longterm',
    role: 'Part-time courier',
    blurb: 'Ongoing TAP packages lane. Weekend mornings.',
    status: 'open',
    demo: true,
  },
];

type LaneId = (typeof TAP_LANES)[number]['id'];

function laneOf(raw: string | null | undefined): LaneId | null {
  const s = String(raw || '').trim().toLowerCase();
  if (s === 'trips' || s === 'trip' || s === 'rides' || s === 'ride') return 'trips';
  if (s === 'packages' || s === 'package' || s === 'parcels' || s === 'parcel' || s === 'dropoff') return 'packages';
  if (s === 'food' || s === 'delivery' || s === 'deliveries' || s === 'dasher') return 'food';
  return null;
}

function connectOf(raw: string | null | undefined): 'fast' | 'longterm' | null {
  const s = String(raw || '').trim().toLowerCase();
  if (s === 'fast' || s === 'short' || s === 'short-term' || s === 'fastconnect') return 'fast';
  if (s === 'longterm' || s === 'long' || s === 'long-term') return 'longterm';
  return null;
}

function num(v: unknown, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function newId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export async function tapQuote(input: { lane: LaneId; km: number; size?: string }) {
  const km = Math.max(0.2, Math.min(400, input.km || 5));
  const size = String(input.size || 'm').toLowerCase();
  const sizeFee = size === 'xl' ? 4 : size === 'l' || size === 'large' ? 2 : 0;
  const base = input.lane === 'packages' ? 3.2 : input.lane === 'food' ? 4.5 : 2.8;
  const perKm = input.lane === 'packages' ? 1.15 : input.lane === 'food' ? 0.95 : 1.45;
  const usd = Math.round((base + perKm * km + sizeFee) * 100) / 100;
  let mt: number | null = null;
  try {
    const m = await fetchMtMarket();
    if (m?.price && m.price > 0) mt = Math.round((usd / m.price) * 100) / 100;
  } catch {
    /* quote still valid in USD */
  }
  return {
    lane: input.lane,
    km,
    size: size || 'm',
    usd,
    mt,
    currency: 'USD',
    pay: ['USD', 'MT'] as const,
    notice: 'Estimates only. Live matching lands with TAP desk dispatch.',
  };
}

async function withDb<T>(fn: (conn: Awaited<ReturnType<typeof getUserDb>>) => Promise<T>): Promise<T | null> {
  try {
    const conn = await getUserDb();
    try {
      await ensure(conn);
      return await fn(conn);
    } finally {
      await conn.end();
    }
  } catch (e) {
    console.error('tap-api db', e);
    return null;
  }
}

async function ensure(conn: Awaited<ReturnType<typeof getUserDb>>) {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS mt_tap_jobs (
      id VARCHAR(48) NOT NULL PRIMARY KEY,
      lane VARCHAR(24) NOT NULL,
      status VARCHAR(24) NOT NULL DEFAULT 'open',
      email VARCHAR(190) NULL,
      username VARCHAR(120) NULL,
      pickup VARCHAR(200) NOT NULL,
      dropoff VARCHAR(200) NOT NULL,
      km DECIMAL(8,2) NULL,
      quote_usd DECIMAL(10,2) NULL,
      quote_mt DECIMAL(18,4) NULL,
      payload JSON NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY lane_status (lane, status),
      KEY email_time (email, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS mt_tapshop_listings (
      id VARCHAR(48) NOT NULL PRIMARY KEY,
      email VARCHAR(190) NULL,
      username VARCHAR(120) NULL,
      title VARCHAR(120) NOT NULL,
      blurb VARCHAR(280) NULL,
      price_mt DECIMAL(18,4) NULL,
      status VARCHAR(24) NOT NULL DEFAULT 'open',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY status_time (status, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS mt_tapmatch_jobs (
      id VARCHAR(48) NOT NULL PRIMARY KEY,
      connect_type VARCHAR(24) NOT NULL,
      role VARCHAR(120) NOT NULL,
      blurb VARCHAR(400) NULL,
      email VARCHAR(190) NULL,
      username VARCHAR(120) NULL,
      status VARCHAR(24) NOT NULL DEFAULT 'open',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY connect_status (connect_type, status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS mt_tapmatch_apps (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      job_id VARCHAR(48) NOT NULL,
      email VARCHAR(190) NOT NULL,
      username VARCHAR(120) NOT NULL,
      note VARCHAR(400) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY job_time (job_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function sessionUser() {
  return userBySession(await readSessionToken());
}

function overview() {
  return {
    api: 'tap-v1',
    host: 'https://memetorrent.futuret3ch.com.au',
    docs: 'https://memetorrent.futuret3ch.com.au/developers/docs',
    desk: 'https://memetorrent.futuret3ch.com.au/portal/tap',
    auth: 'Portal session cookie on .futuret3ch.com.au for writes. Reads are keyless.',
    notice: 'TAP is trips, packages, and food — Uber / Dasher / Panda style. Not MT Tap the game.',
    products: TAP_PRODUCTS,
    lanes: TAP_LANES,
  };
}

export async function handleTapV1(opts: {
  method: string;
  path: string;
  url: URL;
  request: Request;
}): Promise<Response | null> {
  const parts = opts.path.split('/').filter(Boolean);
  const root = parts[0];
  if (root !== 'tap' && root !== 'tapshop' && root !== 'tapmatch') return null;

  const method = opts.method.toUpperCase();
  const q = opts.url.searchParams;
  const rest = parts.slice(1);

  try {
    if (root === 'tap' && rest.length === 0 && method === 'GET') {
      return v1ok(overview());
    }

    if (root === 'tap' && rest[0] === 'lanes' && method === 'GET') {
      return v1ok({ lanes: TAP_LANES });
    }

    if (root === 'tap' && rest[0] === 'products' && method === 'GET') {
      return v1ok({ products: TAP_PRODUCTS });
    }

    if (root === 'tap' && rest[0] === 'quote' && method === 'GET') {
      const lane = laneOf(q.get('lane') || 'trips');
      if (!lane) return v1err('lane must be trips, packages, or food', 400, 400);
      const quote = await tapQuote({
        lane,
        km: num(q.get('km'), 5),
        size: q.get('size') || undefined,
      });
      return v1ok({
        ...quote,
        pickup: q.get('from') || q.get('pickup') || null,
        dropoff: q.get('to') || q.get('dropoff') || null,
      });
    }

    if (root === 'tap' && rest[0] === 'me' && method === 'GET') {
      const user = await sessionUser();
      if (!user) return v1err('Sign in to the MT Portal first. TAP accounts are included.', 401, 401);
      const res = v1ok({
        username: user.username,
        email: user.email,
        accounts: TAP_PRODUCTS.map((p) => ({ id: p.id, name: p.name, included: true, desk: p.desk })),
      });
      res.headers.set('Cache-Control', 'private, no-store');
      return res;
    }

    if (root === 'tap' && rest[0] === 'jobs' && method === 'GET') {
      const lane = laneOf(q.get('lane'));
      const id = rest[1];
      if (id) {
        const demo = DEMO_JOBS.find((j) => j.id === id);
        const row = await withDb(async (conn) => {
          const [rows] = await conn.execute(
            'SELECT id, lane, status, username, pickup, dropoff, km, quote_usd, quote_mt, created_at FROM mt_tap_jobs WHERE id = ? LIMIT 1',
            [id]
          );
          const r = (rows as Record<string, unknown>[])[0];
          return r || null;
        });
        if (!row && !demo) return v1err('Job not found', 404, 404);
        return v1ok(
          row
            ? {
                id: row.id,
                product: 'tap',
                lane: row.lane,
                status: row.status,
                pickup: row.pickup,
                dropoff: row.dropoff,
                km: row.km != null ? Number(row.km) : null,
                quote: { usd: row.quote_usd != null ? Number(row.quote_usd) : null, mt: row.quote_mt != null ? Number(row.quote_mt) : null },
                username: row.username,
                created_at: row.created_at,
                demo: false,
              }
            : demo
        );
      }
      const live = (await withDb(async (conn) => {
        const [rows] = await conn.execute(
          lane
            ? 'SELECT id, lane, status, pickup, dropoff, km, quote_usd, quote_mt, created_at FROM mt_tap_jobs WHERE status = ? AND lane = ? ORDER BY created_at DESC LIMIT 40'
            : 'SELECT id, lane, status, pickup, dropoff, km, quote_usd, quote_mt, created_at FROM mt_tap_jobs WHERE status = ? ORDER BY created_at DESC LIMIT 40',
          lane ? ['open', lane] : ['open']
        );
        return (rows as Record<string, unknown>[]).map((r) => ({
          id: r.id,
          product: 'tap',
          lane: r.lane,
          status: r.status,
          pickup: r.pickup,
          dropoff: r.dropoff,
          km: r.km != null ? Number(r.km) : null,
          quote: { usd: r.quote_usd != null ? Number(r.quote_usd) : null, mt: r.quote_mt != null ? Number(r.quote_mt) : null },
          created_at: r.created_at,
          demo: false,
        }));
      })) || [];
      const demo = DEMO_JOBS.filter((j) => !lane || j.lane === lane);
      return v1ok({ jobs: [...live, ...demo].slice(0, 50) });
    }

    if (root === 'tap' && rest[0] === 'jobs' && method === 'POST') {
      const user = await sessionUser();
      if (!user) return v1err('Sign in to the MT Portal to create a TAP job.', 401, 401);
      let body: Record<string, unknown> = {};
      try {
        body = await opts.request.json();
      } catch {
        body = {};
      }
      const lane = laneOf(String(body.lane || q.get('lane') || 'trips'));
      if (!lane) return v1err('lane must be trips, packages, or food', 400, 400);
      const pickup = String(body.from || body.pickup || '').trim().slice(0, 200);
      const dropoff = String(body.to || body.dropoff || '').trim().slice(0, 200);
      if (pickup.length < 2 || dropoff.length < 2) return v1err('from and to are required', 400, 400);
      const km = Math.max(0.2, Math.min(400, num(body.km, 5)));
      const quote = await tapQuote({ lane, km, size: String(body.size || 'm') });
      const id = newId(`tap_${lane.slice(0, 3)}`);
      const saved = await withDb(async (conn) => {
        await conn.execute(
          'INSERT INTO mt_tap_jobs (id, lane, status, email, username, pickup, dropoff, km, quote_usd, quote_mt, payload) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
          [id, lane, 'open', user.email, user.username, pickup, dropoff, km, quote.usd, quote.mt, JSON.stringify({ size: quote.size })]
        );
        return true;
      });
      if (!saved) return v1err('Could not store TAP job', 502, 502);
      return v1ok({
        id,
        product: 'tap',
        lane,
        status: 'open',
        pickup,
        dropoff,
        km,
        quote,
        username: user.username,
      });
    }

    if (root === 'tapshop' && (rest.length === 0 || rest[0] === 'listings') && method === 'GET') {
      if (rest.length === 0) {
        return v1ok({
          product: 'tapshop',
          desk: '/portal/tapshop',
          tag: 'Trade',
          pay: ['MT', 'Rockets'],
          listings: '/api/v1/tapshop/listings',
        });
      }
      const live = (await withDb(async (conn) => {
        const [rows] = await conn.execute(
          'SELECT id, title, blurb, price_mt, status, username, created_at FROM mt_tapshop_listings WHERE status = ? ORDER BY created_at DESC LIMIT 40',
          ['open']
        );
        return (rows as Record<string, unknown>[]).map((r) => ({
          id: r.id,
          product: 'tapshop',
          title: r.title,
          blurb: r.blurb,
          price_mt: r.price_mt != null ? Number(r.price_mt) : null,
          status: r.status,
          username: r.username,
          created_at: r.created_at,
          demo: false,
        }));
      })) || [];
      return v1ok({ listings: [...live, ...DEMO_LISTINGS] });
    }

    if (root === 'tapshop' && rest[0] === 'listings' && method === 'POST') {
      const user = await sessionUser();
      if (!user) return v1err('Sign in to the MT Portal to list on TAPSHOP.', 401, 401);
      let body: Record<string, unknown> = {};
      try {
        body = await opts.request.json();
      } catch {
        body = {};
      }
      const title = String(body.title || '').trim().slice(0, 120);
      const blurb = String(body.blurb || '').trim().slice(0, 280);
      const price_mt = Math.max(0, num(body.price_mt, 0));
      if (title.length < 2) return v1err('title is required', 400, 400);
      const id = newId('shop');
      const saved = await withDb(async (conn) => {
        await conn.execute(
          'INSERT INTO mt_tapshop_listings (id, email, username, title, blurb, price_mt, status) VALUES (?,?,?,?,?,?,?)',
          [id, user.email, user.username, title, blurb, price_mt || null, 'open']
        );
        return true;
      });
      if (!saved) return v1err('Could not store listing', 502, 502);
      return v1ok({ id, product: 'tapshop', title, blurb, price_mt, status: 'open', username: user.username });
    }

    if (root === 'tapmatch' && rest.length === 0 && method === 'GET') {
      return v1ok({
        product: 'tapmatch',
        desk: '/portal/tapmatch',
        tag: 'Work',
        connect: [
          { id: 'fast', name: 'Fast Connect', desc: 'Short-term shifts and cover.' },
          { id: 'longterm', name: 'Long-term', desc: 'Part-time, full-time, or contract.' },
        ],
        jobs: '/api/v1/tapmatch/jobs',
      });
    }

    if (root === 'tapmatch' && rest[0] === 'jobs' && method === 'GET') {
      const connect = connectOf(q.get('connect') || q.get('type'));
      const live = (await withDb(async (conn) => {
        const [rows] = await conn.execute(
          connect
            ? 'SELECT id, connect_type, role, blurb, status, username, created_at FROM mt_tapmatch_jobs WHERE status = ? AND connect_type = ? ORDER BY created_at DESC LIMIT 40'
            : 'SELECT id, connect_type, role, blurb, status, username, created_at FROM mt_tapmatch_jobs WHERE status = ? ORDER BY created_at DESC LIMIT 40',
          connect ? ['open', connect] : ['open']
        );
        return (rows as Record<string, unknown>[]).map((r) => ({
          id: r.id,
          product: 'tapmatch',
          connect: r.connect_type,
          role: r.role,
          blurb: r.blurb,
          status: r.status,
          username: r.username,
          created_at: r.created_at,
          demo: false,
        }));
      })) || [];
      const demo = DEMO_WORK.filter((j) => !connect || j.connect === connect);
      return v1ok({ jobs: [...live, ...demo] });
    }

    if (root === 'tapmatch' && rest[0] === 'jobs' && method === 'POST') {
      const user = await sessionUser();
      if (!user) return v1err('Sign in to the MT Portal to post TAPMATCH work.', 401, 401);
      let body: Record<string, unknown> = {};
      try {
        body = await opts.request.json();
      } catch {
        body = {};
      }
      const connect = connectOf(String(body.connect || body.type || 'fast')) || 'fast';
      const role = String(body.role || body.title || '').trim().slice(0, 120);
      const blurb = String(body.blurb || '').trim().slice(0, 400);
      if (role.length < 2) return v1err('role is required', 400, 400);
      const id = newId('match');
      const saved = await withDb(async (conn) => {
        await conn.execute(
          'INSERT INTO mt_tapmatch_jobs (id, connect_type, role, blurb, email, username, status) VALUES (?,?,?,?,?,?,?)',
          [id, connect, role, blurb, user.email, user.username, 'open']
        );
        return true;
      });
      if (!saved) return v1err('Could not store TAPMATCH job', 502, 502);
      return v1ok({ id, product: 'tapmatch', connect, role, blurb, status: 'open', username: user.username });
    }

    if (root === 'tapmatch' && rest[0] === 'apply' && method === 'POST') {
      const user = await sessionUser();
      if (!user) return v1err('Sign in to the MT Portal to apply.', 401, 401);
      let body: Record<string, unknown> = {};
      try {
        body = await opts.request.json();
      } catch {
        body = {};
      }
      const job_id = String(body.job_id || '').trim().slice(0, 48);
      const note = String(body.note || '').trim().slice(0, 400);
      if (job_id.length < 4) return v1err('job_id is required', 400, 400);
      const saved = await withDb(async (conn) => {
        await conn.execute(
          'INSERT INTO mt_tapmatch_apps (job_id, email, username, note) VALUES (?,?,?,?)',
          [job_id, user.email, user.username, note || null]
        );
        return true;
      });
      if (!saved) return v1err('Could not store application', 502, 502);
      return v1ok({ ok: true, job_id, username: user.username, note: note || null });
    }

    if (method === 'POST') {
      return v1err(`Unknown TAP POST /api/v1/${opts.path}`, 404, 404);
    }
    return v1err(`Unknown TAP path /api/v1/${opts.path}`, 404, 404);
  } catch (e) {
    console.error('tap v1', opts.path, e);
    return v1err('TAP API unavailable', 502, 502);
  }
}
