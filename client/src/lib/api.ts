import axios from 'axios';
import * as mock from './mockData';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

/** Returns true when the backend API is unavailable (e.g. static Vercel deploy). */
let _useClientMock: boolean | null = null;
async function shouldUseMock(): Promise<boolean> {
  if (_useClientMock !== null) return _useClientMock;
  try {
    const res = await api.get('/dashboard/metrics', { timeout: 3000 });
    // Verify we got actual JSON back, not an HTML page (SPA fallback)
    const ct = res.headers?.['content-type'] ?? '';
    if (typeof res.data !== 'object' || ct.includes('text/html')) {
      _useClientMock = true;
    } else {
      _useClientMock = false;
    }
  } catch {
    _useClientMock = true;
  }
  return _useClientMock;
}

// Audit trail entry for tracking withdrawal actions
export interface AuditEntry {
  id: string;
  action: 'CANCEL' | 'REPROCESS' | 'SKIP_LIQUIDATION';
  performedBy: string;
  notes: string;
  timestamp: string;
  previousStatus?: string;
  newStatus?: string;
}

export interface Withdrawal {
  id: string;
  accountId: string;
  clientId: string;
  clientName: string;
  amount: number;
  status: string;
  // EDD-aligned liquidation status (Cash Movement): CREATED | PENDING | COMPLETE | FAILED | CANCELLED | PROCESSED_SUCCESSFULLY | N/A
  liquidationStatus: string;
  // EDD-aligned transfer status (ACH Transfer): PENDING | COMPLETE | FAILED | RETRYING | STALE | RECONCILED | N/A
  transferStatus: string;
  requestDate: string;
  daysPending: number;
  requestedAmount?: number;
  actualAmount?: number;
  withdrawalType?: 'FULL' | 'PARTIAL';
  reconciliationStatus?: 'MATCHED' | 'UNMATCHED' | 'EXCEPTION';
  achTransferBatchId?: string | null;
  brokerageAccountNumber?: string;
  brokerageId?: string;
  goalId?: string;
  sleeveId?: string;
  // Audit and action tracking
  auditLog?: AuditEntry[];
  reprocessedFromId?: string;
  reprocessedToId?: string;
  liquidationSkipped?: boolean;
}

export interface DashboardMetrics {
  investedAmount: number;
  fundedAccounts: number;
  totalUsers: number;
  withdrawalExceptions: number;
  totalWithdrawalAmount: number;
  negativePositionsSum: number;
  negativePositionsCount: number;
  statusSummary?: {
    pendingLiquidation: number;
    transferPending: number;
    completed: number;
    failed: number;
    retrying: number;
  };
}

export interface NegativePosition {
  userId: string;
  userName: string;
  sleeveId: string;
  symbol: string;
  quantity: number;
  marketValue: number;
}

export interface SeasonedCashData {
  totalBalance: number;
  availableBalance: number;
  unseasonedAmount: number;
  nextSeasoningDate: string | null;
  daysUntilSeasoned: number | null;
  unseasonedDeposits: Array<{
    amount: number;
    depositDate: string;
    seasoningDate: string;
    businessDaysRemaining: number;
  }>;
  unseasonedSchedule: Array<{
    seasoningDate: string;
    amount: number;
    businessDaysRemaining: number;
  }>;
}

export interface Transaction {
  id: string;
  date: string;
  type: string;
  code: 'CR' | 'BUY' | 'SEL' | 'DR';
  description: string;
  amount: number;
  balance: number;
  isWithdrawalRelated?: boolean;
}

export interface User {
  id: string;
  wbClientId?: string;
  displayName?: string;
  dateOfBirth?: string;
  email: string;
  name?: string;
  citizenship?: string;
  countryOfResidence?: string;
  countryOfTaxResidence?: string;
  phoneNumber?: string;
  address?: string;
  accountId: string;
  brokerageAccountNumber: string;
  brokerageId: string;
  goalId: string;
  withdrawals?: Array<{
    id: string;
    amount: number;
    status: string;
    requestDate: string;
  }>;
}

