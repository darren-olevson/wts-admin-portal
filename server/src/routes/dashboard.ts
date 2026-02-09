import express, { Router } from 'express';
import { differenceInCalendarDays } from 'date-fns';
import { mockWithdrawals, mockNegativePositions } from '../utils/mockData';
import { convertHarborWithdrawalToUIFormat } from '../utils/harborConverters';

const router = Router();

// GET /api/dashboard/metrics - Get dashboard metrics
router.get('/metrics', async (req, res) => {
  try {
    // Parse optional date range query params
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : null;
    // Shift endDate to end-of-day so the entire day is included
    if (endDate) endDate.setHours(23, 59, 59, 999);

    // Filter withdrawals by date range when provided
    const filteredWithdrawals = mockWithdrawals.filter((w) => {
      const reqDate = new Date(w.requestDate);
      if (startDate && reqDate < startDate) return false;
      if (endDate && reqDate > endDate) return false;
      return true;
    });

    // Calculate metrics from filtered data
    const totalInvested = 12500000; // Mock total invested amount
    const fundedAccounts = 3420; // Mock funded accounts count
    const totalUsers = 5670; // Mock total users

    // Calculate withdrawal exceptions (withdrawals > 6 days)
    const withdrawalExceptions = filteredWithdrawals
      .map(convertHarborWithdrawalToUIFormat)
      .filter((w) => w.daysPending > 6).length;

    // Calculate total completed withdrawals amount (EDD uses COMPLETE)
    const totalWithdrawalAmount = filteredWithdrawals
      .filter((w) => w.status === 'COMPLETE' || w.status === 'RECONCILED')
      .reduce((sum, w) => sum + (w.amount || 0), 0);

    // Calculate withdrawal status summary per EDD statuses
    const statusSummary = {
      pendingLiquidation: filteredWithdrawals.filter(
        (w) => w.status === 'PENDING_LIQUIDATION'
      ).length,
      transferPending: filteredWithdrawals.filter(
        (w) =>
          w.status === 'CREATED' ||
          w.status === 'PROCESSING' ||
          w.status === 'PROCESSED'
      ).length,
      completed: filteredWithdrawals.filter(
        (w) => w.status === 'COMPLETE' || w.status === 'RECONCILED'
      ).length,
      failed: filteredWithdrawals.filter(
        (w) => w.status === 'FAILED'
      ).length,
      retrying: filteredWithdrawals.filter(
        (w) => w.status === 'RETRYING' || w.status === 'STALE'
      ).length,
      reconciliationPending: filteredWithdrawals.filter(
        (w) => w.status === 'COMPLETE' && w.reconciliationStatus !== 'MATCHED'
      ).length,
    };

    // Calculate completion time breakdown (request date -> transfer completion)
    const completedWithDates = filteredWithdrawals.filter(
      (w) =>
        (w.status === 'COMPLETE' || w.status === 'RECONCILED') &&
        w.transferCompletedDate
    );
    let completionBreakdown = { under3: 0, threeTo5: 0, sixPlus: 0 };
    if (completedWithDates.length > 0) {
      let under3 = 0;
      let threeTo5 = 0;
      let sixPlus = 0;
      for (const w of completedWithDates) {
        const days = differenceInCalendarDays(
          new Date(w.transferCompletedDate!),
          new Date(w.requestDate)
        );
        if (days < 3) under3++;
        else if (days <= 5) threeTo5++;
        else sixPlus++;
      }
      const total = completedWithDates.length;
      completionBreakdown = {
        under3: Math.round((under3 / total) * 100),
        threeTo5: Math.round((threeTo5 / total) * 100),
        sixPlus: Math.round((sixPlus / total) * 100),
      };
    }

    // Calculate negative positions summary
    const negativePositionsSum = mockNegativePositions.reduce(
      (sum, p) => sum + p.marketValue,
      0
    );
    const negativePositionsCount = mockNegativePositions.length;

    res.json({
      investedAmount: totalInvested,
      fundedAccounts,
      totalUsers,
      withdrawalExceptions,
      totalWithdrawalAmount,
      negativePositionsSum,
      negativePositionsCount,
      statusSummary: {
        ...statusSummary,
        completionBreakdown,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
});

// GET /api/dashboard/negative-positions - Get list of negative positions for drill-down
router.get('/negative-positions', async (req, res) => {
  try {
    res.json(mockNegativePositions);
  } catch (error) {
    console.error('Error fetching negative positions:', error);
    res.status(500).json({ error: 'Failed to fetch negative positions' });
  }
});

export default router;
