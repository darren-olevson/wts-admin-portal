import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import './TransactionActivityTable.css';

interface Transaction {
  id: string;
  date: string;
  type: string;
  code: 'CR' | 'BUY' | 'SEL' | 'DR';
  description: string;
  amount: number;
  balance: number;
  isWithdrawalRelated?: boolean;
}

interface TransactionActivityTableProps {
  accountId: string;
}

const ITEMS_PER_PAGE = 25;

function TransactionActivityTable({ accountId }: TransactionActivityTableProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [accountId, dateRange.start, dateRange.end]);

  // Keep current page valid if data size changes
  useEffect(() => {
    const nextTotalPages = Math.max(1, Math.ceil(transactions.length / ITEMS_PER_PAGE));
    if (currentPage > nextTotalPages) setCurrentPage(nextTotalPages);
  }, [transactions.length, currentPage]);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/accounts/${accountId}/transactions?startDate=${dateRange.start}&endDate=${dateRange.end}`
        );
        if (!response.ok) throw new Error('Failed to fetch transactions');
        const data = await response.json();
        setTransactions(data);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [accountId, dateRange]);

  // Pagination derived state
  const totalPages = Math.max(1, Math.ceil(transactions.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const visibleTransactions = transactions.slice(startIndex, endIndex);

  const getCodeBadgeClass = (code: string) => {
    switch (code) {
      case 'CR':
        return 'code-cr';
      case 'BUY':
        return 'code-buy';
      case 'SEL':
        return 'code-sel';
      case 'DR':
        return 'code-dr';
      default:
        return 'code-default';
    }
  };

  const handleExportCSV = () => {
    // TODO: Implement CSV export
    const csv = [
      ['Date', 'Code', 'Type', 'Description', 'Amount', 'Balance'].join(','),
      ...transactions.map(tx =>
        [
          tx.date,
          tx.code,
          tx.type,
          `"${tx.description}"`,
          tx.amount,
          tx.balance,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${accountId}-${dateRange.start}-${dateRange.end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="transaction-table-loading">Loading transactions...</div>;
  }

  return (
    <div className="transaction-activity-table">
      <div className="table-controls">
        <div className="date-range-filters">
          <label>
            Start Date:
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="date-input"
            />
          </label>
          <label>
            End Date:
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="date-input"
            />
          </label>
        </div>
        <button onClick={handleExportCSV} className="export-button">
          <Download size={16} />
          Export CSV
        </button>
      </div>

      <div className="table-container">
        <table className="transaction-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Code</th>
              <th>Type</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state">
                  No transactions found for the selected date range
                </td>
              </tr>
            ) : (
              visibleTransactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className={transaction.isWithdrawalRelated ? 'withdrawal-related' : ''}
                >
                  <td>{new Date(transaction.date).toLocaleDateString()}</td>
                  <td>
                    <span className={`code-badge ${getCodeBadgeClass(transaction.code)}`}>
                      {transaction.code}
                    </span>
                  </td>
                  <td>{transaction.type}</td>
                  <td>{transaction.description}</td>
                  <td className={transaction.amount >= 0 ? 'amount-positive' : 'amount-negative'}>
                    {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString()}
                  </td>
                  <td>${transaction.balance.toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {transactions.length > ITEMS_PER_PAGE && (
        <div className="tx-pagination">
          <div className="tx-pagination-info">
            Showing {startIndex + 1}–{Math.min(endIndex, transactions.length)} of {transactions.length} transactions
          </div>
          <div className="tx-pagination-controls">
            <button
              type="button"
              className="tx-pagination-btn"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              First
            </button>
            <button
              type="button"
              className="tx-pagination-btn"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="tx-pagination-pages">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              className="tx-pagination-btn"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
            <button
              type="button"
              className="tx-pagination-btn"
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

export default TransactionActivityTable;
