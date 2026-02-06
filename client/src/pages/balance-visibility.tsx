import { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';
import { moneyMovementApi, MoneyMovementBalance } from '../lib/api';
import './BalanceVisibility.css';

function BalanceVisibility() {
  const [balances, setBalances] = useState<MoneyMovementBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    accountId: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        setLoading(true);
        const data = await moneyMovementApi.listBalances({
          accountId: filters.accountId || undefined,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
        });
        setBalances(data);
      } catch (error) {
        console.error('Error fetching balances:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBalances();
  }, [filters]);

  if (loading) {
    return <div className="money-movement-loading">Loading balances...</div>;
  }

  return (
    <div className="balance-visibility">
      <div className="page-header">
        <div>
          <h1 className="page-title">Balance Visibility</h1>
          <p className="page-subtitle">Daily opening and closing balances by account</p>
        </div>
      </div>

      <div className="filters-row">
        <input
          type="text"
          placeholder="Filter by account..."
          value={filters.accountId}
          onChange={(e) => setFilters({ ...filters, accountId: e.target.value })}
        />
        <div className="date-filter">
          <Calendar size={16} />
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          />
          <span>to</span>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          />
        </div>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Account</th>
              <th>Date</th>
              <th>Opening Balance</th>
              <th>Closing Balance</th>
              <th>Net Movement</th>
              <th>Payment Types</th>
            </tr>
          </thead>
          <tbody>
            {balances.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state">
                  No balances found
                </td>
              </tr>
            ) : (
              balances.map((balance) => (
                <tr key={`${balance.accountId}-${balance.date}`}>
                  <td>{balance.accountId}</td>
                  <td>{balance.date}</td>
                  <td>${balance.openingBalance.toLocaleString()}</td>
                  <td>${balance.closingBalance.toLocaleString()}</td>
                  <td className={balance.netMovement >= 0 ? 'credit' : 'debit'}>
                    {balance.netMovement >= 0 ? '+' : '-'}$
                    {Math.abs(balance.netMovement).toLocaleString()}
                  </td>
                  <td className="payment-breakdown">
                    {Object.entries(balance.paymentTypeBreakdown).map(([type, value]) => (
                      <div key={type}>
                        {type}: {value >= 0 ? '+' : '-'}${Math.abs(value).toLocaleString()}
                      </div>
                    ))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default BalanceVisibility;
