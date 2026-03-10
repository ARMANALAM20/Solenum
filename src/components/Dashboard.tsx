import { useState } from 'react';
import { NETWORK_LABELS } from '../utils/solana';
import type { Network } from '../utils/solana';
import { useWallet } from '../hooks/useWallet';
import AccountCard from './AccountCard';

interface DashboardProps {
  mnemonic: string;
  initialNetwork: Network;
  onLock: () => void;
}

export default function Dashboard({ mnemonic, initialNetwork, onLock }: DashboardProps) {
  const [network, setNetwork] = useState<Network>(initialNetwork);
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [confirmLock, setConfirmLock] = useState(false);

  const { accounts, addAccount, renameAccount, deleteAccount, refreshBalance, refreshAllBalances, refreshingAll, discovering } =
    useWallet(mnemonic, network);

  return (
    <div className="dashboard">
      {/* Top Bar */}
      <header className="dashboard-header">
        <div className="brand">
          <img src="/solenum.svg" alt="Solenum" className="brand-icon" />
          <span className="brand-name">Solenum</span>
        </div>

        <div className="header-right">
          <select
            className="network-select"
            value={network}
            onChange={(e) => setNetwork(e.target.value as Network)}
          >
            {(Object.keys(NETWORK_LABELS) as Network[]).map((n) => (
              <option key={n} value={n}>
                {NETWORK_LABELS[n]}
              </option>
            ))}
          </select>

          <button
            className="btn-ghost icon-btn"
            title="Refresh all"
            onClick={refreshAllBalances}
            disabled={refreshingAll}
          >
            {refreshingAll ? <span className="spinner sm" /> : '↻'}
          </button>

          <button
            className="btn-ghost icon-btn"
            title="Lock wallet"
            onClick={() => setConfirmLock(true)}
          >
            🔒
          </button>
        </div>
      </header>

      {/* Network Badge */}
      <div className="network-badge-row">
        <span className={`network-badge network-${network}`}>
          ● {NETWORK_LABELS[network]}
        </span>
      </div>

      {/* Accounts */}
      <main className="accounts-section">
        {discovering ? (
          <div className="discovery-screen">
            <span className="spinner lg" />
            <p className="discovery-title">Scanning wallets…</p>
            <p className="discovery-sub">Looking for previously used wallets on {NETWORK_LABELS[network]}</p>
          </div>
        ) : (
          <>
            <div className="accounts-grid">
              {accounts.map((acc) => (
                <AccountCard
                  key={acc.publicKey}
                  account={acc}
                  network={network}
                  allAccounts={accounts}
                  onRefresh={refreshBalance}
                  onRename={renameAccount}
                  onDelete={deleteAccount}
                />
              ))}
            </div>
            <button className="btn-add-account" onClick={addAccount}>
              + Add Wallet
            </button>
          </>
        )}
      </main>

      {/* Recovery Phrase Reveal */}
      <div className="phrase-section">
        <button className="btn-phrase-toggle" onClick={() => setShowMnemonic((v) => !v)}>
          {showMnemonic ? 'Hide' : 'Show'} Recovery Phrase
        </button>
        {showMnemonic && (
          <div className="phrase-reveal">
            <div className="phrase-grid compact">
              {mnemonic.split(' ').map((w, i) => (
                <div key={i} className="phrase-word small">
                  <span className="word-num">{i + 1}</span>
                  <span className="word-text">{w}</span>
                </div>
              ))}
            </div>
            <button
              className="btn-ghost"
              onClick={() => navigator.clipboard.writeText(mnemonic)}
            >
              Copy Phrase
            </button>
          </div>
        )}
      </div>

      {/* Lock Confirmation Modal */}
      {confirmLock && (
        <div className="modal-overlay" onClick={() => setConfirmLock(false)}>
          <div className="modal-card small" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Lock Wallet?</h3>
            <p className="modal-body">
              This will remove the wallet from memory. Make sure you have your
              recovery phrase saved before locking.
            </p>
            <div className="modal-actions">
              <button className="btn-ghost flex-1" onClick={() => setConfirmLock(false)}>
                Cancel
              </button>
              <button className="btn-danger flex-1" onClick={onLock}>
                Lock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
