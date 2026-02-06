import { useMemo, useState, useCallback, useEffect } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  Calendar,
  ChevronDown,
  ChevronRight,
  Loader2,
  Download,
  DollarSign,
} from 'lucide-react';
import {
  moneyMovementApi,
  DailyBalance,
  MoneyMovementTransaction,
} from '../lib/api';
import { useApiFetch } from '../hooks/useApiFetch';
import { useCSVExport } from '../hooks/useCSVExport';
import { formatCurrency } from '../utils/formatters';
import {
  StatusBadge,
  DirectionBadge,
  ReconciliationStatusBadge,
} from '../components/StatusBadge';
import './TransactionsBalances.css';

/** State for expanded balance rows with nested transactions */
interface ExpandedRowState {
  isLoading: boolean;
  transactions: MoneyMovementTransaction[];
  error: string | null;
}

/** Tab types for the main content area */
type TabType = 'balances' | 'transactions';

/** Reconciliation status filter options */
type ReconciliationFilter = 'ALL' | 'MATCHED' | 'UNMATCHED' | 'EXCEPTION';

const ITEMS_PER_PAGE = 25;

/** Filter state for the page */
interface TransactionBalanceFilters {
  accountId: string;
  startDate: string;
  endDate: string;
  reconciliationStatus: ReconciliationFilter;
}

/** Summary statistics calculated from transactions */
interface TransactionStats {
  totalCredits: number;
  totalDebits: number;
  netChange: number;
  exceptionCount: number;
}

/**
 * Calculate summary statistics from a list of transactions.
 */
function calculateStats(transactions: MoneyMovementTransaction[]): TransactionStats {
  const totalCredits = transactions
    .filter((tx) => tx.direction === 'CREDIT')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const totalDebits = transactions
    .filter((tx) => tx.direction === 'DEBIT')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const netChange = totalCredits - totalDebits;
  const exceptionCount = transactions.filter(
    (tx) => tx.reconciliationStatus === 'EXCEPTION'
  ).length;

  return { totalCredits, totalDebits, netChange, exceptionCount };
}

