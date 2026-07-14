import { Connection } from '@solana/web3.js';

function rpcUrl() {
  return process.env.VITE_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
}

export async function POST(request: Request) {
  let body: { transaction?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const raw = body?.transaction;
  if (!raw || typeof raw !== 'string') {
    return Response.json({ error: 'transaction (base64) required' }, { status: 400 });
  }

  const connection = new Connection(rpcUrl(), 'confirmed');
  try {
    const bytes = Buffer.from(raw, 'base64');
    const signature = await connection.sendRawTransaction(bytes, {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
      maxRetries: 3
    });
    return Response.json({ signature });
  } catch (error: any) {
    const msg = error?.message || 'send_failed';
    return Response.json({ error: msg }, { status: 500 });
  }
}