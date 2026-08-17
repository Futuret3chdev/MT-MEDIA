import { NextRequest } from 'next/server';

const cache = new Map<string, { t: string; at: number }>();

export async function POST(request: NextRequest) {
  let body: { text?: string; to?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const text = String(body.text || '').trim().slice(0, 500);
  const to = String(body.to || 'en').slice(0, 8);
  if (!text) return Response.json({ ok: true, text: '' });
  const key = `${to}:${text}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 30 * 60_000) {
    return Response.json({ ok: true, text: hit.t });
  }
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=autodetect|${encodeURIComponent(to)}`;
    const r = await fetch(url, { next: { revalidate: 0 } });
    const j = await r.json();
    const out = String(j?.responseData?.translatedText || text);
    cache.set(key, { t: out, at: Date.now() });
    if (cache.size > 400) {
      const first = cache.keys().next().value;
      if (first) cache.delete(first);
    }
    return Response.json({ ok: true, text: out });
  } catch {
    return Response.json({ ok: true, text });
  }
}
