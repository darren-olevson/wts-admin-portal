/**
 * Client-side mock data for demo/static deployment.
 * Used as fallback when the backend API is unavailable (e.g. Vercel static deploy).
 */

import type {
  Withdrawal,
  DashboardMetrics,
  AccountSummary,
  UserDocument,
  User,
  AccountOverview,
  MoneyMovementTransaction,
  MoneyMovementStats,
  DailyBalance,
  Transaction,
  Position,
  SeasonedCashData,
} from './api';

// ── Withdrawals ──────────────────────────────────────────────

export const mockWithdrawals: Withdrawal[] = [
  {
    id: 'WD-001',
    accountId: 'ACC-12345',
    clientId: 'CL-789',
    clientName: 'Darren Olevson',
    amount: 5000,
    status: 'PENDING_LIQUIDATION',
    liquidationStatus: 'PENDING',
    transferStatus: 'N/A',
    requestDate: '2026-01-20T10:00:00Z',
    daysPending: 17,
    requestedAmount: 5000,
    actualAmount: 5000,
    withdrawalType: 'FULL',
    reconciliationStatus: 'UNMATCHED',
    achTransferBatchId: null,
    brokerageAccountNumber: '73388424776947',
    brokerageId: 'BR-001',
    goalId: 'GOAL-456',
  },
  {
    id: 'WD-002',
    accountId: 'ACC-23456',
    clientId: 'CL-890',
    clientName: 'Jane Smith',
    amount: 12000,
    status: 'CREATED',
    liquidationStatus: 'COMPLETED',
    transferStatus: 'PENDING',
    requestDate: '2026-01-18T09:15:00Z',
    daysPending: 19,
    requestedAmount: 12000,
    actualAmount: 11950,
    withdrawalType: 'PARTIAL',
    reconciliationStatus: 'MATCHED',
    achTransferBatchId: 'ACH-784512',
    brokerageAccountNumber: 'BR-987654322',
    brokerageId: 'BR-002',
    goalId: 'GOAL-789',
  },
  {
    id: 'WD-003',
    accountId: 'ACC-34567',
    clientId: 'CL-901',
    clientName: 'Robert Johnson',
    amount: 7500,
    status: 'FAILED',
    liquidationStatus: 'FAILED',
    transferStatus: 'FAILED',
    requestDate: '2026-01-15T14:30:00Z',
    daysPending: 22,
    requestedAmount: 7500,
    actualAmount: 0,
    withdrawalType: 'FULL',
    reconciliationStatus: 'EXCEPTION',
    achTransferBatchId: null,
    brokerageAccountNumber: 'BR-987654323',
    brokerageId: 'BR-003',
    goalId: 'GOAL-012',
  },
  {
    id: 'WD-004',
    accountId: 'ACC-45678',
    clientId: 'CL-012',
    clientName: 'Emily Davis',
    amount: 3000,
    status: 'PENDING_LIQUIDATION',
    liquidationStatus: 'PENDING',
    transferStatus: 'N/A',
    requestDate: '2026-01-19T11:00:00Z',
    daysPending: 18,
    requestedAmount: 3000,
    actualAmount: 3000,
    withdrawalType: 'PARTIAL',
    reconciliationStatus: 'UNMATCHED',
    achTransferBatchId: null,
    brokerageAccountNumber: 'BR-987654324',
    brokerageId: 'BR-004',
    goalId: 'GOAL-345',
  },
  {
    id: 'WD-005',
    accountId: 'ACC-56789',
    clientId: 'CL-123',
    clientName: 'Michael Brown',
    amount: 8500,
    status: 'TRANSFER_CREATED',
    liquidationStatus: 'COMPLETED',
    transferStatus: 'PENDING',
    requestDate: '2026-01-17T08:45:00Z',
    daysPending: 20,
    requestedAmount: 8500,
    actualAmount: 8500,
    withdrawalType: 'FULL',
    reconciliationStatus: 'MATCHED',
    achTransferBatchId: 'ACH-991203',
    brokerageAccountNumber: 'BR-987654325',
    brokerageId: 'BR-005',
    goalId: 'GOAL-678',
  },
  {
    id: 'WD-006',
    accountId: 'ACC-67890',
    clientId: 'CL-234',
    clientName: 'Sarah Wilson',
    amount: 15000,
    status: 'PENDING_LIQUIDATION',
    liquidationStatus: 'PENDING',
    transferStatus: 'N/A',
    requestDate: '2026-01-10T10:00:00Z',
    daysPending: 27,
    requestedAmount: 15000,
    actualAmount: 15000,
    withdrawalType: 'FULL',
    reconciliationStatus: 'UNMATCHED',
    achTransferBatchId: null,
    brokerageAccountNumber: 'BR-987654326',
    brokerageId: 'BR-006',
    goalId: 'GOAL-901',
  },
  {
    id: 'WD-007',
    accountId: 'ACC-78901',
    clientId: 'CL-345',
    clientName: 'David Martinez',
    amount: 6000,
    status: 'COMPLETED',
    liquidationStatus: 'COMPLETED',
    transferStatus: 'COMPLETED',
    requestDate: '2026-01-12T15:20:00Z',
    daysPending: 25,
    requestedAmount: 6000,
    actualAmount: 6000,
    withdrawalType: 'FULL',
    reconciliationStatus: 'EXCEPTION',
    achTransferBatchId: 'ACH-551122',
    brokerageAccountNumber: 'BR-987654327',
    brokerageId: 'BR-007',
    goalId: 'GOAL-234',
  },
  {
    id: 'WD-100',
    accountId: 'ACC-12345',
    clientId: 'CL-789',
    clientName: 'Darren Olevson',
    amount: 2500,
    status: 'COMPLETED',
    liquidationStatus: 'COMPLETED',
    transferStatus: 'COMPLETED',
    requestDate: '2026-01-15T14:00:00Z',
    daysPending: 22,
    requestedAmount: 2500,
    actualAmount: 2500,
    withdrawalType: 'PARTIAL',
    reconciliationStatus: 'MATCHED',
    achTransferBatchId: 'ACH-100001',
    brokerageAccountNumber: '73388424776947',
    brokerageId: 'BR-001',
    goalId: 'GOAL-456',
  },
];

