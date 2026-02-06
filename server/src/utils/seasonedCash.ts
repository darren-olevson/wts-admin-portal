import { addBusinessDays, differenceInBusinessDays, isWeekend, format } from 'date-fns';
import { HarborAccountBalance, UIBalance } from '../types/harbor';

/**
 * Calculate seasoned cash based on 5-business-day rule
 * Funds must be held for 5 business days before they can be withdrawn
 */
export function calculateSeasonedCash(
  balance: HarborAccountBalance,
  transactions: Array<{ date: string; amount: number }>
): UIBalance {
  const now = new Date();
  const SEASONING_BUSINESS_DAYS = 5;
  const fiveBusinessDaysAgo = addBusinessDays(now, -SEASONING_BUSINESS_DAYS);

  // Calculate unseasoned amount (funds deposited within last 5 business days)
  let unseasonedAmount = 0;
  const unseasonedDeposits: UIBalance['unseasonedDeposits'] = [];

  // Sort transactions by date (newest first)
  const recentTransactions = transactions
    .filter((tx) => {
      const txDate = new Date(tx.date);
      return txDate >= fiveBusinessDaysAgo && tx.amount > 0; // Only positive amounts (deposits)
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate unseasoned funds
  for (const tx of recentTransactions) {
    const txDate = new Date(tx.date);
    const daysSinceDeposit = differenceInBusinessDays(now, txDate);

    if (daysSinceDeposit < SEASONING_BUSINESS_DAYS) {
      unseasonedAmount += tx.amount;
      const seasoningDate = addBusinessDays(txDate, SEASONING_BUSINESS_DAYS);
      unseasonedDeposits.push({
        amount: tx.amount,
        depositDate: txDate.toISOString(),
        seasoningDate: format(seasoningDate, 'yyyy-MM-dd'),
        businessDaysRemaining: Math.max(0, SEASONING_BUSINESS_DAYS - daysSinceDeposit),
      });
    }
  }

  const availableBalance = Math.max(0, balance.totalBalance - unseasonedAmount);

  // Calculate next seasoning date (when oldest unseasoned funds will be available)
  let nextSeasoningDate: string | null = null;
  let daysUntilSeasoned: number | null = null;

  const scheduleByDate = new Map<string, { amount: number; businessDaysRemaining: number }>();
  for (const deposit of unseasonedDeposits) {
    const existing = scheduleByDate.get(deposit.seasoningDate);
    if (existing) {
      existing.amount += deposit.amount;
    } else {
      scheduleByDate.set(deposit.seasoningDate, {
        amount: deposit.amount,
        businessDaysRemaining: deposit.businessDaysRemaining,
      });
    }
  }

  const unseasonedSchedule = Array.from(scheduleByDate.entries())
    .map(([seasoningDate, data]) => ({
      seasoningDate,
      amount: data.amount,
      businessDaysRemaining: data.businessDaysRemaining,
    }))
    .sort((a, b) => new Date(a.seasoningDate).getTime() - new Date(b.seasoningDate).getTime());

  unseasonedDeposits.sort((a, b) => {
    const seasoningDiff = new Date(a.seasoningDate).getTime() - new Date(b.seasoningDate).getTime();
    if (seasoningDiff !== 0) {
      return seasoningDiff;
    }
    return new Date(a.depositDate).getTime() - new Date(b.depositDate).getTime();
  });

  if (unseasonedSchedule.length > 0) {
    nextSeasoningDate = unseasonedSchedule[0].seasoningDate;
    daysUntilSeasoned = unseasonedSchedule[0].businessDaysRemaining;
  }

  return {
    totalBalance: balance.totalBalance,
    availableBalance,
    unseasonedAmount,
    nextSeasoningDate,
    daysUntilSeasoned,
    unseasonedDeposits,
    unseasonedSchedule,
  };
}

/**
 * Check if a date is a business day (not weekend)
 * Note: This is a simplified version. In production, you'd want to
 * account for holidays using a holiday calendar library
 */
export function isBusinessDay(date: Date): boolean {
  return !isWeekend(date);
}

/**
 * Calculate business days between two dates
 */
export function businessDaysBetween(startDate: Date, endDate: Date): number {
  return differenceInBusinessDays(endDate, startDate);
}