export interface AccountSummary {
  accountId: string;
  totalEquity?: number;
  gains?: number;
  cash?: number;
  positions?: number;
  availableToWithdraw?: number;
  target?: number;
  sleeveType?: string;
  brokerageAccountNumber?: string;
  brokerageAccountId?: string;
  accountStatus?: string;
}

export interface UserDocument {
  id: string;
  type: string;
  accountId: string;
  bookAndRecordsId: string;
  date: string;
  fileName: string;
  size: number;
  downloadUrl?: string;
  accessedBy?: string;
  accessedAt?: string;
  userName?: string;
}

export interface DocumentsFilter {
  type?: string;
  accountId?: string;
  startDate?: string;
  endDate?: string;
}

export interface AuditLog {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
}

export interface BulkDownloadJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  documentIds: string[];
  progress: number;
  downloadUrl?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

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

export interface AccountOverview {
  accountId: string;
  accountHolderName: string;
  brokerageId: string;
  brokerageAccountNumber: string;
  accountStatus: 'active' | 'inactive' | 'pending' | 'closed';
  accountType: string;
  totalBalance: number;
  cashBalance: number;
  positionsValue: number;
  openedDate: string;
  lastActivityDate: string;
  positions: Position[];
}

// Money Movement Types
export interface MoneyMovementTransaction {
  id: string;
  amount: number;
  direction: 'CREDIT' | 'DEBIT';
  effectiveDate: string;
  postingDate: string;
  sourceAccount: string;
  status: string;
  reconciliationStatus: 'MATCHED' | 'UNMATCHED' | 'EXCEPTION';
}

export interface MoneyMovementBalance {
  accountId: string;
  date: string;
  openingBalance: number;
  closingBalance: number;
  netMovement: number;
  paymentTypeBreakdown: Record<string, number>;
}

export interface MoneyMovementStats {
  totalTransactionsToday: number;
  totalCreditsToday: number;
  totalDebitsToday: number;
  netChangeToday: number;
  matchedCount: number;
  unmatchedCount: number;
  exceptionCount: number;
}

export interface DailyBalance {
  date: string;
  openingBalance: number;
  closingBalance: number;
  deposits: number;
  withdrawals: number;
  netChange: number;
}

// Withdrawals API
export const withdrawalsApi = {
  list: async (filters?: {
    status?: string;
    accountId?: string;
    clientId?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    reconciliationStatus?: string;
    withdrawalType?: string;
    minDaysPending?: number;
    maxDaysPending?: number;
  }): Promise<Withdrawal[]> => {
    if (await shouldUseMock()) {
      let data = [...mock.mockWithdrawals];
      if (filters?.accountId) data = data.filter(w => w.accountId === filters.accountId);
      if (filters?.clientId) data = data.filter(w => w.clientId === filters.clientId);
      if (filters?.status) data = data.filter(w => w.status === filters.status);
      if (filters?.minDaysPending) data = data.filter(w => w.daysPending >= filters.minDaysPending!);
      return data;
    }
    const response = await api.get('/withdrawals', { params: filters });
    return response.data;
  },

  get: async (withdrawalId: string): Promise<Withdrawal> => {
    if (await shouldUseMock()) {
      const w = mock.mockWithdrawals.find(w => w.id === withdrawalId);
      if (w) return w;
      return mock.mockWithdrawals[0];
    }
    const response = await api.get(`/withdrawals/${withdrawalId}`);
    return response.data;
  },

  getAged: async (thresholdDays: number = 6): Promise<Withdrawal[]> => {
    if (await shouldUseMock()) {
      return mock.mockWithdrawals.filter(w => w.daysPending > thresholdDays);
    }
    const response = await api.get('/withdrawals/aged', {
      params: { thresholdDays },
    });
    return response.data;
  },

  getAccountActivity: async (withdrawalId: string): Promise<Transaction[]> => {
    if (await shouldUseMock()) {
      const w = mock.mockWithdrawals.find(w => w.id === withdrawalId);
      return mock.mockAccountTransactions[w?.accountId ?? 'ACC-12345'] ?? [];
    }
    const response = await api.get(`/withdrawals/${withdrawalId}/account-activity`);
    return response.data;
  },

  cancel: async (_withdrawalId: string, _notes: string): Promise<void> => {
    if (await shouldUseMock()) return;
    await api.post(`/withdrawals/${_withdrawalId}/cancel`, { notes: _notes });
  },

  reprocess: async (_withdrawalId: string, _notes: string): Promise<void> => {
    if (await shouldUseMock()) return;
    await api.post(`/withdrawals/${_withdrawalId}/reprocess`, { notes: _notes });
  },

  skipLiquidation: async (_withdrawalId: string, _notes: string): Promise<void> => {
    if (await shouldUseMock()) return;
    await api.post(`/withdrawals/${_withdrawalId}/skip-liquidation`, { notes: _notes });
  },
};

