import { Connection } from '@solana/web3.js';

function rpcUrl() {
  return process.env.VITE_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const signature = searchParams.get('signature');
  if (!signature) {
    return Response.json({ error: 'signature required' }, { status: 400 });
  }

  const connection = new Connection(rpcUrl(), 'confirmed');
  try {
    const status = await connection.getSignatureStatus(signature);
    const value = status.value;
    const confirmed =
      value?.confirmationStatus === 'confirmed' ||
      value?.confirmationStatus === 'finalized';
    return Response.json({
      signature,
      confirmed,
      confirmationStatus: value?.confirmationStatus || null,
      err: value?.err || null
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}