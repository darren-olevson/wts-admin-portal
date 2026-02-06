import { useEffect, useState } from 'react';
import { User, Building2, CircleDot, DollarSign, Wallet, Clock, CheckCircle, XCircle, AlertCircle, ChevronDown } from 'lucide-react';
import { Position } from './OpenPositions';
import InvestActivityTable, { InvestActivityTransaction } from './InvestActivityTable';
import './AccountOverview.css';

interface Portfolio {
  id: string;
  name: string;
  cashBalance: number;
  positionsValue: number;
  positions: Position[];
  transactions: InvestActivityTransaction[];
}

interface AccountOverviewData {
  accountId: string;
  accountHolderName: string;
  brokerageId: string;
  brokerageAccountNumber: string;
  portfolioId: string;
  fundingAccountId: string;
  accountStatus: 'active' | 'inactive' | 'pending' | 'closed';
  accountType: string;
  totalBalance: number;
  cashBalance: number;
  positionsValue: number;
  openedDate: string;
  lastActivityDate: string;
  positions: Position[];
}

// Mock portfolios data
const MOCK_PORTFOLIOS: Portfolio[] = [
  {
    id: 'PTF-12345',
    name: 'Growth Portfolio',
    cashBalance: 15000,
    positionsValue: 6518,
    positions: [
      { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', quantity: 25, price: 220.50, value: 5512.50, change: 2.3 },
      { symbol: 'BND', name: 'Vanguard Total Bond Market ETF', quantity: 12, price: 83.75, value: 1005.00, change: -0.5 },
    ],
    transactions: [
      { id: 'tx-1', date: '2026-02-03', buys: 2500, deposits: 5000 },
      { id: 'tx-2', date: '2026-02-01', buys: 1800, dividends: 45 },
      { id: 'tx-3', date: '2026-01-28', sells: 1200, withdrawals: 1000 },
      { id: 'tx-4', date: '2026-01-25', deposits: 10000 },
    ],
  },
  {
    id: 'PTF-67890',
    name: 'Conservative Portfolio',
    cashBalance: 8500,
    positionsValue: 12350,
    positions: [
      { symbol: 'BND', name: 'Vanguard Total Bond Market ETF', quantity: 80, price: 83.75, value: 6700.00, change: -0.5 },
      { symbol: 'VTIP', name: 'Vanguard Short-Term Inflation-Protected', quantity: 50, price: 113.00, value: 5650.00, change: 0.2 },
    ],
    transactions: [
      { id: 'tx-5', date: '2026-02-04', dividends: 125, interests: 35 },
      { id: 'tx-6', date: '2026-02-02', buys: 3000 },
      { id: 'tx-7', date: '2026-01-30', deposits: 2500, reinvestments: 125 },
    ],
  },
  {
    id: 'PTF-11111',
    name: 'Aggressive Growth',
    cashBalance: 3200,
    positionsValue: 28750,
    positions: [
      { symbol: 'QQQ', name: 'Invesco QQQ Trust', quantity: 40, price: 450.25, value: 18010.00, change: 3.1 },
      { symbol: 'ARKK', name: 'ARK Innovation ETF', quantity: 150, price: 71.60, value: 10740.00, change: 4.5 },
    ],
    transactions: [
      { id: 'tx-8', date: '2026-02-05', buys: 8500, sells: 2200 },
      { id: 'tx-9', date: '2026-02-03', buys: 5000, deposits: 15000 },
      { id: 'tx-10', date: '2026-01-31', sells: 3500, withdrawals: 3000 },
      { id: 'tx-11', date: '2026-01-29', buys: 12000 },
      { id: 'tx-12', date: '2026-01-27', deposits: 20000 },
    ],
  },
];

interface AccountOverviewProps {
  accountId: string;
  userId?: string;
  initialData?: Partial<AccountOverviewData>;
  transactions?: InvestActivityTransaction[];
}

function AccountOverview({ accountId, userId, initialData, transactions = [] }: AccountOverviewProps) {
  const [data, setData] = useState<AccountOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUnseasonedDetails, setShowUnseasonedDetails] = useState(false);
  const [portfolios] = useState<Portfolio[]>(MOCK_PORTFOLIOS);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>(MOCK_PORTFOLIOS[0].id);
  const [displayedTransactions, setDisplayedTransactions] = useState<InvestActivityTransaction[]>(MOCK_PORTFOLIOS[0].transactions);
  const [seasonedCash, setSeasonedCash] = useState<{
    totalBalance: number;
    availableBalance: number;
    unseasonedAmount: number;
    nextSeasoningDate: string | null;
    daysUntilSeasoned: number | null;
    unseasonedDeposits?: Array<{
      amount: number;
      depositDate: string;
      seasoningDate: string;
      businessDaysRemaining: number;
    }>;
    unseasonedSchedule?: Array<{
      seasoningDate: string;
      amount: number;
      businessDaysRemaining: number;
    }>;
  } | null>(null);

  useEffect(() => {
    const fetchAccountData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [overviewResponse, balanceResponse] = await Promise.all([
          fetch(`/api/accounts/${accountId}/overview`),
          fetch(`/api/accounts/${accountId}/balance`),
        ]);
        if (!overviewResponse.ok) {
          throw new Error('Failed to fetch account overview');
        }
        const accountData = await overviewResponse.json();
        if (balanceResponse.ok) {
          const balanceData = await balanceResponse.json();
          setSeasonedCash(balanceData);
        }
        
        setData({
          ...accountData,
          ...initialData,
          portfolioId: accountData.portfolioId || initialData?.portfolioId || 'PTF-' + accountId.slice(-6).toUpperCase(),
          fundingAccountId: accountData.fundingAccountId || initialData?.fundingAccountId || 'FND-' + accountId.slice(-8).toUpperCase(),
        });
      } catch (err) {
        console.error('Error fetching account overview:', err);
        setError('Unable to load account overview');
        
        // Use mock data for development
        const selectedPortfolio = MOCK_PORTFOLIOS.find(p => p.id === selectedPortfolioId) || MOCK_PORTFOLIOS[0];
        setData({
          accountId,
          accountHolderName: initialData?.accountHolderName || 'Account Holder',
          brokerageId: initialData?.brokerageId || 'BRK-' + accountId.slice(-6),
          brokerageAccountNumber: initialData?.brokerageAccountNumber || 'ACC-' + accountId.slice(-8),
          portfolioId: selectedPortfolio.id,
          fundingAccountId: initialData?.fundingAccountId || 'FND-' + accountId.slice(-8).toUpperCase(),
          accountStatus: initialData?.accountStatus || 'active',
          accountType: initialData?.accountType || 'Individual',
          totalBalance: selectedPortfolio.cashBalance + selectedPortfolio.positionsValue,
          cashBalance: selectedPortfolio.cashBalance,
          positionsValue: selectedPortfolio.positionsValue,
          openedDate: initialData?.openedDate || new Date().toISOString(),
          lastActivityDate: initialData?.lastActivityDate || new Date().toISOString(),
          positions: selectedPortfolio.positions,
        });
        const unseasonedAmount = Math.round(selectedPortfolio.cashBalance * 0.13);
        setSeasonedCash({
          totalBalance: selectedPortfolio.cashBalance,
          availableBalance: selectedPortfolio.cashBalance - unseasonedAmount,
          unseasonedAmount: unseasonedAmount,
          nextSeasoningDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          daysUntilSeasoned: 3,
        });
        setDisplayedTransactions(selectedPortfolio.transactions);
      } finally {
        setLoading(false);
      }
    };

    fetchAccountData();
  }, [accountId, initialData, selectedPortfolioId]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getCashBalanceValue = () => {
    if (seasonedCash) {
      return seasonedCash.availableBalance + seasonedCash.unseasonedAmount;
    }
    return data?.cashBalance ?? 0;
  };

  const getNextSeasoningSummary = () => {
    if (!seasonedCash) {
      return '—';
    }

    const schedule = seasonedCash.unseasonedSchedule ?? [];
    if (schedule.length > 0) {
      const next = schedule[0];
      return `${formatCurrency(next.amount)} on ${formatDate(next.seasoningDate)} (${next.businessDaysRemaining} business day${next.businessDaysRemaining !== 1 ? 's' : ''})`;
    }

    if (seasonedCash.nextSeasoningDate) {
      const daysRemaining = seasonedCash.daysUntilSeasoned ?? 0;
      return `${formatCurrency(seasonedCash.unseasonedAmount)} on ${formatDate(seasonedCash.nextSeasoningDate)} (${daysRemaining} business day${daysRemaining !== 1 ? 's' : ''})`;
    }

    return '—';
  };

  const getUnseasonedDepositCount = () => {
    if (!seasonedCash) {
      return 0;
    }
    if (seasonedCash.unseasonedDeposits) {
      return seasonedCash.unseasonedDeposits.length;
    }
    return seasonedCash.unseasonedAmount > 0 ? 1 : 0;
  };

  const unseasonedDeposits = seasonedCash?.unseasonedDeposits ?? [];
  const canExpandUnseasoned = unseasonedDeposits.length > 1;

  useEffect(() => {
    if (!canExpandUnseasoned) {
      setShowUnseasonedDetails(false);
    }
  }, [canExpandUnseasoned, accountId]);


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle size={16} className="status-icon active" />;
      case 'inactive':
        return <Clock size={16} className="status-icon inactive" />;
      case 'pending':
        return <AlertCircle size={16} className="status-icon pending" />;
      case 'closed':
        return <XCircle size={16} className="status-icon closed" />;
      default:
        return <CircleDot size={16} className="status-icon" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'status-badge active';
      case 'inactive':
        return 'status-badge inactive';
      case 'pending':
        return 'status-badge pending';
      case 'closed':
        return 'status-badge closed';
      default:
        return 'status-badge';
    }
  };

  if (loading) {
    return (
      <div className="account-overview">
        <div className="account-overview-skeleton">
          <div className="skeleton-header">
            <div className="skeleton-line wide"></div>
            <div className="skeleton-line medium"></div>
          </div>
          <div className="skeleton-cards">
            <div className="skeleton-card"></div>
            <div className="skeleton-card"></div>
            <div className="skeleton-card"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="account-overview">
        <div className="account-overview-error">
          <AlertCircle size={24} />
          <span>{error || 'Unable to load account overview'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="account-overview">
      {/* Account Header */}
      <div className="account-header-section">
        <div className="account-identity">
          <div className="account-icon">
            <User size={24} />
          </div>
          <div className="account-info">
            <h2 className="account-holder-name">{data.accountHolderName}</h2>
            <div className="account-meta">
              <span className="meta-item">
                <Building2 size={14} />
                {data.brokerageAccountNumber}
              </span>
              <span className="meta-divider">|</span>
              <span className="meta-item">
                Brokerage ID: {data.brokerageId}
              </span>
              <span className="meta-divider">|</span>
              <span className="meta-item portfolio-selector">
                <label htmlFor="portfolio-select">Portfolio:</label>
                <div className="portfolio-dropdown-wrapper">
                  <select
                    id="portfolio-select"
                    value={selectedPortfolioId}
                    onChange={(e) => setSelectedPortfolioId(e.target.value)}
                    className="portfolio-dropdown"
                  >
                    {portfolios.map((portfolio) => (
                      <option key={portfolio.id} value={portfolio.id}>
                        {portfolio.name} ({portfolio.id})
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="portfolio-dropdown-icon" />
                </div>
              </span>
              <span className="meta-divider">|</span>
              <span className="meta-item funding-account-line">
                Funding Account: {data.fundingAccountId}
              </span>
            </div>
          </div>
        </div>
        <div className={getStatusBadgeClass(data.accountStatus)}>
          {getStatusIcon(data.accountStatus)}
          <span>{data.accountStatus.charAt(0).toUpperCase() + data.accountStatus.slice(1)}</span>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="balance-cards-grid">
        <div className="balance-card total">
          <div className="balance-card-icon">
            <DollarSign size={20} />
          </div>
          <div className="balance-card-content">
            <span className="balance-card-label">Total Equity</span>
            <span className="balance-card-value">{formatCurrency(data.cashBalance + data.positionsValue)}</span>
          </div>
        </div>
        <div className="balance-card cash">
          <div className="balance-card-icon">
            <Wallet size={20} />
          </div>
          <div className="balance-card-content">
            <span className="balance-card-label">Cash Balance</span>
            <span className="balance-card-value">{formatCurrency(getCashBalanceValue())}</span>
            {seasonedCash && (
              <div className="balance-card-meta">
                <div className="balance-card-row">
                  <span>Seasoned Cash</span>
                  <strong>{formatCurrency(seasonedCash.availableBalance)}</strong>
                </div>
                <div className="balance-card-row">
                  {seasonedCash.unseasonedAmount > 0 ? (
                    <button
                      type="button"
                      className={`unseasoned-dropdown-toggle ${showUnseasonedDetails ? 'open' : ''}`}
                      onClick={() => setShowUnseasonedDetails((prev) => !prev)}
                    >
                      <span>Unseasoned</span>
                      <span className="unseasoned-value-with-chevron">
                        <strong>{formatCurrency(seasonedCash.unseasonedAmount)}</strong>
                        <span className="unseasoned-dropdown-chevron">▼</span>
                      </span>
                    </button>
                  ) : (
                    <>
                      <span>Unseasoned</span>
                      <strong>{formatCurrency(seasonedCash.unseasonedAmount)}</strong>
                    </>
                  )}
                </div>
                {showUnseasonedDetails && seasonedCash.unseasonedAmount > 0 && (
                  <div className="unseasoned-dropdown">
                    <div className="unseasoned-detail-row">
                      <span>Next Seasoning</span>
                      <strong>{getNextSeasoningSummary()}</strong>
                    </div>
                    {unseasonedDeposits.length > 0 && (
                      <>
                        <div className="unseasoned-detail-row">
                          <span>Unseasoned Deposits</span>
                          <strong>{unseasonedDeposits.length}</strong>
                        </div>
                        {unseasonedDeposits.map((deposit) => (
                          <div
                            key={`${deposit.depositDate}-${deposit.amount}`}
                            className="unseasoned-deposit-row"
                          >
                            <span className="unseasoned-deposit-date">
                              {formatDate(deposit.depositDate)}
                            </span>
                            <span className="unseasoned-deposit-amount">
                              {formatCurrency(deposit.amount)}
                            </span>
                            <span className="unseasoned-deposit-remaining">
                              {deposit.businessDaysRemaining} business day
                              {deposit.businessDaysRemaining !== 1 ? 's' : ''} remaining
                            </span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="balance-card positions">
          <div className="balance-card-icon">
            <Building2 size={20} />
          </div>
          <div className="balance-card-content">
            <span className="balance-card-label">Positions Value</span>
            <span className="balance-card-value">{formatCurrency(data.positionsValue)}</span>
          </div>
        </div>
      </div>

      {/* Invest Activity Section */}
      <div className="section-divider">
        <h3 className="section-title">Invest Activity</h3>
      </div>
      <InvestActivityTable
        transactions={displayedTransactions}
        totalEquity={data.cashBalance + data.positionsValue}
        seasonedCash={seasonedCash?.availableBalance}
      />
    </div>
  );
}

export default AccountOverview;