// Dashboard API
export const dashboardApi = {
  getMetrics: async (): Promise<DashboardMetrics> => {
    if (await shouldUseMock()) return mock.mockDashboardMetrics;
    const response = await api.get('/dashboard/metrics');
    return response.data;
  },

  getNegativePositions: async (): Promise<NegativePosition[]> => {
    if (await shouldUseMock()) return mock.mockNegativePositions;
    const response = await api.get('/dashboard/negative-positions');
    return response.data;
  },
};

// Accounts API
export const accountsApi = {
  getBalance: async (accountId: string): Promise<SeasonedCashData> => {
    if (await shouldUseMock()) {
      return mock.mockSeasonedCash[accountId] ?? mock.mockSeasonedCash['ACC-12345'];
    }
    const response = await api.get(`/accounts/${accountId}/balance`);
    return response.data;
  },

  getOverview: async (accountId: string): Promise<AccountOverview> => {
    if (await shouldUseMock()) {
      return mock.mockAccountOverviews[accountId] ?? mock.mockAccountOverviews['ACC-12345'];
    }
    const response = await api.get(`/accounts/${accountId}/overview`);
    return response.data;
  },

  getPositions: async (accountId: string): Promise<Position[]> => {
    if (await shouldUseMock()) {
      return mock.mockPositions[accountId] ?? [];
    }
    const response = await api.get(`/accounts/${accountId}/positions`);
    return response.data;
  },

  getTransactions: async (
    accountId: string,
    startDate?: string,
    endDate?: string
  ): Promise<Transaction[]> => {
    if (await shouldUseMock()) {
      return mock.mockAccountTransactions[accountId] ?? [];
    }
    const response = await api.get(`/accounts/${accountId}/transactions`, {
      params: { startDate, endDate },
    });
    return response.data;
  },
};

// Users API
export const usersApi = {
  search: async (query: string): Promise<User[]> => {
    if (await shouldUseMock()) {
      const q = query.toLowerCase();
      return mock.mockUsers.filter(u =>
        u.displayName?.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q) ||
        u.accountId.toLowerCase().includes(q)
      );
    }
    const response = await api.get('/users/search', { params: { q: query } });
    return response.data;
  },

  get: async (userId: string): Promise<User> => {
    if (await shouldUseMock()) {
      return mock.mockUsers.find(u => u.id === userId) ?? mock.mockUsers[0];
    }
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  getAccountSummary: async (userId: string): Promise<AccountSummary> => {
    if (await shouldUseMock()) {
      return mock.mockAccountSummaries[userId] ?? { accountId: 'ACC-12345' };
    }
    const response = await api.get(`/users/${userId}/account-summary`);
    return response.data;
  },

  getDocuments: async (userId: string): Promise<UserDocument[]> => {
    if (await shouldUseMock()) {
      return mock.mockDocuments.filter(d => {
        const user = mock.mockUsers.find(u => u.id === userId);
        return user ? d.accountId === user.accountId : true;
      });
    }
    const response = await api.get(`/users/${userId}/documents`);
    return response.data;
  },
};

