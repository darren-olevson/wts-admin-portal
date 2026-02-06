import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Calendar, Filter, Loader2, CheckCircle } from 'lucide-react';
import { moneyMovementApi } from '../lib/api';
import './MoneyMovementReports.css';

type ReportType = 'transactions' | 'balances' | 'reconciliation' | 'exceptions';

interface ReportConfig {
  type: ReportType;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const reportConfigs: ReportConfig[] = [
  {
    type: 'transactions',
    title: 'Transaction Report',
    description: 'All ACH transactions with amounts, dates, and status',
    icon: <FileText size={24} />,
  },
  {
    type: 'balances',
    title: 'Daily Balance Report',
    description: 'Opening and closing balances with net movement',
    icon: <Calendar size={24} />,
  },
  {
    type: 'reconciliation',
    title: 'Reconciliation Report',
    description: 'Matched and unmatched transaction summary',
    icon: <CheckCircle size={24} />,
  },
  {
    type: 'exceptions',
    title: 'Exception Report',
    description: 'Transactions requiring manual review',
    icon: <Filter size={24} />,
  },
];

function MoneyMovementReports() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('transactions');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [accountFilter, setAccountFilter] = useState('');
  const [format, setFormat] = useState<'csv' | 'xlsx'>('csv');
  const [loading, setLoading] = useState(false);
  const [lastDownload, setLastDownload] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      setLoading(true);
      setLastDownload(null);

      let data: string;
      const filename = `${selectedReport}-report-${dateRange.start}-to-${dateRange.end}`;

      switch (selectedReport) {
        case 'transactions':
          data = await moneyMovementApi.exportTransactionsCSV({
            startDate: dateRange.start,
            endDate: dateRange.end,
            accountId: accountFilter || undefined,
          });
          break;
        case 'balances':
          data = await moneyMovementApi.exportBalancesCSV({
            startDate: dateRange.start,
            endDate: dateRange.end,
            accountId: accountFilter || undefined,
          });
          break;
        case 'reconciliation':
          data = await moneyMovementApi.exportReconciliationCSV({
            startDate: dateRange.start,
            endDate: dateRange.end,
          });
          break;
        case 'exceptions':
          data = await moneyMovementApi.exportExceptionsCSV({
            startDate: dateRange.start,
            endDate: dateRange.end,
          });
          break;
        default:
          throw new Error('Unknown report type');
      }

      // Create and download file
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setLastDownload(filename);
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Failed to export report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPresetRange = (preset: 'today' | 'week' | 'month' | 'quarter') => {
    const today = new Date();
    let start: Date;

    switch (preset) {
      case 'today':
        start = today;
        break;
      case 'week':
        start = new Date(today.setDate(today.getDate() - 7));
        break;
      case 'month':
        start = new Date(today.setMonth(today.getMonth() - 1));
        break;
      case 'quarter':
        start = new Date(today.setMonth(today.getMonth() - 3));
        break;
    }

    setDateRange({
      start: start.toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <div className="mm-reports">
      <Link to="/money-movement" className="back-link">
        <ArrowLeft size={20} />
        Back to Money Movement
      </Link>

      <div className="mm-reports-header">
        <div>
          <h1 className="mm-reports-title">Reports</h1>
          <p className="mm-reports-subtitle">Export money movement data for reporting</p>
        </div>
      </div>

      <div className="reports-layout">
        {/* Report Type Selection */}
        <div className="report-types">
          <h3>Select Report Type</h3>
          <div className="report-type-list">
            {reportConfigs.map((config) => (
              <button
                key={config.type}
                className={`report-type-card ${selectedReport === config.type ? 'selected' : ''}`}
                onClick={() => setSelectedReport(config.type)}
              >
                <div className="report-type-icon">{config.icon}</div>
                <div className="report-type-content">
                  <span className="report-type-title">{config.title}</span>
                  <span className="report-type-desc">{config.description}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Report Configuration */}
        <div className="report-config">
          <h3>Configure Report</h3>

          {/* Date Range */}
          <div className="config-section">
            <label className="config-label">Date Range</label>
            <div className="date-presets">
              <button onClick={() => getPresetRange('today')} className="preset-button">
                Today
              </button>
              <button onClick={() => getPresetRange('week')} className="preset-button">
                Last 7 Days
              </button>
              <button onClick={() => getPresetRange('month')} className="preset-button">
                Last 30 Days
              </button>
              <button onClick={() => getPresetRange('quarter')} className="preset-button">
                Last Quarter
              </button>
            </div>
            <div className="date-range-inputs">
              <div className="date-input-group">
                <label>From</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="date-input"
                />
              </div>
              <div className="date-input-group">
                <label>To</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="date-input"
                />
              </div>
            </div>
          </div>

          {/* Account Filter */}
          {(selectedReport === 'transactions' || selectedReport === 'balances') && (
            <div className="config-section">
              <label className="config-label">Account ID (Optional)</label>
              <input
                type="text"
                placeholder="Enter account ID to filter..."
                value={accountFilter}
                onChange={(e) => setAccountFilter(e.target.value)}
                className="text-input"
              />
            </div>
          )}

          {/* Format Selection */}
          <div className="config-section">
            <label className="config-label">Export Format</label>
            <div className="format-options">
              <button
                className={`format-button ${format === 'csv' ? 'selected' : ''}`}
                onClick={() => setFormat('csv')}
              >
                CSV
              </button>
              <button
                className={`format-button ${format === 'xlsx' ? 'selected' : ''}`}
                onClick={() => setFormat('xlsx')}
                disabled
                title="Coming soon"
              >
                Excel (Coming Soon)
              </button>
            </div>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            className="export-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={20} className="spin" />
                Generating Report...
              </>
            ) : (
              <>
                <Download size={20} />
                Export Report
              </>
            )}
          </button>

          {/* Last Download Confirmation */}
          {lastDownload && (
            <div className="download-success">
              <CheckCircle size={18} />
              <span>Successfully downloaded: {lastDownload}.{format}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MoneyMovementReports;
