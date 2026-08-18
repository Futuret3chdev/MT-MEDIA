import { NextRequest } from 'next/server';

const CLIENT_ID = process.env.DISCORD_CLIENT_ID || '1380444668562505789';
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || 'Pl_jTJEmumMAtPknE19iYEkApjS_9Wnh';
const SITE_REDIRECT = 'https://memetorrent.futuret3ch.com.au/games/api/discord-callback.php';

export async function POST(request: NextRequest) {
  let body: { code?: string; redirect_uri?: string; code_verifier?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const code = String(body.code || '').trim();
  const redirectUri = String(body.redirect_uri || SITE_REDIRECT).trim() || SITE_REDIRECT;
  const codeVerifier = String(body.code_verifier || '').trim();
  if (!code) {
    return Response.json({ error: 'Missing code' }, { status: 400 });
  }

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  });
  if (codeVerifier) params.set('code_verifier', codeVerifier);

  try {
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });
    const data = await tokenRes.json();
    if (!tokenRes.ok) {
      return Response.json(
        { error: data.error_description || data.error || 'Discord token failed' },
        { status: tokenRes.status }
      );
    }

    const meRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    const me = await meRes.json();
    if (!meRes.ok || !me?.id) {
      return Response.json({ error: 'Could not load Discord profile' }, { status: 502 });
    }

    return Response.json({ access_token: data.access_token, user: me });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Discord token request failed';
    return Response.json({ error: message }, { status: 500 });
  }
}
