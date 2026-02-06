/**
 * Harbor API Type Definitions
 */

export interface HarborWithdrawal {
  withdrawalId: string;
  accountId: string;
  clientId: string;
  clientName: string;
  requestAmount: number;
  requestDate: string; // ISO date string
  status: HarborWithdrawalStatus;
  brokerageAccountNumber?: string;
  brokerageId?: string;
  goalId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ACH Transfer Status per EDD (Combination Endpoint)
export type HarborWithdrawalStatus =
  | 'CREATED'
  | 'PENDING_LIQUIDATION'
  | 'PROCESSING'
  | 'PROCESSED'
  | 'RETRYING'
  | 'RECONCILED'
  | 'STALE'
  | 'COMPLETE'
  | 'FAILED'
  | 'CANCELLED';

// Liquidation (Cash Movement) Status per EDD
export type LiquidationStatus =
  | 'CREATED'
  | 'PENDING'
  | 'FAILED'
  | 'COMPLETE'
  | 'CANCELLED'
  | 'PROCESSED_SUCCESSFULLY';

export interface HarborAccountBalance {
  accountId: string;
  totalBalance: number;
  availableBalance: number;
  unseasonedBalance: number;
  currency: string;
  lastUpdated: string;
}

export interface HarborTransaction {
  transactionId: string;
  accountId: string;
  amount: number;
  date: string; // ISO date string
  transactionCode: HarborTransactionCode;
  description: string;
  type: string;
  relatedWithdrawalId?: string;
}

export type HarborTransactionCode = 'CR' | 'BUY' | 'SEL' | 'DR' | string;

export interface HarborWithdrawalStatusResponse {
  withdrawal: HarborWithdrawal;
  accountBalance: HarborAccountBalance;
  canCancel: boolean;
  canReprocess: boolean;
}

export interface HarborApiError {
  error: string;
  message: string;
  code?: string;
}
