import {
  HarborWithdrawal,
  HarborTransaction,
  HarborAccountBalance,
  HarborPaymentInstruction,
  HarborPaymentStatus,
  HarborClient,
  HarborAccount,
  HarborDocument,
  HarborDocumentDetail,
  HarborUser,
  LiquidationDetail,
  UIWithdrawal,
  UITransaction,
  UILiquidationStatus,
  UITransferStatus,
} from '../types/harbor';
import { differenceInBusinessDays, differenceInCalendarDays } from 'date-fns';

/**
 * Derive liquidation status from withdrawal data per EDD.
 * If a nested liquidation object is available, use its status directly.
 * Otherwise, derive from the ACH Transfer status.
 *
 * EDD Liquidation (Cash Movement) statuses:
 *   CREATED | PENDING | FAILED | COMPLETE | CANCELLED | PROCESSED_SUCCESSFULLY
 */
function deriveLiquidationStatus(
  achStatus: string,
  liquidation?: LiquidationDetail,
): UILiquidationStatus {
  // If nested liquidation is present, use its status directly
  if (liquidation) {
    return liquidation.status;
  }

  // Fall back to deriving from ACH Transfer status
  const s = achStatus.toUpperCase();

  if (s === 'PENDING_LIQUIDATION') {
    // Liquidation exists but we don't have the nested object; assume CREATED/PENDING
    return 'PENDING';
  }
  if (s === 'FAILED') {
    return 'FAILED';
  }
  if (s === 'CANCELLED') {
    return 'CANCELLED';
  }
  // If the ACH transfer has moved past PENDING_LIQUIDATION, liquidation is done
  if (['CREATED', 'PROCESSING', 'PROCESSED', 'RETRYING', 'COMPLETE', 'RECONCILED', 'STALE'].includes(s)) {
    return 'COMPLETE';
  }
  return 'N/A';
}

/**
 * Derive transfer (ACH) status from the ACH Transfer status per EDD.
 *
 * EDD ACH Transfer statuses:
 *   CREATED | PENDING_LIQUIDATION | PROCESSING | PROCESSED | RETRYING |
 *   RECONCILED | STALE | COMPLETE | FAILED | CANCELLED
 */
function deriveTransferStatus(achStatus: string): UITransferStatus {
  const s = achStatus.toUpperCase();

  // Still waiting on liquidation — transfer hasn't started
  if (s === 'PENDING_LIQUIDATION') {
    return 'N/A';
  }
  // Transfer queued or being processed
  if (s === 'CREATED' || s === 'PROCESSING' || s === 'PROCESSED') {
    return 'PENDING';
  }
  // Retrying after ACH rejection
  if (s === 'RETRYING') {
    return 'RETRYING';
  }
  // Successfully submitted to WSI
  if (s === 'COMPLETE') {
    return 'COMPLETE';
  }
  // Reconciled via BOD files
  if (s === 'RECONCILED') {
    return 'RECONCILED';
  }
  // Not reconciled after 7 days
  if (s === 'STALE') {
    return 'STALE';
  }
  // Terminal states
  if (s === 'FAILED') {
    return 'FAILED';
  }
  if (s === 'CANCELLED') {
    return 'N/A';
  }
  return 'N/A';
}

/**
 * Convert Harbor withdrawal to UI format
 */
