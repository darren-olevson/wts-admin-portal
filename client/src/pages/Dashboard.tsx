import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  Users,
  FileText,
  ArrowRight,
  TrendingUp,
  Clock,
  Calendar,
  ArrowDownCircle,
  CheckCircle,
} from 'lucide-react';
import { dashboardApi } from '../lib/api';
import AgedWithdrawalQueue from '../components/AgedWithdrawalQueue';
import NegativePositionsCard from '../components/NegativePositionsCard';
import './Dashboard.css';

interface DashboardMetrics {
  investedAmount: number;
  fundedAccounts: number;
  totalUsers: number;
  withdrawalExceptions: number;
  totalWithdrawalAmount: number;
  negativePositionsSum: number;
  negativePositionsCount: number;
  statusSummary?: {
    pendingLiquidation: number;
    transferPending: number;
    completed: number;
    failed: number;
    retrying: number;
    reconciliationPending?: number;
    completionBreakdown?: {
      under3: number;
      threeTo5: number;
      sixPlus: number;
    };
  };
}

// Helper to get date string in YYYY-MM-DD format
const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

type DatePreset = 'all' | '30' | '90' | '365' | 'custom';

// Calculate date range based on preset
const getDateRangeFromPreset = (preset: DatePreset): { start: string; end: string } => {
  const end = new Date();
  const start = new Date();

  switch (preset) {
    case 'all':
      return { start: '', end: '' };
    case '30':
      start.setDate(start.getDate() - 30);
      break;
    case '90':
      start.setDate(start.getDate() - 90);
      break;
    case '365':
      start.setDate(start.getDate() - 365);
      break;
    case 'custom':
      start.setDate(start.getDate() - 30);
      break;
  }

  return {
    start: formatDateForInput(start),
    end: formatDateForInput(end),
  };
};

