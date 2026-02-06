import { useEffect, useState } from 'react';
import { DollarSign, Calendar, AlertCircle } from 'lucide-react';
import './SeasonedCashDisplay.css';

interface SeasonedCashData {
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
}

interface SeasonedCashDisplayProps {
  accountId: string;
  variant?: 'full' | 'card';
  data?: SeasonedCashData | null;
}

function SeasonedCashDisplay({ accountId, variant = 'full', data: dataOverride }: SeasonedCashDisplayProps) {
  const [data, setData] = useState<SeasonedCashData | null>(dataOverride ?? null);
  const [loading, setLoading] = useState(!dataOverride);

  useEffect(() => {
    if (dataOverride) {
      setData(dataOverride);
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/accounts/${accountId}/balance`);
        if (!response.ok) throw new Error('Failed to fetch balance');
        const data = await response.json();
        setData(data);
      } catch (error) {
        console.error('Error fetching seasoned cash data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [accountId, dataOverride]);

  if (loading) {
    return <div className="seasoned-cash-loading">Loading balance data...</div>;
  }

  if (!data) {
    return <div className="seasoned-cash-error">Unable to load balance data</div>;
  }

  const isFullySeasoned = data.unseasonedAmount === 0;
  const daysRemaining = data.daysUntilSeasoned ?? 0;
  const schedule = data.unseasonedSchedule ?? [];
  const deposits = data.unseasonedDeposits ?? [];

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  if (variant === 'card') {
    return (
      <div className="seasoned-cash-card">
        <div className="seasoned-cash-card-header">
          <DollarSign size={20} className="seasoned-cash-card-icon" />
          <span>Total Cash</span>
        </div>
        <div className="seasoned-cash-card-amount">
          ${data.totalBalance.toLocaleString()}
          <span className="seasoned-cash-card-amount-label">Total balance</span>
        </div>
        <div className="seasoned-cash-card-summary">
          Seasoned ${data.availableBalance.toLocaleString()} • Unseasoned ${data.unseasonedAmount.toLocaleString()} • Days remaining {isFullySeasoned ? 0 : daysRemaining}
        </div>
      </div>
    );
  }

  return (
    <div className="seasoned-cash-display">
      <div className="balance-card">
        <div className="balance-header">
          <DollarSign size={24} className="balance-icon" />
          <div>
            <p className="balance-label">Total Cash</p>
            <p className="balance-value">${data.totalBalance.toLocaleString()}</p>
          </div>
        </div>
        <div className="balance-breakdown">
          <div className="breakdown-item">
            <span className="breakdown-label">Seasoned Cash:</span>
            <span className="breakdown-value">${data.availableBalance.toLocaleString()}</span>
          </div>
          <div className="breakdown-item">
            <span className="breakdown-label">Unseasoned Funds:</span>
            <span className="breakdown-value unseasoned">
              ${data.unseasonedAmount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {!isFullySeasoned && data.nextSeasoningDate && (
        <div className="seasoning-info">
          <div className="seasoning-header">
            <Calendar size={20} />
            <span>5-Business-Day Seasoning Rule</span>
          </div>
          <div className="seasoning-details">
            {schedule.length > 0 ? (
              <>
                <p className="seasoning-summary">
                  <strong>{data.unseasonedAmount.toLocaleString()}</strong> unseasoned across{' '}
                  <strong>{schedule.length}</strong> upcoming date{schedule.length !== 1 ? 's' : ''}
                </p>
                <div className="seasoning-schedule">
                  {schedule.map((entry) => (
                    <div key={entry.seasoningDate} className="seasoning-schedule-row">
                      <div className="seasoning-schedule-date">{formatDate(entry.seasoningDate)}</div>
                      <div className="seasoning-schedule-amount">
                        ${entry.amount.toLocaleString()}
                      </div>
                      <div className="seasoning-schedule-remaining">
                        {entry.businessDaysRemaining} business day
                        {entry.businessDaysRemaining !== 1 ? 's' : ''} remaining
                      </div>
                    </div>
                  ))}
                </div>
                {deposits.length > 0 && (
                  <details className="seasoning-details-toggle">
                    <summary>Deposit details</summary>
                    <div className="seasoning-deposit-list">
                      {deposits.map((deposit) => {
                        const progress = Math.min(
                          100,
                          ((5 - deposit.businessDaysRemaining) / 5) * 100
                        );
                        return (
                          <div
                            key={`${deposit.depositDate}-${deposit.amount}`}
                            className="seasoning-deposit-row"
                          >
                            <div className="seasoning-deposit-main">
                              <div className="seasoning-deposit-date">
                                {formatDate(deposit.depositDate)}
                              </div>
                              <div className="seasoning-deposit-amount">
                                ${deposit.amount.toLocaleString()}
                              </div>
                              <div className="seasoning-deposit-remaining">
                                {deposit.businessDaysRemaining} business day
                                {deposit.businessDaysRemaining !== 1 ? 's' : ''} remaining
                              </div>
                            </div>
                            <div className="seasoning-deposit-progress">
                              <div
                                className="seasoning-deposit-progress-bar"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </details>
                )}
              </>
            ) : (
              <>
                <p>
                  <strong>{data.unseasonedAmount.toLocaleString()}</strong> will be available on{' '}
                  <strong>{new Date(data.nextSeasoningDate).toLocaleDateString()}</strong>
                </p>
                {data.daysUntilSeasoned !== null && (
                  <p className="days-remaining">
                    {data.daysUntilSeasoned} business day
                    {data.daysUntilSeasoned !== 1 ? 's' : ''} remaining
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {isFullySeasoned && (
        <div className="seasoning-info fully-seasoned">
          <AlertCircle size={20} />
          <span>All funds are seasoned and available for withdrawal</span>
        </div>
      )}
    </div>
  );
}

export default SeasonedCashDisplay;
