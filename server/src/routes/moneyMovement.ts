import { Router } from 'express';

const router = Router();

// Mock data for transactions
const mockTransactions = [
  {
    id: 'TX-MM-001',
    amount: 5000,
    type: 'credit',
    effectiveDate: '2026-01-30',
    postingDate: '2026-01-30',
    sourceAccount: 'ACC-12345',
    destinationAccount: 'ACC-MAIN',
    status: 'matched',
    description: 'ACH Deposit - John Doe',
    referenceNumber: 'REF-20260130-001',
    achBatchId: 'BATCH-001',
  },
  {
    id: 'TX-MM-002',
    amount: 12000,
    type: 'debit',
    effectiveDate: '2026-01-30',
    postingDate: '2026-01-30',
    sourceAccount: 'ACC-MAIN',
    destinationAccount: 'ACC-23456',
    status: 'matched',
    description: 'ACH Withdrawal - Jane Smith',
    referenceNumber: 'REF-20260130-002',
    achBatchId: 'BATCH-001',
  },
  {
    id: 'TX-MM-003',
    amount: 7500,
    type: 'credit',
    effectiveDate: '2026-01-29',
    postingDate: '2026-01-29',
    sourceAccount: 'ACC-34567',
    destinationAccount: 'ACC-MAIN',
    status: 'unmatched',
    description: 'ACH Deposit - Robert Johnson',
    referenceNumber: 'REF-20260129-001',
    achBatchId: 'BATCH-002',
  },
  {
    id: 'TX-MM-004',
    amount: 3000,
    type: 'debit',
    effectiveDate: '2026-01-29',
    postingDate: '2026-01-29',
    sourceAccount: 'ACC-MAIN',
    destinationAccount: 'ACC-45678',
    status: 'exception',
    description: 'ACH Withdrawal - NSF',
    referenceNumber: 'REF-20260129-002',
    achBatchId: 'BATCH-002',
  },
  {
    id: 'TX-MM-005',
    amount: 8500,
    type: 'credit',
    effectiveDate: '2026-01-28',
    postingDate: '2026-01-28',
    sourceAccount: 'ACC-56789',
    destinationAccount: 'ACC-MAIN',
    status: 'matched',
    description: 'ACH Deposit - Michael Brown',
    referenceNumber: 'REF-20260128-001',
    achBatchId: 'BATCH-003',
  },
  {
    id: 'TX-MM-006',
    amount: 15000,
    type: 'debit',
    effectiveDate: '2026-01-28',
    postingDate: '2026-01-28',
    sourceAccount: 'ACC-MAIN',
    destinationAccount: 'ACC-67890',
    status: 'matched',
    description: 'ACH Withdrawal - Sarah Wilson',
    referenceNumber: 'REF-20260128-002',
    achBatchId: 'BATCH-003',
  },
  {
    id: 'TX-MM-007',
    amount: 6000,
    type: 'credit',
    effectiveDate: '2026-01-27',
    postingDate: '2026-01-27',
    sourceAccount: 'ACC-78901',
    destinationAccount: 'ACC-MAIN',
    status: 'unmatched',
    description: 'ACH Deposit - David Martinez',
    referenceNumber: 'REF-20260127-001',
    achBatchId: 'BATCH-004',
  },
  {
    id: 'TX-MM-008',
    amount: 4500,
    type: 'debit',
    effectiveDate: '2026-01-27',
    postingDate: '2026-01-27',
    sourceAccount: 'ACC-MAIN',
    destinationAccount: 'ACC-89012',
    status: 'matched',
    description: 'ACH Withdrawal - Lisa Anderson',
    referenceNumber: 'REF-20260127-002',
    achBatchId: 'BATCH-004',
  },
];

// Mock daily balances
const mockBalances = [
  {
    date: '2026-01-30',
    openingBalance: 1250000,
    closingBalance: 1243000,
    deposits: 17000,
    withdrawals: 24000,
    netChange: -7000,
  },
  {
    date: '2026-01-29',
    openingBalance: 1255500,
    closingBalance: 1250000,
    deposits: 7500,
    withdrawals: 13000,
    netChange: -5500,
  },
  {
    date: '2026-01-28',
    openingBalance: 1262000,
    closingBalance: 1255500,
    deposits: 8500,
    withdrawals: 15000,
    netChange: -6500,
  },
  {
    date: '2026-01-27',
    openingBalance: 1260500,
    closingBalance: 1262000,
    deposits: 6000,
    withdrawals: 4500,
    netChange: 1500,
  },
  {
    date: '2026-01-26',
    openingBalance: 1245000,
    closingBalance: 1260500,
    deposits: 22500,
    withdrawals: 7000,
    netChange: 15500,
  },
  {
    date: '2026-01-25',
    openingBalance: 1230000,
    closingBalance: 1245000,
    deposits: 18000,
    withdrawals: 3000,
    netChange: 15000,
  },
  {
    date: '2026-01-24',
    openingBalance: 1215500,
    closingBalance: 1230000,
    deposits: 25000,
    withdrawals: 10500,
    netChange: 14500,
  },
];

