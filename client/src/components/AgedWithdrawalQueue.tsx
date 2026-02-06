import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Clock, XCircle, Minus, AlertTriangle, RotateCw } from 'lucide-react';
import { withdrawalsApi, Withdrawal } from '../lib/api';
import './AgedWithdrawalQueue.css';

interface AgedWithdrawalQueueProps {
  thresholdDays?: number;
}

type TransferStatusType = 'PENDING' | 'COMPLETE' | 'FAILED' | 'RETRYING' | 'STALE' | 'RECONCILED' | 'N/A';

/**
 * Get a display-friendly badge class for any status string.
 * Used for both liquidation and transfer status columns.
 */
function getStatusBadgeClass(status: string): string {
  const s = status.toUpperCase();
  if (s === 'COMPLETE' || s === 'RECONCILED' || s === 'PROCESSED_SUCCESSFULLY') return 'status-badge completed';
  if (s === 'PENDING' || s === 'CREATED' || s === 'PROCESSING' || s === 'PROCESSED') return 'status-badge pending';
  if (s === 'FAILED') return 'status-badge failed';
  if (s === 'RETRYING' || s === 'STALE') return 'status-badge warning';
  return 'status-badge na';
}

function getStatusIcon(status: string) {
  const s = status.toUpperCase();
  if (s === 'COMPLETE' || s === 'RECONCILED' || s === 'PROCESSED_SUCCESSFULLY') return <CheckCircle size={14} />;
  if (s === 'PENDING' || s === 'CREATED' || s === 'PROCESSING' || s === 'PROCESSED') return <Clock size={14} />;
  if (s === 'FAILED') return <XCircle size={14} />;
  if (s === 'RETRYING') return <RotateCw size={14} />;
  if (s === 'STALE') return <AlertTriangle size={14} />;
  return <Minus size={14} />;
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <span className={getStatusBadgeClass(status)}>
      {getStatusIcon(status)}
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
          // Use the server-derived transferStatus directly
          return w.transferStatus !== 'COMPLETE' && w.transferStatus !== 'RECONCILED';
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
                      status={withdrawal.liquidationStatus} 
                      label={withdrawal.liquidationStatus} 
                    />
                  </td>
                  <td>
                    <StatusBadge 
                      status={withdrawal.transferStatus} 
                      label={withdrawal.transferStatus} 
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
