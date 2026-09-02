import { CORS, v1ok } from '@/lib/mt-v1';

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function GET() {
  return v1ok({
    api: 'mt-v1',
    version: '1.0.0',
    docs: 'https://memetorrent.futuret3ch.com.au/developers/docs',
    cli: 'https://memetorrent.futuret3ch.com.au/cli/mt.js',
  });
}
