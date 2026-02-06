import express, { Router } from 'express';
import {
  mockWithdrawals,
  mockUsers,
  getMockWithdrawal,
  getMockBalance,
  getMockTransactions,
  calculateDaysPending,
} from '../utils/mockData';
import {
  convertHarborWithdrawalToUIFormat,
  convertPaymentInstructionToWithdrawal,
} from '../utils/harborConverters';
import { calculateSeasonedCash } from '../utils/seasonedCash';
import { getHarborClient } from '../harbor';
// import { authenticate } from '../middleware/auth';
// import { requireAdmin } from '../middleware/rbac';

const router = Router();

// Feature flag for Harbor API
const USE_HARBOR_API = process.env.USE_HARBOR_API === 'true';

// GET /api/withdrawals - List withdrawals with filters
router.get('/', async (req, res) => {
  try {
    const {
      status,
      accountId,
      clientId,
      search,
      startDate,
      endDate,
      reconciliationStatus,
      withdrawalType,
      minDaysPending,
      maxDaysPending,
    } = req.query;

    if (USE_HARBOR_API && accountId) {
      // Use Harbor API - fetch payment instructions
      const harborClient = getHarborClient();

      // Calculate date range (default to last 30 days if not provided)
      const end = endDate
        ? new Date(endDate as string)
        : new Date();
      const start = startDate
        ? new Date(startDate as string)
        : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

      const paymentInstructions = await harborClient.getPaymentInstructions(
        accountId as string,
        start.toISOString().split('T')[0], // YYYY-MM-DD
        end.toISOString().split('T')[0] // YYYY-MM-DD
      );

      // Convert to UI format
      let uiWithdrawals = paymentInstructions.map(convertPaymentInstructionToWithdrawal);

      // Apply filters
      if (status && status !== 'all') {
        uiWithdrawals = uiWithdrawals.filter((w) => w.status === status);
      }
      if (reconciliationStatus) {
        uiWithdrawals = uiWithdrawals.filter(
          (w) => w.reconciliationStatus === reconciliationStatus
        );
      }
      if (withdrawalType) {
        uiWithdrawals = uiWithdrawals.filter((w) => w.withdrawalType === withdrawalType);
      }
      if (minDaysPending) {
        const minDays = Number(minDaysPending);
        uiWithdrawals = uiWithdrawals.filter((w) => w.daysPending >= minDays);
      }
      if (maxDaysPending) {
        const maxDays = Number(maxDaysPending);
        uiWithdrawals = uiWithdrawals.filter((w) => w.daysPending <= maxDays);
      }

      return res.json(uiWithdrawals);
    }

    // Use mock data
    let filtered = [...mockWithdrawals];

    // Filter by status
    if (status && status !== 'all') {
      filtered = filtered.filter((w) => w.status === status);
    }

    // Filter by account ID
    if (accountId) {
      filtered = filtered.filter((w) => w.accountId === accountId);
    }

    // Filter by client ID
    if (clientId) {
      filtered = filtered.filter((w) => w.clientId === clientId);
    }

    // Search by account ID, client ID, or client name
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filtered = filtered.filter(
        (w) =>
          w.accountId.toLowerCase().includes(searchLower) ||
          w.clientId.toLowerCase().includes(searchLower) ||
          w.clientName.toLowerCase().includes(searchLower)
      );
    }

    // Convert to UI format
    let uiWithdrawals = filtered.map(convertHarborWithdrawalToUIFormat);

    if (reconciliationStatus) {
      uiWithdrawals = uiWithdrawals.filter(
        (w) => w.reconciliationStatus === reconciliationStatus
      );
    }
    if (withdrawalType) {
      uiWithdrawals = uiWithdrawals.filter((w) => w.withdrawalType === withdrawalType);
    }
    if (minDaysPending) {
      const minDays = Number(minDaysPending);
      uiWithdrawals = uiWithdrawals.filter((w) => w.daysPending >= minDays);
    }
    if (maxDaysPending) {
      const maxDays = Number(maxDaysPending);
      uiWithdrawals = uiWithdrawals.filter((w) => w.daysPending <= maxDays);
    }

    res.json(uiWithdrawals);
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    res.status(500).json({ error: 'Failed to fetch withdrawals' });
  }
});

