/**
 * Server Routes
 * 
 * API endpoints for the WTS Admin Portal
 */

import { Router } from 'express';
import { calculateSeasonedCash, calculateBusinessDays } from './utils/seasonedCash';
import { HarborWithdrawal, HarborAccountBalance, HarborTransaction, HarborWithdrawalStatus } from './types/harbor';

const router = Router();

// Mock data for development - replace with actual Harbor API calls
const mockWithdrawals: HarborWithdrawal[] = [
  {
    withdrawalId: 'wd-001',
    accountId: 'acc-123',
    clientId: 'client-456',
    clientName: 'John Doe',
    requestAmount: 5000.00,
    requestDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    status: 'PENDING_LIQUIDATION',
    brokerageAccountNumber: 'BR-789',
    brokerageId: 'broker-001',
    goalId: 'goal-123',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    withdrawalId: 'wd-002',
    accountId: 'acc-124',
    clientId: 'client-457',
    clientName: 'Jane Smith',
    requestAmount: 10000.00,
    requestDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    status: 'CREATED',
    brokerageAccountNumber: 'BR-790',
    brokerageId: 'broker-001',
    goalId: 'goal-124',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    withdrawalId: 'wd-003',
    accountId: 'acc-125',
    clientId: 'client-458',
    clientName: 'Bob Johnson',
    requestAmount: 2500.00,
    requestDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago - exception
    status: 'FAILED',
    brokerageAccountNumber: 'BR-791',
    brokerageId: 'broker-001',
    goalId: 'goal-125',
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const mockTransactions: Record<string, HarborTransaction[]> = {
  'acc-123': [
    {
      transactionId: 'txn-001',
      accountId: 'acc-123',
      amount: 10000.00,
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      transactionCode: 'CR',
      description: 'Cash Received - Deposit',
      type: 'deposit',
    },
    {
      transactionId: 'txn-002',
      accountId: 'acc-123',
      amount: -2000.00,
      date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      transactionCode: 'BUY',
      description: 'Securities Purchased',
      type: 'purchase',
    },
    {
      transactionId: 'txn-003',
      accountId: 'acc-123',
      amount: 3000.00,
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      transactionCode: 'SEL',
      description: 'Shares Sold',
      type: 'sale',
      relatedWithdrawalId: 'wd-001',
    },
  ],
};

/**
 * GET /api/withdrawals
 * Get list of withdrawals with filtering and search
 */
router.get('/api/withdrawals', (req, res) => {
  try {
    const { status, search, page = '1', limit = '50' } = req.query;
    
    let filtered = [...mockWithdrawals];
    
    // Filter by status
    if (status && typeof status === 'string') {
      filtered = filtered.filter(w => w.status === status);
    }
    
    // Search by account ID, client ID, or client name
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(w =>
        w.accountId.toLowerCase().includes(searchLower) ||
        w.clientId.toLowerCase().includes(searchLower) ||
        w.clientName.toLowerCase().includes(searchLower)
      );
    }
    
    // Calculate age in days
    const now = new Date();
    const withdrawalsWithAge = filtered.map(w => {
      const requestDate = new Date(w.requestDate);
      const ageInDays = Math.floor((now.getTime() - requestDate.getTime()) / (1000 * 60 * 60 * 24));
      return {
        ...w,
        ageInDays,
        isException: ageInDays > 6,
      };
    });
    
    // Pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const start = (pageNum - 1) * limitNum;
    const end = start + limitNum;
    const paginated = withdrawalsWithAge.slice(start, end);
    
    res.json({
      withdrawals: paginated,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: withdrawalsWithAge.length,
        totalPages: Math.ceil(withdrawalsWithAge.length / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch withdrawals', message: (error as Error).message });
  }
});

/**
 * GET /api/withdrawals/:withdrawalId
 * Get withdrawal details
 */
router.get('/api/withdrawals/:withdrawalId', (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const withdrawal = mockWithdrawals.find(w => w.withdrawalId === withdrawalId);
    
    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }
    
    // Calculate age
    const now = new Date();
    const requestDate = new Date(withdrawal.requestDate);
    const ageInDays = Math.floor((now.getTime() - requestDate.getTime()) / (1000 * 60 * 60 * 24));
    
    res.json({
      ...withdrawal,
      ageInDays,
      isException: ageInDays > 6,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch withdrawal', message: (error as Error).message });
  }
});

/**
 * GET /api/withdrawals/:withdrawalId/account-activity
 * Get account activity/transactions for a withdrawal
 */
router.get('/api/withdrawals/:withdrawalId/account-activity', (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const withdrawal = mockWithdrawals.find(w => w.withdrawalId === withdrawalId);
    
    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }
    
    const transactions = mockTransactions[withdrawal.accountId] || [];
    
    // Apply date range filter if provided
    const { startDate, endDate } = req.query;
    let filtered = transactions;
    
    if (startDate) {
      const start = new Date(startDate as string);
      filtered = filtered.filter(t => new Date(t.date) >= start);
    }
    
    if (endDate) {
      const end = new Date(endDate as string);
      filtered = filtered.filter(t => new Date(t.date) <= end);
    }
    
    res.json({
      transactions: filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch account activity', message: (error as Error).message });
  }
});

/**
 * GET /api/withdrawals/:withdrawalId/seasoned-cash
 * Get seasoned cash calculation for a withdrawal
 */
router.get('/api/withdrawals/:withdrawalId/seasoned-cash', (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const withdrawal = mockWithdrawals.find(w => w.withdrawalId === withdrawalId);
    
    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }
    
    const transactions = mockTransactions[withdrawal.accountId] || [];
    
    // Convert Harbor transactions to format expected by calculateSeasonedCash
    const transactionsForCalculation = transactions.map(txn => ({
      amount: txn.amount,
      date: new Date(txn.date),
      transactionId: txn.transactionId,
      transactionCode: txn.transactionCode,
    }));
    
    const seasonedCashResult = calculateSeasonedCash(transactionsForCalculation);
    
    res.json({
      accountId: withdrawal.accountId,
      ...seasonedCashResult,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate seasoned cash', message: (error as Error).message });
  }
});

/**
 * POST /api/withdrawals/:withdrawalId/cancel
 * Cancel a withdrawal (admin-only)
 */
router.post('/api/withdrawals/:withdrawalId/cancel', (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const { notes } = req.body;
    
    if (!notes || typeof notes !== 'string' || notes.trim().length === 0) {
      return res.status(400).json({ error: 'Notes are required for cancellation' });
    }
    
    const withdrawal = mockWithdrawals.find(w => w.withdrawalId === withdrawalId);
    
    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }
    
    // In real implementation, update via Harbor API
    withdrawal.status = 'CANCELLED';
    withdrawal.notes = notes;
    withdrawal.updatedAt = new Date().toISOString();
    
    res.json({
      withdrawal,
      message: 'Withdrawal cancelled successfully',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel withdrawal', message: (error as Error).message });
  }
});

/**
 * POST /api/withdrawals/:withdrawalId/reprocess
 * Reprocess a withdrawal request (admin-only)
 */
router.post('/api/withdrawals/:withdrawalId/reprocess', (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const { notes } = req.body;
    
    if (!notes || typeof notes !== 'string' || notes.trim().length === 0) {
      return res.status(400).json({ error: 'Notes are required for reprocessing' });
    }
    
    const withdrawal = mockWithdrawals.find(w => w.withdrawalId === withdrawalId);
    
    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }
    
    // In real implementation, create new withdrawal via Harbor API
    const newWithdrawal: HarborWithdrawal = {
      ...withdrawal,
      withdrawalId: `wd-${Date.now()}`,
      status: 'PENDING',
      notes: notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    res.json({
      withdrawal: newWithdrawal,
      message: 'Withdrawal reprocessed successfully',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reprocess withdrawal', message: (error as Error).message });
  }
});

export default router;