export function convertHarborWithdrawalToUIFormat(
  withdrawal: HarborWithdrawal
): UIWithdrawal {
  const requestDate = new Date(withdrawal.requestDate);
  const now = new Date();
  const daysPending = differenceInBusinessDays(now, requestDate);

  // If liquidation was skipped, show liquidation as COMPLETE
  const liquidationStatus = withdrawal.liquidationSkipped
    ? 'COMPLETE' as const
    : deriveLiquidationStatus(withdrawal.status, withdrawal.liquidation);

  // Calculate days to complete (liquidation completed -> transfer completed)
  let daysToComplete: number | null = null;
  if (withdrawal.liquidationCompletedDate && withdrawal.transferCompletedDate) {
    const liqDate = new Date(withdrawal.liquidationCompletedDate);
    const xferDate = new Date(withdrawal.transferCompletedDate);
    daysToComplete = differenceInCalendarDays(xferDate, liqDate);
  }

  return {
    id: withdrawal.id,
    accountId: withdrawal.accountId,
    clientId: withdrawal.clientId,
    clientName: withdrawal.clientName,
    amount: withdrawal.amount,
    status: withdrawal.status,
    liquidationStatus,
    transferStatus: deriveTransferStatus(withdrawal.status),
    requestDate: withdrawal.requestDate,
    daysPending,
    requestedAmount: withdrawal.requestedAmount ?? withdrawal.amount,
    actualAmount: withdrawal.actualAmount ?? withdrawal.amount,
    withdrawalType: withdrawal.withdrawalType,
    reconciliationStatus: withdrawal.reconciliationStatus,
    achTransferBatchId: withdrawal.achTransferBatchId ?? null,
    transferType: withdrawal.transferType,
    brokerageAccountNumber: withdrawal.brokerageAccountNumber,
    brokerageId: withdrawal.brokerageId,
    goalId: withdrawal.goalId,
    sleeveId: withdrawal.sleeveId || 'SLV-' + withdrawal.accountId.slice(-5).toUpperCase(),
    // Nested liquidation detail from EDD
    liquidation: withdrawal.liquidation,
    // Completion metrics
    daysToComplete,
    // Audit and action tracking
    auditLog: withdrawal.auditLog,
    reprocessedFromId: withdrawal.reprocessedFromId,
    reprocessedToId: withdrawal.reprocessedToId,
    liquidationSkipped: withdrawal.liquidationSkipped,
  };
}

/**
 * Convert Harbor transaction to UI format
 */
export function convertHarborTransactionToUIFormat(
  transaction: HarborTransaction,
  withdrawalId?: string
): UITransaction {
  return {
    id: transaction.id,
    date: transaction.date,
    type: transaction.type,
    code: transaction.code,
    description: transaction.description,
    amount: transaction.amount,
    balance: transaction.balance,
    isWithdrawalRelated: withdrawalId
      ? transaction.description.toLowerCase().includes('withdrawal') ||
        transaction.description.toLowerCase().includes('liquidation')
      : false,
  };
}

/**
 * Map Harbor transaction type to display code
 */
export function mapTransactionCode(type: string): 'CR' | 'BUY' | 'SEL' | 'DR' {
  const normalizedType = type.toLowerCase();

  if (normalizedType.includes('cash received') || normalizedType.includes('deposit')) {
    return 'CR';
  }
  if (normalizedType.includes('buy') || normalizedType.includes('purchase')) {
    return 'BUY';
  }
  if (normalizedType.includes('sell') || normalizedType.includes('liquidation')) {
    return 'SEL';
  }
  if (normalizedType.includes('disbursement') || normalizedType.includes('withdrawal')) {
    return 'DR';
  }

  // Default fallback
  return 'CR';
}

/**
 * Get transaction type display name
 */
export function getTransactionTypeName(code: 'CR' | 'BUY' | 'SEL' | 'DR'): string {
  const typeMap = {
    CR: 'Cash Received',
    BUY: 'Securities Purchased',
    SEL: 'Shares Sold',
    DR: 'DDA Disbursement',
  };
  return typeMap[code];
}

// ============================================================================
// Harbor API Converters (New)
// ============================================================================

/**
 * Map Harbor Payment Status to EDD-aligned ACH Transfer Status.
 * Harbor Payment API uses a simpler status set; we map to the EDD ACH Transfer statuses.
 */
export function mapPaymentStatusToWithdrawalStatus(
  status: HarborPaymentStatus,
): string {
  switch (status) {
    case 'PENDING':
      return 'CREATED';
    case 'PROCESSING':
      return 'PROCESSING';
    case 'COMPLETE':
      return 'COMPLETE';
    case 'FAILED':
      return 'FAILED';
    case 'CANCELLED':
      return 'CANCELLED';
    default:
      return status;
  }
}

/**
 * Convert Harbor Payment Instruction to UI Withdrawal format
 */
