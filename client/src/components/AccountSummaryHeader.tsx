import './AccountSummaryHeader.css';

interface AccountSummaryHeaderProps {
  summary: {
    totalEquity?: number;
    gains?: number;
    cash?: number;
    positions?: number;
    availableToWithdraw?: number;
    target?: number;
    portfolioType?: string;
    brokerageAccountNumber?: string;
    brokerageAccountId?: string;
    accountStatus?: string;
  };
}

const formatCurrency = (value?: number) => {
  if (value === undefined || value === null) return 'N/A';
  return `$${value.toLocaleString()}`;
};

function AccountSummaryHeader({ summary }: AccountSummaryHeaderProps) {
  return (
    <div className="account-summary">
      <div className="summary-grid">
        <div className="summary-item">
          <span className="summary-label">Total Equity</span>
          <span className="summary-value">{formatCurrency(summary.totalEquity)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Gains</span>
          <span className="summary-value">{formatCurrency(summary.gains)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Cash</span>
          <span className="summary-value">{formatCurrency(summary.cash)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Positions</span>
          <span className="summary-value">{summary.positions ?? 'N/A'}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Available to Withdraw</span>
          <span className="summary-value">{formatCurrency(summary.availableToWithdraw)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Target</span>
          <span className="summary-value">{formatCurrency(summary.target)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Portfolio</span>
          <span className="summary-value">{summary.portfolioType || 'N/A'}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Brokerage Account #</span>
          <span className="summary-value">{summary.brokerageAccountNumber || 'N/A'}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Brokerage Account ID</span>
          <span className="summary-value">{summary.brokerageAccountId || 'N/A'}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Status</span>
          <span className="summary-value">{summary.accountStatus || 'N/A'}</span>
        </div>
      </div>
    </div>
  );
}

export default AccountSummaryHeader;