// Documents API
export const documentsApi = {
  list: async (filters?: DocumentsFilter): Promise<UserDocument[]> => {
    if (await shouldUseMock()) {
      let docs = [...mock.mockDocuments];
      if (filters?.accountId) docs = docs.filter(d => d.accountId === filters.accountId);
      if (filters?.type) docs = docs.filter(d => d.type === filters.type);
      return docs;
    }
    const response = await api.get('/documents', { params: filters });
    return response.data;
  },

  getDownloadUrl: async (documentId: string): Promise<{ downloadUrl: string }> => {
    const response = await api.get(`/documents/${documentId}`);
    return response.data;
  },

  getDownload: async (documentId: string): Promise<{ downloadUrl: string }> => {
    const response = await api.get(`/documents/${documentId}`);
    return response.data;
  },

  getAuditLogs: async (documentId?: string): Promise<AuditLog[]> => {
    const response = await api.get('/documents/audit-logs', {
      params: { documentId },
    });
    return response.data;
  },

  startBulkDownload: async (documentIds: string[]): Promise<BulkDownloadJob> => {
    const response = await api.post('/documents/bulk-download', { documentIds });
    const data = response.data as BulkDownloadJob | { downloadId: string };

    if ('downloadId' in data) {
      return {
        id: data.downloadId,
        status: 'pending',
        documentIds,
        progress: 0,
        createdAt: new Date().toISOString(),
      };
    }

    return data;
  },

  getBulkDownloadStatus: async (jobId: string): Promise<BulkDownloadJob> => {
    const response = await api.get(`/documents/bulk-download/${jobId}`);
    return response.data;
  },

  bulkDownload: async (documentIds: string[]): Promise<{
    downloadId: string;
    documentCount: number;
  }> => {
    const response = await api.post('/documents/bulk-download', { documentIds });
    return response.data;
  },
};

// Money Movement API
export const moneyMovementApi = {
  getStats: async (): Promise<MoneyMovementStats> => {
    if (await shouldUseMock()) return mock.mockMoneyMovementStats;
    const response = await api.get('/money-movement/stats');
    return response.data;
  },

  getTransactions: async (filters?: {
    status?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    accountId?: string;
  }): Promise<MoneyMovementTransaction[]> => {
    if (await shouldUseMock()) return mock.mockMoneyMovementTransactions;
    const response = await api.get('/money-movement/transactions', { params: filters });
    return response.data;
  },

  listTransactions: async (filters?: {
    accountId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    reconciliationStatus?: string;
  }): Promise<MoneyMovementTransaction[]> => {
    if (await shouldUseMock()) return mock.mockMoneyMovementTransactions;
    const response = await api.get('/money-movement/transactions', { params: filters });
    return response.data;
  },

  getBalances: async (filters?: {
    accountId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<DailyBalance[]> => {
    if (await shouldUseMock()) return mock.mockDailyBalances;
    const response = await api.get('/money-movement/balances', { params: filters });
    return response.data;
  },

  listBalances: async (filters?: {
    accountId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<MoneyMovementBalance[]> => {
    if (await shouldUseMock()) return [];
    const response = await api.get('/money-movement/balances', { params: filters });
    return response.data;
  },

  exportReport: async (filters?: {
    accountId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Blob> => {
    const response = await api.get('/money-movement/reports/export', {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  },

  exportTransactionsCSV: async (filters?: {
    status?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    accountId?: string;
  }): Promise<string> => {
    const response = await api.get('/money-movement/transactions/export', {
      params: filters,
      responseType: 'text',
    });
    return response.data;
  },

  exportBalancesCSV: async (filters?: {
    startDate?: string;
    endDate?: string;
    accountId?: string;
  }): Promise<string> => {
    const response = await api.get('/money-movement/balances/export', {
      params: filters,
      responseType: 'text',
    });
    return response.data;
  },

  exportReconciliationCSV: async (filters?: {
    startDate?: string;
    endDate?: string;
  }): Promise<string> => {
    const response = await api.get('/money-movement/reconciliation/export', {
      params: filters,
      responseType: 'text',
    });
    return response.data;
  },

  exportExceptionsCSV: async (filters?: {
    startDate?: string;
    endDate?: string;
  }): Promise<string> => {
    const response = await api.get('/money-movement/exceptions/export', {
      params: filters,
      responseType: 'text',
    });
    return response.data;
  },
};

export default api;