// GET /api/withdrawals/aged - List withdrawals older than threshold
router.get('/aged', async (req, res) => {
  try {
    const thresholdDays = Number(req.query.thresholdDays || 6);
    const uiWithdrawals = mockWithdrawals.map(convertHarborWithdrawalToUIFormat);
    const aged = uiWithdrawals.filter((w) => w.daysPending > thresholdDays);
    res.json(aged);
  } catch (error) {
    console.error('Error fetching aged withdrawals:', error);
    res.status(500).json({ error: 'Failed to fetch aged withdrawals' });
  }
});

// GET /api/withdrawals/aged - Get aged withdrawals (> X days, not cancelled/reconciled)
router.get('/aged', async (req, res) => {
  try {
    const thresholdDays = parseInt(req.query.thresholdDays as string) || 6;

    // Use mock data - filter for aged withdrawals
    const agedWithdrawals = mockWithdrawals
      .map(convertHarborWithdrawalToUIFormat)
      .filter((w) => {
        // Exclude cancelled and completed/reconciled withdrawals
        const excludedStatuses = ['CANCELLED', 'COMPLETED', 'RECONCILED'];
        const isNotExcluded = !excludedStatuses.includes(w.status.toUpperCase());
        // Only include withdrawals older than threshold
        const isAged = w.daysPending > thresholdDays;
        return isNotExcluded && isAged;
      })
      // Sort by days pending descending (oldest first)
      .sort((a, b) => b.daysPending - a.daysPending);

    res.json(agedWithdrawals);
  } catch (error) {
    console.error('Error fetching aged withdrawals:', error);
    res.status(500).json({ error: 'Failed to fetch aged withdrawals' });
  }
});

// POST /api/withdrawals/create - Create new withdrawal request (admin-only)
router.post('/create', async (req, res) => {
  try {
    const { clientId, amount, fundingAccount, notes } = req.body;

    if (!clientId || typeof clientId !== 'string') {
      return res.status(400).json({ error: 'Client ID is required' });
    }
    if (!fundingAccount || typeof fundingAccount !== 'string') {
      return res.status(400).json({ error: 'Funding account is required' });
    }
    if (typeof amount !== 'number' || Number.isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }
    if (!notes || typeof notes !== 'string' || notes.trim().length === 0) {
      return res.status(400).json({ error: 'Notes are required' });
    }

    const user = mockUsers.find((u) => u.id === clientId);
    if (!user) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const timestamp = new Date().toISOString();
    const newWithdrawalId = `WD-${Date.now()}`;
    const newWithdrawal = {
      id: newWithdrawalId,
      accountId: fundingAccount.trim(),
      clientId,
      clientName: user.displayName || 'Unknown Client',
      amount,
      status: 'PENDING_LIQUIDATION' as const,
      requestDate: timestamp,
      requestedAmount: amount,
      actualAmount: amount,
      withdrawalType: 'FULL' as const,
      reconciliationStatus: 'UNMATCHED' as const,
      achTransferBatchId: null,
      brokerageAccountNumber: user.brokerageAccountNumber,
      brokerageId: user.brokerageId,
      goalId: user.goalId,
      createdAt: timestamp,
      updatedAt: timestamp,
      auditLog: [
        {
          id: `AUDIT-${Date.now()}-create`,
          action: 'REPROCESS' as const,
          performedBy: 'Admin User',
          notes: `CREATED WITHDRAWAL: ${notes.trim()}`,
          timestamp,
          previousStatus: undefined,
          newStatus: 'PENDING_LIQUIDATION',
        },
      ],
    };

    mockWithdrawals.push(newWithdrawal);

    return res.json({
      success: true,
      message: 'Withdrawal created successfully',
      newWithdrawal: convertHarborWithdrawalToUIFormat(newWithdrawal),
    });
  } catch (error) {
    console.error('Error creating withdrawal:', error);
    return res.status(500).json({ error: 'Failed to create withdrawal' });
  }
});

// GET /api/withdrawals/:withdrawalId - Get withdrawal details
router.get('/:withdrawalId', async (req, res) => {
  try {
    const { withdrawalId } = req.params;

    if (USE_HARBOR_API) {
      // Use Harbor API - fetch payment instruction
      const harborClient = getHarborClient();
      const paymentInstruction = await harborClient.getPaymentInstruction(withdrawalId);
      const uiWithdrawal = convertPaymentInstructionToWithdrawal(paymentInstruction);
      return res.json(uiWithdrawal);
    }

    // Use mock data
    const withdrawal = getMockWithdrawal(withdrawalId);

    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }

    const uiWithdrawal = convertHarborWithdrawalToUIFormat(withdrawal);
    res.json(uiWithdrawal);
  } catch (error) {
    console.error('Error fetching withdrawal details:', error);
    res.status(500).json({ error: 'Failed to fetch withdrawal details' });
  }
});

