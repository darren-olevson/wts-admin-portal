import { TrendingUp, TrendingDown, ArrowRight, DollarSign, Calendar } from 'lucide-react';
import './BalanceCard.css';

export interface DailyBalance {
  date: string;
  openingBalance: number;
  closingBalance: number;
  deposits: number;
  withdrawals: number;
  netChange: number;
}

interface BalanceCardProps {
  balance: DailyBalance;
  onClick?: () => void;
  compact?: boolean;
}

function BalanceCard({ balance, onClick, compact = false }: BalanceCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const isPositiveChange = balance.netChange >= 0;

  if (compact) {
    return (
      <div className={`balance-card-compact ${onClick ? 'clickable' : ''}`} onClick={onClick}>
        <div className="compact-date">
          <Calendar size={14} />
          {formatDate(balance.date)}
        </div>
        <div className="compact-balances">
          <div className="compact-balance">
            <span className="compact-label">Open</span>
            <span className="compact-value">{formatCurrency(balance.openingBalance)}</span>
          </div>
          <ArrowRight size={16} className="compact-arrow" />
          <div className="compact-balance">
            <span className="compact-label">Close</span>
            <span className="compact-value">{formatCurrency(balance.closingBalance)}</span>
          </div>
        </div>
        <div className={`compact-change ${isPositiveChange ? 'positive' : 'negative'}`}>
          {isPositiveChange ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {isPositiveChange ? '+' : ''}
          {formatCurrency(balance.netChange)}
        </div>
      </div>
    );
  }

  return (
    <div className={`balance-card-full ${onClick ? 'clickable' : ''}`} onClick={onClick}>
      <div className="balance-card-header">
        <div className="balance-date">
          <Calendar size={18} />
          <span>{formatDate(balance.date)}</span>
        </div>
        <div className={`net-change-badge ${isPositiveChange ? 'positive' : 'negative'}`}>
          {isPositiveChange ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          <span>
            {isPositiveChange ? '+' : ''}
            {formatCurrency(balance.netChange)}
          </span>
        </div>
      </div>

      <div className="balance-card-body">
        <div className="balance-flow">
          <div className="balance-item opening">
            <div className="balance-icon">
              <DollarSign size={20} />
            </div>
            <div className="balance-content">
              <span className="balance-label">Opening Balance</span>
              <span className="balance-value">{formatCurrency(balance.openingBalance)}</span>
            </div>
          </div>

          <div className="balance-arrow">
            <ArrowRight size={24} />
          </div>

          <div className="balance-item closing">
            <div className="balance-icon">
              <DollarSign size={20} />
            </div>
            <div className="balance-content">
              <span className="balance-label">Closing Balance</span>
              <span className="balance-value">{formatCurrency(balance.closingBalance)}</span>
            </div>
          </div>
        </div>

        <div className="balance-breakdown">
          <div className="breakdown-item deposits">
            <span className="breakdown-label">Deposits</span>
            <span className="breakdown-value positive">+{formatCurrency(balance.deposits)}</span>
          </div>
          <div className="breakdown-item withdrawals">
            <span className="breakdown-label">Withdrawals</span>
            <span className="breakdown-value negative">-{formatCurrency(balance.withdrawals)}</span>
          </div>
        </div>
      </div>

      {onClick && (
        <div className="balance-card-footer">
          <span>View transactions</span>
          <ArrowRight size={16} />
        </div>
      )}
    </div>
  );
}

export default BalanceCard;
