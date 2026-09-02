'use client';

import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

export const WalletAdapterProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const network = WalletAdapterNetwork.Mainnet;

  // Use the same RPC preference as the rest of the buy flow
  const endpoint = useMemo(() => {
    // Hardcode the standard public Solana RPC. This avoids any restricted API keys from env vars that cause 403 errors.
    // 'https://api.mainnet-beta.solana.com' is the official public endpoint and works reliably for getLatestBlockhash and balance queries.
    return 'https://api.mainnet-beta.solana.com';
  }, [network]);

  // Wallet Standard (Phantom / Solflare / Backpack) registers itself.
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
};
