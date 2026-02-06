import { AlertTriangle } from 'lucide-react';
import './WithdrawalStatusBadge.css';

interface WithdrawalStatusBadgeProps {
  status: string;
  daysPending?: number;
}

function WithdrawalStatusBadge({ status, daysPending }: WithdrawalStatusBadgeProps) {
  const getStatusConfig = () => {
    const normalizedStatus = status.toLowerCase();
    
    if (normalizedStatus.includes('liquidation_pending')) {
      return {
        label: 'Liquidation Pending',
        className: 'status-liquidation',
      };
    }
    if (normalizedStatus.includes('pending_liquidation')) {
      return {
        label: 'Pending Liquidation',
        className: 'status-liquidation',
      };
    }
    if (normalizedStatus.includes('transfer_created')) {
      return {
        label: 'Transfer Created',
        className: 'status-transfer',
      };
    }
    if (normalizedStatus.includes('created')) {
      return {
        label: 'Created',
        className: 'status-transfer',
      };
    }
    if (normalizedStatus.includes('transfer_pending')) {
      return {
        label: 'Transfer Pending',
        className: 'status-transfer',
      };
    }
    if (normalizedStatus.includes('approval_failed') || normalizedStatus.includes('failed')) {
      return {
        label: 'Failed',
        className: 'status-failed',
      };
    }
    if (normalizedStatus.includes('cancelled')) {
      return {
        label: 'Cancelled',
        className: 'status-cancelled',
      };
    }
    if (normalizedStatus.includes('completed')) {
      return {
        label: 'Completed',
        className: 'status-completed',
      };
    }
    return {
      label: status,
      className: 'status-default',
    };
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
