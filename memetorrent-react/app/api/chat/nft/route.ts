import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const mint = String(request.nextUrl.searchParams.get('mint') || '').trim();
  if (mint.length < 32) return Response.json({ ok: false, error: 'Need mint' }, { status: 400 });
  let name = 'NFT';
  let image = '';
  try {
    const r = await fetch(`https://api-mainnet.magiceden.dev/v2/tokens/${mint}`, {
      headers: { accept: 'application/json' },
    });
    if (r.ok) {
      const j = (await r.json()) as { name?: string; image?: string };
      name = j.name || name;
      image = j.image || '';
    }
  } catch {
    /* preview optional */
  }
  return Response.json({
    ok: true,
    mint,
    name,
    image,
    explorer: `https://solscan.io/token/${mint}`,
  });
}
