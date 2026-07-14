import { Connection, PublicKey } from '@solana/web3.js';

function rpcUrl() {
  return process.env.VITE_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  if (!address) {
    return Response.json({ error: 'address required' }, { status: 400 });
  }

  const connection = new Connection(rpcUrl(), 'confirmed');
  try {
    const info = await connection.getAccountInfo(new PublicKey(address));
    return Response.json({ exists: info !== null, address });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}