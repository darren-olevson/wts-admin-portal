import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Filter, Wallet, AlertCircle, RefreshCw, FastForward } from 'lucide-react';
import { withdrawalsApi } from '../lib/api';
import './Withdrawals.css';

interface Withdrawal {
  id: string;
  accountId: string;
  clientId: string;
  clientName: string;
  amount: number;
  status: string;
  liquidationStatus: string;
  transferStatus: string;
  requestDate: string;
  daysPending: number;
  withdrawalType?: 'FULL' | 'PARTIAL';
  reconciliationStatus?: 'MATCHED' | 'UNMATCHED' | 'EXCEPTION';
  achTransferBatchId?: string | null;
  // Completion metrics
  daysToComplete?: number | null;
  // Action tracking
  reprocessedToId?: string;
  reprocessedFromId?: string;
  liquidationSkipped?: boolean;
}

const ITEMS_PER_PAGE = 25;

function Withdrawals() {
  const navigate = useNavigate();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [minDaysPending, setMinDaysPending] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

  const headerLabels = useMemo(
    () => [
      'Withdrawal ID',
      'Account ID',
      'Client',
      'Amount',
      'Type',
      'Liquidation Status',
      'Transfer Status',
      'Request Date',
      'Days Pending',
      'Days to Complete',
    ],
    []
  );

  // Calculate pagination
  const totalPages = Math.ceil(withdrawals.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedWithdrawals = withdrawals.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, typeFilter, minDaysPending]);

  const fetchWithdrawals = useCallback(async () => {
    try {
      setLoading(true);
        const data = await withdrawalsApi.list({
          status: statusFilter !== 'all' ? statusFilter : undefined,
          search: searchQuery || undefined,
          withdrawalType: typeFilter !== 'all' ? typeFilter : undefined,
          minDaysPending: minDaysPending ? Number(minDaysPending) : undefined,
        });
      setWithdrawals(data);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery, typeFilter, minDaysPending]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  useEffect(() => {
    const handleRefresh = () => {
      fetchWithdrawals();
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'withdrawals:refresh') {
        fetchWithdrawals();
      }
    };

    window.addEventListener('withdrawals:refresh', handleRefresh);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('withdrawals:refresh', handleRefresh);
      window.removeEventListener('storage', handleStorage);
    };
  }, [fetchWithdrawals]);

  const getLiquidationStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    let className = 'status-badge-inline';
    if (s === 'COMPLETE' || s === 'PROCESSED_SUCCESSFULLY') className += ' liquidation-completed';
    else if (s === 'PENDING' || s === 'CREATED') className += ' liquidation-pending';
    else if (s === 'FAILED') className += ' liquidation-failed';
    else if (s === 'CANCELLED') className += ' liquidation-failed';
    else className += ' liquidation-na';
    return <span className={className}>{status}</span>;
  };

  const getTransferStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    let className = 'status-badge-inline';
    if (s === 'COMPLETE' || s === 'RECONCILED') className += ' transfer-completed';
    else if (s === 'PENDING' || s === 'N/A') className += ' transfer-pending';
    else if (s === 'FAILED') className += ' transfer-failed';
    else if (s === 'RETRYING' || s === 'STALE') className += ' transfer-pending';
    else className += ' transfer-na';
    return <span className={className}>{status}</span>;
  };

  if (loading) {
    return (
      <div className="withdrawals">
        <div className="withdrawals-header">
          <div className="skeleton-title-large"></div>
          <div className="skeleton-subtitle"></div>
        </div>
        <div className="skeleton-filters">
          <div className="skeleton-input-large"></div>
          <div className="skeleton-input"></div>
          <div className="skeleton-input"></div>
        </div>
        <div className="skeleton-table">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton-row"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="withdrawals">
      <div className="withdrawals-header">
        <div className="header-content">
          <div className="header-icon">
            <Wallet size={24} />
          </div>
          <div>
            <h1 className="withdrawals-title">Withdrawals</h1>
            <p className="withdrawals-subtitle">
              Monitor and manage Invest withdrawal requests
            </p>
          </div>
        </div>
      </div>

      <div className="withdrawals-filters">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by account ID, client ID, or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-group">
          <Filter size={18} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Statuses</option>
            <option value="PENDING_LIQUIDATION">Pending Liquidation</option>
            <option value="CREATED">Created</option>
            <option value="PROCESSING">Processing</option>
            <option value="PROCESSED">Processed</option>
            <option value="RETRYING">Retrying</option>
            <option value="COMPLETE">Complete</option>
            <option value="RECONCILED">Reconciled</option>
            <option value="STALE">Stale</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <div className="filter-group">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="FULL">Full</option>
            <option value="PARTIAL">Partial</option>
          </select>
        </div>
        <div className="filter-group">
          <input
            type="number"
            min="0"
            placeholder="Min days pending"
            value={minDaysPending}
            onChange={(e) => setMinDaysPending(e.target.value)}
            className="filter-input"
          />
        </div>
      </div>

      <div className="withdrawals-table-container">
        <table className="withdrawals-table">
          <thead>
            <tr>
              {headerLabels.map((label) => (
                <th key={label}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {withdrawals.length === 0 ? (
              <tr>
                <td colSpan={10} className="empty-state">
                  <AlertCircle size={40} className="empty-icon" />
                  <p>No withdrawals found</p>
                  <span>Try adjusting your filters</span>
                </td>
              </tr>
            ) : (
              paginatedWithdrawals.map((withdrawal) => (
                <tr key={withdrawal.id} className="clickable-row" onClick={() => navigate(`/invest/users/${withdrawal.clientId}?tab=withdrawals&withdrawalId=${withdrawal.id}`)}>
                  <td className="mono withdrawal-id-cell">
                    <Link to={`/invest/users/${withdrawal.clientId}?tab=withdrawals&withdrawalId=${withdrawal.id}`} className="withdrawal-id-link" onClick={(e) => e.stopPropagation()}>
                      {withdrawal.id}
                    </Link>
                    {withdrawal.reprocessedToId && (
                      <span className="reprocessed-indicator" title={`Reprocessed to ${withdrawal.reprocessedToId}`}>
                        <RefreshCw size={14} />
                      </span>
                    )}
                    {withdrawal.reprocessedFromId && (
                      <span className="from-reprocess-indicator" title={`Created from ${withdrawal.reprocessedFromId}`}>
                        <RefreshCw size={14} />
                      </span>
                    )}
                    {withdrawal.liquidationSkipped && (
                      <span className="skipped-indicator" title="Liquidation was skipped">
                        <FastForward size={14} />
                      </span>
                    )}
                  </td>
                  <td className="mono">{withdrawal.accountId}</td>
                  <td>
                    <div>
                      <div className="client-name">{withdrawal.clientName}</div>
                      <div className="client-id">{withdrawal.clientId}</div>
                    </div>
                  </td>
                  <td className="amount">${withdrawal.amount.toLocaleString()}</td>
                  <td>
                    <span className={`type-badge ${withdrawal.withdrawalType?.toLowerCase() || 'full'}`}>
                      {withdrawal.withdrawalType || 'FULL'}
                    </span>
                  </td>
                  <td>{getLiquidationStatusBadge(withdrawal.liquidationStatus)}</td>
                  <td>{getTransferStatusBadge(withdrawal.transferStatus)}</td>
                  <td>{new Date(withdrawal.requestDate).toLocaleDateString()}</td>
                  <td>
                    {['COMPLETE', 'RECONCILED', 'CANCELLED', 'FAILED'].includes(withdrawal.status?.toUpperCase()) ? (
                      <span className="days-pending-na">—</span>
                    ) : (
                      <span className={`days-pending ${withdrawal.daysPending > 6 ? 'warning' : ''}`}>
                        {withdrawal.daysPending} days
                      </span>
                    )}
                  </td>
                  <td>
                    {withdrawal.daysToComplete != null ? (
                      <span className="days-to-complete">
                        {withdrawal.daysToComplete} {withdrawal.daysToComplete === 1 ? 'day' : 'days'}
                      </span>
                    ) : (
                      <span className="days-pending-na">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pagination">
          <div className="pagination-info">
            Showing {startIndex + 1}–{Math.min(endIndex, withdrawals.length)} of {withdrawals.length} withdrawals
          </div>
          <div className="pagination-controls">
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              First
            </button>
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="pagination-pages">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Withdrawals;
