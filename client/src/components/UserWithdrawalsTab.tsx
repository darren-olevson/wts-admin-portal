import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, RefreshCw, FastForward } from 'lucide-react';
import { Withdrawal, usersApi } from '../lib/api';
import WithdrawalRemediationDialog from './WithdrawalRemediationDialog';
import './UserWithdrawalsTab.css';

const ITEMS_PER_PAGE = 20;

interface UserWithdrawalsTabProps {
  withdrawals: Withdrawal[];
  selectedWithdrawalId?: string | null;
  userId: string;
  onRefresh?: () => void;
}

function UserWithdrawalsTab({
  withdrawals,
  selectedWithdrawalId,
  userId,
}: UserWithdrawalsTabProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [fundingAccounts, setFundingAccounts] = useState<Array<{ id: string; label: string }>>([]);
  const [fundingAccountsLoading, setFundingAccountsLoading] = useState(false);

  useEffect(() => {
    let isActive = true;

    const fetchFundingAccounts = async () => {
      try {
        setFundingAccountsLoading(true);
        const user = await usersApi.get(userId);
        const accountId = user.accountId;
        const brokerageAccountNumber = user.brokerageAccountNumber;
        const labelParts = [accountId, brokerageAccountNumber].filter(Boolean);
        const label = labelParts.join(' • ');
        if (isActive) {
          setFundingAccounts(
            accountId
              ? [
                  {
                    id: accountId,
                    label: label || accountId,
                  },
                ]
              : []
          );
        }
      } catch (error) {
        console.error('Error fetching funding accounts:', error);
        if (isActive) {
          setFundingAccounts([]);
        }
      } finally {
        if (isActive) {
          setFundingAccountsLoading(false);
        }
      }
    };

    fetchFundingAccounts();

    return () => {
      isActive = false;
    };
  }, [userId]);

  // Pagination calculations
  const totalPages = Math.ceil(withdrawals.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedWithdrawals = withdrawals.slice(startIndex, endIndex);
  const getLiquidationStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    let className = 'user-withdrawals-status status-badge-inline';
    if (statusLower === 'completed') className += ' liquidation-completed';
    else if (statusLower === 'pending') className += ' liquidation-pending';
    else if (statusLower === 'failed') className += ' liquidation-failed';
    else className += ' liquidation-na';
    return <span className={className}>{status}</span>;
  };

  const getTransferStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    let className = 'user-withdrawals-status status-badge-inline';
    if (statusLower === 'completed') className += ' transfer-completed';
    else if (statusLower === 'pending') className += ' transfer-pending';
    else if (statusLower === 'failed') className += ' transfer-failed';
    else className += ' transfer-na';
    return <span className={className}>{status}</span>;
  };

  if (withdrawals.length === 0) {
    return (
      <div className="user-withdrawals user-withdrawals-empty">
        <div className="user-withdrawals-toolbar">
          <button className="user-withdrawals-create" onClick={() => setShowCreateDialog(true)}>
            <PlusCircle size={16} />
            Create Withdrawal
          </button>
        </div>
        No withdrawals found for this user.
        {showCreateDialog && (
          <WithdrawalRemediationDialog
            action="create"
            clientId={userId}
            fundingAccounts={fundingAccounts}
            fundingAccountsLoading={fundingAccountsLoading}
            onClose={() => setShowCreateDialog(false)}
            onSuccess={() => setShowCreateDialog(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="user-withdrawals">
      <div className="user-withdrawals-toolbar">
        <button className="user-withdrawals-create" onClick={() => setShowCreateDialog(true)}>
          <PlusCircle size={16} />
          Create Withdrawal
        </button>
      </div>
      <div className="user-withdrawals-table-container">
        <table className="user-withdrawals-table">
          <thead>
            <tr>
              <th>Withdrawal ID</th>
              <th>Amount</th>
              <th>Type</th>
              <th>Liquidation Status</th>
              <th>Transfer Status</th>
              <th>Request Date</th>
              <th>Days Pending</th>
            </tr>
          </thead>
          <tbody>
            {paginatedWithdrawals.map((withdrawal) => (
              <tr
                key={withdrawal.id}
                className={`user-withdrawals-row${
                  withdrawal.id === selectedWithdrawalId ? ' selected' : ''
                }`}
                onClick={() => navigate(`/invest/withdrawals/${withdrawal.id}`)}
              >
                <td className="mono user-withdrawal-id-cell">
                  {withdrawal.id}
                  {withdrawal.reprocessedToId && (
                    <span className="reprocessed-indicator" title={`Reprocessed to ${withdrawal.reprocessedToId}`}>
                      <RefreshCw size={14} />
                    </span>
                  )}
                  {withdrawal.reprocessedFromId && (
                    <span className="from-reprocess-indicator" title={`Created from ${withdrawal.reprocessedFromId}`}>
                      <RefreshCw size={14} />
                    </span>
                  )}
                  {withdrawal.liquidationSkipped && (
                    <span className="skipped-indicator" title="Liquidation was skipped">
                      <FastForward size={14} />
                    </span>
                  )}
                </td>
                <td className="amount">${withdrawal.amount.toLocaleString()}</td>
                <td>
                  <span
                    className={`type-badge ${
                      withdrawal.withdrawalType?.toLowerCase() || 'full'
                    }`}
                  >
                    {withdrawal.withdrawalType || 'FULL'}
                  </span>
                </td>
                <td>{getLiquidationStatusBadge(withdrawal.liquidationStatus)}</td>
                <td>{getTransferStatusBadge(withdrawal.transferStatus)}</td>
                <td>{new Date(withdrawal.requestDate).toLocaleDateString()}</td>
                <td>
                  {['COMPLETED', 'CANCELLED', 'FAILED'].includes(withdrawal.status?.toUpperCase()) ? (
                    <span className="days-pending-na">—</span>
                  ) : (
                    <span
                      className={`days-pending ${
                        withdrawal.daysPending > 6 ? 'warning' : ''
                      }`}
                    >
                      {withdrawal.daysPending} days
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="user-withdrawals-pagination">
          <div className="pagination-info">
            Showing {startIndex + 1}–{Math.min(endIndex, withdrawals.length)} of {withdrawals.length} withdrawals
          </div>
          <div className="pagination-controls">
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              First
            </button>
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="pagination-pages">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              Last
            </button>
          </div>
        </div>
      )}

      {showCreateDialog && (
        <WithdrawalRemediationDialog
          action="create"
          clientId={userId}
          fundingAccounts={fundingAccounts}
          fundingAccountsLoading={fundingAccountsLoading}
          onClose={() => setShowCreateDialog(false)}
          onSuccess={(newWithdrawalId) => {
            setShowCreateDialog(false);
            if (newWithdrawalId) {
              window.location.assign(`/invest/withdrawals/${newWithdrawalId}`);
            }
          }}
        />
      )}
    </div>
  );
}

export default UserWithdrawalsTab;
