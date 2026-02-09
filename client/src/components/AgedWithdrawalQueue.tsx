import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle,
  Clock,
  XCircle,
  Minus,
  AlertTriangle,
  RotateCw,
  StickyNote,
  Save,
  X,
  ChevronDown,
  Bookmark,
} from 'lucide-react';
import { withdrawalsApi, Withdrawal } from '../lib/api';
import { hasWithdrawalNotes } from '../lib/withdrawalNotes';
import './AgedWithdrawalQueue.css';

interface AgedWithdrawalQueueProps {
  thresholdDays?: number;
}

interface SavedView {
  id: string;
  name: string;
  /** @deprecated kept for backward compat with old saved views */
  statuses?: string[];
  liquidationStatuses: string[];
  transferStatuses: string[];
  minDaysPending: number;
  createdAt: string;
}

interface ActiveFilters {
  liquidationStatuses: string[];
  transferStatuses: string[];
  minDaysPending: string;
}

const LIQUIDATION_STATUSES = [
  'CREATED',
  'PENDING',
  'PROCESSING',
  'PROCESSED',
  'FAILED',
  'CANCELLED',
  'COMPLETE',
  'PROCESSED_SUCCESSFULLY',
] as const;

const TRANSFER_STATUSES = [
  'PENDING',
  'FAILED',
  'RETRYING',
  'STALE',
  'COMPLETE',
  'RECONCILED',
] as const;

const VIEWS_STORAGE_KEY = 'aged-withdrawal-saved-views';
const FILTERS_STORAGE_KEY = 'aged-withdrawal-active-filters';

/**
 * Get a display-friendly badge class for any status string.
 * Used for both liquidation and transfer status columns.
 */
function getStatusBadgeClass(status: string): string {
  const s = status.toUpperCase();
  if (s === 'COMPLETE' || s === 'RECONCILED' || s === 'PROCESSED_SUCCESSFULLY') return 'status-badge completed';
  if (s === 'PENDING' || s === 'CREATED' || s === 'PROCESSING' || s === 'PROCESSED') return 'status-badge pending';
  if (s === 'FAILED') return 'status-badge failed';
  if (s === 'RETRYING' || s === 'STALE') return 'status-badge warning';
  return 'status-badge na';
}

function getStatusIcon(status: string) {
  const s = status.toUpperCase();
  if (s === 'COMPLETE' || s === 'RECONCILED' || s === 'PROCESSED_SUCCESSFULLY') return <CheckCircle size={14} />;
  if (s === 'PENDING' || s === 'CREATED' || s === 'PROCESSING' || s === 'PROCESSED') return <Clock size={14} />;
  if (s === 'FAILED') return <XCircle size={14} />;
  if (s === 'RETRYING') return <RotateCw size={14} />;
  if (s === 'STALE') return <AlertTriangle size={14} />;
  return <Minus size={14} />;
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <span className={getStatusBadgeClass(status)}>
      {getStatusIcon(status)}
      <span>{label}</span>
    </span>
  );
}

function formatStatusLabel(status: string): string {
  return status
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}

// ===== REUSABLE DROPDOWN =====

interface StatusFilterDropdownProps {
  label: string;
  statuses: readonly string[];
  selected: string[];
  onToggle: (status: string) => void;
  onClear: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  dropdownRef: React.RefObject<HTMLDivElement>;
}

