import { NextRequest, NextResponse } from 'next/server';

const SITE = 'https://memetorrent.futuret3ch.com.au';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code') || '';
  const state = request.nextUrl.searchParams.get('state') || '';
  const error = request.nextUrl.searchParams.get('error') || '';
  const errorDescription = request.nextUrl.searchParams.get('error_description') || '';

  if (state.startsWith('nm_')) {
    const dest = new URL('/casino-floor/auth/callback.html', SITE);
    if (code) dest.searchParams.set('code', code);
    if (state) dest.searchParams.set('state', state);
    if (error) dest.searchParams.set('error', error);
    if (errorDescription) dest.searchParams.set('error_description', errorDescription);
    return NextResponse.redirect(dest);
  }

  if (code) {
    const dest = new URL('/games/api/connectSocial.php', SITE);
    dest.searchParams.set('platform', 'discord');
    dest.searchParams.set('code', code);
    return NextResponse.redirect(dest);
  }

  return Response.json({ error: 'OAuth failed: No code received' }, { status: 400 });
}
