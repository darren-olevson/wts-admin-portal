import { ReactNode } from 'react';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import './StatusBadge.css';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'pending';

interface StatusBadgeProps {
  /** The status text to display */
  status: string;
  /** Optional variant override (auto-detected from status if not provided) */
  variant?: BadgeVariant;
  /** Whether to show an icon */
  showIcon?: boolean;
  /** Custom icon to display */
  icon?: ReactNode;
  /** Additional CSS class */
  className?: string;
}

/**
 * Status badge component for displaying various statuses with consistent styling.
 * Automatically determines the appropriate variant based on common status patterns.
 * 
 * @example
 * <StatusBadge status="COMPLETE" />
 * <StatusBadge status="PENDING" showIcon />
 * <StatusBadge status="Custom" variant="warning" />
 */
export function StatusBadge({
  status,
  variant,
  showIcon = false,
  icon,
  className = '',
}: StatusBadgeProps): JSX.Element {
  const normalizedStatus = status.toUpperCase();
  
  // Auto-detect variant based on status text
  const detectedVariant = variant || getVariantFromStatus(normalizedStatus);
  
  const IconComponent = icon || getIconForVariant(detectedVariant);

  return (
    <span className={`status-badge status-badge--${detectedVariant} ${className}`}>
      {showIcon && IconComponent && (
        <span className="status-badge-icon">{IconComponent}</span>
      )}
      <span className="status-badge-text">{status}</span>
    </span>
  );
}

function getVariantFromStatus(status: string): BadgeVariant {
  // Success patterns
  if (/^(COMPLETE|COMPLETED|RECONCILED|MATCHED|ACTIVE|APPROVED|SUCCESS|DONE|VERIFIED|PROCESSED_SUCCESSFULLY)$/.test(status)) {
    return 'success';
  }
  
  // Warning patterns
  if (/^(PENDING|PENDING_LIQUIDATION|UNMATCHED|PROCESSING|PROCESSED|CREATED|IN.?PROGRESS|WAITING|REVIEW|RETRYING|STALE)$/.test(status)) {
    return 'warning';
  }
  
  // Error patterns
  if (/^(FAILED|ERROR|REJECTED|CANCELLED|EXCEPTION|EXPIRED|DENIED)$/.test(status)) {
    return 'error';
  }
  
  // Info patterns
  if (/^(N\/A|NA|INFO|NEW)$/.test(status)) {
    return 'info';
  }
  
  // Pending patterns
  if (/^(PARTIAL|FULL)$/.test(status)) {
    return 'pending';
  }
  
  return 'neutral';
}

function getIconForVariant(variant: BadgeVariant): ReactNode {
  switch (variant) {
    case 'success':
      return <CheckCircle size={14} />;
    case 'warning':
      return <AlertTriangle size={14} />;
    case 'error':
      return <XCircle size={14} />;
    case 'info':
      return <AlertCircle size={14} />;
    case 'pending':
      return <Clock size={14} />;
    default:
      return null;
  }
}

// Specialized badge components for common use cases

interface LiquidationStatusBadgeProps {
  status: string;
}

/**
 * Specialized badge for liquidation status.
 */
export function LiquidationStatusBadge({ status }: LiquidationStatusBadgeProps): JSX.Element {
  return <StatusBadge status={status as any} showIcon />;
}

interface TransferStatusBadgeProps {
  status: string;
}

/**
 * Specialized badge for transfer status.
 */
export function TransferStatusBadge({ status }: TransferStatusBadgeProps): JSX.Element {
  return <StatusBadge status={status as any} showIcon />;
}

interface ReconciliationStatusBadgeProps {
  status: 'MATCHED' | 'UNMATCHED' | 'EXCEPTION';
}

/**
 * Specialized badge for reconciliation status.
 */
export function ReconciliationStatusBadge({ status }: ReconciliationStatusBadgeProps): JSX.Element {
  return <StatusBadge status={status} showIcon />;
}

interface DirectionBadgeProps {
  direction: 'CREDIT' | 'DEBIT';
}

/**
 * Specialized badge for transaction direction.
 */
export function DirectionBadge({ direction }: DirectionBadgeProps): JSX.Element {
  const variant: BadgeVariant = direction === 'CREDIT' ? 'success' : 'error';
  return <StatusBadge status={direction} variant={variant} />;
}

interface WithdrawalTypeBadgeProps {
  type: 'FULL' | 'PARTIAL';
}

/**
 * Specialized badge for withdrawal type.
 */
export function WithdrawalTypeBadge({ type }: WithdrawalTypeBadgeProps): JSX.Element {
  return <StatusBadge status={type} variant="pending" />;
}

export default StatusBadge;
