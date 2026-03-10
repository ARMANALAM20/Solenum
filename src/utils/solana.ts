import {
  Keypair,
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from 'bip39';
import { derivePath } from 'ed25519-hd-key';

export type Network = 'mainnet-beta' | 'devnet' | 'testnet';

export const NETWORKS: Record<Network, string> = {
  'mainnet-beta': `https://solana-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_MAINNET_KEY}`,
  devnet: 'https://api.devnet.solana.com',
  testnet: 'https://api.testnet.solana.com',
};

export const NETWORK_LABELS: Record<Network, string> = {
  'mainnet-beta': 'Mainnet',
  devnet: 'Devnet',
  testnet: 'Testnet',
};

export function generateNewMnemonic(): string {
  return generateMnemonic();
}

export function validateMnemonicPhrase(mnemonic: string): boolean {
  return validateMnemonic(mnemonic.trim());
}

export function deriveKeypair(mnemonic: string, accountIndex: number): Keypair {
  const seed = mnemonicToSeedSync(mnemonic.trim());
  const path = `m/44'/501'/${accountIndex}'/0'`;
  const derivedSeed = derivePath(path, seed.toString('hex')).key;
  return Keypair.fromSeed(derivedSeed);
}

export async function getBalance(publicKey: string, network: Network): Promise<number> {
  const connection = new Connection(NETWORKS[network], 'confirmed');
  const balance = await connection.getBalance(new PublicKey(publicKey));
  return balance / LAMPORTS_PER_SOL;
}

export async function sendSol(
  fromKeypair: Keypair,
  toAddress: string,
  amount: number,
  network: Network
): Promise<string> {
  const connection = new Connection(NETWORKS[network], 'confirmed');
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: fromKeypair.publicKey,
      toPubkey: new PublicKey(toAddress),
      lamports: Math.floor(amount * LAMPORTS_PER_SOL),
    })
  );
  const signature = await sendAndConfirmTransaction(connection, transaction, [fromKeypair]);
  return signature;
}

export async function requestAirdrop(publicKey: string, network: Network): Promise<string> {
  if (network === 'mainnet-beta') throw new Error('Airdrop not available on mainnet');

  // Try the dedicated faucet API first (more reliable than public RPC)
  if (network === 'devnet') {
    try {
      const res = await fetch('https://faucet.solana.com/api/v1/fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pubkey: publicKey, lamports: LAMPORTS_PER_SOL }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.signature ?? 'airdrop-ok';
      }
    } catch {
      // fall through to RPC airdrop
    }
  }

  // Fallback: RPC airdrop
  const connection = new Connection(NETWORKS[network], 'confirmed');
  const pubKey = new PublicKey(publicKey);
  const signature = await connection.requestAirdrop(pubKey, LAMPORTS_PER_SOL);
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
  await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');
  return signature;
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Returns true if the account has any on-chain activity
 * (non-zero balance OR at least one transaction signature).
 */
async function hasAccountActivity(publicKey: string, network: Network): Promise<boolean> {
  const connection = new Connection(NETWORKS[network], 'confirmed');
  const pubKey = new PublicKey(publicKey);
  const balance = await connection.getBalance(pubKey);
  if (balance > 0) return true;
  const sigs = await connection.getSignaturesForAddress(pubKey, { limit: 1 });
  return sigs.length > 0;
}

/**
 * BIP44 account discovery: derive accounts sequentially and stop
 * when `gapLimit` consecutive unused accounts are found.
 * Returns the number of active accounts (minimum 1).
 */
export async function discoverAccountCount(
  mnemonic: string,
  network: Network,
  gapLimit = 1
): Promise<number> {
  let lastUsedIndex = -1;
  let index = 0;
  let gap = 0;

  while (gap < gapLimit) {
    const keypair = deriveKeypair(mnemonic, index);
    const active = await hasAccountActivity(keypair.publicKey.toBase58(), network);
    if (active) {
      lastUsedIndex = index;
      gap = 0;
    } else {
      gap++;
    }
    index++;
    // Safety cap: don't scan more than 20 accounts
    if (index >= 20) break;
  }

  return lastUsedIndex + 1; // e.g. 0 → show 1, 2 → show 3
}
