import express, { Router } from 'express';
import { mockWithdrawals } from '../utils/mockData';
import { convertHarborWithdrawalToUIFormat } from '../utils/harborConverters';

const router = Router();

// GET /api/dashboard/metrics - Get dashboard metrics
router.get('/metrics', async (req, res) => {
  try {
    // Calculate metrics from mock data
    const totalInvested = 12500000; // Mock total invested amount
    const fundedAccounts = 3420; // Mock funded accounts count
    const totalUsers = 5670; // Mock total users

    // Calculate withdrawal exceptions (withdrawals > 6 days)
    const withdrawalExceptions = mockWithdrawals
      .map(convertHarborWithdrawalToUIFormat)
      .filter((w) => w.daysPending > 6).length;

    // Calculate total completed withdrawals amount
    const totalWithdrawalAmount = mockWithdrawals
      .filter((w) => w.status === 'COMPLETED')
      .reduce((sum, w) => sum + (w.amount || 0), 0);

    // Calculate withdrawal status summary
    const statusSummary = {
      liquidationPending: mockWithdrawals.filter(
        (w) => w.status === 'Liquidation_pending' || w.status === 'PENDING_LIQUIDATION'
      ).length,
      transferPending: mockWithdrawals.filter(
        (w) =>
          w.status === 'Transfer_pending' ||
          w.status === 'CREATED' ||
          w.status === 'TRANSFER_CREATED'
      ).length,
      completed: mockWithdrawals.filter((w) => w.status === 'COMPLETED').length,
      approvalFailed: mockWithdrawals.filter(
        (w) => w.status === 'Withdrawal_approval_failed' || w.status === 'FAILED'
      ).length,
      reconciliationPending: mockWithdrawals.filter(
        (w) => w.status === 'COMPLETED' && w.reconciliationStatus !== 'MATCHED'
      ).length,
    };

    res.json({
      investedAmount: totalInvested,
      fundedAccounts,
      totalUsers,
      withdrawalExceptions,
      totalWithdrawalAmount,
      statusSummary,
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
});

export default router;
