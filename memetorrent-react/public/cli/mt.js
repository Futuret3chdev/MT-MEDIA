#!/usr/bin/env node
/**
 * MT CLI — https://memetorrent.futuret3ch.com.au/cli/mt.js
 *   node mt.js quotes
 *   node mt.js holders
 *   node mt.js chart
 *   node mt.js status
 *   node mt.js tap
 */
const ORIGIN = process.env.MT_API || 'https://memetorrent.futuret3ch.com.au';
const cmd = (process.argv[2] || 'help').toLowerCase();
const args = process.argv.slice(3);

function flag(name, fallback) {
  const i = args.indexOf('--' + name);
  if (i >= 0 && args[i + 1]) return args[i + 1];
  return fallback;
}

async function get(path) {
  const res = await fetch(ORIGIN + path, { headers: { accept: 'application/json' } });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Not JSON: ' + text.slice(0, 120));
  }
}

function print(obj) {
  process.stdout.write(JSON.stringify(obj, null, 2) + '\n');
}

async function main() {
  if (cmd === 'help' || cmd === '-h' || cmd === '--help') {
    console.log(`MT CLI  (${ORIGIN})

  quotes              Latest $MT quote (price, mcap, liquidity)
  listings            Tracked listings
  chart [--range 24h|7d]
  holders
  pool
  status
  chain
  tap
  tap-quote --lane trips|packages|food [--km 5]
  tap-jobs [--lane trips]
  tapshop
  tapmatch [--connect fast|longterm]
  scores --game tap [--limit 10]
  license --key MT-FREE-…     Verify game software license

Windows PowerShell:
  irm ${ORIGIN}/cli/mt.ps1 -OutFile mt.ps1
  powershell -File .\\mt.ps1 quotes

macOS / Linux (needs Node):
  curl -fsSL ${ORIGIN}/cli/mt.js -o mt.js
  node mt.js quotes
`);
    return;
  }

  if (cmd === 'quotes' || cmd === 'quote' || cmd === 'price') {
    print(await get('/api/v1/cryptocurrency/quotes/latest?symbol=MT'));
    return;
  }
  if (cmd === 'listings') {
    print(await get('/api/v1/cryptocurrency/listings/latest'));
    return;
  }
  if (cmd === 'chart' || cmd === 'ohlcv') {
    const range = flag('range', '24h');
    print(await get('/api/v1/token/ELywDcVX2WumHm4xEfqF8NdEKaeGCAaq9JmwtjE8pump/chart?range=' + encodeURIComponent(range)));
    return;
  }
  if (cmd === 'holders') {
    print(await get('/api/v1/token/ELywDcVX2WumHm4xEfqF8NdEKaeGCAaq9JmwtjE8pump/holders'));
    return;
  }
  if (cmd === 'pool') {
    print(await get('/api/v1/pool/E3kdauLD47xLHAisLuvGTAnqD5MWWJojJYNMCoEvTHi7'));
    return;
  }
  if (cmd === 'status') {
    print(await get('/api/v1/status'));
    return;
  }
  if (cmd === 'chain') {
    print(await get('/api/v1/chain/info'));
    return;
  }
  if (cmd === 'tap') {
    print(await get('/api/v1/tap'));
    return;
  }
  if (cmd === 'tap-quote' || cmd === 'tapquote') {
    const lane = flag('lane', 'trips');
    const km = flag('km', '5');
    print(await get('/api/v1/tap/quote?lane=' + encodeURIComponent(lane) + '&km=' + encodeURIComponent(km)));
    return;
  }
  if (cmd === 'tap-jobs' || cmd === 'tapjobs') {
    const lane = flag('lane', '');
    print(await get('/api/v1/tap/jobs' + (lane ? '?lane=' + encodeURIComponent(lane) : '')));
    return;
  }
  if (cmd === 'tapshop') {
    print(await get('/api/v1/tapshop/listings'));
    return;
  }
  if (cmd === 'tapmatch') {
    const connect = flag('connect', '');
    print(await get('/api/v1/tapmatch/jobs' + (connect ? '?connect=' + encodeURIComponent(connect) : '')));
    return;
  }
  if (cmd === 'license' || cmd === 'games-license') {
    const key = flag('key', '');
    if (!key) {
      console.error('Need --key MT-FREE-…');
      process.exit(1);
    }
    print(await get('/api/v1/games/license?key=' + encodeURIComponent(key)));
    return;
  }
  if (cmd === 'scores') {
    const game = flag('game', 'tap');
    const limit = flag('limit', '10');
    print(await get('/api/scores?game_id=' + encodeURIComponent(game) + '&limit=' + limit));
    return;
  }

  console.error('Unknown command: ' + cmd + '  (try: help)');
  process.exit(1);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