// GET /api/withdrawals/:withdrawalId/account-activity - Get account activity
router.get('/:withdrawalId/account-activity', async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const withdrawal = getMockWithdrawal(withdrawalId);

    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }

    const transactions = getMockTransactions(withdrawal.accountId);
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching account activity:', error);
    res.status(500).json({ error: 'Failed to fetch account activity' });
  }
});

// GET /api/withdrawals/:withdrawalId/seasoned-cash - Get seasoned cash info
router.get('/:withdrawalId/seasoned-cash', async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const withdrawal = getMockWithdrawal(withdrawalId);

    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }

    const balance = getMockBalance(withdrawal.accountId);
    const transactions = getMockTransactions(withdrawal.accountId);

    // Calculate seasoned cash
    const seasonedCash = calculateSeasonedCash(
      balance,
      transactions.map((tx) => ({ date: tx.date, amount: tx.amount }))
    );

    res.json(seasonedCash);
  } catch (error) {
    console.error('Error calculating seasoned cash:', error);
    res.status(500).json({ error: 'Failed to calculate seasoned cash' });
  }
});

// POST /api/withdrawals/:withdrawalId/cancel - Cancel withdrawal (admin-only)
// NOTE: Harbor Payment Instructions API does not currently support cancel operations
router.post('/:withdrawalId/cancel', async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const { notes } = req.body;

    if (!notes || notes.trim().length === 0) {
      return res.status(400).json({ error: 'Notes are required' });
    }

    const withdrawalIndex = mockWithdrawals.findIndex((w) => w.id === withdrawalId);
    if (withdrawalIndex === -1) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }

    const withdrawal = mockWithdrawals[withdrawalIndex];
    const previousStatus = withdrawal.status;

    // Create audit entry
    const auditEntry = {
      id: `AUDIT-${Date.now()}`,
      action: 'CANCEL' as const,
      performedBy: 'Admin User',
      notes: notes.trim(),
      timestamp: new Date().toISOString(),
      previousStatus,
      newStatus: 'CANCELLED',
    };

    // Update the mock withdrawal in place
    mockWithdrawals[withdrawalIndex] = {
      ...withdrawal,
      status: 'CANCELLED' as const,
      updatedAt: new Date().toISOString(),
      auditLog: [...(withdrawal.auditLog || []), auditEntry],
    };

    res.json({
      success: true,
      message: 'Withdrawal cancelled successfully',
      withdrawal: convertHarborWithdrawalToUIFormat(mockWithdrawals[withdrawalIndex]),
    });
  } catch (error) {
    console.error('Error cancelling withdrawal:', error);
    res.status(500).json({ error: 'Failed to cancel withdrawal' });
  }
});

