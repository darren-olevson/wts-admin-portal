import { useEffect, useMemo, useState, useCallback } from 'react';
import { ArrowDownLeft, ArrowUpRight, AlertTriangle, Calendar, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { moneyMovementApi, DailyBalance, MoneyMovementTransaction } from '../lib/api';
import './MoneyMovementDashboard.css';

interface ExpandedRowState {
  isLoading: boolean;
  transactions: MoneyMovementTransaction[];
  error: string | null;
}

const ITEMS_PER_PAGE = 25;

function PaginatedMoneyMovementTransactions({ transactions }: { transactions: MoneyMovementTransaction[] }) {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [transactions]);

  const totalPages = Math.max(1, Math.ceil(transactions.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const visibleTransactions = transactions.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  return (
    <>
      <table className="nested-transactions-table">
        <thead>
          <tr>
            <th>Transaction ID</th>
            <th>Direction</th>
            <th>Amount</th>
            <th>Effective Date</th>
            <th>Posting Date</th>
            <th>Source Account</th>
            <th>Status</th>
            <th>Reconciliation</th>
          </tr>
        </thead>
        <tbody>
          {visibleTransactions.map((tx) => (
            <tr key={tx.id}>
              <td className="mono">{tx.id}</td>
              <td>
                <span className={`direction-badge ${tx.direction.toLowerCase()}`}>
                  {tx.direction}
                </span>
              </td>
              <td className={`mono ${tx.direction === 'CREDIT' ? 'credit' : 'debit'}`}>
                {tx.direction === 'CREDIT' ? '+' : '-'}${tx.amount.toLocaleString()}
              </td>
              <td>{tx.effectiveDate}</td>
              <td>{tx.postingDate}</td>
              <td className="mono">{tx.sourceAccount}</td>
              <td>{tx.status}</td>
              <td>
                <span className={`recon-badge ${tx.reconciliationStatus.toLowerCase()}`}>
                  {tx.reconciliationStatus}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {transactions.length > ITEMS_PER_PAGE && (
        <div className="mm-tx-pagination">
          <div className="mm-tx-pagination-info">
            Showing {startIndex + 1}–{Math.min(endIndex, transactions.length)} of {transactions.length}
          </div>
          <div className="mm-tx-pagination-controls">
            <button
              type="button"
              className="mm-tx-pagination-btn"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              First
            </button>
            <button
              type="button"
              className="mm-tx-pagination-btn"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="mm-tx-pagination-pages">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              className="mm-tx-pagination-btn"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
            <button
              type="button"
              className="mm-tx-pagination-btn"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              Last
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function MoneyMovementDashboard() {
  const [balances, setBalances] = useState<DailyBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    accountId: '',
    startDate: '',
    endDate: '',
  });
  const [expandedRows, setExpandedRows] = useState<Record<string, ExpandedRowState>>({});

  // Fetch balances when filters change
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const bls = await moneyMovementApi.getBalances({
          accountId: filters.accountId || undefined,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
        });
        setBalances(bls);
        // Clear expanded rows when filters change
        setExpandedRows({});
      } catch (error) {
        console.error('Error loading money movement dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  // Calculate summary stats from balances
  const stats = useMemo(() => {
    const totalDays = balances.length;
    const totalDeposits = balances.reduce((sum, b) => sum + b.deposits, 0);
    const totalWithdrawals = balances.reduce((sum, b) => sum + b.withdrawals, 0);
    const netChange = balances.reduce((sum, b) => sum + b.netChange, 0);

    return {
      totalDays,
      totalDeposits,
      totalWithdrawals,
      netChange,
    };
  }, [balances]);

  // Handle row expand/collapse and fetch transactions
  const handleToggleRow = useCallback(async (balance: DailyBalance) => {
    const rowKey = `${balance.date}`;
    
    if (expandedRows[rowKey]) {
      // Collapse the row
      setExpandedRows(prev => {
        const newState = { ...prev };
        delete newState[rowKey];
        return newState;
      });
      return;
    }

    // Expand and fetch transactions
    setExpandedRows(prev => ({
      ...prev,
      [rowKey]: { isLoading: true, transactions: [], error: null },
    }));

    try {
      const transactions = await moneyMovementApi.listTransactions({
        startDate: balance.date,
        endDate: balance.date,
      });
      setExpandedRows(prev => ({
        ...prev,
        [rowKey]: { isLoading: false, transactions, error: null },
      }));
    } catch (error) {
      setExpandedRows(prev => ({
        ...prev,
        [rowKey]: { isLoading: false, transactions: [], error: 'Failed to load transactions' },
      }));
    }
  }, [expandedRows]);

  if (loading) {
    return <div className="money-movement-loading">Loading money movement...</div>;
  }

  return (
    <div className="money-movement-dashboard">
      <div className="money-movement-header">
        <div>
          <h1 className="money-movement-title">Money Movement</h1>
          <p className="money-movement-subtitle">
            Track ACH reconciliation, balances, and exceptions
          </p>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="money-movement-metrics">
        <div className="money-movement-card">
          <div className="card-icon card-icon-balance">
            <Calendar size={20} />
          </div>
          <div>
            <p className="card-label">Days Tracked</p>
            <p className="card-value">{stats.totalDays}</p>
          </div>
        </div>

        <div className="money-movement-card">
          <div className="card-icon card-icon-credit">
            <ArrowDownLeft size={20} />
          </div>
          <div>
            <p className="card-label">Total Deposits</p>
            <p className="card-value">${stats.totalDeposits.toLocaleString()}</p>
          </div>
        </div>

        <div className="money-movement-card">
          <div className="card-icon card-icon-debit">
            <ArrowUpRight size={20} />
          </div>
          <div>
            <p className="card-label">Total Withdrawals</p>
            <p className="card-value">${stats.totalWithdrawals.toLocaleString()}</p>
          </div>
        </div>

        <div className="money-movement-card">
          <div className="card-icon card-icon-net">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="card-label">Net Change</p>
            <p className={`card-value ${stats.netChange >= 0 ? 'positive' : 'negative'}`}>
              {stats.netChange >= 0 ? '+' : '-'}${Math.abs(stats.netChange).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Balance Visibility Section */}
      <div className="balance-visibility-section">
        <div className="section-title-row">
          <h2>Balance Visibility</h2>
          <p className="section-subtitle">Daily opening and closing balances with transaction tracing</p>
        </div>

        {/* Filters */}
        <div className="balance-filters-row">
          <div className="date-filter">
            <Calendar size={16} />
            <input
              type="date"
              className="filter-input"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
            <span className="date-separator">to</span>
            <input
              type="date"
              className="filter-input"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
        </div>

        {/* Balances Table */}
        <div className="balance-table-card">
          <table className="balance-table">
            <thead>
              <tr>
                <th className="expand-col"></th>
                <th>Date</th>
                <th>Opening Balance</th>
                <th>Closing Balance</th>
                <th>Deposits</th>
                <th>Withdrawals</th>
                <th>Net Change</th>
              </tr>
            </thead>
            <tbody>
              {balances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-state">
                    No balances found
                  </td>
                </tr>
              ) : (
                balances.map((balance) => {
                  const rowKey = `${balance.date}`;
                  const expandedState = expandedRows[rowKey];
                  const isExpanded = !!expandedState;

                  return (
                    <>
                      <tr key={rowKey} className={isExpanded ? 'expanded-row' : ''}>
                        <td className="expand-col">
                          <button
                            className="expand-button"
                            onClick={() => handleToggleRow(balance)}
                            aria-label={isExpanded ? 'Collapse transactions' : 'Expand transactions'}
                          >
                            {expandedState?.isLoading ? (
                              <Loader2 size={16} className="spin" />
                            ) : isExpanded ? (
                              <ChevronDown size={16} />
                            ) : (
                              <ChevronRight size={16} />
                            )}
                          </button>
                        </td>
                        <td>{balance.date}</td>
                        <td className="mono">${balance.openingBalance.toLocaleString()}</td>
                        <td className="mono">${balance.closingBalance.toLocaleString()}</td>
                        <td className="mono credit">+${balance.deposits.toLocaleString()}</td>
                        <td className="mono debit">-${balance.withdrawals.toLocaleString()}</td>
                        <td className={`mono ${balance.netChange >= 0 ? 'credit' : 'debit'}`}>
                          {balance.netChange >= 0 ? '+' : '-'}$
                          {Math.abs(balance.netChange).toLocaleString()}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${rowKey}-transactions`} className="transactions-row">
                          <td colSpan={7}>
                            <div className="transactions-container">
                              {expandedState.isLoading ? (
                                <div className="transactions-loading">
                                  <Loader2 size={20} className="spin" />
                                  <span>Loading transactions...</span>
                                </div>
                              ) : expandedState.error ? (
                                <div className="transactions-error">
                                  {expandedState.error}
                                </div>
                              ) : expandedState.transactions.length === 0 ? (
                                <div className="transactions-empty">
                                  No transactions for this account on this date
                                </div>
                              ) : (
                                <PaginatedMoneyMovementTransactions transactions={expandedState.transactions} />
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default MoneyMovementDashboard;