function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    investedAmount: 0,
    fundedAccounts: 0,
    totalUsers: 0,
    withdrawalExceptions: 0,
    totalWithdrawalAmount: 0,
    negativePositionsSum: 0,
    negativePositionsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [datePreset, setDatePreset] = useState<DatePreset>('30');
  const [customDateRange, setCustomDateRange] = useState(getDateRangeFromPreset('30'));

  // Get the effective date range based on preset or custom selection (memoized to prevent infinite re-renders)
  const dateRange = useMemo(() => {
    return datePreset === 'custom' ? customDateRange : getDateRangeFromPreset(datePreset);
  }, [datePreset, customDateRange.start, customDateRange.end]);

  const handlePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    if (preset !== 'custom') {
      setCustomDateRange(getDateRangeFromPreset(preset));
    }
  };

  // Stable string key for useEffect dependency to prevent infinite loops
  const dateRangeKey = `${dateRange.start}-${dateRange.end}`;

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const data = await dashboardApi.getMetrics(
          dateRange.start && dateRange.end
            ? { startDate: dateRange.start, endDate: dateRange.end }
            : undefined
        );
        setMetrics({
          ...data,
          totalWithdrawalAmount: data.totalWithdrawalAmount ?? 0,
          negativePositionsSum: data.negativePositionsSum ?? 0,
          negativePositionsCount: data.negativePositionsCount ?? 0,
        });
      } catch (error) {
        console.error('Error fetching dashboard metrics:', error);
        // Use mock data on error
        setMetrics({
          investedAmount: 45678900,
          fundedAccounts: 3421,
          totalUsers: 15234,
          withdrawalExceptions: 12,
          totalWithdrawalAmount: 125000,
          negativePositionsSum: -347.62,
          negativePositionsCount: 3,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [dateRangeKey]);

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-header-skeleton">
          <div className="skeleton-title"></div>
        </div>

        <div className="metrics-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="metric-card-skeleton">
              <div className="skeleton-icon"></div>
              <div className="skeleton-content">
                <div className="skeleton-label"></div>
                <div className="skeleton-value"></div>
              </div>
            </div>
          ))}
        </div>

        <div className="dashboard-two-column">
          <div className="dashboard-column">
            <div className="skeleton-section"></div>
          </div>
          <div className="dashboard-column">
            <div className="skeleton-section"></div>
          </div>
        </div>

        <div className="skeleton-table"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-header-left">
          <h1 className="dashboard-title">Invest Dashboard</h1>
          <div className="dashboard-date">
            <Clock size={16} />
            <span>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
        <div className="dashboard-filters">
          <div className="date-filter">
            <Calendar size={18} className="filter-icon" />
            <select
              value={datePreset}
              onChange={(e) => handlePresetChange(e.target.value as DatePreset)}
              className="date-preset-select"
            >
              <option value="all">All Time</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="365">Last 365 Days</option>
              <option value="custom">Custom Range</option>
            </select>
            {datePreset === 'custom' && (
              <div className="custom-date-range">
                <input
                  type="date"
                  value={customDateRange.start}
                  onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                  className="date-input"
                />
                <span className="date-separator">to</span>
                <input
                  type="date"
                  value={customDateRange.end}
                  onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                  className="date-input"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid metrics-grid-5">
        <div className="metric-card">
          <div className="metric-icon invested">
            <DollarSign size={24} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Invested Amount</p>
            <p className="metric-value">${metrics.investedAmount.toLocaleString()}</p>
            <div className="metric-trend positive">
              <TrendingUp size={14} />
              <span>+2.4% this month</span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon accounts">
            <Users size={24} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Funded Accounts</p>
            <p className="metric-value">{metrics.fundedAccounts.toLocaleString()}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon users">
            <FileText size={24} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Total Users</p>
            <p className="metric-value">{metrics.totalUsers.toLocaleString()}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon withdrawals">
            <ArrowDownCircle size={24} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Amount Withdrawal</p>
            <p className="metric-value">${metrics.totalWithdrawalAmount.toLocaleString()}</p>
            <div className="metric-subtext">Completed withdrawals</div>
          </div>
        </div>

        <NegativePositionsCard
          sum={metrics.negativePositionsSum}
          count={metrics.negativePositionsCount}
        />
      </div>

      {/* Withdrawal Status Summary */}
      <div className="dashboard-full-width">
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Withdrawal Status Summary</h2>
            <Link to="/invest/withdrawals" className="view-all-link">
              View All <ArrowRight size={16} />
            </Link>
          </div>
          <div className="status-cards status-cards-horizontal">
            <div className="status-card liquidation">
              <div className="status-card-header">
                <span className="status-label">Pending Liquidation</span>
                <Clock size={16} />
              </div>
              <span className="status-count">{metrics.statusSummary?.pendingLiquidation || 0}</span>
            </div>
            <div className="status-card transfer">
              <div className="status-card-header">
                <span className="status-label">Transfer Pending</span>
                <Clock size={16} />
              </div>
              <span className="status-count">{metrics.statusSummary?.transferPending || 0}</span>
            </div>
            <div className="status-card completed">
              <div className="status-card-header">
                <span className="status-label">Completed</span>
                <CheckCircle size={16} />
              </div>
              <span className="status-count">{metrics.statusSummary?.completed || 0}</span>
              {metrics.statusSummary?.completionBreakdown && (
                <div className="completion-breakdown">
                  <div className="breakdown-row">
                    <span className="breakdown-label">Under 3 days</span>
                    <span className="breakdown-pct">{metrics.statusSummary.completionBreakdown.under3}%</span>
                    <div className="breakdown-bar">
                      <div
                        className="breakdown-bar-fill fast"
                        style={{ width: `${metrics.statusSummary.completionBreakdown.under3}%` }}
                      />
                    </div>
                  </div>
                  <div className="breakdown-row">
                    <span className="breakdown-label">3 – 5 days</span>
                    <span className="breakdown-pct">{metrics.statusSummary.completionBreakdown.threeTo5}%</span>
                    <div className="breakdown-bar">
                      <div
                        className="breakdown-bar-fill moderate"
                        style={{ width: `${metrics.statusSummary.completionBreakdown.threeTo5}%` }}
                      />
                    </div>
                  </div>
                  <div className="breakdown-row">
                    <span className="breakdown-label">6+ days</span>
                    <span className="breakdown-pct">{metrics.statusSummary.completionBreakdown.sixPlus}%</span>
                    <div className="breakdown-bar">
                      <div
                        className="breakdown-bar-fill slow"
                        style={{ width: `${metrics.statusSummary.completionBreakdown.sixPlus}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Aged Withdrawal Queue */}
      <div className="dashboard-full-width">
        <AgedWithdrawalQueue thresholdDays={6} />
      </div>
    </div>
  );
}

export default Dashboard;
