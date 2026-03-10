import { useState } from 'react';
import { requestAirdrop, shortenAddress } from '../utils/solana';
import bs58 from 'bs58';
import type { Network } from '../utils/solana';
import type { WalletAccount } from '../hooks/useWallet';
import SendModal from './SendModal';

interface AccountCardProps {
  account: WalletAccount;
  network: Network;
  allAccounts: WalletAccount[];
  onRefresh: (publicKey: string) => void;
  onRename: (publicKey: string, name: string) => void;
  onDelete: (publicKey: string) => void;
}

export default function AccountCard({
  account,
  network,
  allAccounts,
  onRefresh,
  onRename,
  onDelete,
}: AccountCardProps) {
  const [showSend, setShowSend] = useState(false);
  const [copied, setCopied] = useState(false);
  const [airdropping, setAirdropping] = useState(false);
  const [airdropError, setAirdropError] = useState('');
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(account.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showPrivKey, setShowPrivKey] = useState(false);
  const [privKeyRevealed, setPrivKeyRevealed] = useState(false);
  const [privKeyCopied, setPrivKeyCopied] = useState(false);

  const privateKeyBase58 = bs58.encode(account.keypair.secretKey);

  async function handleCopyPrivKey() {
    await navigator.clipboard.writeText(privateKeyBase58);
    setPrivKeyCopied(true);
    setTimeout(() => setPrivKeyCopied(false), 1500);
  }

  function handleClosePrivKey() {
    setShowPrivKey(false);
    setPrivKeyRevealed(false);
    setPrivKeyCopied(false);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(account.publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleAirdrop() {
    setAirdropError('');
    setAirdropping(true);
    try {
      await requestAirdrop(account.publicKey, network);
      onRefresh(account.publicKey);
    } catch (e: unknown) {
      setAirdropError(e instanceof Error ? e.message : 'Airdrop failed.');
    } finally {
      setAirdropping(false);
    }
  }

  function submitRename() {
    const trimmed = nameInput.trim();
    if (trimmed) onRename(account.publicKey, trimmed);
    else setNameInput(account.name);
    setEditing(false);
  }

  return (
    <>
      <div className="account-card">
        <div className="account-header">
          {editing ? (
            <input
              className="name-input"
              value={nameInput}
              autoFocus
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={submitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitRename();
                if (e.key === 'Escape') {
                  setNameInput(account.name);
                  setEditing(false);
                }
              }}
            />
          ) : (
            <button className="account-name" onClick={() => setEditing(true)}>
              {account.name} <span className="edit-hint">✏</span>
            </button>
          )}
          <div className="header-btns">
            <button className="refresh-btn" onClick={() => onRefresh(account.publicKey)}>
              {account.loadingBalance ? <span className="spinner sm" /> : '↻'}
            </button>
            {confirmDelete ? (
              <span className="delete-confirm">
                <button className="delete-yes" onClick={() => onDelete(account.publicKey)}>Delete</button>
                <button className="delete-no" onClick={() => setConfirmDelete(false)}>Cancel</button>
              </span>
            ) : (
              <button
                className="delete-btn"
                title="Remove wallet"
                onClick={() => setConfirmDelete(true)}
              >
                🗑
              </button>
            )}
          </div>
        </div>

        <div className="account-address" onClick={handleCopy} title="Click to copy">
          <span className="address-text">{shortenAddress(account.publicKey, 8)}</span>
          <span className="copy-badge">{copied ? '✓ Copied' : 'Copy'}</span>
        </div>

        <div className="account-balance">
          {account.loadingBalance ? (
            <span className="balance-loading">Loading...</span>
          ) : account.balance !== null ? (
            <>
              <span className="balance-amount">{account.balance.toFixed(4)}</span>
              <span className="balance-unit"> SOL</span>
            </>
          ) : (
            <span className="balance-error">Error loading balance</span>
          )}
        </div>

        <div className="account-actions">
          <button className="btn-primary" onClick={() => setShowSend(true)}>
            Send
          </button>
          {network !== 'mainnet-beta' && (
            <button
              className="btn-ghost"
              onClick={handleAirdrop}
              disabled={airdropping}
            >
              {airdropping ? <span className="spinner sm" /> : 'Airdrop 1 SOL'}
            </button>
          )}
        </div>

        <button className="btn-privkey" onClick={() => setShowPrivKey(true)}>
          🔑 View Private Key
        </button>

        {airdropError && <p className="error-msg mt-sm">{airdropError}</p>}
      </div>

      {showSend && (
        <SendModal
          account={account}
          network={network}
          allAccounts={allAccounts}
          onClose={() => setShowSend(false)}
          onSuccess={(pk) => {
            onRefresh(pk);
            setShowSend(false);
          }}
        />
      )}

      {showPrivKey && (
        <div className="modal-overlay" onClick={handleClosePrivKey}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Private Key</h2>
              <button className="modal-close" onClick={handleClosePrivKey}>✕</button>
            </div>

            <div className="privkey-warning">
              <span className="privkey-warning-icon">⚠️</span>
              <p>Never share your private key. Anyone with it has full control of this wallet.</p>
            </div>

            <div className="privkey-box-wrap">
              <div className={`privkey-box ${!privKeyRevealed ? 'blurred' : ''}`}>
                <span className="privkey-text">{privateKeyBase58}</span>
              </div>
              {!privKeyRevealed && (
                <button className="reveal-btn" onClick={() => setPrivKeyRevealed(true)}>
                  👁 Click to reveal
                </button>
              )}
            </div>

            {privKeyRevealed && (
              <button className="btn-ghost btn-full" onClick={handleCopyPrivKey}>
                {privKeyCopied ? '✓ Copied' : 'Copy Private Key'}
              </button>
            )}

            <button className="btn-primary btn-full" style={{ marginTop: '0.75rem' }} onClick={handleClosePrivKey}>
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}
