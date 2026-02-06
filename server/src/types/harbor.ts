// Harbor API Type Definitions

// ============================================================================
// API Response Wrappers
// ============================================================================

/**
 * All Harbor API responses follow this wrapper structure
 */
export interface HarborApiResponse<T> {
  data: T;
  meta?: Record<string, any>;
}

/**
 * Harbor API error response structure
 */
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
  | 'COMPLETE'
  | 'FAILED'
  | 'CANCELLED';

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

// Withdrawal (ACH Transfer) record per EDD
export interface HarborWithdrawal {
  id: string;
  accountId: string;
  clientId: string;
  clientName: string;
  amount: number;
  status: HarborWithdrawalStatus;
  requestDate: string;
  requestedAmount?: number;
  actualAmount?: number;
  withdrawalType?: 'FULL' | 'PARTIAL';
  reconciliationStatus?: 'MATCHED' | 'UNMATCHED' | 'EXCEPTION';
  achTransferBatchId?: string | null;
  brokerageAccountNumber?: string;
  brokerageId?: string;
  goalId?: string;
  createdAt: string;
  updatedAt: string;
  // Nested liquidation object per EDD
  liquidation?: LiquidationDetail;
  // Milestone dates
  liquidationCompletedDate?: string;
  transferCompletedDate?: string;
  // Audit and action tracking
  auditLog?: AuditEntry[];
  reprocessedFromId?: string;
  reprocessedToId?: string;
  liquidationSkipped?: boolean;
  transferType?: 'ACH' | 'WIRE' | 'CARD';
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

// Nested liquidation object returned by the combination endpoint
export interface LiquidationDetail {
  id: string;
  partnerUserSleeveID?: string;
  accountNumber?: string;
  amount: number;
  direction?: 'SELL';
  isFullLiquidation: boolean;
  status: LiquidationStatus;
  createdBy?: string;
  created?: number;
  modifiedBy?: string;
  modified?: number;
  objectVersion?: number;
}

export interface HarborAccountBalance {
  accountId: string;
  totalBalance: number;
  availableBalance: number;
  unseasonedAmount: number;
  lastUpdated: string;
}

export interface HarborTransaction {
  id: string;
  accountId: string;
  date: string;
  type: string;
  code: 'CR' | 'BUY' | 'SEL' | 'DR';
  description: string;
  amount: number;
  balance: number;
  transactionDate: string;
  activityType?: 'BUY' | 'SELL' | 'DIVIDEND' | 'DEPOSIT' | 'WITHDRAWAL' | 'REINVESTMENT' | 'INTEREST' | 'OTHER';
  buys?: number;
  sells?: number;
  dividends?: number;
  deposits?: number;
  withdrawals?: number;
  reinvestments?: number;
  interests?: number;
  other?: number;
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

export interface WorkInformation {
  employer?: string;
  occupation?: string;
  employmentStatus?: string;
}

export interface ExperienceInformation {
  investmentExperience?: string;
  riskTolerance?: string;
}

export interface EmployerInformation {
  isEmployedByFinancialIndustry?: boolean;
  companyName?: string;
}

export interface FinancialInformation {
  annualIncome?: number;
  netWorth?: number;
  liquidNetWorth?: number;
}

export interface AgreementsInformation {
  termsAccepted?: boolean;
  privacyPolicyAccepted?: boolean;
  marketDataAgreement?: boolean;
}

export interface AssociationInformation {
  isControlPerson?: boolean;
  isPoliticallyExposed?: boolean;
}

export interface HarborClient {
  clientId: string;
  emailAddress: string;
  contactInformation?: ContactInformation;
  personalInformation: PersonalInformation;
  workInformation?: WorkInformation;
  experienceInformation?: ExperienceInformation;
  employerInformation?: EmployerInformation;
  financialInformation?: FinancialInformation;
  agreementsInformation?: AgreementsInformation;
  associationInformation?: AssociationInformation;
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
  documentDate?: string; // Not included in list response
  documentType: HarborDocumentType;
}

export interface HarborDocumentDetail extends HarborDocument {
  accountId: string;
  documentUrl: string; // Pre-signed S3 URL
}

// ============================================================================
// Legacy Types (for backwards compatibility)
// ============================================================================

export interface HarborUser {
  id: string;
  wbClientId: string;
  displayName: string;
  dateOfBirth: string;
  email: string;
  citizenship?: string;
  countryOfResidence: string;
  countryOfTaxResidence: string;
  phoneNumber?: string;
  address?: string;
  accountId: string;
  brokerageAccountNumber: string;
  brokerageId: string;
  goalId?: string;
  totalEquity?: number;
  gains?: number;
  cash?: number;
  positions?: number;
  availableToWithdraw?: number;
  target?: number;
  portfolioType?: string;
  accountStatus?: string;
}

export interface HarborOrderValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Derived liquidation status for UI display
export type UILiquidationStatus = LiquidationStatus | 'N/A';

// Derived transfer status for UI display
export type UITransferStatus = 'PENDING' | 'COMPLETE' | 'FAILED' | 'RETRYING' | 'STALE' | 'RECONCILED' | 'N/A';

// UI-facing types (converted from Harbor types)
export interface UIWithdrawal {
  id: string;
  accountId: string;
  clientId: string;
  clientName: string;
  amount: number;
  status: string;
  liquidationStatus: UILiquidationStatus;
  transferStatus: UITransferStatus;
  requestDate: string;
  daysPending: number;
  requestedAmount?: number;
  actualAmount?: number;
  withdrawalType?: 'FULL' | 'PARTIAL';
  reconciliationStatus?: 'MATCHED' | 'UNMATCHED' | 'EXCEPTION' | 'PENDING';
  achTransferBatchId?: string | null;
  transferType?: 'ACH' | 'WIRE' | 'CARD';
  brokerageAccountNumber?: string;
  brokerageId?: string;
  goalId?: string;
  // Nested liquidation detail from EDD
  liquidation?: LiquidationDetail;
  // Completion metrics
  daysToComplete?: number | null;
  // Audit and action tracking
  auditLog?: AuditEntry[];
  reprocessedFromId?: string;
  reprocessedToId?: string;
  liquidationSkipped?: boolean;
}

export interface UIBalance {
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

export interface UITransaction {
  id: string;
  date: string;
  type: string;
  code: 'CR' | 'BUY' | 'SEL' | 'DR';
  description: string;
  amount: number;
  balance: number;
  isWithdrawalRelated?: boolean;
}
