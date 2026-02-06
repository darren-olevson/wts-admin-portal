import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Clock, XCircle, Minus } from 'lucide-react';
import { withdrawalsApi, Withdrawal } from '../lib/api';
import './AgedWithdrawalQueue.css';

interface AgedWithdrawalQueueProps {
  thresholdDays?: number;
}

type StatusType = 'PENDING' | 'COMPLETED' | 'FAILED' | 'N/A';

/**
 * Derive liquidation status from the withdrawal status
 */
function deriveLiquidationStatus(status: string): StatusType {
  const normalizedStatus = status.toUpperCase().replace(/[_\s]+/g, '_');
  
  if (normalizedStatus.includes('PENDING_LIQUIDATION') || normalizedStatus.includes('LIQUIDATION_PENDING')) {
    return 'PENDING';
  }
  if (normalizedStatus.includes('FAILED') || normalizedStatus.includes('APPROVAL_FAILED')) {
    return 'FAILED';
  }
  if (normalizedStatus.includes('CANCELLED')) {
    return 'N/A';
  }
  // If we're past liquidation (transfer phase or completed), liquidation is completed
  if (normalizedStatus.includes('TRANSFER') || normalizedStatus.includes('CREATED') || normalizedStatus.includes('COMPLETED')) {
    return 'COMPLETED';
  }
  return 'PENDING';
}

/**
 * Derive transfer status from the withdrawal status
 */
function deriveTransferStatus(status: string, achTransferBatchId?: string | null): StatusType {
  const normalizedStatus = status.toUpperCase().replace(/[_\s]+/g, '_');
  
  // If still in liquidation phase, transfer hasn't started
  if (normalizedStatus.includes('PENDING_LIQUIDATION') || normalizedStatus.includes('LIQUIDATION_PENDING')) {
    return 'N/A';
  }
  if (normalizedStatus.includes('FAILED') || normalizedStatus.includes('APPROVAL_FAILED')) {
    return 'FAILED';
  }
  if (normalizedStatus.includes('CANCELLED')) {
    return 'N/A';
  }
  if (normalizedStatus.includes('COMPLETED')) {
    return 'COMPLETED';
  }
  // In transfer phase
  if (normalizedStatus.includes('TRANSFER') || normalizedStatus.includes('CREATED')) {
    return 'PENDING';
  }
  return 'N/A';
}

function StatusBadge({ status, label }: { status: StatusType; label: string }) {
  const getStatusIcon = () => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle size={14} />;
      case 'PENDING':
        return <Clock size={14} />;
      case 'FAILED':
        return <XCircle size={14} />;
      default:
        return <Minus size={14} />;
    }
  };

  const getStatusClass = () => {
    switch (status) {
      case 'COMPLETED':
        return 'status-badge completed';
      case 'PENDING':
        return 'status-badge pending';
      case 'FAILED':
        return 'status-badge failed';
      default:
        return 'status-badge na';
    }
  };

  return (
    <span className={getStatusClass()}>
      {getStatusIcon()}
      <span>{label}</span>
    </span>
  );
}

function AgedWithdrawalQueue({ thresholdDays = 6 }: AgedWithdrawalQueueProps) {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const fetchAgedWithdrawals = async () => {
      try {
        setLoading(true);
        const data = await withdrawalsApi.list({
          minDaysPending: thresholdDays,
        });
        const filtered = data.filter((w) => {
          if (w.reconciliationStatus === 'MATCHED') return false;
          const transferStatus = deriveTransferStatus(w.status, w.achTransferBatchId);
          return transferStatus !== 'COMPLETED';
        });
        setWithdrawals(filtered);
        setPage(1);
      } catch (error) {
        console.error('Error loading aged withdrawals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgedWithdrawals();
  }, [thresholdDays]);

  const totalRows = withdrawals.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const visibleWithdrawals = withdrawals.slice(startIndex, endIndex);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  if (loading) {
    return <div className="aged-withdrawals-loading">Loading aged withdrawals...</div>;
  }

  return (
    <div className="aged-withdrawal-queue">
      <div className="aged-header">
        <h3>Aged Withdrawal Queue</h3>
        <span className="aged-subtitle">Older than {thresholdDays} days</span>
      </div>
      <div className="aged-table">
        <table>
          <thead>
            <tr>
              <th>Withdrawal ID</th>
              <th>Client</th>
              <th>Amount</th>
              <th>Liquidation Status</th>
              <th>Transfer Status</th>
              <th>Days Pending</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state">
                  No aged withdrawals found
                </td>
              </tr>
            ) : (
              visibleWithdrawals.map((withdrawal) => (
                <tr key={withdrawal.id}>
                  <td>
                    <Link
                      to={`/invest/users/${withdrawal.clientId}?tab=withdrawals&withdrawalId=${withdrawal.id}`}
                      className="withdrawal-id-link"
                    >
                      {withdrawal.id}
                    </Link>
                  </td>
                  <td>
                    <div className="client-cell">
                      <div>{withdrawal.clientName}</div>
                      <div className="client-id">{withdrawal.clientId}</div>
                    </div>
                  </td>
                  <td>${withdrawal.amount.toLocaleString()}</td>
                  <td>
                    <StatusBadge 
                      status={deriveLiquidationStatus(withdrawal.status)} 
                      label={deriveLiquidationStatus(withdrawal.status)} 
                    />
                  </td>
                  <td>
                    <StatusBadge 
                      status={deriveTransferStatus(withdrawal.status, withdrawal.achTransferBatchId)} 
                      label={deriveTransferStatus(withdrawal.status, withdrawal.achTransferBatchId)} 
                    />
                  </td>
                  <td>{withdrawal.daysPending} days</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalRows > pageSize && (
        <div className="aged-pagination">
          <span className="aged-pagination-info">
            Showing {startIndex + 1}-{Math.min(endIndex, totalRows)} of {totalRows}
          </span>
          <div className="aged-pagination-buttons">
            <button
              type="button"
              className="aged-pagination-button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <span className="aged-pagination-page">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              className="aged-pagination-button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AgedWithdrawalQueue;