function TransactionsBalances() {
  const [activeTab, setActiveTab] = useState<TabType>('balances');
  const [filters, setFilters] = useState<TransactionBalanceFilters>({
    accountId: '',
    startDate: '',
    endDate: '',
    reconciliationStatus: 'ALL',
  });
  const [expandedRows, setExpandedRows] = useState<Record<string, ExpandedRowState>>({});

  // Fetch balances using custom hook
  const {
    data: balances,
    loading: balancesLoading,
    error: balancesError,
  } = useApiFetch(
    () =>
      moneyMovementApi.getBalances({
        accountId: filters.accountId || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      }),
    { deps: [filters.accountId, filters.startDate, filters.endDate] }
  );

  // Fetch transactions using custom hook
  const {
    data: transactions,
    loading: transactionsLoading,
    error: transactionsError,
  } = useApiFetch(
    () =>
      moneyMovementApi.listTransactions({
        accountId: filters.accountId || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        reconciliationStatus:
          filters.reconciliationStatus !== 'ALL'
            ? filters.reconciliationStatus
            : undefined,
      }),
    { deps: [filters.accountId, filters.startDate, filters.endDate, filters.reconciliationStatus] }
  );

  // CSV export using custom hook
  const { exporting, exportToCSV } = useCSVExport(
    () =>
      moneyMovementApi.exportTransactionsCSV({
        accountId: filters.accountId || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      }),
    'transactions'
  );

  const loading = balancesLoading || transactionsLoading;
  const error = balancesError || transactionsError;

  // Calculate summary stats with memoization
  const stats = useMemo(
    () => calculateStats(transactions ?? []),
    [transactions]
  );

  // Handle row expand/collapse and fetch transactions for that date
  const handleToggleRow = useCallback(
    async (balance: DailyBalance) => {
      const rowKey = balance.date;

      if (expandedRows[rowKey]) {
        setExpandedRows((prev) => {
          const newState = { ...prev };
          delete newState[rowKey];
          return newState;
        });
        return;
      }

      setExpandedRows((prev) => ({
        ...prev,
        [rowKey]: { isLoading: true, transactions: [], error: null },
      }));

      try {
        const txs = await moneyMovementApi.listTransactions({
          startDate: balance.date,
          endDate: balance.date,
        });
        setExpandedRows((prev) => ({
          ...prev,
          [rowKey]: { isLoading: false, transactions: txs, error: null },
        }));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load transactions';
        setExpandedRows((prev) => ({
          ...prev,
          [rowKey]: {
            isLoading: false,
            transactions: [],
            error: errorMessage,
          },
        }));
      }
    },
    [expandedRows]
  );

  // Safe arrays with defensive checks
  const safeBalances = balances ?? [];
  const safeTransactions = transactions ?? [];

  if (loading) {
    return (
      <div className="tb-loading">Loading transactions and balances...</div>
    );
  }

  if (error) {
    return (
      <div className="tb-error">
        <AlertTriangle size={24} />
        <p>Failed to load data: {error}</p>
      </div>
    );
  }

  return (
    <div className="transactions-balances">
      <div className="tb-header">
        <div>
          <h1 className="tb-title">Transactions & Balances</h1>
          <p className="tb-subtitle">
            View transactions and daily balances with reconciliation status
          </p>
        </div>
        <button
          className="tb-export-button"
          onClick={() => exportToCSV()}
          disabled={exporting}
        >
          {exporting ? (
            <Loader2 size={16} className="spin" />
          ) : (
            <Download size={16} />
          )}
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="tb-filters">
        <input
          type="text"
          className="tb-filter-input"
          placeholder="Filter by account ID..."
          value={filters.accountId}
          onChange={(e) => setFilters({ ...filters, accountId: e.target.value })}
        />
        <div className="tb-date-filter">
          <Calendar size={16} />
          <input
            type="date"
            className="tb-filter-input"
            value={filters.startDate}
            onChange={(e) =>
              setFilters({ ...filters, startDate: e.target.value })
            }
          />
          <span className="tb-date-separator">to</span>
          <input
            type="date"
            className="tb-filter-input"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          />
        </div>
        <select
          className="tb-filter-select"
          value={filters.reconciliationStatus}
          onChange={(e) =>
            setFilters({
              ...filters,
              reconciliationStatus: e.target.value as ReconciliationFilter,
            })
          }
        >
          <option value="ALL">All Status</option>
          <option value="MATCHED">Matched</option>
          <option value="UNMATCHED">Unmatched</option>
          <option value="EXCEPTION">Exception</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="tb-summary-cards">
        <div className="tb-card">
          <div className="tb-card-icon credits">
            <ArrowDownLeft size={20} />
          </div>
          <div className="tb-card-content">
            <p className="tb-card-label">Total Credits</p>
            <p className="tb-card-value credit">
              {formatCurrency(stats.totalCredits, { showSign: true })}
            </p>
          </div>
        </div>

        <div className="tb-card">
          <div className="tb-card-icon debits">
            <ArrowUpRight size={20} />
          </div>
          <div className="tb-card-content">
            <p className="tb-card-label">Total Debits</p>
            <p className="tb-card-value debit">
              {formatCurrency(-stats.totalDebits)}
            </p>
          </div>
        </div>

        <div className="tb-card">
          <div className="tb-card-icon net">
            <DollarSign size={20} />
          </div>
          <div className="tb-card-content">
            <p className="tb-card-label">Net Change</p>
            <p className={`tb-card-value ${stats.netChange >= 0 ? 'credit' : 'debit'}`}>
              {formatCurrency(stats.netChange, { showSign: true })}
            </p>
          </div>
        </div>

        <div className="tb-card">
          <div className="tb-card-icon exceptions">
            <AlertTriangle size={20} />
          </div>
          <div className="tb-card-content">
            <p className="tb-card-label">Exceptions</p>
            <p className="tb-card-value exception">{stats.exceptionCount}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tb-tabs">
        <button
          className={`tb-tab ${activeTab === 'balances' ? 'active' : ''}`}
          onClick={() => setActiveTab('balances')}
        >
          Balances
          <span className="tb-tab-count">{safeBalances.length}</span>
        </button>
        <button
          className={`tb-tab ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          Transactions
          <span className="tb-tab-count">{safeTransactions.length}</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="tb-content">
        {activeTab === 'balances' ? (
          <BalancesTable
            balances={safeBalances}
            expandedRows={expandedRows}
            onToggleRow={handleToggleRow}
          />
        ) : (
          <TransactionsTable transactions={safeTransactions} />
        )}
      </div>
    </div>
  );
}

/** Props for the BalancesTable component */
interface BalancesTableProps {
  balances: DailyBalance[];
  expandedRows: Record<string, ExpandedRowState>;
  onToggleRow: (balance: DailyBalance) => void;
}

/** Balances table with expandable rows */
function BalancesTable({ balances, expandedRows, onToggleRow }: BalancesTableProps) {
  return (
    <div className="tb-table-card">
      <table className="tb-table">
        <thead>
          <tr>
            <th className="expand-col"></th>
            <th>Date</th>
            <th>Opening Balance</th>
            <th>Closing Balance</th>
            <th>Deposits</th>
            <th>Withdrawals</th>
            <th>Net Change</th>
          </tr>
        </thead>
        <tbody>
          {balances.length === 0 ? (
            <tr>
              <td colSpan={7} className="tb-empty-state">
                No balances found
              </td>
            </tr>
          ) : (
            balances.map((balance) => (
              <BalanceRow
                key={balance.date}
                balance={balance}
                expandedState={expandedRows[balance.date]}
                onToggle={() => onToggleRow(balance)}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/** Props for the BalanceRow component */
interface BalanceRowProps {
  balance: DailyBalance;
  expandedState?: ExpandedRowState;
  onToggle: () => void;
}

/** Single balance row with expansion capability */
function BalanceRow({ balance, expandedState, onToggle }: BalanceRowProps) {
  const isExpanded = !!expandedState;

  return (
    <>
      <tr className={isExpanded ? 'expanded-row' : ''}>
        <td className="expand-col">
          <button
            className="tb-expand-button"
            onClick={onToggle}
            aria-label={isExpanded ? 'Collapse transactions' : 'Expand transactions'}
          >
            {expandedState?.isLoading ? (
              <Loader2 size={16} className="spin" />
            ) : isExpanded ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </button>
        </td>
        <td>{balance.date}</td>
        <td className="mono">{formatCurrency(balance.openingBalance)}</td>
        <td className="mono">{formatCurrency(balance.closingBalance)}</td>
        <td className="mono credit">{formatCurrency(balance.deposits, { showSign: true })}</td>
        <td className="mono debit">{formatCurrency(-balance.withdrawals)}</td>
        <td className={`mono ${balance.netChange >= 0 ? 'credit' : 'debit'}`}>
          {formatCurrency(balance.netChange, { showSign: true })}
        </td>
      </tr>
      {isExpanded && (
        <tr className="tb-nested-row">
          <td colSpan={7}>
            <NestedTransactionsTable expandedState={expandedState} />
          </td>
        </tr>
      )}
    </>
  );
}

/** Props for the NestedTransactionsTable component */
interface NestedTransactionsTableProps {
  expandedState: ExpandedRowState;
}

/** Nested transactions table shown when a balance row is expanded */
function NestedTransactionsTable({ expandedState }: NestedTransactionsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [expandedState.transactions]);

  if (expandedState.isLoading) {
    return (
      <div className="tb-nested-container">
        <div className="tb-nested-loading">
          <Loader2 size={20} className="spin" />
          <span>Loading transactions...</span>
        </div>
      </div>
    );
  }

  if (expandedState.error) {
    return (
      <div className="tb-nested-container">
        <div className="tb-nested-error">{expandedState.error}</div>
      </div>
    );
  }

  if (expandedState.transactions.length === 0) {
    return (
      <div className="tb-nested-container">
        <div className="tb-nested-empty">No transactions for this date</div>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(expandedState.transactions.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const visibleTransactions = expandedState.transactions.slice(startIndex, endIndex);

  // Keep page valid if transaction count changes
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  return (
    <div className="tb-nested-container">
      <table className="tb-nested-table">
        <thead>
          <tr>
            <th>Transaction ID</th>
            <th>Direction</th>
            <th>Amount</th>
            <th>Effective Date</th>
            <th>Posting Date</th>
            <th>Source Account</th>
            <th>Status</th>
            <th>Reconciliation</th>
          </tr>
        </thead>
        <tbody>
          {visibleTransactions.map((tx) => (
            <TransactionRow key={tx.id} transaction={tx} />
          ))}
        </tbody>
      </table>

      {expandedState.transactions.length > ITEMS_PER_PAGE && (
        <div className="tb-pagination tb-pagination--nested">
          <div className="tb-pagination-info">
            Showing {startIndex + 1}–{Math.min(endIndex, expandedState.transactions.length)} of{' '}
            {expandedState.transactions.length}
          </div>
          <div className="tb-pagination-controls">
            <button
              type="button"
              className="tb-pagination-btn"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              First
            </button>
            <button
              type="button"
              className="tb-pagination-btn"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="tb-pagination-pages">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              className="tb-pagination-btn"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
            <button
              type="button"
              className="tb-pagination-btn"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Props for the TransactionsTable component */
interface TransactionsTableProps {
  transactions: MoneyMovementTransaction[];
}

/** Main transactions table */
function TransactionsTable({ transactions }: TransactionsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [transactions]);

  const totalPages = Math.max(1, Math.ceil(transactions.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const visibleTransactions = transactions.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  return (
    <div className="tb-table-card">
      <table className="tb-table">
        <thead>
          <tr>
            <th>Transaction ID</th>
            <th>Direction</th>
            <th>Amount</th>
            <th>Effective Date</th>
            <th>Posting Date</th>
            <th>Source Account</th>
            <th>Status</th>
            <th>Reconciliation</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length === 0 ? (
            <tr>
              <td colSpan={8} className="tb-empty-state">
                No transactions found
              </td>
            </tr>
          ) : (
            visibleTransactions.map((tx) => <TransactionRow key={tx.id} transaction={tx} />)
          )}
        </tbody>
      </table>

      {transactions.length > ITEMS_PER_PAGE && (
        <div className="tb-pagination">
          <div className="tb-pagination-info">
            Showing {startIndex + 1}–{Math.min(endIndex, transactions.length)} of {transactions.length} transactions
          </div>
          <div className="tb-pagination-controls">
            <button
              type="button"
              className="tb-pagination-btn"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              First
            </button>
            <button
              type="button"
              className="tb-pagination-btn"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="tb-pagination-pages">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              className="tb-pagination-btn"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
            <button
              type="button"
              className="tb-pagination-btn"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Props for the TransactionRow component */
interface TransactionRowProps {
  transaction: MoneyMovementTransaction;
}

/** Single transaction row */
function TransactionRow({ transaction: tx }: TransactionRowProps) {
  const amount = tx.direction === 'CREDIT' ? tx.amount : -tx.amount;

  return (
    <tr>
      <td className="mono">{tx.id}</td>
      <td>
        <DirectionBadge direction={tx.direction as 'CREDIT' | 'DEBIT'} />
      </td>
      <td className={`mono ${tx.direction === 'CREDIT' ? 'credit' : 'debit'}`}>
        {formatCurrency(amount, { showSign: true })}
      </td>
      <td>{tx.effectiveDate}</td>
      <td>{tx.postingDate}</td>
      <td className="mono">{tx.sourceAccount}</td>
      <td>
        <StatusBadge status={tx.status} />
      </td>
      <td>
        <ReconciliationStatusBadge
          status={tx.reconciliationStatus as 'MATCHED' | 'UNMATCHED' | 'EXCEPTION'}
        />
      </td>
    </tr>
  );
}

export default TransactionsBalances;