// GET /api/money-movement/stats - Get money movement statistics
router.get('/stats', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const todayTransactions = mockTransactions.filter((tx) => tx.effectiveDate === today);

    const stats = {
      totalTransactionsToday: todayTransactions.length,
      totalCreditsToday: todayTransactions
        .filter((tx) => tx.type === 'credit')
        .reduce((sum, tx) => sum + tx.amount, 0),
      totalDebitsToday: todayTransactions
        .filter((tx) => tx.type === 'debit')
        .reduce((sum, tx) => sum + tx.amount, 0),
      netChangeToday:
        todayTransactions
          .filter((tx) => tx.type === 'credit')
          .reduce((sum, tx) => sum + tx.amount, 0) -
        todayTransactions
          .filter((tx) => tx.type === 'debit')
          .reduce((sum, tx) => sum + tx.amount, 0),
      matchedCount: mockTransactions.filter((tx) => tx.status === 'matched').length,
      unmatchedCount: mockTransactions.filter((tx) => tx.status === 'unmatched').length,
      exceptionCount: mockTransactions.filter((tx) => tx.status === 'exception').length,
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching money movement stats:', error);
    res.status(500).json({ error: 'Failed to fetch money movement stats' });
  }
});

// GET /api/money-movement/transactions - List transactions
router.get('/transactions', async (req, res) => {
  try {
    const { status, type, startDate, endDate, accountId } = req.query;

    let filtered = [...mockTransactions];

    if (status && status !== 'all') {
      filtered = filtered.filter((tx) => tx.status === status);
    }

    if (type && type !== 'all') {
      filtered = filtered.filter((tx) => tx.type === type);
    }

    if (startDate) {
      filtered = filtered.filter((tx) => tx.effectiveDate >= (startDate as string));
    }

    if (endDate) {
      filtered = filtered.filter((tx) => tx.effectiveDate <= (endDate as string));
    }

    if (accountId) {
      filtered = filtered.filter(
        (tx) =>
          tx.sourceAccount === accountId || tx.destinationAccount === accountId
      );
    }

    // Sort by date descending
    filtered.sort(
      (a, b) =>
        new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime()
    );

    res.json(filtered);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// GET /api/money-movement/transactions/export - Export transactions as CSV
router.get('/transactions/export', async (req, res) => {
  try {
    const { status, type, startDate, endDate, accountId } = req.query;

    let filtered = [...mockTransactions];

    if (status && status !== 'all') {
      filtered = filtered.filter((tx) => tx.status === status);
    }

    if (type && type !== 'all') {
      filtered = filtered.filter((tx) => tx.type === type);
    }

    if (startDate) {
      filtered = filtered.filter((tx) => tx.effectiveDate >= (startDate as string));
    }

    if (endDate) {
      filtered = filtered.filter((tx) => tx.effectiveDate <= (endDate as string));
    }

    if (accountId) {
      filtered = filtered.filter(
        (tx) =>
          tx.sourceAccount === accountId || tx.destinationAccount === accountId
      );
    }

    // Generate CSV
    const headers = [
      'ID',
      'Amount',
      'Type',
      'Effective Date',
      'Posting Date',
      'Source Account',
      'Destination Account',
      'Status',
      'Description',
      'Reference Number',
      'ACH Batch ID',
    ];

    const rows = filtered.map((tx) => [
      tx.id,
      tx.amount,
      tx.type,
      tx.effectiveDate,
      tx.postingDate,
      tx.sourceAccount,
      tx.destinationAccount,
      tx.status,
      `"${tx.description}"`,
      tx.referenceNumber,
      tx.achBatchId || '',
    ]);

    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="transactions-${new Date().toISOString().split('T')[0]}.csv"`
    );
    res.send(csv);
  } catch (error) {
    console.error('Error exporting transactions:', error);
    res.status(500).json({ error: 'Failed to export transactions' });
  }
});

// GET /api/money-movement/balances - List daily balances
router.get('/balances', async (req, res) => {
  try {
    const { accountId, startDate, endDate, limit } = req.query;

    let filtered = [...mockBalances];

    if (startDate) {
      filtered = filtered.filter((b) => b.date >= (startDate as string));
    }

    if (endDate) {
      filtered = filtered.filter((b) => b.date <= (endDate as string));
    }

    // Sort by date descending
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (limit) {
      filtered = filtered.slice(0, parseInt(limit as string, 10));
    }

    res.json(filtered);
  } catch (error) {
    console.error('Error fetching balances:', error);
    res.status(500).json({ error: 'Failed to fetch balances' });
  }
});

// GET /api/money-movement/balances/export - Export balances as CSV
router.get('/balances/export', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let filtered = [...mockBalances];

    if (startDate) {
      filtered = filtered.filter((b) => b.date >= (startDate as string));
    }

    if (endDate) {
      filtered = filtered.filter((b) => b.date <= (endDate as string));
    }

    // Generate CSV
    const headers = [
      'Date',
      'Opening Balance',
      'Closing Balance',
      'Deposits',
      'Withdrawals',
      'Net Change',
    ];

    const rows = filtered.map((b) => [
      b.date,
      b.openingBalance,
      b.closingBalance,
      b.deposits,
      b.withdrawals,
      b.netChange,
    ]);

    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="balances-${new Date().toISOString().split('T')[0]}.csv"`
    );
    res.send(csv);
  } catch (error) {
    console.error('Error exporting balances:', error);
    res.status(500).json({ error: 'Failed to export balances' });
  }
});

// GET /api/money-movement/reconciliation/export - Export reconciliation report as CSV
router.get('/reconciliation/export', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let filtered = [...mockTransactions];

    if (startDate) {
      filtered = filtered.filter((tx) => tx.effectiveDate >= (startDate as string));
    }

    if (endDate) {
      filtered = filtered.filter((tx) => tx.effectiveDate <= (endDate as string));
    }

    // Group by status
    const matched = filtered.filter((tx) => tx.status === 'matched');
    const unmatched = filtered.filter((tx) => tx.status === 'unmatched');
    const exceptions = filtered.filter((tx) => tx.status === 'exception');

    // Generate summary CSV
    const lines = [
      'Reconciliation Report',
      `Date Range: ${startDate || 'All'} to ${endDate || 'All'}`,
      '',
      'Summary',
      `Total Transactions,${filtered.length}`,
      `Matched,${matched.length}`,
      `Unmatched,${unmatched.length}`,
      `Exceptions,${exceptions.length}`,
      '',
      'Matched Transactions',
      'ID,Amount,Type,Date,Description',
      ...matched.map(
        (tx) => `${tx.id},${tx.amount},${tx.type},${tx.effectiveDate},"${tx.description}"`
      ),
      '',
      'Unmatched Transactions',
      'ID,Amount,Type,Date,Description',
      ...unmatched.map(
        (tx) => `${tx.id},${tx.amount},${tx.type},${tx.effectiveDate},"${tx.description}"`
      ),
      '',
      'Exception Transactions',
      'ID,Amount,Type,Date,Description',
      ...exceptions.map(
        (tx) => `${tx.id},${tx.amount},${tx.type},${tx.effectiveDate},"${tx.description}"`
      ),
    ];

    const csv = lines.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="reconciliation-${new Date().toISOString().split('T')[0]}.csv"`
    );
    res.send(csv);
  } catch (error) {
    console.error('Error exporting reconciliation report:', error);
    res.status(500).json({ error: 'Failed to export reconciliation report' });
  }
});

// GET /api/money-movement/exceptions/export - Export exceptions report as CSV
router.get('/exceptions/export', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let filtered = mockTransactions.filter((tx) => tx.status === 'exception');

    if (startDate) {
      filtered = filtered.filter((tx) => tx.effectiveDate >= (startDate as string));
    }

    if (endDate) {
      filtered = filtered.filter((tx) => tx.effectiveDate <= (endDate as string));
    }

    // Generate CSV
    const headers = [
      'ID',
      'Amount',
      'Type',
      'Effective Date',
      'Posting Date',
      'Source Account',
      'Destination Account',
      'Description',
      'Reference Number',
      'ACH Batch ID',
    ];

    const rows = filtered.map((tx) => [
      tx.id,
      tx.amount,
      tx.type,
      tx.effectiveDate,
      tx.postingDate,
      tx.sourceAccount,
      tx.destinationAccount,
      `"${tx.description}"`,
      tx.referenceNumber,
      tx.achBatchId || '',
    ]);

    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="exceptions-${new Date().toISOString().split('T')[0]}.csv"`
    );
    res.send(csv);
  } catch (error) {
    console.error('Error exporting exceptions report:', error);
    res.status(500).json({ error: 'Failed to export exceptions report' });
  }
});

export default router;
