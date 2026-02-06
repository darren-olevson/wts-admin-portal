import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, Filter, Calendar, RefreshCw, Download } from 'lucide-react';
import { moneyMovementApi } from '../lib/api';
import ReconciliationTable, { Transaction as ReconciliationTransaction } from '../components/ReconciliationTable';
import './TransactionReconciliation.css';

function TransactionReconciliation() {
  const [transactions, setTransactions] = useState<ReconciliationTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await moneyMovementApi.getTransactions({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        startDate: dateRange.start || undefined,
        endDate: dateRange.end || undefined,
      });
      // Map MoneyMovementTransaction to ReconciliationTransaction
      const mapped: ReconciliationTransaction[] = data.map((tx) => ({
        id: tx.id,
        amount: tx.amount,
        type: (tx.direction === 'CREDIT' ? 'credit' : 'debit') as 'credit' | 'debit',
        effectiveDate: tx.effectiveDate,
        postingDate: tx.postingDate,
        sourceAccount: tx.sourceAccount,
        destinationAccount: '',
        status: (tx.reconciliationStatus?.toLowerCase() ?? 'unmatched') as 'matched' | 'unmatched' | 'exception',
        description: `${tx.direction} transaction`,
        referenceNumber: tx.id,
      }));
      setTransactions(mapped);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, dateRange]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.sourceAccount.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleExportCSV = async () => {
    try {
      const csv = await moneyMovementApi.exportTransactionsCSV({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        startDate: dateRange.start || undefined,
        endDate: dateRange.end || undefined,
      });

      // Create and download CSV file
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  const statusCounts = {
    all: transactions.length,
    matched: transactions.filter((t) => t.status === 'matched').length,
    unmatched: transactions.filter((t) => t.status === 'unmatched').length,
    exception: transactions.filter((t) => t.status === 'exception').length,
  };

  return (
    <div className="transaction-recon">
      <Link to="/money-movement" className="back-link">
        <ArrowLeft size={20} />
        Back to Money Movement
      </Link>

      <div className="transaction-recon-header">
        <div>
          <h1 className="transaction-recon-title">Transaction Reconciliation</h1>
          <p className="transaction-recon-subtitle">
            Review and reconcile ACH transactions
          </p>
        </div>
        <div className="header-actions">
          <button onClick={fetchTransactions} className="refresh-button" disabled={loading}>
            <RefreshCw size={18} className={loading ? 'spin' : ''} />
            Refresh
          </button>
          <button onClick={handleExportCSV} className="export-button">
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="status-tabs">
        <button
          className={`status-tab ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          All <span className="count">{statusCounts.all}</span>
        </button>
        <button
          className={`status-tab ${statusFilter === 'matched' ? 'active' : ''}`}
          onClick={() => setStatusFilter('matched')}
        >
          Matched <span className="count matched">{statusCounts.matched}</span>
        </button>
        <button
          className={`status-tab ${statusFilter === 'unmatched' ? 'active' : ''}`}
          onClick={() => setStatusFilter('unmatched')}
        >
          Unmatched <span className="count unmatched">{statusCounts.unmatched}</span>
        </button>
        <button
          className={`status-tab ${statusFilter === 'exception' ? 'active' : ''}`}
          onClick={() => setStatusFilter('exception')}
        >
          Exceptions <span className="count exception">{statusCounts.exception}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="transaction-filters">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by reference #, description, or account..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-group">
          <Filter size={18} />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="credit">Credits Only</option>
            <option value="debit">Debits Only</option>
          </select>
        </div>
        <div className="date-range-group">
          <Calendar size={18} />
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="date-input"
          />
          <span>to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="date-input"
          />
        </div>
      </div>

      {/* Transaction Table */}
      <ReconciliationTable
        transactions={filteredTransactions}
        loading={loading}
      />

      {/* Results Count */}
      {!loading && (
        <div className="results-count">
          Showing {filteredTransactions.length} of {transactions.length} transactions
        </div>
      )}
    </div>
  );
}

export default TransactionReconciliation;
