import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Download, X, ChevronRight } from 'lucide-react';
import { dashboardApi } from '../lib/api';
import type { NegativePosition } from '../lib/api';
import { arrayToCSV } from '../hooks/useCSVExport';
import './NegativePositionsCard.css';

interface NegativePositionsCardProps {
  sum: number;
  count: number;
}

function NegativePositionsCard({ sum, count }: NegativePositionsCardProps) {
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [positions, setPositions] = useState<NegativePosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleCardClick = async () => {
    setDrillDownOpen(true);
    if (positions.length === 0) {
      setLoading(true);
      try {
        const data = await dashboardApi.getNegativePositions();
        setPositions(data);
      } catch (error) {
        console.error('Error fetching negative positions:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleClose = () => {
    setDrillDownOpen(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const handleExportCSV = useCallback(async () => {
    setExporting(true);
    try {
      const data = positions.length > 0 ? positions : await dashboardApi.getNegativePositions();
      const csv = arrayToCSV(data as unknown as Record<string, unknown>[], [
        { key: 'userId', header: 'User ID' },
        { key: 'sleeveId', header: 'Sleeve ID' },
        { key: 'userName', header: 'Name' },
        { key: 'marketValue', header: 'Negative Value' },
      ]);

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `negative-positions-${date}.csv`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    } finally {
      setExporting(false);
    }
  }, [positions]);

  return (
    <>
      {/* Metric Card */}
      <div className="metric-card metric-card-link negative-positions-card" onClick={handleCardClick}>
        <div className="metric-icon negative-positions">
          <AlertTriangle size={24} />
        </div>
        <div className="metric-content">
          <p className="metric-label">Negative Positions</p>
          <p className="metric-value">{formatCurrency(sum)}</p>
          <div className="metric-subtext negative-positions-subtext">
            <span>{count} account{count !== 1 ? 's' : ''} affected</span>
            <ChevronRight size={14} className="drill-in-icon" />
          </div>
        </div>
      </div>

      {/* Drill-down Modal */}
      {drillDownOpen && (
        <div className="neg-pos-overlay" onClick={handleClose}>
          <div className="neg-pos-modal" onClick={(e) => e.stopPropagation()}>
            <div className="neg-pos-modal-header">
              <div className="neg-pos-modal-title">
                <AlertTriangle size={20} className="neg-pos-title-icon" />
                <h2>Negative Positions</h2>
                <span className="neg-pos-sum-badge">{formatCurrency(sum)}</span>
              </div>
              <div className="neg-pos-modal-actions">
                <button
                  className="neg-pos-export-btn"
                  onClick={handleExportCSV}
                  disabled={exporting || loading}
                >
                  <Download size={16} />
                  {exporting ? 'Exporting...' : 'Export CSV'}
                </button>
                <button className="neg-pos-close-btn" onClick={handleClose}>
                  <X size={20} />
                </button>
              </div>
            </div>

            <p className="neg-pos-description">
              These accounts have negative positions caused by over-liquidation during withdrawal processing.
              Download and reconcile with the Book and Records.
            </p>

            <div className="neg-pos-table-container">
              {loading ? (
                <div className="neg-pos-loading">
                  <div className="neg-pos-loading-spinner" />
                  <span>Loading positions...</span>
                </div>
              ) : positions.length === 0 ? (
                <div className="neg-pos-empty">No negative positions found.</div>
              ) : (
                <table className="neg-pos-table">
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>Sleeve ID</th>
                      <th>Name</th>
                      <th className="neg-pos-value-col">Negative Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((pos, idx) => (
                      <tr key={`${pos.userId}-${pos.sleeveId}-${idx}`}>
                        <td>
                          <Link
                            to={`/invest/users/${pos.userId}?tab=account-overview`}
                            className="neg-pos-user-link"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {pos.userId}
                          </Link>
                        </td>
                        <td className="neg-pos-mono">{pos.sleeveId}</td>
                        <td>{pos.userName}</td>
                        <td className="neg-pos-value-col neg-pos-negative">
                          {formatCurrency(pos.marketValue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} className="neg-pos-total-label">Total</td>
                      <td className="neg-pos-value-col neg-pos-negative neg-pos-total-value">
                        {formatCurrency(positions.reduce((s, p) => s + p.marketValue, 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default NegativePositionsCard;
