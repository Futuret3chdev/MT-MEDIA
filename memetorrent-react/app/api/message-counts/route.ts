import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // MySQL dependency disabled to resolve Turbopack build module resolution error.
  // This API returns stub data; real message counts can be restored when DB access is configured for build.
  const now = new Date().toISOString();
  return NextResponse.json({
    timestamp: now,
    telegram: { range: [], daily: [], monthly: [] },
    discord: { range: [], daily: [], monthly: [] },
    note: 'Message counts API temporarily stubbed for build compatibility.'
  });
}
