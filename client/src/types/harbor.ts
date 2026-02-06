/**
 * Harbor API Type Definitions (Client-side)
 */

// ============================================================================
// API Response Wrappers
// ============================================================================

export interface HarborApiResponse<T> {
  data: T;
  meta?: Record<string, any>;
}

export interface HarborApiError {
  errors: Array<{
    code: string;
    title: string;
    detail?: string;
  }>;
  meta?: Record<string, any>;
}

// ============================================================================
// Payment Instructions (Withdrawals)
// ============================================================================

export interface PaymentAccount {
  accountId?: string;
  accountNumber?: string;
  accountType?: string;
  routingNumber?: string;
  institutionName?: string;
}

export interface HarborPaymentInstruction {
  id: string;
  transferType: 'WIRE' | 'ACH' | 'CARD' | 'CASH_PROMOTION' | 'CASH_ADJUSTMENT' | 'WALLET_TRANSFER';
  orchestrationMode: 'PARTNER_PROCESSOR';
  status: HarborPaymentStatus;
  sourceAccount: PaymentAccount;
  destinationAccount: PaymentAccount;
  sourceAmount: number;
  sourceCurrency: string;
  destinationAmount: number;
  destinationCurrency: string;
  description?: string;
  comment?: string;
  createdAt: string;
  updatedAt?: string;
  metadata?: Record<string, string>;
}

export type HarborPaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

// Legacy withdrawal types (for backwards compatibility)
export interface HarborWithdrawal {
  withdrawalId: string;
  accountId: string;
  clientId: string;
  clientName: string;
  requestAmount: number;
  requestDate: string;
  status: HarborWithdrawalStatus;
  brokerageAccountNumber?: string;
  brokerageId?: string;
  goalId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  ageInDays?: number;
  isException?: boolean;
}

export type HarborWithdrawalStatus =
  | 'Liquidation_pending'
  | 'Transfer_pending'
  | 'Withdrawal_approval_failed'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED';

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
  date: string;
  transactionCode: HarborTransactionCode;
  description: string;
  type: string;
  relatedWithdrawalId?: string;
}

export type HarborTransactionCode = 'CR' | 'BUY' | 'SEL' | 'DR' | string;

export interface SeasonedCashResult {
  accountId: string;
  totalBalance: number;
  availableBalance: number;
  unseasonedBalance: number;
  seasonedTransactions: SeasonedTransaction[];
  unseasonedTransactions: SeasonedTransaction[];
}

export interface SeasonedTransaction {
  transactionId: string;
  amount: number;
  date: string;
  transactionCode: string;
  daysSinceTransaction: number;
  isSeasoned: boolean;
}

// ============================================================================
// Clients
// ============================================================================

export interface ContactInformation {
  phoneNumber?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
}

export interface PersonalInformation {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  citizenship?: string;
  countryOfResidence?: string;
  taxResidency?: string;
}

export interface HarborClient {
  clientId: string;
  emailAddress: string;
  contactInformation?: ContactInformation;
  personalInformation: PersonalInformation;
}

// ============================================================================
// Accounts
// ============================================================================

export interface HarborAccount {
  accountId: string;
  accountNumber: string;
  clientId: string;
  name: string;
  accountType: 'INDIV' | 'NON_INDIV';
  accountStatus: 'OPEN' | 'RESTRICTED' | null;
  entitlements: string[];
}

// ============================================================================
// Documents
// ============================================================================

export type HarborDocumentType =
  | 'TRADE_CONFIRMATIONS'
  | 'STATEMENTS_MONTHLY'
  | 'STATEMENTS_DAILY'
  | 'TAX_FORMS'
  | 'W9'
  | '407';

export interface HarborDocument {
  documentId: string;
  documentName: string;
  documentDate?: string;
  documentType: HarborDocumentType;
}

export interface HarborDocumentDetail extends HarborDocument {
  accountId: string;
  documentUrl: string; // Pre-signed S3 URL
}

// ============================================================================
// UI Types
// ============================================================================

export interface UIWithdrawal {
  id: string;
  accountId: string;
  clientId: string;
  clientName: string;
  amount: number;
  status: string;
  requestDate: string;
  daysPending: number;
  brokerageAccountNumber?: string;
  brokerageId?: string;
  goalId?: string;
}

export interface UIDocument {
  id: string;
  documentId: string;
  name: string;
  type: string;
  date: string;
  accountId?: string;
  downloadUrl?: string;
}
