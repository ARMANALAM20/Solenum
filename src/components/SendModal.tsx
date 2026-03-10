import { useState } from 'react';
import { sendSol } from '../utils/solana';
import type { Network } from '../utils/solana';
import type { WalletAccount } from '../hooks/useWallet';

interface SendModalProps {
  account: WalletAccount;
  network: Network;
  allAccounts: WalletAccount[];
  onClose: () => void;
  onSuccess: (publicKey: string) => void;
}

export default function SendModal({ account, network, allAccounts, onClose, onSuccess }: SendModalProps) {
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [txSig, setTxSig] = useState('');
  const [error, setError] = useState('');

  async function handleSend() {
    setError('');
    const amountNum = parseFloat(amount);
    if (!toAddress.trim()) return setError('Please enter a recipient address.');
    if (isNaN(amountNum) || amountNum <= 0) return setError('Please enter a valid amount.');
    if (account.balance !== null && amountNum > account.balance)
      return setError('Insufficient balance.');

    setSending(true);
    try {
      const sig = await sendSol(account.keypair, toAddress.trim(), amountNum, network);
      setTxSig(sig);
      onSuccess(account.publicKey);
      // If recipient is another account in this wallet, refresh it too
      const recipient = allAccounts.find((a) => a.publicKey === toAddress.trim());
      if (recipient) onSuccess(recipient.publicKey);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Transaction failed.');
    } finally {
      setSending(false);
    }
  }

  function explorerLink() {
    const cluster = network === 'mainnet-beta' ? '' : `?cluster=${network}`;
    return `https://explorer.solana.com/tx/${txSig}${cluster}`;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Send SOL</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {txSig ? (
          <div className="tx-success">
            <div className="success-icon">✓</div>
            <h3>Transaction Sent!</h3>
            <p className="tx-sig">{txSig.slice(0, 20)}...{txSig.slice(-20)}</p>
            <a
              href={explorerLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary btn-full"
              style={{ textAlign: 'center', display: 'block' }}
            >
              View on Explorer
            </a>
            <button className="btn-ghost btn-full" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="send-from">
              <span className="send-label">From</span>
              <span className="send-account">{account.name}</span>
              <span className="send-balance">
                Balance: {account.balance !== null ? `${account.balance.toFixed(4)} SOL` : '—'}
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Recipient Address</label>
              <input
                className="form-input"
                type="text"
                placeholder="Solana public key..."
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value)}
                spellCheck={false}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Amount (SOL)</label>
              <div className="amount-row">
                <input
                  className="form-input"
                  type="number"
                  placeholder="0.00"
                  min="0"
                  step="0.001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                {account.balance !== null && (
                  <button
                    className="btn-ghost max-btn"
                    onClick={() => setAmount(Math.max(0, account.balance! - 0.000005).toFixed(6))}
                  >
                    MAX
                  </button>
                )}
              </div>
            </div>

            {error && <p className="error-msg">{error}</p>}

            <div className="modal-actions">
              <button className="btn-ghost flex-1" onClick={onClose}>Cancel</button>
              <button
                className="btn-primary flex-1"
                disabled={sending || !toAddress || !amount}
                onClick={handleSend}
              >
                {sending ? <span className="spinner" /> : 'Send'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
