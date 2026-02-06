import { AlertTriangle } from 'lucide-react';
import './WithdrawalStatusBadge.css';

interface WithdrawalStatusBadgeProps {
  status: string;
  daysPending?: number;
}

function WithdrawalStatusBadge({ status, daysPending }: WithdrawalStatusBadgeProps) {
  const getStatusConfig = () => {
    const s = status.toUpperCase();

    // EDD ACH Transfer statuses
    switch (s) {
      case 'PENDING_LIQUIDATION':
        return { label: 'Pending Liquidation', className: 'status-liquidation' };
      case 'CREATED':
        return { label: 'Created', className: 'status-transfer' };
      case 'PROCESSING':
        return { label: 'Processing', className: 'status-transfer' };
      case 'PROCESSED':
        return { label: 'Processed', className: 'status-transfer' };
      case 'RETRYING':
        return { label: 'Retrying', className: 'status-retrying' };
      case 'RECONCILED':
        return { label: 'Reconciled', className: 'status-completed' };
      case 'STALE':
        return { label: 'Stale', className: 'status-retrying' };
      case 'COMPLETE':
        return { label: 'Complete', className: 'status-completed' };
      case 'FAILED':
        return { label: 'Failed', className: 'status-failed' };
      case 'CANCELLED':
        return { label: 'Cancelled', className: 'status-cancelled' };
      default:
        return { label: status, className: 'status-default' };
    }
  };

  const config = getStatusConfig();
  const isException = daysPending !== undefined && daysPending > 6;

  return (
    <div className="status-badge-container">
      <span className={`status-badge ${config.className}`}>
        {config.label}
      </span>
      {isException && (
        <span className="exception-indicator" title="Exceeds 6-day threshold">
          <AlertTriangle size={14} />
        </span>
      )}
    </div>
  );
}

export default WithdrawalStatusBadge;
