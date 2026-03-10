import { useState, useEffect, useCallback } from 'react';
import { Keypair } from '@solana/web3.js';
import { deriveKeypair, getBalance, discoverAccountCount } from '../utils/solana';
import type { Network } from '../utils/solana';

export interface WalletAccount {
  index: number;
  publicKey: string;
  keypair: Keypair;
  balance: number | null;
  name: string;
  loadingBalance: boolean;
}

export function useWallet(mnemonic: string | null, network: Network) {
  const [accounts, setAccounts] = useState<WalletAccount[]>([]);
  const [refreshingAll, setRefreshingAll] = useState(false);
  const [discovering, setDiscovering] = useState(false);

  const refreshBalance = useCallback(
    async (publicKey: string) => {
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.publicKey === publicKey ? { ...acc, loadingBalance: true } : acc
        )
      );
      try {
        const balance = await getBalance(publicKey, network);
        setAccounts((prev) =>
          prev.map((acc) =>
            acc.publicKey === publicKey
              ? { ...acc, balance, loadingBalance: false }
              : acc
          )
        );
      } catch {
        setAccounts((prev) =>
          prev.map((acc) =>
            acc.publicKey === publicKey
              ? { ...acc, balance: null, loadingBalance: false }
              : acc
          )
        );
      }
    },
    [network]
  );

  const refreshAllBalances = useCallback(
    async (accs: WalletAccount[]) => {
      setRefreshingAll(true);
      await Promise.all(accs.map((acc) => refreshBalance(acc.publicKey)));
      setRefreshingAll(false);
    },
    [refreshBalance]
  );

  const addAccount = useCallback(() => {
    if (!mnemonic) return;
    const index = accounts.length;
    const keypair = deriveKeypair(mnemonic, index);
    const newAccount: WalletAccount = {
      index,
      publicKey: keypair.publicKey.toBase58(),
      keypair,
      balance: null,
      name: `Wallet ${index + 1}`,
      loadingBalance: false,
    };
    setAccounts((prev) => {
      const updated = [...prev, newAccount];
      refreshBalance(newAccount.publicKey);
      return updated;
    });
  }, [mnemonic, accounts.length, refreshBalance]);

  const renameAccount = useCallback((publicKey: string, newName: string) => {
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.publicKey === publicKey ? { ...acc, name: newName } : acc
      )
    );
  }, []);

  const deleteAccount = useCallback((publicKey: string) => {
    setAccounts((prev) => prev.filter((acc) => acc.publicKey !== publicKey));
  }, []);

  // Initialize accounts when mnemonic is set — run account discovery
  useEffect(() => {
    if (!mnemonic) {
      setAccounts([]);
      return;
    }

    let cancelled = false;

    async function init() {
      setDiscovering(true);
      setAccounts([]);

      try {
        const count = await discoverAccountCount(mnemonic!, network);
        if (cancelled) return;

        const discovered: WalletAccount[] = Array.from({ length: Math.max(count, 1) }, (_, i) => {
          const keypair = deriveKeypair(mnemonic!, i);
          return {
            index: i,
            publicKey: keypair.publicKey.toBase58(),
            keypair,
            balance: null,
            name: `Wallet ${i + 1}`,
            loadingBalance: false,
          };
        });

        if (!cancelled) {
          setAccounts(discovered);
          discovered.forEach((acc) => refreshBalance(acc.publicKey));
        }
      } finally {
        if (!cancelled) setDiscovering(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, [mnemonic]);

  // Refresh all balances on network change
  useEffect(() => {
    if (accounts.length > 0) {
      refreshAllBalances(accounts);
    }
  }, [network]);

  return {
    accounts,
    addAccount,
    renameAccount,
    deleteAccount,
    refreshBalance,
    refreshAllBalances: () => refreshAllBalances(accounts),
    refreshingAll,
    discovering,
  };
}
