import { useEffect, useMemo, useState } from 'react';
import { withdrawalsApi, Withdrawal } from '../lib/api';
import './StatusFunnel.css';

interface FunnelStage {
  label: string;
  count: number;
  description: string;
}

function StatusFunnel() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWithdrawals = async () => {
      try {
        setLoading(true);
        const data = await withdrawalsApi.list();
        setWithdrawals(data);
      } catch (error) {
        console.error('Error loading withdrawal funnel:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWithdrawals();
  }, []);

  const stages = useMemo<FunnelStage[]>(() => {
    const liquidation = withdrawals.filter(
      (w) =>
        w.status.toLowerCase().includes('pending_liquidation') &&
        w.daysPending > 2
    ).length;
    const transfer = withdrawals.filter(
      (w) =>
        (w.status.toLowerCase().includes('created') ||
          w.status.toLowerCase().includes('transfer_created')) &&
        !w.achTransferBatchId
    ).length;
    const reconciliation = withdrawals.filter(
      (w) =>
        w.status.toLowerCase().includes('completed') &&
        w.reconciliationStatus !== 'MATCHED'
    ).length;

    return [
      {
        label: 'Liquidation',
        count: liquidation,
        description: 'Pending liquidation > 48 hours',
      },
      {
        label: 'Transfer',
        count: transfer,
        description: 'Created with no transfer assignment',
      },
      {
        label: 'Reconciliation',
        count: reconciliation,
        description: 'Completed but not reconciled',
      },
    ];
  }, [withdrawals]);

  if (loading) {
    return <div className="status-funnel-loading">Loading status funnel...</div>;
  }

  const maxCount = Math.max(...stages.map((stage) => stage.count), 1);

  return (
    <div className="status-funnel">
      <div className="funnel-header">
        <h3>Status Funnel</h3>
        <span>Where withdrawals stall in the lifecycle</span>
      </div>
      <div className="funnel-stages">
        {stages.map((stage) => (
          <div key={stage.label} className="funnel-stage">
            <div className="stage-info">
              <div className="stage-label">{stage.label}</div>
              <div className="stage-description">{stage.description}</div>
            </div>
            <div className="stage-bar">
              <div
                className="stage-bar-fill"
                style={{ width: `${(stage.count / maxCount) * 100}%` }}
              />
              <span className="stage-count">{stage.count}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StatusFunnel;
