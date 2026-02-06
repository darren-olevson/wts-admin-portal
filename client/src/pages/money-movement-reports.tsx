import { useState } from 'react';
import { FileDown } from 'lucide-react';
import { moneyMovementApi } from '../lib/api';
import './MoneyMovementReports.css';

function MoneyMovementReports() {
  const [filters, setFilters] = useState({
    accountId: '',
    startDate: '',
    endDate: '',
  });
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);
      const blob = await moneyMovementApi.exportReport({
        accountId: filters.accountId || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'money-movement-report.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export report:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="money-movement-reports">
      <div className="page-header">
        <div>
          <h1 className="page-title">Money Movement Reports</h1>
          <p className="page-subtitle">Export reconciliation data to CSV</p>
        </div>
      </div>

      <div className="reports-card">
        <div className="reports-filters">
          <input
            type="text"
            placeholder="Filter by account..."
            value={filters.accountId}
            onChange={(e) => setFilters({ ...filters, accountId: e.target.value })}
          />
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          />
        </div>

        <button className="export-button" onClick={handleExport} disabled={loading}>
          <FileDown size={16} />
          {loading ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>
    </div>
  );
}

export default MoneyMovementReports;
