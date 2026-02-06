import './InvestActivityTable.css';

export interface InvestActivityTransaction {
  id: string;
  date: string;
  activityType?: 'BUY' | 'SELL' | 'DIVIDEND' | 'DEPOSIT' | 'WITHDRAWAL' | 'REINVESTMENT' | 'INTEREST' | 'OTHER';
  buys?: number;
  sells?: number;
  dividends?: number;
  deposits?: number;
  withdrawals?: number;
  reinvestments?: number;
  interests?: number;
  other?: number;
}

interface InvestActivityTableProps {
  transactions: InvestActivityTransaction[];
  totalEquity?: number;
  seasonedCash?: number;
}

const formatCurrency = (value?: number) => {
  if (value === undefined || value === null || value === 0) return '-';
  return `$${value.toLocaleString()}`;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
};

function InvestActivityTable({ transactions, totalEquity, seasonedCash }: InvestActivityTableProps) {
  const grouped = transactions.reduce<Record<string, any>>((acc, tx) => {
    const dateKey = tx.date.split('T')[0];
    if (!acc[dateKey]) {
      acc[dateKey] = {
        date: dateKey,
        buys: 0,
        sells: 0,
        dividends: 0,
        deposits: 0,
        withdrawals: 0,
        reinvestments: 0,
        interests: 0,
        other: 0,
      };
    }

    acc[dateKey].buys += tx.buys || 0;
    acc[dateKey].sells += tx.sells || 0;
    acc[dateKey].dividends += tx.dividends || 0;
    acc[dateKey].deposits += tx.deposits || 0;
    acc[dateKey].withdrawals += tx.withdrawals || 0;
    acc[dateKey].reinvestments += tx.reinvestments || 0;
    acc[dateKey].interests += tx.interests || 0;
    acc[dateKey].other += tx.other || 0;
    return acc;
  }, {});

  const rows = Object.values(grouped).sort(
    (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const runningTotalEquity = totalEquity;
  let runningSeasonedCash =
    runningTotalEquity !== undefined && seasonedCash !== undefined
      ? Math.min(seasonedCash, runningTotalEquity)
      : seasonedCash;

  const rowsWithTotals = rows.map((row: any) => {
    const totalEquityValue = runningTotalEquity !== undefined ? runningTotalEquity : undefined;
    const seasonedCashValue = runningSeasonedCash !== undefined ? runningSeasonedCash : undefined;

    if (runningSeasonedCash !== undefined) {
      const seasonedImpact =
        (row.sells || 0) +
        (row.dividends || 0) +
        (row.interests || 0) +
        (row.other || 0) -
        (row.buys || 0) -
        (row.withdrawals || 0) -
        (row.reinvestments || 0);
      const updatedSeasoned = runningSeasonedCash - seasonedImpact;
      const capped = Math.max(0, updatedSeasoned);
      runningSeasonedCash =
        runningTotalEquity !== undefined ? Math.min(capped, runningTotalEquity) : capped;
    }

    return {
      ...row,
      totalEquityValue,
      seasonedCashValue,
    };
  });

  return (
    <div className="invest-activity-table">
      <div className="invest-table-header">
        <h3>Activities</h3>
      </div>
      <div className="invest-table-container">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Buys</th>
              <th>Sells</th>
              <th>Dividends</th>
              <th>Deposits</th>
              <th>Withdrawals</th>
              <th>Reinvestments</th>
              <th>Interests</th>
              <th>Other</th>
              <th className="summary-col">Total Equity</th>
              <th className="summary-col">Seasoned Cash</th>
            </tr>
          </thead>
          <tbody>
            {rowsWithTotals.length === 0 ? (
              <tr>
                <td colSpan={11} className="empty-state">
                  No activity available
                </td>
              </tr>
            ) : (
              rowsWithTotals.map((row: any) => (
                <tr key={row.date}>
                  <td>{formatDate(row.date)}</td>
                  <td>{formatCurrency(row.buys)}</td>
                  <td>{formatCurrency(row.sells)}</td>
                  <td>{formatCurrency(row.dividends)}</td>
                  <td>{formatCurrency(row.deposits)}</td>
                  <td className="negative-value">{formatCurrency(row.withdrawals)}</td>
                  <td>{formatCurrency(row.reinvestments)}</td>
                  <td>{formatCurrency(row.interests)}</td>
                  <td>{formatCurrency(row.other)}</td>
                  <td className="summary-col">{formatCurrency(row.totalEquityValue)}</td>
                  <td className="summary-col">{formatCurrency(row.seasonedCashValue)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default InvestActivityTable;