// POST /api/withdrawals/:withdrawalId/reprocess - Reprocess withdrawal (admin-only)
// NOTE: Harbor Payment Instructions API does not currently support reprocess operations
router.post('/:withdrawalId/reprocess', async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const { notes, amount, fundingAccount } = req.body;

    if (!notes || notes.trim().length === 0) {
      return res.status(400).json({ error: 'Notes are required' });
    }

    const withdrawalIndex = mockWithdrawals.findIndex((w) => w.id === withdrawalId);
    if (withdrawalIndex === -1) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }

    const withdrawal = mockWithdrawals[withdrawalIndex];
    const newWithdrawalId = `WD-${Date.now()}`;
    const timestamp = new Date().toISOString();

    // Create audit entry for original withdrawal
    const originalAuditEntry = {
      id: `AUDIT-${Date.now()}-orig`,
      action: 'REPROCESS' as const,
      performedBy: 'Admin User',
      notes: notes.trim(),
      timestamp,
      previousStatus: withdrawal.status,
      newStatus: 'REPROCESSED',
    };

    // Update original withdrawal to mark as reprocessed
    mockWithdrawals[withdrawalIndex] = {
      ...withdrawal,
      updatedAt: timestamp,
      reprocessedToId: newWithdrawalId,
      auditLog: [...(withdrawal.auditLog || []), originalAuditEntry],
    };

    // Create new withdrawal with link to original
    const parsedAmount = typeof amount === 'number' && !Number.isNaN(amount) ? amount : withdrawal.amount;
    const newAccountId =
      typeof fundingAccount === 'string' && fundingAccount.trim().length > 0
        ? fundingAccount.trim()
        : withdrawal.accountId;

    const newWithdrawal = {
      ...withdrawal,
      id: newWithdrawalId,
      status: 'PENDING_LIQUIDATION' as const,
      requestDate: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
      amount: parsedAmount,
      requestedAmount: parsedAmount,
      accountId: newAccountId,
      reprocessedFromId: withdrawalId,
      reprocessedToId: undefined,
      auditLog: [
        {
          id: `AUDIT-${Date.now()}-new`,
          action: 'REPROCESS' as const,
          performedBy: 'Admin User',
          notes: `Created from reprocess of ${withdrawalId}. Original note: ${notes.trim()}`,
          timestamp,
          previousStatus: undefined,
          newStatus: 'PENDING_LIQUIDATION',
        },
      ],
    };

    // Add new withdrawal to mock data
    mockWithdrawals.push(newWithdrawal);

    res.json({
      success: true,
      message: 'Withdrawal reprocessed successfully',
      originalWithdrawal: convertHarborWithdrawalToUIFormat(mockWithdrawals[withdrawalIndex]),
      newWithdrawal: convertHarborWithdrawalToUIFormat(newWithdrawal),
    });
  } catch (error) {
    console.error('Error reprocessing withdrawal:', error);
    res.status(500).json({ error: 'Failed to reprocess withdrawal' });
  }
});

// POST /api/withdrawals/:withdrawalId/skip-liquidation - Bypass liquidation for ACH transfers
// This endpoint allows admin/ops to bypass the liquidation engine when cash is already available
// NOTE: This is a mock implementation - actual Harbor API integration would be needed
router.post('/:withdrawalId/skip-liquidation', async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const { notes } = req.body;

    if (!notes || notes.trim().length === 0) {
      return res.status(400).json({ error: 'Notes are required' });
    }

    const withdrawalIndex = mockWithdrawals.findIndex((w) => w.id === withdrawalId);
    if (withdrawalIndex === -1) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }

    const withdrawal = mockWithdrawals[withdrawalIndex];

    // Validate: Only ACH transfers can skip liquidation
    if (withdrawal.transferType && withdrawal.transferType !== 'ACH') {
      return res.status(400).json({
        error: 'Skip liquidation is only available for ACH transfers',
      });
    }

    // Validate: Only withdrawals in PENDING_LIQUIDATION status can skip
    const validStatuses = ['Liquidation_pending', 'PENDING_LIQUIDATION'];
    if (!validStatuses.includes(withdrawal.status)) {
      return res.status(400).json({
        error: `Cannot skip liquidation for withdrawal in ${withdrawal.status} status. Only pending liquidation withdrawals can skip.`,
      });
    }

    const previousStatus = withdrawal.status;
    const timestamp = new Date().toISOString();

    // Create audit entry
    const auditEntry = {
      id: `AUDIT-${Date.now()}`,
      action: 'SKIP_LIQUIDATION' as const,
      performedBy: 'Admin User',
      notes: `LIQUIDATION SKIPPED: ${notes.trim()}`,
      timestamp,
      previousStatus,
      newStatus: 'TRANSFER_CREATED',
    };

    // Update the mock withdrawal in place
    mockWithdrawals[withdrawalIndex] = {
      ...withdrawal,
      status: 'TRANSFER_CREATED' as const,
      achTransferBatchId: `ACH-BATCH-${Date.now()}`,
      updatedAt: timestamp,
      liquidationSkipped: true,
      auditLog: [...(withdrawal.auditLog || []), auditEntry],
    };

    res.json({
      success: true,
      message: 'Liquidation bypassed successfully. Withdrawal moved to Transfer Created status.',
      withdrawal: convertHarborWithdrawalToUIFormat(mockWithdrawals[withdrawalIndex]),
    });
  } catch (error) {
    console.error('Error skipping liquidation:', error);
    res.status(500).json({ error: 'Failed to skip liquidation' });
  }
});

export default router;