function StatusFilterDropdown({
  label,
  statuses,
  selected,
  onToggle,
  onClear,
  isOpen,
  setIsOpen,
  dropdownRef,
}: StatusFilterDropdownProps) {
  return (
    <div className="aged-status-dropdown" ref={dropdownRef}>
      <button
        className={`aged-status-dropdown-trigger${selected.length > 0 ? ' has-selection' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="aged-dropdown-trigger-content">
          <span className="aged-dropdown-label">{label}</span>
          {selected.length > 0 && (
            <span className="aged-dropdown-count">{selected.length}</span>
          )}
        </span>
        <ChevronDown size={14} className={`aged-dropdown-chevron${isOpen ? ' open' : ''}`} />
      </button>
      {isOpen && (
        <div className="aged-status-dropdown-menu">
          <div className="aged-dropdown-menu-header">{label}</div>
          {statuses.map((status) => (
            <label key={status} className="aged-status-option">
              <input
                type="checkbox"
                checked={selected.includes(status)}
                onChange={() => onToggle(status)}
              />
              <span className={`aged-status-option-badge ${getStatusBadgeClass(status)}`}>
                {getStatusIcon(status)}
                {formatStatusLabel(status)}
              </span>
            </label>
          ))}
          {selected.length > 0 && (
            <button className="aged-status-clear" onClick={onClear}>
              Clear selection
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ===== MAIN COMPONENT =====

function AgedWithdrawalQueue({ thresholdDays = 6 }: AgedWithdrawalQueueProps) {
  const [allWithdrawals, setAllWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Filters
  const [selectedLiquidationStatuses, setSelectedLiquidationStatuses] = useState<string[]>([]);
  const [selectedTransferStatuses, setSelectedTransferStatuses] = useState<string[]>([]);
  const [filterMinDays, setFilterMinDays] = useState<string>('');
  const [liquidationDropdownOpen, setLiquidationDropdownOpen] = useState(false);
  const [transferDropdownOpen, setTransferDropdownOpen] = useState(false);
  const liquidationDropdownRef = useRef<HTMLDivElement>(null);
  const transferDropdownRef = useRef<HTMLDivElement>(null);

  // Track whether initial load from localStorage is done (to avoid persisting defaults)
  const [filtersInitialized, setFiltersInitialized] = useState(false);

  // Saved views
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const saveDialogInputRef = useRef<HTMLInputElement>(null);

  // Load saved views and active filters from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(VIEWS_STORAGE_KEY);
      if (stored) {
        setSavedViews(JSON.parse(stored));
      }
    } catch {
      // Ignore
    }
    try {
      const storedFilters = localStorage.getItem(FILTERS_STORAGE_KEY);
      if (storedFilters) {
        const parsed: ActiveFilters = JSON.parse(storedFilters);
        if (parsed.liquidationStatuses) setSelectedLiquidationStatuses(parsed.liquidationStatuses);
        if (parsed.transferStatuses) setSelectedTransferStatuses(parsed.transferStatuses);
        if (parsed.minDaysPending) setFilterMinDays(parsed.minDaysPending);
      }
    } catch {
      // Ignore
    }
    setFiltersInitialized(true);
  }, []);

  const persistViews = useCallback((views: SavedView[]) => {
    setSavedViews(views);
    localStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify(views));
  }, []);

  // Auto-persist active filters to localStorage
  useEffect(() => {
    if (!filtersInitialized) return;
    const filters: ActiveFilters = {
      liquidationStatuses: selectedLiquidationStatuses,
      transferStatuses: selectedTransferStatuses,
      minDaysPending: filterMinDays,
    };
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
  }, [selectedLiquidationStatuses, selectedTransferStatuses, filterMinDays, filtersInitialized]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (liquidationDropdownRef.current && !liquidationDropdownRef.current.contains(e.target as Node)) {
        setLiquidationDropdownOpen(false);
      }
      if (transferDropdownRef.current && !transferDropdownRef.current.contains(e.target as Node)) {
        setTransferDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Fetch data
  useEffect(() => {
    const fetchAgedWithdrawals = async () => {
      try {
        setLoading(true);
        const data = await withdrawalsApi.list({
          minDaysPending: thresholdDays,
        });
        const filtered = data.filter((w) => {
          if (w.reconciliationStatus === 'MATCHED') return false;
          return w.transferStatus !== 'COMPLETE' && w.transferStatus !== 'RECONCILED';
        });
        setAllWithdrawals(filtered);
        setPage(1);
      } catch (error) {
        console.error('Error loading aged withdrawals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgedWithdrawals();
  }, [thresholdDays]);

  // Apply filters
  const filteredWithdrawals = allWithdrawals.filter((w) => {
    if (selectedLiquidationStatuses.length > 0) {
      const liqStatus = w.liquidationStatus?.toUpperCase();
      if (!selectedLiquidationStatuses.includes(liqStatus)) return false;
    }
    if (selectedTransferStatuses.length > 0) {
      const txStatus = w.transferStatus?.toUpperCase();
      if (!selectedTransferStatuses.includes(txStatus)) return false;
    }
    if (filterMinDays) {
      const min = parseInt(filterMinDays, 10);
      if (!isNaN(min) && w.daysPending < min) return false;
    }
    return true;
  });

  const totalRows = filteredWithdrawals.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const visibleWithdrawals = filteredWithdrawals.slice(startIndex, endIndex);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  // Focus save dialog input when opened
  useEffect(() => {
    if (showSaveDialog) {
      setTimeout(() => saveDialogInputRef.current?.focus(), 50);
    }
  }, [showSaveDialog]);

  // Handlers
  const toggleLiquidationStatus = (status: string) => {
    setActiveViewId(null);
    setSelectedLiquidationStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
    setPage(1);
  };

  const toggleTransferStatus = (status: string) => {
    setActiveViewId(null);
    setSelectedTransferStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
    setPage(1);
  };

  const handleFilterMinDaysChange = (value: string) => {
    setActiveViewId(null);
    setFilterMinDays(value);
    setPage(1);
  };

  const clearFilters = () => {
    setSelectedLiquidationStatuses([]);
    setSelectedTransferStatuses([]);
    setFilterMinDays('');
    setActiveViewId(null);
    setPage(1);
  };

  const applyView = (view: SavedView) => {
    setSelectedLiquidationStatuses(view.liquidationStatuses || []);
    setSelectedTransferStatuses(view.transferStatuses || []);
    setFilterMinDays(view.minDaysPending > 0 ? String(view.minDaysPending) : '');
    setActiveViewId(view.id);
    setPage(1);
  };

  const handleSaveView = () => {
    const name = newViewName.trim();
    if (!name) return;
    const view: SavedView = {
      id: `view-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      liquidationStatuses: [...selectedLiquidationStatuses],
      transferStatuses: [...selectedTransferStatuses],
      minDaysPending: filterMinDays ? parseInt(filterMinDays, 10) || 0 : 0,
      createdAt: new Date().toISOString(),
    };
    persistViews([...savedViews, view]);
    setActiveViewId(view.id);
    setShowSaveDialog(false);
    setNewViewName('');
  };

  const deleteView = (viewId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    persistViews(savedViews.filter((v) => v.id !== viewId));
    if (activeViewId === viewId) {
      setActiveViewId(null);
    }
  };

  const hasActiveFilters = selectedLiquidationStatuses.length > 0 || selectedTransferStatuses.length > 0 || filterMinDays !== '';

  /** Build a human-readable summary for a saved view's tooltip */
  const viewTooltip = (view: SavedView) => {
    const parts: string[] = [];
    const liq = view.liquidationStatuses || [];
    const tx = view.transferStatuses || [];
    if (liq.length > 0) parts.push(`Liq: ${liq.map(formatStatusLabel).join(', ')}`);
    if (tx.length > 0) parts.push(`Xfer: ${tx.map(formatStatusLabel).join(', ')}`);
    if (parts.length === 0) parts.push('All statuses');
    if (view.minDaysPending > 0) parts.push(`≥${view.minDaysPending} days`);
    return parts.join(' · ');
  };

  if (loading) {
    return <div className="aged-withdrawals-loading">Loading aged withdrawals...</div>;
  }

  return (
    <div className="aged-withdrawal-queue">
      <div className="aged-header">
        <h3>Aged Withdrawal Queue</h3>
      </div>

      {/* Saved Views */}
      {savedViews.length > 0 && (
        <div className="aged-saved-views">
          <div className="aged-saved-views-label">
            <Bookmark size={13} />
            <span>Saved Views</span>
          </div>
          <div className="aged-saved-views-list">
            {savedViews.map((view) => (
              <button
                key={view.id}
                className={`aged-view-chip${activeViewId === view.id ? ' active' : ''}`}
                onClick={() => applyView(view)}
                title={viewTooltip(view)}
              >
                <span>{view.name}</span>
                <span
                  className="aged-view-chip-delete"
                  onClick={(e) => deleteView(view.id, e)}
                  title="Delete view"
                >
                  <X size={12} />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="aged-filters">
        <div className="aged-filter-group">
          {/* Liquidation Status dropdown */}
          <StatusFilterDropdown
            label="Liquidation Status"
            statuses={LIQUIDATION_STATUSES}
            selected={selectedLiquidationStatuses}
            onToggle={toggleLiquidationStatus}
            onClear={() => {
              setSelectedLiquidationStatuses([]);
              setActiveViewId(null);
              setPage(1);
            }}
            isOpen={liquidationDropdownOpen}
            setIsOpen={setLiquidationDropdownOpen}
            dropdownRef={liquidationDropdownRef}
          />

          {/* Transfer Status dropdown */}
          <StatusFilterDropdown
            label="Transfer Status"
            statuses={TRANSFER_STATUSES}
            selected={selectedTransferStatuses}
            onToggle={toggleTransferStatus}
            onClear={() => {
              setSelectedTransferStatuses([]);
              setActiveViewId(null);
              setPage(1);
            }}
            isOpen={transferDropdownOpen}
            setIsOpen={setTransferDropdownOpen}
            dropdownRef={transferDropdownRef}
          />

          {/* Min days pending */}
          <input
            type="number"
            className="aged-days-input"
            placeholder="Min days pending"
            value={filterMinDays}
            onChange={(e) => handleFilterMinDaysChange(e.target.value)}
            min={0}
          />
        </div>

        <div className="aged-filter-actions">
          {hasActiveFilters && (
            <>
              <button className="aged-clear-btn" onClick={clearFilters}>
                <X size={14} />
                Clear
              </button>
              <button className="aged-save-view-btn" onClick={() => setShowSaveDialog(true)}>
                <Save size={14} />
                Save View
              </button>
            </>
          )}
        </div>
      </div>

      {/* Save View Dialog */}
      {showSaveDialog && (
        <div className="aged-save-dialog">
          <div className="aged-save-dialog-content">
            <span className="aged-save-dialog-label">View name:</span>
            <input
              ref={saveDialogInputRef}
              type="text"
              className="aged-save-dialog-input"
              placeholder="e.g. Failed > 30 days"
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveView();
                if (e.key === 'Escape') {
                  setShowSaveDialog(false);
                  setNewViewName('');
                }
              }}
            />
            <button
              className="aged-save-dialog-confirm"
              onClick={handleSaveView}
              disabled={!newViewName.trim()}
            >
              Save
            </button>
            <button
              className="aged-save-dialog-cancel"
              onClick={() => {
                setShowSaveDialog(false);
                setNewViewName('');
              }}
            >
              Cancel
            </button>
          </div>
          <div className="aged-save-dialog-summary">
            {selectedLiquidationStatuses.length > 0
              ? `Liquidation: ${selectedLiquidationStatuses.map(formatStatusLabel).join(', ')}`
              : 'All liquidation statuses'}
            {' · '}
            {selectedTransferStatuses.length > 0
              ? `Transfer: ${selectedTransferStatuses.map(formatStatusLabel).join(', ')}`
              : 'All transfer statuses'}
            {filterMinDays ? ` · Min ${filterMinDays} days pending` : ''}
          </div>
        </div>
      )}

      {/* Active filter summary */}
      {hasActiveFilters && (
        <div className="aged-filter-summary">
          Showing {filteredWithdrawals.length} of {allWithdrawals.length} withdrawals
        </div>
      )}

      <div className="aged-table">
        <table>
          <thead>
            <tr>
              <th>Withdrawal ID</th>
              <th>Client</th>
              <th>Sleeve ID</th>
              <th>Amount</th>
              <th>Liquidation Status</th>
              <th>Transfer Status</th>
              <th>Days Pending</th>
            </tr>
          </thead>
          <tbody>
            {filteredWithdrawals.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-state">
                  No aged withdrawals match the current filters
                </td>
              </tr>
            ) : (
              visibleWithdrawals.map((withdrawal) => (
                <tr key={withdrawal.id}>
                  <td className="aged-withdrawal-id-cell">
                    <Link
                      to={`/invest/users/${withdrawal.clientId}?tab=withdrawals&withdrawalId=${withdrawal.id}`}
                      className="withdrawal-id-link"
                    >
                      {withdrawal.id}
                    </Link>
                    {hasWithdrawalNotes(withdrawal.id) && (
                      <span className="note-indicator" title="Has notes">
                        <StickyNote size={14} />
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="client-cell">
                      <div>{withdrawal.clientName}</div>
                      <div className="client-id">{withdrawal.clientId}</div>
                    </div>
                  </td>
                  <td className="mono">{withdrawal.sleeveId || '—'}</td>
                  <td>${withdrawal.amount.toLocaleString()}</td>
                  <td>
                    <StatusBadge
                      status={withdrawal.liquidationStatus}
                      label={withdrawal.liquidationStatus}
                    />
                  </td>
                  <td>
                    <StatusBadge
                      status={withdrawal.transferStatus}
                      label={withdrawal.transferStatus}
                    />
                  </td>
                  <td>{withdrawal.daysPending} days</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalRows >= pageSize && (
        <div className="aged-pagination">
          <span className="aged-pagination-info">
            Showing {startIndex + 1}-{Math.min(endIndex, totalRows)} of {totalRows}
          </span>
          <div className="aged-pagination-buttons">
            <button
              type="button"
              className="aged-pagination-button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <span className="aged-pagination-page">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              className="aged-pagination-button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AgedWithdrawalQueue;
