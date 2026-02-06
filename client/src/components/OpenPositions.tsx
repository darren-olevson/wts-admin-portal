import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import './OpenPositions.css';

export interface Position {
  symbol: string;
  name: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  marketValue: number;
  gainLoss: number;
  gainLossPercent: number;
}

interface OpenPositionsProps {
  accountId: string;
  positions?: Position[];
}

function OpenPositions({ accountId, positions: initialPositions }: OpenPositionsProps) {
  const [positions, setPositions] = useState<Position[]>(initialPositions || []);
  const [loading, setLoading] = useState(!initialPositions);

  useEffect(() => {
    if (initialPositions) {
      setPositions(initialPositions);
      return;
    }

    const fetchPositions = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/accounts/${accountId}/positions`);
        if (!response.ok) throw new Error('Failed to fetch positions');
        const data = await response.json();
        setPositions(data);
      } catch (error) {
        console.error('Error fetching positions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPositions();
  }, [accountId, initialPositions]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getGainLossIcon = (value: number) => {
    if (value > 0) return <TrendingUp size={16} className="gain-icon" />;
    if (value < 0) return <TrendingDown size={16} className="loss-icon" />;
    return <Minus size={16} className="neutral-icon" />;
  };

  if (loading) {
    return (
      <div className="open-positions">
        <div className="positions-header">
          <h3>Open Positions</h3>
        </div>
        <div className="positions-loading">Loading positions...</div>
      </div>
    );
  }

  const totalMarketValue = positions.reduce((sum, p) => sum + p.marketValue, 0);
  const totalGainLoss = positions.reduce((sum, p) => sum + p.gainLoss, 0);

  return (
    <div className="open-positions">
      <div className="positions-header">
        <h3>Open Positions</h3>
        <div className="positions-summary">
          <span className="summary-item">
            <span className="summary-label">Total Value:</span>
            <span className="summary-value">{formatCurrency(totalMarketValue)}</span>
          </span>
          <span className="summary-item">
            <span className="summary-label">Total Gain/Loss:</span>
            <span className={`summary-value ${totalGainLoss >= 0 ? 'gain' : 'loss'}`}>
              {getGainLossIcon(totalGainLoss)}
              {formatCurrency(totalGainLoss)}
            </span>
          </span>
        </div>
      </div>

      {positions.length === 0 ? (
        <div className="positions-empty">No open positions</div>
      ) : (
        <div className="positions-table-container">
          <table className="positions-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Name</th>
                <th>Quantity</th>
                <th>Avg Cost</th>
                <th>Current Price</th>
                <th>Market Value</th>
                <th>Gain/Loss</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((position) => (
                <tr key={position.symbol}>
                  <td className="symbol-cell">{position.symbol}</td>
                  <td className="name-cell">{position.name}</td>
                  <td>{position.quantity.toLocaleString()}</td>
                  <td>{formatCurrency(position.averageCost)}</td>
                  <td>{formatCurrency(position.currentPrice)}</td>
                  <td>{formatCurrency(position.marketValue)}</td>
                  <td className={`gain-loss-cell ${position.gainLoss >= 0 ? 'gain' : 'loss'}`}>
                    <div className="gain-loss-content">
                      {getGainLossIcon(position.gainLoss)}
                      <span>
                        {formatCurrency(position.gainLoss)} ({formatPercent(position.gainLossPercent)})
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default OpenPositions;