export function convertPaymentInstructionToWithdrawal(
  paymentInstruction: HarborPaymentInstruction
): UIWithdrawal {
  const requestDate = new Date(paymentInstruction.createdAt);
  const now = new Date();
  const daysPending = differenceInBusinessDays(now, requestDate);

  const status = mapPaymentStatusToWithdrawalStatus(
    paymentInstruction.status,
  );

  return {
    id: paymentInstruction.id,
    accountId: paymentInstruction.sourceAccount.accountId || '',
    clientId: paymentInstruction.metadata?.clientId || '',
    clientName: paymentInstruction.metadata?.clientName || 'Unknown',
    amount: paymentInstruction.sourceAmount,
    requestedAmount: paymentInstruction.sourceAmount,
    actualAmount: paymentInstruction.destinationAmount,
    withdrawalType:
      paymentInstruction.metadata?.withdrawalType === 'PARTIAL' ? 'PARTIAL' : 'FULL',
    reconciliationStatus:
      paymentInstruction.metadata?.reconciliationStatus === 'MATCHED'
        ? 'MATCHED'
        : paymentInstruction.metadata?.reconciliationStatus === 'EXCEPTION'
          ? 'EXCEPTION'
          : 'UNMATCHED',
    achTransferBatchId: paymentInstruction.metadata?.achTransferBatchId || null,
    status,
    liquidationStatus: deriveLiquidationStatus(status),
    transferStatus: deriveTransferStatus(status),
    requestDate: paymentInstruction.createdAt,
    daysPending,
    brokerageAccountNumber: paymentInstruction.sourceAccount.accountNumber,
  };
}

/**
 * Convert Harbor Client and Accounts to UI User format
 */
export function convertHarborClientToUser(
  client: HarborClient,
  accounts: HarborAccount[]
): HarborUser {
  const primaryAccount = accounts[0]; // Use first account as primary
  const personalInfo = client.personalInformation;

  return {
    id: client.clientId,
    wbClientId: client.clientId,
    displayName: personalInfo
      ? `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim()
      : 'Unknown',
    dateOfBirth: personalInfo?.dateOfBirth || '',
    email: client.emailAddress,
    citizenship: personalInfo?.citizenship,
    countryOfResidence: personalInfo?.countryOfResidence || '',
    countryOfTaxResidence: personalInfo?.taxResidency || '',
    phoneNumber: client.contactInformation?.phoneNumber,
    address: client.contactInformation?.address
      ? `${client.contactInformation.address.street || ''}, ${client.contactInformation.address.city || ''}, ${client.contactInformation.address.state || ''} ${client.contactInformation.address.zipCode || ''}`
      : undefined,
    accountId: primaryAccount?.accountId || '',
    brokerageAccountNumber: primaryAccount?.accountNumber || '',
    brokerageId: primaryAccount?.accountId || '',
    accountStatus: primaryAccount?.accountStatus || undefined,
  };
}

/**
 * Convert Harbor Document to UI Document format
 */
export function convertHarborDocumentToUIFormat(doc: HarborDocument | HarborDocumentDetail) {
  return {
    id: doc.documentId,
    documentId: doc.documentId,
    name: doc.documentName,
    type: mapDocumentTypeToUIType(doc.documentType),
    date: doc.documentDate || '',
    accountId: 'accountId' in doc ? doc.accountId : undefined,
    downloadUrl: 'documentUrl' in doc ? doc.documentUrl : undefined,
  };
}

/**
 * Map Harbor Document Type to UI display type
 */
export function mapDocumentTypeToUIType(type: string): string {
  const typeMap: Record<string, string> = {
    TRADE_CONFIRMATIONS: 'Trade Confirmation',
    STATEMENTS_MONTHLY: 'Monthly Statement',
    STATEMENTS_DAILY: 'Daily Statement',
    TAX_FORMS: 'Tax Form (1099)',
    W9: 'W9 Form',
    '407': 'Form 407',
  };
  return typeMap[type] || type;
}

/**
 * Map UI Document Type to Harbor API type
 */
export function mapUITypeToHarborDocumentType(uiType: string): string {
  const reverseMap: Record<string, string> = {
    'Trade Confirmation': 'TRADE_CONFIRMATIONS',
    'Monthly Statement': 'STATEMENTS_MONTHLY',
    'Daily Statement': 'STATEMENTS_DAILY',
    'Tax Form (1099)': 'TAX_FORMS',
    'Tax 1099': 'TAX_FORMS',
    'W9 Form': 'W9',
    'Form 407': '407',
  };
  return reverseMap[uiType] || uiType;
}