// ── Dashboard metrics ────────────────────────────────────────

export const mockDashboardMetrics: DashboardMetrics = {
  investedAmount: 12500000,
  fundedAccounts: 3420,
  totalUsers: 5670,
  withdrawalExceptions: 4,
  totalWithdrawalAmount: 125000,
  statusSummary: {
    liquidationPending: 3,
    transferPending: 2,
    completed: 2,
    approvalFailed: 1,
  },
};

// ── Users ────────────────────────────────────────────────────

export const mockUsers: User[] = [
  {
    id: 'CL-789',
    wbClientId: 'WB-19156',
    displayName: 'Darren Olevson',
    dateOfBirth: '1994-08-11',
    email: 'darren.olevson@hotmail.com',
    citizenship: 'N/A',
    countryOfResidence: 'US',
    countryOfTaxResidence: 'US',
    phoneNumber: '+16476494545',
    address: '811 Diamond Street',
    accountId: 'ACC-12345',
    brokerageAccountNumber: '73388424776947',
    brokerageId: 'BR-001',
    goalId: 'GOAL-456',
  },
  {
    id: 'CL-890',
    displayName: 'Jane Smith',
    email: 'jane.smith@example.com',
    accountId: 'ACC-23456',
    brokerageAccountNumber: '73388424776948',
    brokerageId: 'BR-002',
    goalId: 'GOAL-789',
  },
  {
    id: 'CL-901',
    displayName: 'Robert Johnson',
    email: 'robert.johnson@example.com',
    accountId: 'ACC-34567',
    brokerageAccountNumber: '73388424776949',
    brokerageId: 'BR-003',
    goalId: 'GOAL-012',
  },
  {
    id: 'CL-012',
    displayName: 'Emily Davis',
    email: 'emily.davis@example.com',
    accountId: 'ACC-45678',
    brokerageAccountNumber: '73388424776950',
    brokerageId: 'BR-004',
    goalId: 'GOAL-345',
  },
  {
    id: 'CL-123',
    displayName: 'Michael Brown',
    email: 'michael.brown@example.com',
    accountId: 'ACC-56789',
    brokerageAccountNumber: '73388424776951',
    brokerageId: 'BR-005',
    goalId: 'GOAL-678',
  },
];

