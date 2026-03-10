import { useState } from 'react';
import WalletSetup from './components/WalletSetup';
import Dashboard from './components/Dashboard';
import type { Network } from './utils/solana';

export default function App() {
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [network, setNetwork] = useState<Network>('devnet');

  if (!mnemonic) {
    return <WalletSetup onComplete={(m, n) => { setMnemonic(m); setNetwork(n); }} />;
  }

  return <Dashboard mnemonic={mnemonic} initialNetwork={network} onLock={() => setMnemonic(null)} />;
}
