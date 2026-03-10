import { useState } from 'react';
import { generateNewMnemonic, validateMnemonicPhrase, NETWORK_LABELS } from '../utils/solana';
import type { Network } from '../utils/solana';

interface WalletSetupProps {
  onComplete: (mnemonic: string, network: Network) => void;
}

export default function WalletSetup({ onComplete }: WalletSetupProps) {
  const [tab, setTab] = useState<'create' | 'import'>('create');
  const [network, setNetwork] = useState<Network>('devnet');

  // Create flow
  const [mnemonic, setMnemonic] = useState<string>(() => generateNewMnemonic());
  const [confirmed, setConfirmed] = useState(false);
  const [revealed, setRevealed] = useState(false);

  // Import flow
  const [importValue, setImportValue] = useState('');
  const [importError, setImportError] = useState('');

  const words = mnemonic.split(' ');

  function handleCreate() {
    if (confirmed) onComplete(mnemonic, network);
  }

  function handleImport() {
    setImportError('');
    if (!validateMnemonicPhrase(importValue)) {
      setImportError('Invalid recovery phrase. Please check and try again.');
      return;
    }
    onComplete(importValue.trim(), network);
  }

  function regenerate() {
    setMnemonic(generateNewMnemonic());
    setConfirmed(false);
    setRevealed(false);
  }

  return (
    <div className="setup-container">
      <div className="setup-card">
        <div className="setup-logo">
          <div className="logo-icon">◎</div>
          <h1 className="logo-title">Solenum</h1>
          <p className="logo-sub">Your Solana Wallet</p>
        </div>

        {/* Network selector */}
        <div className="setup-network-row">
          <span className="setup-network-label">Network</span>
          <div className="setup-network-pills">
            {(Object.keys(NETWORK_LABELS) as Network[]).map((n) => (
              <button
                key={n}
                className={`network-pill ${network === n ? 'active' : ''}`}
                onClick={() => setNetwork(n)}
              >
                {NETWORK_LABELS[n]}
              </button>
            ))}
          </div>
        </div>

        <div className="tab-row">
          <button
            className={`tab-btn ${tab === 'create' ? 'active' : ''}`}
            onClick={() => setTab('create')}
          >
            Create New
          </button>
          <button
            className={`tab-btn ${tab === 'import' ? 'active' : ''}`}
            onClick={() => setTab('import')}
          >
            Import Wallet
          </button>
        </div>

        {tab === 'create' && (
          <div className="create-flow">
            <p className="setup-hint">
              Your recovery phrase is the only way to restore your wallet. Write it
              down and store it somewhere safe.
            </p>

            <div className={`phrase-grid-wrapper ${!revealed ? 'blurred' : ''}`}>
              <div className="phrase-grid">
                {words.map((word, i) => (
                  <div key={i} className="phrase-word">
                    <span className="word-num">{i + 1}</span>
                    <span className="word-text">{word}</span>
                  </div>
                ))}
              </div>
              {!revealed && (
                <button className="reveal-btn" onClick={() => setRevealed(true)}>
                  👁 Click to reveal
                </button>
              )}
            </div>

            <div className="phrase-actions">
              <button
                className="btn-ghost"
                onClick={() => {
                  navigator.clipboard.writeText(mnemonic);
                }}
              >
                Copy Phrase
              </button>
              <button className="btn-ghost" onClick={regenerate}>
                Regenerate
              </button>
            </div>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              <span>I have saved my recovery phrase securely</span>
            </label>

            <button
              className="btn-primary btn-full"
              disabled={!confirmed}
              onClick={handleCreate}
            >
              Create Wallet
            </button>
          </div>
        )}

        {tab === 'import' && (
          <div className="import-flow">
            <p className="setup-hint">
              Enter your 12 or 24-word BIP39 recovery phrase to restore your wallet.
            </p>
            <textarea
              className={`phrase-input ${importError ? 'error' : ''}`}
              placeholder="Enter your recovery phrase, separated by spaces..."
              value={importValue}
              onChange={(e) => {
                setImportValue(e.target.value);
                setImportError('');
              }}
              rows={4}
              spellCheck={false}
            />
            {importError && <p className="error-msg">{importError}</p>}
            <button
              className="btn-primary btn-full"
              disabled={!importValue.trim()}
              onClick={handleImport}
            >
              Import Wallet
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
