import { CheckCircle, XCircle, AlertTriangle, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import './ReconciliationTable.css';

export interface Transaction {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  effectiveDate: string;
  postingDate: string;
  sourceAccount: string;
  destinationAccount: string;
  status: 'matched' | 'unmatched' | 'exception';
  description: string;
  referenceNumber: string;
  achBatchId?: string;
}

interface ReconciliationTableProps {
  transactions: Transaction[];
  loading?: boolean;
  onRowClick?: (transaction: Transaction) => void;
}

function ReconciliationTable({ transactions, loading, onRowClick }: ReconciliationTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: Transaction['status']) => {
    switch (status) {
      case 'matched':
        return (
          <span className="recon-status-badge matched">
            <CheckCircle size={14} />
            Matched
          </span>
        );
      case 'unmatched':
        return (
          <span className="recon-status-badge unmatched">
            <XCircle size={14} />
            Unmatched
          </span>
        );
      case 'exception':
        return (
          <span className="recon-status-badge exception">
            <AlertTriangle size={14} />
            Exception
          </span>
        );
    }
  };

  const getTypeIcon = (type: Transaction['type']) => {
    return type === 'credit' ? (
      <ArrowDownLeft size={16} className="type-icon credit" />
    ) : (
      <ArrowUpRight size={16} className="type-icon debit" />
    );
  };

  if (loading) {
    return (
      <div className="reconciliation-table-container">
        <div className="recon-loading-skeleton">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton-row"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="reconciliation-table-container">
      <table className="reconciliation-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Amount</th>
            <th>Effective Date</th>
            <th>Posting Date</th>
            <th>Source Account</th>
            <th>Description</th>
            <th>Reference #</th>
            <th>Status</th>
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
            transactions.map((transaction) => (
              <tr
                key={transaction.id}
                onClick={() => onRowClick?.(transaction)}
                className={onRowClick ? 'clickable' : ''}
              >
                <td>
                  <div className="type-cell">
                    {getTypeIcon(transaction.type)}
                    <span className={`type-label ${transaction.type}`}>
                      {transaction.type === 'credit' ? 'CR' : 'DR'}
                    </span>
                  </div>
                </td>
                <td className={`amount-cell ${transaction.type}`}>
                  {transaction.type === 'credit' ? '+' : '-'}
                  {formatCurrency(Math.abs(transaction.amount))}
                </td>
                <td>{formatDate(transaction.effectiveDate)}</td>
                <td>{formatDate(transaction.postingDate)}</td>
                <td className="mono">{transaction.sourceAccount}</td>
                <td className="description-cell">{transaction.description}</td>
                <td className="mono">{transaction.referenceNumber}</td>
                <td>{getStatusBadge(transaction.status)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ReconciliationTable;
