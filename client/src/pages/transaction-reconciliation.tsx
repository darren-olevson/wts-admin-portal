import { useEffect, useState } from 'react';
import { Filter } from 'lucide-react';
import { moneyMovementApi, MoneyMovementTransaction } from '../lib/api';
import './TransactionReconciliation.css';

const ITEMS_PER_PAGE = 25;

function TransactionReconciliation() {
  const [transactions, setTransactions] = useState<MoneyMovementTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    accountId: '',
    status: 'all',
    reconciliationStatus: 'all',
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.accountId, filters.status, filters.reconciliationStatus]);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const data = await moneyMovementApi.listTransactions({
          accountId: filters.accountId || undefined,
          status: filters.status !== 'all' ? filters.status : undefined,
          reconciliationStatus:
            filters.reconciliationStatus !== 'all' ? filters.reconciliationStatus : undefined,
        });
        setTransactions(data);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [filters]);

  const totalPages = Math.max(1, Math.ceil(transactions.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const visibleTransactions = transactions.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  if (loading) {
    return <div className="money-movement-loading">Loading transactions...</div>;
  }

  return (
    <div className="transaction-reconciliation">
      <div className="page-header">
        <div>
          <h1 className="page-title">Transaction Reconciliation</h1>
          <p className="page-subtitle">Monitor ACH transactions and reconciliation status</p>
        </div>
      </div>

      <div className="filters-row">
        <div className="filter-input">
          <Filter size={16} />
          <input
            type="text"
            placeholder="Filter by account..."
            value={filters.accountId}
            onChange={(e) => setFilters({ ...filters, accountId: e.target.value })}
          />
        </div>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="all">All Statuses</option>
          <option value="POSTED">Posted</option>
          <option value="PENDING">Pending</option>
        </select>
        <select
          value={filters.reconciliationStatus}
          onChange={(e) => setFilters({ ...filters, reconciliationStatus: e.target.value })}
        >
          <option value="all">All Reconciliation</option>
          <option value="MATCHED">Matched</option>
          <option value="UNMATCHED">Unmatched</option>
          <option value="EXCEPTION">Exception</option>
        </select>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Amount</th>
              <th>Direction</th>
              <th>Effective Date</th>
              <th>Posting Date</th>
              <th>Source Account</th>
              <th>Status</th>
              <th>Reconciliation</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-state">
                  No transactions found
                </td>
              </tr>
            ) : (
              visibleTransactions.map((tx) => (
                <tr key={tx.id}>
                  <td>{tx.id}</td>
                  <td>${tx.amount.toLocaleString()}</td>
                  <td className={tx.direction === 'CREDIT' ? 'credit' : 'debit'}>
                    {tx.direction}
                  </td>
                  <td>{tx.effectiveDate}</td>
                  <td>{tx.postingDate}</td>
                  <td>{tx.sourceAccount}</td>
                  <td>{tx.status}</td>
                  <td>
                    <span className={`recon-badge recon-${tx.reconciliationStatus.toLowerCase()}`}>
                      {tx.reconciliationStatus}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {transactions.length > ITEMS_PER_PAGE && (
        <div className="tr-pagination">
          <div className="tr-pagination-info">
            Showing {startIndex + 1}–{Math.min(endIndex, transactions.length)} of {transactions.length} transactions
          </div>
          <div className="tr-pagination-controls">
            <button
              type="button"
              className="tr-pagination-btn"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              First
            </button>
            <button
              type="button"
              className="tr-pagination-btn"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="tr-pagination-pages">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              className="tr-pagination-btn"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
            <button
              type="button"
              className="tr-pagination-btn"
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

export default TransactionReconciliation;
