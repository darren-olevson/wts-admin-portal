/**
 * Seasoned Cash Calculation Utility
 * 
 * Implements the 5-business-day seasoning rule for withdrawal eligibility.
 * Funds must be held for 5 business days (excluding weekends and holidays) before they can be withdrawn.
 */

export interface SeasonedCashResult {
  totalBalance: number;
  availableBalance: number;
  unseasonedBalance: number;
  seasonedTransactions: SeasonedTransaction[];
  unseasonedTransactions: SeasonedTransaction[];
}

export interface SeasonedTransaction {
  transactionId: string;
  amount: number;
  date: Date;
  transactionCode: string;
  daysSinceTransaction: number;
  isSeasoned: boolean;
}

/**
 * Check if a date is a business day (Monday-Friday)
 */
function isBusinessDay(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6; // 0 = Sunday, 6 = Saturday
}

/**
 * Get the next business day from a given date
 */
function getNextBusinessDay(date: Date): Date {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  
  while (!isBusinessDay(nextDay)) {
    nextDay.setDate(nextDay.getDate() + 1);
  }
  
  return nextDay;
}

/**
 * Calculate the number of business days between two dates
 * 
 * @param startDate - The start date (inclusive)
 * @param endDate - The end date (inclusive)
 * @returns Number of business days between the dates
 */
export function calculateBusinessDays(startDate: Date, endDate: Date): number {
  if (startDate > endDate) {
    return 0;
  }

  let businessDays = 0;
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    if (isBusinessDay(currentDate)) {
      businessDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return businessDays;
}

/**
 * Check if a transaction date is seasoned (5+ business days old)
 * 
 * @param transactionDate - The date of the transaction
 * @param referenceDate - The reference date (usually today)
 * @returns true if the transaction is seasoned (5+ business days old)
 */
export function isTransactionSeasoned(transactionDate: Date, referenceDate: Date = new Date()): boolean {
  const businessDays = calculateBusinessDays(transactionDate, referenceDate);
  return businessDays >= 5;
}

/**
 * Calculate the number of business days until a transaction becomes seasoned
 * 
 * @param transactionDate - The date of the transaction
 * @param referenceDate - The reference date (usually today)
 * @returns Number of business days remaining until seasoning (0 if already seasoned)
 */
export function getDaysUntilSeasoned(transactionDate: Date, referenceDate: Date = new Date()): number {
  const businessDays = calculateBusinessDays(transactionDate, referenceDate);
  return Math.max(0, 5 - businessDays);
}

/**
 * Calculate seasoned cash balance from account transactions
 * 
 * This function takes a list of transactions and calculates:
 * - Total balance (sum of all transactions)
 * - Available balance (sum of seasoned transactions only)
 * - Unseasoned balance (total - available)
 * 
 * @param transactions - Array of transactions with amount and date
 * @param referenceDate - The reference date for seasoning calculation (defaults to today)
 * @returns SeasonedCashResult with balance breakdown
 */
export function calculateSeasonedCash(
  transactions: Array<{ amount: number; date: Date; transactionId?: string; transactionCode?: string }>,
  referenceDate: Date = new Date()
): SeasonedCashResult {
  const totalBalance = transactions.reduce((sum, txn) => sum + txn.amount, 0);
  
  const processedTransactions: SeasonedTransaction[] = transactions.map(txn => {
    const daysSinceTransaction = calculateBusinessDays(txn.date, referenceDate);
    const isSeasoned = daysSinceTransaction >= 5;
    
    return {
      transactionId: txn.transactionId || '',
      amount: txn.amount,
      date: txn.date,
      transactionCode: txn.transactionCode || '',
      daysSinceTransaction,
      isSeasoned,
    };
  });
  
  const seasonedTransactions = processedTransactions.filter(txn => txn.isSeasoned);
  const unseasonedTransactions = processedTransactions.filter(txn => !txn.isSeasoned);
  
  const availableBalance = seasonedTransactions.reduce((sum, txn) => sum + txn.amount, 0);
  const unseasonedBalance = totalBalance - availableBalance;
  
  return {
    totalBalance,
    availableBalance,
    unseasonedBalance,
    seasonedTransactions,
    unseasonedTransactions,
  };
}

/**
 * Get the date when funds from a transaction will become available for withdrawal
 * 
 * @param transactionDate - The date of the transaction
 * @returns The date when the funds will be seasoned (5 business days after transaction)
 */
export function getSeasoningDate(transactionDate: Date): Date {
  let currentDate = new Date(transactionDate);
  let businessDaysCounted = 0;
  
  // Count the transaction date as day 0, so we need 4 more business days
  while (businessDaysCounted < 4) {
    currentDate = getNextBusinessDay(currentDate);
    businessDaysCounted++;
  }
  
  return currentDate;
}
