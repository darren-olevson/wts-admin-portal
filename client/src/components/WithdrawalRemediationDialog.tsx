import { useEffect, useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import './WithdrawalRemediationDialog.css';

interface WithdrawalRemediationDialogProps {
  withdrawalId?: string;
  action: 'cancel' | 'reprocess' | 'skip-liquidation' | 'create';
  clientId?: string;
  fundingAccounts?: Array<{ id: string; label: string }>;
  fundingAccountsLoading?: boolean;
  onClose: () => void;
  onSuccess: (newWithdrawalId?: string) => void;
}

function WithdrawalRemediationDialog({
  withdrawalId,
  action,
  clientId,
  fundingAccounts = [],
  fundingAccountsLoading = false,
  onClose,
  onSuccess,
}: WithdrawalRemediationDialogProps) {
  const [notes, setNotes] = useState('');
  const [fundingAccount, setFundingAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if ((action === 'reprocess' || action === 'create') && !fundingAccount && fundingAccounts.length === 1) {
      setFundingAccount(fundingAccounts[0].id);
    }
  }, [action, fundingAccount, fundingAccounts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!notes.trim()) {
      setError('Notes are required');
      return;
    }
    if (action === 'reprocess' || action === 'create') {
      if (!fundingAccount.trim()) {
        setError('Funding account is required');
        return;
      }
      if (!amount || Number(amount) <= 0) {
        setError('Amount must be greater than 0');
        return;
      }
    }
    if (action === 'create' && !clientId) {
      setError('Client is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call API endpoint based on action
      let endpoint: string;
      switch (action) {
        case 'cancel':
          if (!withdrawalId) {
            throw new Error('Withdrawal ID is required');
          }
          endpoint = `/api/withdrawals/${withdrawalId}/cancel`;
          break;
        case 'reprocess':
          if (!withdrawalId) {
            throw new Error('Withdrawal ID is required');
          }
          endpoint = `/api/withdrawals/${withdrawalId}/reprocess`;
          break;
        case 'skip-liquidation':
          if (!withdrawalId) {
            throw new Error('Withdrawal ID is required');
          }
          endpoint = `/api/withdrawals/${withdrawalId}/skip-liquidation`;
          break;
        case 'create':
          endpoint = `/api/withdrawals/create`;
          break;
      }
      
      const payload: Record<string, unknown> = { notes };
      if (action === 'reprocess' || action === 'create') {
        payload.amount = Number(amount);
        payload.fundingAccount = fundingAccount.trim();
      }
      if (action === 'create') {
        payload.clientId = clientId;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to process request');
      }

      let newWithdrawalId: string | undefined;
      try {
        const data = await response.json();
        if ((action === 'reprocess' || action === 'create') && data?.newWithdrawal?.id) {
          newWithdrawalId = data.newWithdrawal.id;
        }
      } catch {
        // ignore response parse errors
      }

      localStorage.setItem('withdrawals:refresh', String(Date.now()));
      window.dispatchEvent(new Event('withdrawals:refresh'));

      onSuccess(newWithdrawalId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const actionLabels = {
    cancel: {
      title: 'Cancel Withdrawal',
      description: 'This will cancel the withdrawal request and update the status to CANCELLED.',
      buttonText: 'Cancel Withdrawal',
      buttonClass: 'button-cancel',
    },
    reprocess: {
      title: 'Reprocess Withdrawal',
      description: 'This will create a new withdrawal request. Please confirm the funding account and amount.',
      buttonText: 'Create Withdrawal',
      buttonClass: 'button-reprocess',
    },
    create: {
      title: 'Create Withdrawal',
      description: 'Create a new withdrawal request for this user.',
      buttonText: 'Create Withdrawal',
      buttonClass: 'button-reprocess',
    },
    'skip-liquidation': {
      title: 'Skip Liquidation',
      description: 'This will bypass the liquidation engine and move the ACH transfer directly to TRANSFER_CREATED status. Use only when cash is already available.',
      buttonText: 'Skip Liquidation',
      buttonClass: 'button-skip',
    },
  };

  const labels = actionLabels[action];

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2 className="dialog-title">{labels.title}</h2>
          <button onClick={onClose} className="dialog-close">
            <X size={20} />
          </button>
        </div>

        <div className="dialog-body">
          <div className="dialog-warning">
            <AlertTriangle size={20} />
            <p>{labels.description}</p>
          </div>

          <form onSubmit={handleSubmit}>
            {(action === 'reprocess' || action === 'create') && (
              <>
                <div className="form-group">
                  <label htmlFor="fundingAccount" className="form-label">
                    Funding Account <span className="required">*</span>
                  </label>
                  <select
                    id="fundingAccount"
                    value={fundingAccount}
                    onChange={(e) => setFundingAccount(e.target.value)}
                    className="form-input"
                    required
                    disabled={fundingAccountsLoading || fundingAccounts.length === 0}
                  >
                    <option value="">
                      {fundingAccountsLoading
                        ? 'Loading funding accounts...'
                        : fundingAccounts.length === 0
                          ? 'No funding accounts available'
                          : 'Select funding account'}
                    </option>
                    {fundingAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="amount" className="form-label">
                    Amount <span className="required">*</span>
                  </label>
                  <input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="form-input"
                    placeholder="Enter amount"
                    required
                  />
                </div>
              </>
            )}
            <div className="form-group">
              <label htmlFor="notes" className="form-label">
                Notes <span className="required">*</span>
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="form-textarea"
                rows={4}
                placeholder="Enter notes explaining the reason for this action..."
                required
              />
              <p className="form-help">
                Notes are required and will be logged in the audit trail.
              </p>
            </div>

            {error && (
              <div className="form-error">
                {error}
              </div>
            )}

            <div className="dialog-actions">
              <button
                type="button"
                onClick={onClose}
                className="button-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`button-primary ${labels.buttonClass}`}
                disabled={
                  loading ||
                  !notes.trim() ||
                  ((action === 'reprocess' || action === 'create') &&
                    (!fundingAccount.trim() || !amount || Number(amount) <= 0 || fundingAccounts.length === 0))
                }
              >
                {loading ? 'Processing...' : labels.buttonText}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default WithdrawalRemediationDialog;
