import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, RefreshCw, Filter } from 'lucide-react';
import { moneyMovementApi } from '../lib/api';
import BalanceCard, { DailyBalance } from '../components/BalanceCard';
import './BalanceVisibility.css';

function BalanceVisibility() {
  const navigate = useNavigate();
  const [balances, setBalances] = useState<DailyBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [accountFilter, setAccountFilter] = useState('');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const fetchBalances = useCallback(async () => {
    try {
      setLoading(true);
      const startDate = new Date(currentMonth.year, currentMonth.month, 1);
      const endDate = new Date(currentMonth.year, currentMonth.month + 1, 0);

      const data = await moneyMovementApi.getBalances({
        accountId: accountFilter || undefined,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      });
      setBalances(data);
    } catch (error) {
      console.error('Error fetching balances:', error);
    } finally {
      setLoading(false);
    }
  }, [currentMonth, accountFilter]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  const handlePreviousMonth = () => {
    setCurrentMonth((prev) => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  const handleBalanceClick = (balance: DailyBalance) => {
    navigate(`/money-movement/transactions?date=${balance.date}`);
  };

  const formatMonthYear = (year: number, month: number) => {
    return new Date(year, month).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Calculate summary stats
  const summary = balances.reduce(
    (acc, b) => ({
      totalDeposits: acc.totalDeposits + b.deposits,
      totalWithdrawals: acc.totalWithdrawals + b.withdrawals,
      netChange: acc.netChange + b.netChange,
    }),
    { totalDeposits: 0, totalWithdrawals: 0, netChange: 0 }
  );

  const isCurrentMonth =
    currentMonth.year === new Date().getFullYear() &&
    currentMonth.month === new Date().getMonth();

  return (
    <div className="balance-visibility">
      <Link to="/money-movement" className="back-link">
        <ArrowLeft size={20} />
        Back to Money Movement
      </Link>

      <div className="balance-visibility-header">
        <div>
          <h1 className="balance-visibility-title">Daily Balances</h1>
          <p className="balance-visibility-subtitle">
            Opening and closing balances by day
          </p>
        </div>
        <div className="header-actions">
          <button onClick={fetchBalances} className="refresh-button" disabled={loading}>
            <RefreshCw size={18} className={loading ? 'spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="month-navigation">
        <button onClick={handlePreviousMonth} className="month-nav-button">
          <ChevronLeft size={20} />
        </button>
        <div className="current-month">
          <Calendar size={18} />
          <span>{formatMonthYear(currentMonth.year, currentMonth.month)}</span>
        </div>
        <button
          onClick={handleNextMonth}
          className="month-nav-button"
          disabled={isCurrentMonth}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Filters */}
      <div className="balance-filters">
        <div className="filter-group">
          <Filter size={18} />
          <input
            type="text"
            placeholder="Filter by account ID"
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="filter-input"
          />
        </div>
        <div className="view-toggle">
          <button
            className={`view-button ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            List
          </button>
          <button
            className={`view-button ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            Grid
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="balance-summary">
        <div className="summary-card">
          <span className="summary-label">Total Deposits</span>
          <span className="summary-value positive">+{formatCurrency(summary.totalDeposits)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Total Withdrawals</span>
          <span className="summary-value negative">-{formatCurrency(summary.totalWithdrawals)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Net Change</span>
          <span className={`summary-value ${summary.netChange >= 0 ? 'positive' : 'negative'}`}>
            {summary.netChange >= 0 ? '+' : ''}
            {formatCurrency(summary.netChange)}
          </span>
        </div>
      </div>

      {/* Balance List/Grid */}
      {loading ? (
        <div className="balance-loading">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton-balance-card"></div>
          ))}
        </div>
      ) : balances.length === 0 ? (
        <div className="balance-empty">
          <Calendar size={48} />
          <p>No balance data for this month</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="balance-list">
          {balances.map((balance) => (
            <BalanceCard
              key={balance.date}
              balance={balance}
              compact
              onClick={() => handleBalanceClick(balance)}
            />
          ))}
        </div>
      ) : (
        <div className="balance-grid">
          {balances.map((balance) => (
            <BalanceCard
              key={balance.date}
              balance={balance}
              onClick={() => handleBalanceClick(balance)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default BalanceVisibility;
