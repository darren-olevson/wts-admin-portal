import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { moneyMovementApi, MoneyMovementStats } from '../lib/api';
import BalanceCard, { DailyBalance } from '../components/BalanceCard';
import './MoneyMovementDashboard.css';

function MoneyMovementDashboard() {
  const [stats, setStats] = useState<MoneyMovementStats | null>(null);
  const [recentBalances, setRecentBalances] = useState<DailyBalance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsData, balancesData] = await Promise.all([
          moneyMovementApi.getStats(),
          moneyMovementApi.getBalances({ limit: 5 }),
        ]);
        setStats(statsData);
        setRecentBalances(balancesData);
      } catch (error) {
        console.error('Error fetching money movement data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="mm-dashboard">
        <div className="mm-dashboard-skeleton">
          <div className="skeleton-header">
            <div className="skeleton-line wide"></div>
            <div className="skeleton-line medium"></div>
          </div>
          <div className="skeleton-cards">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton-stat-card"></div>
            ))}
          </div>
          <div className="skeleton-section"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mm-dashboard">
      <div className="mm-dashboard-header">
        <div>
          <h1 className="mm-dashboard-title">Money Movement</h1>
          <p className="mm-dashboard-subtitle">
            ACH transaction reconciliation and balance visibility
          </p>
        </div>
        <div className="header-date">
          <Calendar size={18} />
          <span>{new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mm-stats-grid">
        <div className="mm-stat-card">
          <div className="stat-icon total">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Transactions Today</span>
            <span className="stat-value">{stats?.totalTransactionsToday || 0}</span>
          </div>
        </div>

        <div className="mm-stat-card">
          <div className="stat-icon credits">
            <ArrowDownLeft size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Credits</span>
            <span className="stat-value positive">
              +{formatCurrency(stats?.totalCreditsToday || 0)}
            </span>
          </div>
        </div>

        <div className="mm-stat-card">
          <div className="stat-icon debits">
            <ArrowUpRight size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Debits</span>
            <span className="stat-value negative">
              -{formatCurrency(stats?.totalDebitsToday || 0)}
            </span>
          </div>
        </div>

        <div className="mm-stat-card">
          <div className="stat-icon net">
            {(stats?.netChangeToday || 0) >= 0 ? (
              <TrendingUp size={24} />
            ) : (
              <TrendingDown size={24} />
            )}
          </div>
          <div className="stat-content">
            <span className="stat-label">Net Change</span>
            <span className={`stat-value ${(stats?.netChangeToday || 0) >= 0 ? 'positive' : 'negative'}`}>
              {(stats?.netChangeToday || 0) >= 0 ? '+' : ''}
              {formatCurrency(stats?.netChangeToday || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Reconciliation Status */}
      <div className="mm-section">
        <div className="section-header">
          <h2>Reconciliation Status</h2>
          <Link to="/money-movement/transactions" className="view-all-link">
            View All Transactions
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="recon-status-cards">
          <div className="recon-status-card matched">
            <CheckCircle size={28} />
            <div className="recon-status-content">
              <span className="recon-status-count">{stats?.matchedCount || 0}</span>
              <span className="recon-status-label">Matched</span>
            </div>
          </div>

          <div className="recon-status-card unmatched">
            <XCircle size={28} />
            <div className="recon-status-content">
              <span className="recon-status-count">{stats?.unmatchedCount || 0}</span>
              <span className="recon-status-label">Unmatched</span>
            </div>
          </div>

          <div className="recon-status-card exception">
            <AlertTriangle size={28} />
            <div className="recon-status-content">
              <span className="recon-status-count">{stats?.exceptionCount || 0}</span>
              <span className="recon-status-label">Exceptions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Daily Balances */}
      <div className="mm-section">
        <div className="section-header">
          <h2>Recent Daily Balances</h2>
          <Link to="/money-movement/balances" className="view-all-link">
            View All Balances
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="recent-balances-list">
          {recentBalances.map((balance) => (
            <BalanceCard key={balance.date} balance={balance} compact />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mm-section">
        <h2>Quick Actions</h2>
        <div className="quick-actions-grid">
          <Link to="/money-movement/transactions" className="quick-action-card">
            <DollarSign size={24} />
            <span>View Transactions</span>
          </Link>
          <Link to="/money-movement/balances" className="quick-action-card">
            <Calendar size={24} />
            <span>Daily Balances</span>
          </Link>
          <Link to="/money-movement/reports" className="quick-action-card">
            <ArrowUpRight size={24} />
            <span>Export Reports</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default MoneyMovementDashboard;
