#!/usr/bin/env node
/**
 * MT CLI — https://memetorrent.futuret3ch.com.au/cli/mt.js
 *   node mt.js quotes
 *   node mt.js holders
 *   node mt.js chart
 *   node mt.js status
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
  scores --game tap [--limit 10]

Install:
  curl -fsSL ${ORIGIN}/cli/mt.js -o mt.js && chmod +x mt.js
  ./mt.js quotes
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
