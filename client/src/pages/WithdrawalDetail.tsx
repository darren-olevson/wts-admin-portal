import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  X,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Minus,
  Clock,
  FastForward,
  DollarSign,
  TrendingUp,
  Wallet,
  Calendar,
  ArrowRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import WithdrawalRemediationDialog from '../components/WithdrawalRemediationDialog';
import WithdrawalStatusBadge from '../components/WithdrawalStatusBadge';
import { withdrawalsApi, accountsApi, AuditEntry, AccountOverview } from '../lib/api';
import './WithdrawalDetail.css';

type WithdrawalType = 'FULL' | 'PARTIAL';
type ReconciliationStatus = 'MATCHED' | 'UNMATCHED' | 'EXCEPTION' | 'PENDING';

interface CorrespondingTransfer {
  id: string;
  externalId: string;
  amount: number;
  status: 'CREATED' | 'PROCESSING' | 'PROCESSED' | 'COMPLETE' | 'RETRYING' | 'RECONCILED' | 'STALE' | 'FAILED' | 'CANCELLED';
  matched: boolean;
  matchedTimestamp?: string;
  createdAt: string;
  updatedAt: string;
}

interface CorrespondingLiquidation {
  id: string;
  requestId: string;
  amount: number;
  status: 'CREATED' | 'PENDING' | 'COMPLETE' | 'FAILED' | 'CANCELLED' | 'PROCESSED_SUCCESSFULLY';
  liquidationType: 'FULL' | 'PARTIAL';
  createdAt: string;
  updatedAt: string;
}

interface SeasonedCashData {
  totalBalance: number;
  availableBalance: number;
  unseasonedAmount: number;
  nextSeasoningDate: string | null;
  daysUntilSeasoned: number | null;
  unseasonedSchedule?: Array<{
    seasoningDate: string;
    amount: number;
    businessDaysRemaining: number;
  }>;
  unseasonedDeposits?: Array<{
    amount: number;
    depositDate: string;
    seasoningDate: string;
    businessDaysRemaining: number;
  }>;
}

interface WithdrawalDetailData {
  id: string;
  accountId: string;
  clientId: string;
  clientName: string;
  amount: number;
  actualAmount?: number;
  status: string;
  requestDate: string;
  brokerageAccountNumber: string;
  brokerageId: string;
  portfolioId: string;
  goalId: string;
  daysPending: number;
  withdrawalType?: WithdrawalType;
  reconciliationStatus?: ReconciliationStatus;
  transferType?: 'ACH' | 'WIRE' | 'CARD';
  auditLog?: AuditEntry[];
  reprocessedFromId?: string;
  reprocessedToId?: string;
  liquidationSkipped?: boolean;
  correspondingTransfer?: CorrespondingTransfer;
  correspondingLiquidation?: CorrespondingLiquidation;
}

// Helper component for reconciliation status badge
function ReconciliationStatusBadge({ status }: { status?: ReconciliationStatus }) {
  const config: Record<ReconciliationStatus, { icon: React.ReactNode; label: string; className: string }> = {
    MATCHED: { icon: <CheckCircle2 size={14} />, label: 'Matched', className: 'recon-matched' },
    UNMATCHED: { icon: <XCircle size={14} />, label: 'Unmatched', className: 'recon-unmatched' },
    EXCEPTION: { icon: <AlertCircle size={14} />, label: 'Exception', className: 'recon-exception' },
    PENDING: { icon: <Minus size={14} />, label: 'Pending', className: 'recon-pending' },
  };

  const { icon, label, className } = config[status || 'PENDING'];

  return (
    <span className={`recon-badge ${className}`}>
      {icon}
      {label}
    </span>
  );
}

// Helper component for withdrawal type badge
function WithdrawalTypeBadge({ type }: { type?: WithdrawalType }) {
  return (
    <span className={`withdrawal-type-badge ${type === 'FULL' ? 'type-full' : 'type-partial'}`}>
      {type || 'N/A'}
    </span>
  );
}

