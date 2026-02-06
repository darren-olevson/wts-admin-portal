/**
 * Common type definitions for the WTS Admin Portal.
 */

/**
 * Filter state for date range filtering.
 */
export interface DateRangeFilter {
  startDate: string;
  endDate: string;
}

/**
 * Filter state for list pages with common filters.
 */
export interface BaseListFilters extends DateRangeFilter {
  accountId?: string;
  search?: string;
}

/**
 * Reconciliation status types.
 */
export type ReconciliationStatus = 'MATCHED' | 'UNMATCHED' | 'EXCEPTION';

/**
 * Transaction direction types.
 */
export type TransactionDirection = 'CREDIT' | 'DEBIT';

/**
 * Common status types.
 */
export type CommonStatus = 'PENDING' | 'COMPLETE' | 'FAILED' | 'N/A';

/**
 * Withdrawal type.
 */
export type WithdrawalType = 'FULL' | 'PARTIAL';

/**
 * Account status types.
 */
export type AccountStatus = 'active' | 'inactive' | 'pending' | 'closed';

/**
 * Pagination state.
 */
export interface PaginationState {
  page: number;
  pageSize: number;
  totalCount: number;
}

/**
 * Sort state.
 */
export interface SortState<T extends string = string> {
  field: T;
  direction: 'asc' | 'desc';
}

/**
 * API error response.
 */
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * Loading state type.
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Generic async state.
 */
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Table column definition.
 */
export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, row: T) => React.ReactNode;
}

/**
 * Props for components that display error states.
 */
export interface ErrorDisplayProps {
  error: string | null;
  onRetry?: () => void;
}

/**
 * Props for components that display loading states.
 */
export interface LoadingDisplayProps {
  loading: boolean;
  skeleton?: React.ReactNode;
}