// ── Account Summaries ────────────────────────────────────────

export const mockAccountSummaries: Record<string, AccountSummary> = {
  'CL-789': {
    accountId: 'ACC-12345',
    totalEquity: 90.08,
    gains: 45.96,
    cash: 70.86,
    positions: 19.22,
    availableToWithdraw: 71.0,
    target: 1000.0,
    portfolioType: 'Conservative',
    brokerageAccountNumber: '73388424776947',
    accountStatus: 'ACTIVE',
  },
};

// ── Account Overviews ────────────────────────────────────────

export const mockAccountOverviews: Record<string, AccountOverview> = {
  'ACC-12345': {
    accountId: 'ACC-12345',
    accountHolderName: 'Darren Olevson',
    brokerageId: 'BR-001',
    brokerageAccountNumber: '73388424776947',
    accountStatus: 'active',
    accountType: 'Individual',
    totalBalance: 15000,
    cashBalance: 8482,
    positionsValue: 6518,
    openedDate: '2024-06-15T00:00:00Z',
    lastActivityDate: '2026-02-06T00:00:00Z',
    positions: [],
  },
};

// ── Positions ────────────────────────────────────────────────

export const mockPositions: Record<string, Position[]> = {
  'ACC-12345': [
    { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', quantity: 15, averageCost: 220.5, currentPrice: 235.75, marketValue: 3536.25, gainLoss: 228.75, gainLossPercent: 6.91 },
    { symbol: 'BND', name: 'Vanguard Total Bond Market ETF', quantity: 25, averageCost: 72.3, currentPrice: 70.15, marketValue: 1753.75, gainLoss: -53.75, gainLossPercent: -2.97 },
    { symbol: 'VXUS', name: 'Vanguard Total International Stock ETF', quantity: 20, averageCost: 58.25, currentPrice: 61.4, marketValue: 1228.0, gainLoss: 63.0, gainLossPercent: 5.41 },
  ],
};

// ── Transactions (account activity) ──────────────────────────

export const mockAccountTransactions: Record<string, Transaction[]> = {
  'ACC-12345': [
    { id: 'TX-000A', date: '2026-01-30', type: 'CR', code: 'CR', description: 'Cash Deposit', amount: 2000, balance: 15000 },
    { id: 'TX-000B', date: '2026-01-29', type: 'CR', code: 'CR', description: 'Cash Deposit', amount: 1500, balance: 13000 },
    { id: 'TX-001', date: '2026-01-26', type: 'CR', code: 'CR', description: 'Cash Deposit', amount: 3000, balance: 15000 },
    { id: 'TX-002', date: '2026-01-20', type: 'DR', code: 'DR', description: 'Withdrawal Request', amount: -5000, balance: 12000, isWithdrawalRelated: true },
    { id: 'TX-003', date: '2026-01-15', type: 'SEL', code: 'SEL', description: 'Shares Sold', amount: 5000, balance: 17000 },
    { id: 'TX-004', date: '2026-01-10', type: 'CR', code: 'CR', description: 'Cash Deposit', amount: 10000, balance: 12000 },
  ],
};

// ── Documents ────────────────────────────────────────────────

export const mockDocuments: UserDocument[] = [
  { id: 'DOC-001', type: 'Tax 1099', accountId: 'ACC-12345', bookAndRecordsId: 'BR-987654321', date: '2025-12-31', fileName: 'Tax-1099-2025-12-31.pdf', size: 345678 },
  { id: 'DOC-002', type: 'Tax 1099', accountId: 'ACC-12345', bookAndRecordsId: 'BR-987654321', date: '2024-12-31', fileName: 'Tax-1099-2024-12-31.pdf', size: 312456 },
  { id: 'DOC-003', type: 'Tax 1099', accountId: 'ACC-23456', bookAndRecordsId: 'BR-987654322', date: '2025-12-31', fileName: 'Tax-1099-2025-12-31.pdf', size: 298765 },
];

// ── Money Movement ───────────────────────────────────────────

export const mockMoneyMovementStats: MoneyMovementStats = {
  totalTransactionsToday: 142,
  totalCreditsToday: 2450000,
  totalDebitsToday: 1870000,
  netChangeToday: 580000,
  matchedCount: 128,
  unmatchedCount: 10,
  exceptionCount: 4,
};

export const mockMoneyMovementTransactions: MoneyMovementTransaction[] = [
  { id: 'MMT-001', amount: 5000, direction: 'CREDIT', effectiveDate: '2026-02-05', postingDate: '2026-02-05', sourceAccount: 'ACC-12345', status: 'COMPLETED', reconciliationStatus: 'MATCHED' },
  { id: 'MMT-002', amount: 12000, direction: 'DEBIT', effectiveDate: '2026-02-05', postingDate: '2026-02-05', sourceAccount: 'ACC-23456', status: 'COMPLETED', reconciliationStatus: 'MATCHED' },
  { id: 'MMT-003', amount: 7500, direction: 'DEBIT', effectiveDate: '2026-02-04', postingDate: '2026-02-04', sourceAccount: 'ACC-34567', status: 'FAILED', reconciliationStatus: 'EXCEPTION' },
  { id: 'MMT-004', amount: 3000, direction: 'CREDIT', effectiveDate: '2026-02-04', postingDate: '2026-02-04', sourceAccount: 'ACC-45678', status: 'COMPLETED', reconciliationStatus: 'MATCHED' },
  { id: 'MMT-005', amount: 8500, direction: 'DEBIT', effectiveDate: '2026-02-03', postingDate: '2026-02-03', sourceAccount: 'ACC-56789', status: 'PENDING', reconciliationStatus: 'UNMATCHED' },
];

export const mockDailyBalances: DailyBalance[] = [
  { date: '2026-02-05', openingBalance: 4520000, closingBalance: 4580000, deposits: 320000, withdrawals: 260000, netChange: 60000 },
  { date: '2026-02-04', openingBalance: 4480000, closingBalance: 4520000, deposits: 280000, withdrawals: 240000, netChange: 40000 },
  { date: '2026-02-03', openingBalance: 4450000, closingBalance: 4480000, deposits: 210000, withdrawals: 180000, netChange: 30000 },
  { date: '2026-02-02', openingBalance: 4400000, closingBalance: 4450000, deposits: 350000, withdrawals: 300000, netChange: 50000 },
  { date: '2026-02-01', openingBalance: 4380000, closingBalance: 4400000, deposits: 150000, withdrawals: 130000, netChange: 20000 },
];

// ── Seasoned Cash ────────────────────────────────────────────

export const mockSeasonedCash: Record<string, SeasonedCashData> = {
  'ACC-12345': {
    totalBalance: 15000,
    availableBalance: 12000,
    unseasonedAmount: 3000,
    nextSeasoningDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    daysUntilSeasoned: 3,
    unseasonedDeposits: [
      { amount: 2000, depositDate: '2026-01-30', seasoningDate: '2026-02-06', businessDaysRemaining: 2 },
      { amount: 1000, depositDate: '2026-01-29', seasoningDate: '2026-02-05', businessDaysRemaining: 1 },
    ],
    unseasonedSchedule: [
      { seasoningDate: '2026-02-05', amount: 1000, businessDaysRemaining: 1 },
      { seasoningDate: '2026-02-06', amount: 2000, businessDaysRemaining: 2 },
    ],
  },
};