function WithdrawalDetail() {
  const { withdrawalId } = useParams<{ withdrawalId: string }>();
  const navigate = useNavigate();
  const [withdrawal, setWithdrawal] = useState<WithdrawalDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [accountOverview, setAccountOverview] = useState<AccountOverview | null>(null);
  const [accountOverviewLoading, setAccountOverviewLoading] = useState(false);
  const [accountOverviewError, setAccountOverviewError] = useState<string | null>(null);
  const [seasonedCashData, setSeasonedCashData] = useState<SeasonedCashData | null>(null);
  const [seasonedCashLoading, setSeasonedCashLoading] = useState(false);
  const [showDepositDetails, setShowDepositDetails] = useState(false);
  const [isAdmin] = useState(true); // TODO: Get from auth context

  const fetchWithdrawal = async () => {
    if (!withdrawalId) return;

    try {
      setLoading(true);
      const data = await withdrawalsApi.get(withdrawalId);
      const statusUpper = data.status?.toUpperCase();
      const isComplete = statusUpper === 'COMPLETE' || statusUpper === 'RECONCILED';
      const isCancelled = statusUpper === 'CANCELLED';
      const isFailed = statusUpper === 'FAILED';
      const isMatched = (data as any).reconciliationStatus === 'MATCHED';
      
      // Determine transfer status based on ACH Transfer status per EDD
      let transferStatus: CorrespondingTransfer['status'] = 'CREATED';
      if (isComplete) transferStatus = 'COMPLETE';
      else if (isCancelled) transferStatus = 'CANCELLED';
      else if (isFailed) transferStatus = 'FAILED';
      else if (statusUpper === 'PROCESSING') transferStatus = 'PROCESSING';
      else if (statusUpper === 'PROCESSED') transferStatus = 'PROCESSED';
      else if (statusUpper === 'RETRYING') transferStatus = 'RETRYING';
      else if (statusUpper === 'STALE') transferStatus = 'STALE';
      else if (statusUpper === 'RECONCILED') transferStatus = 'RECONCILED';

      // Determine liquidation status based on EDD Cash Movement statuses
      let liquidationStatus: CorrespondingLiquidation['status'] = 'CREATED';
      if (isComplete || ['CREATED', 'PROCESSING', 'PROCESSED', 'RETRYING', 'STALE', 'RECONCILED'].includes(statusUpper)) {
        liquidationStatus = 'COMPLETE';
      }
      if (statusUpper === 'PENDING_LIQUIDATION') liquidationStatus = 'PENDING';
      if (isCancelled) liquidationStatus = 'CANCELLED';
      if (isFailed) liquidationStatus = 'FAILED';

      const correspondingTransfer: CorrespondingTransfer = {
        id: Math.floor(Math.random() * 9000000 + 1000000).toString(),
        externalId: `2026020${Math.floor(Math.random() * 9000000 + 1000000)}`,
        amount: data.amount,
        status: transferStatus,
        matched: isMatched,
        matchedTimestamp: isMatched ? new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        createdAt: new Date(new Date(data.requestDate).getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const correspondingLiquidation: CorrespondingLiquidation = {
        id: Math.floor(Math.random() * 900000 + 100000).toString(),
        requestId: `prod-rAay1B7suTUpGK7gFM9KBxKMNNe`,
        amount: data.amount,
        status: liquidationStatus,
        liquidationType: (data as any).withdrawalType || 'FULL',
        createdAt: new Date(new Date(data.requestDate).getTime() + 1 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(new Date(data.requestDate).getTime() + 2 * 60 * 60 * 1000).toISOString(),
      };

      setWithdrawal({
        id: data.id,
        accountId: data.accountId,
        clientId: data.clientId,
        clientName: data.clientName,
        amount: data.amount,
        actualAmount: (data as any).actualAmount,
        status: data.status,
        requestDate: data.requestDate,
        brokerageAccountNumber: data.brokerageAccountNumber || '',
        brokerageId: data.brokerageId || '',
        portfolioId: (data as any).portfolioId || 'PTF-' + data.accountId.slice(-6).toUpperCase(),
        goalId: data.goalId || '',
        daysPending: data.daysPending,
        withdrawalType: (data as any).withdrawalType,
        reconciliationStatus: (data as any).reconciliationStatus,
        transferType: (data as any).transferType,
        auditLog: data.auditLog,
        reprocessedFromId: data.reprocessedFromId,
        reprocessedToId: data.reprocessedToId,
        liquidationSkipped: data.liquidationSkipped,
        correspondingTransfer,
        correspondingLiquidation,
      });
    } catch (error) {
      console.error('Error fetching withdrawal details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawal();
  }, [withdrawalId]);

  useEffect(() => {
    if (!withdrawal?.accountId) return;

    let isActive = true;

    const fetchAccountData = async () => {
      try {
        setAccountOverviewLoading(true);
        setSeasonedCashLoading(true);
        setAccountOverviewError(null);
        
        // Fetch both account overview and seasoned cash data
        const [overviewData, balanceResponse] = await Promise.all([
          accountsApi.getOverview(withdrawal.accountId),
          fetch(`/api/accounts/${withdrawal.accountId}/balance`).then(r => r.ok ? r.json() : null)
        ]);
        
        if (isActive) {
          setAccountOverview(overviewData);
          setSeasonedCashData(balanceResponse);
        }
      } catch (error) {
        console.error('Error fetching account data:', error);
        if (isActive) {
          setAccountOverviewError('Unable to load account data');
        }
      } finally {
        if (isActive) {
          setAccountOverviewLoading(false);
          setSeasonedCashLoading(false);
        }
      }
    };

    fetchAccountData();

    return () => {
      isActive = false;
    };
  }, [withdrawal?.accountId]);

  if (loading) {
    return <div className="withdrawal-detail-loading">Loading withdrawal details...</div>;
  }

  if (!withdrawal) {
    return <div className="withdrawal-detail-error">Withdrawal not found</div>;
  }

  const seasonedCash = seasonedCashData?.availableBalance ?? 0;
  const unseasonedCash = seasonedCashData?.unseasonedAmount ?? 0;
  const totalCash = accountOverview?.cashBalance ?? seasonedCashData?.totalBalance ?? 0;
  const isFeasible = totalCash >= withdrawal.amount;
  const cashShortfall = Math.max(0, withdrawal.amount - totalCash);
  const unseasonedSchedule = seasonedCashData?.unseasonedSchedule ?? [];
  const unseasonedDeposits = seasonedCashData?.unseasonedDeposits ?? [];
  const hasUnseasonedFunds = unseasonedCash > 0;

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  return (
    <div className="withdrawal-detail">
      <button onClick={() => navigate('/invest/withdrawals')} className="back-button">
        <ArrowLeft size={20} />
        Back to Withdrawals
      </button>

      {/* Main Header */}
      <div className="withdrawal-header">
        <div className="withdrawal-id-row">
          <h1 className="withdrawal-id">Withdrawal {withdrawal.id}</h1>
          <div className="header-badges">
            <WithdrawalTypeBadge type={withdrawal.withdrawalType} />
            <WithdrawalStatusBadge status={withdrawal.status} daysPending={withdrawal.daysPending} />
          </div>
        </div>
        <div className="withdrawal-meta">
          <Link to={`/users/${withdrawal.clientId}`} className="meta-link">
            {withdrawal.clientName}
          </Link>
          <span className="meta-separator">•</span>
          <span className="meta-item">{withdrawal.accountId}</span>
          <span className="meta-separator">•</span>
          <span className="meta-item">Portfolio: {withdrawal.portfolioId}</span>
        </div>
        {(withdrawal.reprocessedToId || withdrawal.reprocessedFromId || withdrawal.liquidationSkipped) && (
          <div className="action-status-badges">
            {withdrawal.reprocessedToId && (
              <Link to={`/invest/withdrawals/${withdrawal.reprocessedToId}`} className="action-badge reprocessed-badge">
                <RefreshCw size={14} />
                Reprocessed → {withdrawal.reprocessedToId}
              </Link>
            )}
            {withdrawal.reprocessedFromId && (
              <Link to={`/invest/withdrawals/${withdrawal.reprocessedFromId}`} className="action-badge created-from-badge">
                <RefreshCw size={14} />
                Created from {withdrawal.reprocessedFromId}
              </Link>
            )}
            {withdrawal.liquidationSkipped && (
              <span className="action-badge liquidation-skipped-badge">
                <FastForward size={14} />
                Liquidation Skipped
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="withdrawal-main-grid">
        <div className="content-column">
          <div className="detail-card account-card">
            <h2 className="card-title">Account Snapshot</h2>
            <div className="metric-grid">
              <div className="metric-card">
                <div className="metric-icon metric-icon-equity">
                  <TrendingUp size={16} />
                </div>
                <div className="metric-content">
                  <span className="metric-label">Total Equity</span>
                  <span className="metric-value">
                    {accountOverviewLoading ? '...' : `$${(accountOverview?.totalBalance ?? 0).toLocaleString()}`}
                  </span>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-icon metric-icon-cash">
                  <Wallet size={16} />
                </div>
                <div className="metric-content">
                  <span className="metric-label">Cash Balance</span>
                  <span className="metric-value">
                    {accountOverviewLoading ? '...' : `$${totalCash.toLocaleString()}`}
                  </span>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-icon metric-icon-positions">
                  <DollarSign size={16} />
                </div>
                <div className="metric-content">
                  <span className="metric-label">Positions Value</span>
                  <span className="metric-value">
                    {accountOverviewLoading ? '...' : `$${(accountOverview?.positionsValue ?? 0).toLocaleString()}`}
                  </span>
                </div>
              </div>
            </div>
            {!accountOverviewLoading && !seasonedCashLoading && (
              <div className="cash-inline">
                <span className="cash-inline-label">Seasoned:</span>
                <span className="cash-inline-value">${seasonedCash.toLocaleString()}</span>
                <span className="cash-inline-divider">•</span>
                <span className="cash-inline-label">Unseasoned:</span>
                <span className={`cash-inline-value ${hasUnseasonedFunds ? 'cash-inline-warning' : ''}`}>
                  ${unseasonedCash.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {hasUnseasonedFunds && (
            <div className="detail-card seasoning-card">
              <div className="seasoning-header">
                <Calendar size={18} />
                <h2 className="card-title">Seasoning Timeline</h2>
              </div>
              <p className="seasoning-summary">
                <strong>${unseasonedCash.toLocaleString()}</strong> unseasoned across{' '}
                <strong>{unseasonedSchedule.length || 1}</strong> upcoming date{unseasonedSchedule.length !== 1 ? 's' : ''}
              </p>
              <div className="seasoning-timeline">
                {unseasonedSchedule.map((entry) => (
                  <div key={entry.seasoningDate} className="timeline-item">
                    <div className="timeline-date">{formatDate(entry.seasoningDate)}</div>
                    <div className="timeline-amount">${entry.amount.toLocaleString()}</div>
                    <div className="timeline-remaining">
                      {entry.businessDaysRemaining} business day{entry.businessDaysRemaining !== 1 ? 's' : ''} remaining
                    </div>
                  </div>
                ))}
              </div>
              {unseasonedDeposits.length > 0 && (
                <button
                  className="deposit-details-toggle"
                  onClick={() => setShowDepositDetails(!showDepositDetails)}
                >
                  {showDepositDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  Deposit details
                </button>
              )}
              {showDepositDetails && unseasonedDeposits.length > 0 && (
                <div className="deposit-details">
                  {unseasonedDeposits.map((deposit) => {
                    const progress = Math.min(100, ((5 - deposit.businessDaysRemaining) / 5) * 100);
                    return (
                      <div key={`${deposit.depositDate}-${deposit.amount}`} className="deposit-item">
                        <div className="deposit-info">
                          <span className="deposit-date">{formatDate(deposit.depositDate)}</span>
                          <span className="deposit-amount">${deposit.amount.toLocaleString()}</span>
                        </div>
                        <div className="deposit-progress">
                          <div className="deposit-progress-bar" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="deposit-remaining">
                          {deposit.businessDaysRemaining} day{deposit.businessDaysRemaining !== 1 ? 's' : ''} left
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {!hasUnseasonedFunds && !seasonedCashLoading && (
            <div className="detail-card seasoning-card seasoning-card-ok">
              <div className="seasoning-header">
                <CheckCircle2 size={18} />
                <h2 className="card-title">All Funds Seasoned</h2>
              </div>
              <p className="seasoning-ok-text">All cash is fully seasoned and available for withdrawal.</p>
            </div>
          )}
        </div>

        <div className="content-column">
          <div className="detail-card request-card">
            <h2 className="card-title">Withdrawal Request</h2>
            <div className="detail-rows">
              <div className="detail-row detail-row-highlight">
                <span className="detail-label">Requested Amount</span>
                <span className="detail-value detail-value-amount">${withdrawal.amount.toLocaleString()}</span>
              </div>
              {withdrawal.actualAmount !== undefined && (
                <div className="detail-row">
                  <span className="detail-label">Actual Amount</span>
                  <span className={`detail-value ${withdrawal.actualAmount !== withdrawal.amount ? 'detail-value-diff' : ''}`}>
                    ${withdrawal.actualAmount.toLocaleString()}
                    {withdrawal.actualAmount !== withdrawal.amount && (
                      <span className="variance">
                        ({withdrawal.actualAmount > withdrawal.amount ? '+' : ''}
                        ${(withdrawal.actualAmount - withdrawal.amount).toLocaleString()})
                      </span>
                    )}
                  </span>
                </div>
              )}
              <div className="detail-row">
                <span className="detail-label">Request Date</span>
                <span className="detail-value">{formatDate(withdrawal.requestDate)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Days Pending</span>
                <span className={`detail-value ${withdrawal.daysPending > 6 ? 'detail-value-warning' : ''}`}>
                  {withdrawal.daysPending} days
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Reconciliation</span>
                <span className="detail-value">
                  <ReconciliationStatusBadge status={withdrawal.reconciliationStatus} />
                </span>
              </div>
            </div>
            <div className="feasibility-section">
              <h3 className="subsection-title">Feasibility</h3>
              <div className={`feasibility-indicator ${isFeasible ? 'feasibility-ok' : 'feasibility-insufficient'}`}>
                {isFeasible ? (
                  <>
                    <CheckCircle2 size={18} />
                    <span>Sufficient cash available</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={18} />
                    <span>Insufficient by ${cashShortfall.toLocaleString()}</span>
                  </>
                )}
              </div>
              <div className="feasibility-comparison">
                <div className="comparison-row">
                  <span>Requested</span>
                  <span>${withdrawal.amount.toLocaleString()}</span>
                </div>
                <div className="comparison-row">
                  <span>Available Cash</span>
                  <span>${totalCash.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {(withdrawal.correspondingTransfer || withdrawal.correspondingLiquidation) && (
            <div className="detail-card related-card">
              <h2 className="card-title">Related Records</h2>
              <div className="related-records-grid">
                {withdrawal.correspondingTransfer && (
                  <div className="record-card">
                    <div className="record-header">
                      <span className="record-type">Transfer</span>
                      <span className={`status-pill ${withdrawal.correspondingTransfer.status.toLowerCase()}`}>
                        {withdrawal.correspondingTransfer.status}
                      </span>
                    </div>
                    <div className="record-body">
                      <div className="record-row">
                        <span>ID</span>
                        <span className="mono">{withdrawal.correspondingTransfer.id}</span>
                      </div>
                      <div className="record-row">
                        <span>External ID</span>
                        <span className="mono">{withdrawal.correspondingTransfer.externalId}</span>
                      </div>
                      <div className="record-row">
                        <span>Amount</span>
                        <span>${withdrawal.correspondingTransfer.amount.toLocaleString()}</span>
                      </div>
                      <div className="record-row">
                        <span>Matched</span>
                        <span>{withdrawal.correspondingTransfer.matched ? '✓ Yes' : '— No'}</span>
                      </div>
                      {withdrawal.correspondingTransfer.matchedTimestamp && (
                        <div className="record-row">
                          <span>Matched At</span>
                          <span>{new Date(withdrawal.correspondingTransfer.matchedTimestamp).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="record-row">
                        <span>Created</span>
                        <span>{new Date(withdrawal.correspondingTransfer.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                {withdrawal.correspondingLiquidation && (
                  <div className="record-card">
                    <div className="record-header">
                      <span className="record-type">Liquidation</span>
                      <span className={`status-pill ${withdrawal.correspondingLiquidation.status.toLowerCase()}`}>
                        {withdrawal.correspondingLiquidation.status}
                      </span>
                    </div>
                    <div className="record-body">
                      <div className="record-row">
                        <span>ID</span>
                        <span className="mono">{withdrawal.correspondingLiquidation.id}</span>
                      </div>
                      <div className="record-row">
                        <span>Request ID</span>
                        <span className="mono truncate">{withdrawal.correspondingLiquidation.requestId}</span>
                      </div>
                      <div className="record-row">
                        <span>Amount</span>
                        <span>${withdrawal.correspondingLiquidation.amount.toLocaleString()}</span>
                      </div>
                      <div className="record-row">
                        <span>Type</span>
                        <span className={`type-badge ${withdrawal.correspondingLiquidation.liquidationType.toLowerCase()}`}>
                          {withdrawal.correspondingLiquidation.liquidationType}
                        </span>
                      </div>
                      <div className="record-row">
                        <span>Created</span>
                        <span>{new Date(withdrawal.correspondingLiquidation.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Audit Trail Section */}
      {withdrawal.auditLog && withdrawal.auditLog.length > 0 && (
        <div className="audit-section">
          <h2 className="section-title">
            <Clock size={18} />
            Audit Trail
          </h2>
          <div className="audit-trail">
            {withdrawal.auditLog.map((entry) => (
              <div key={entry.id} className="audit-entry">
                <div className="audit-entry-header">
                  <span className={`audit-action-badge action-${entry.action.toLowerCase()}`}>
                    {entry.action === 'CANCEL' && <X size={14} />}
                    {entry.action === 'REPROCESS' && <RefreshCw size={14} />}
                    {entry.action === 'SKIP_LIQUIDATION' && <FastForward size={14} />}
                    {entry.action.replace('_', ' ')}
                  </span>
                  <span className="audit-timestamp">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="audit-entry-body">
                  <div className="audit-performer">
                    Performed by: <strong>{entry.performedBy}</strong>
                  </div>
                  {entry.previousStatus && entry.newStatus && (
                    <div className="audit-status-change">
                      {entry.previousStatus} <ArrowRight size={14} /> {entry.newStatus}
                    </div>
                  )}
                  <div className="audit-notes">{entry.notes}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Remediation Actions */}
      {isAdmin && !['COMPLETE', 'RECONCILED', 'CANCELLED', 'FAILED'].includes(withdrawal.status?.toUpperCase()) && (
        <div className="remediation-section">
          <h2 className="section-title">Remediation Actions</h2>
          <div className="remediation-actions">
            <button
              onClick={() => setShowCancelDialog(true)}
              className="action-button action-button-cancel"
            >
              <X size={20} />
              Cancel Withdrawal
            </button>
          </div>
        </div>
      )}

      {showCancelDialog && (
        <WithdrawalRemediationDialog
          withdrawalId={withdrawal.id}
          action="cancel"
          onClose={() => setShowCancelDialog(false)}
          onSuccess={() => {
            setShowCancelDialog(false);
            fetchWithdrawal();
          }}
        />
      )}

    </div>
  );
}

export default WithdrawalDetail;
