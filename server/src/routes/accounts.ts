import express, { Router } from 'express';
import { getMockBalance, getMockTransactions, getMockPositions, getMockAccountOverview } from '../utils/mockData';
import { calculateSeasonedCash } from '../utils/seasonedCash';

const router = Router();

// GET /api/accounts/:accountId/balance - Get account balance with seasoned cash
router.get('/:accountId/balance', async (req, res) => {
  try {
    const { accountId } = req.params;
    const balance = getMockBalance(accountId);
    const transactions = getMockTransactions(accountId);

    // Calculate seasoned cash
    const seasonedCash = calculateSeasonedCash(
      balance,
      transactions.map((tx) => ({ date: tx.date, amount: tx.amount }))
    );

    res.json({
      ...balance,
      ...seasonedCash,
    });
  } catch (error) {
    console.error('Error fetching account balance:', error);
    res.status(500).json({ error: 'Failed to fetch account balance' });
  }
});

// GET /api/accounts/:accountId/overview - Get full account overview with positions
router.get('/:accountId/overview', async (req, res) => {
  try {
    const { accountId } = req.params;
    const overview = getMockAccountOverview(accountId);
    res.json(overview);
  } catch (error) {
    console.error('Error fetching account overview:', error);
    res.status(500).json({ error: 'Failed to fetch account overview' });
  }
});

// GET /api/accounts/:accountId/positions - Get open positions
router.get('/:accountId/positions', async (req, res) => {
  try {
    const { accountId } = req.params;
    const positions = getMockPositions(accountId);
    res.json(positions);
  } catch (error) {
    console.error('Error fetching account positions:', error);
    res.status(500).json({ error: 'Failed to fetch account positions' });
  }
});

// GET /api/accounts/:accountId/transactions - Get account transactions
router.get('/:accountId/transactions', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { startDate, endDate } = req.query;

    let transactions = getMockTransactions(accountId);

    // Filter by date range if provided
    if (startDate) {
      transactions = transactions.filter((tx) => tx.date >= (startDate as string));
    }
    if (endDate) {
      transactions = transactions.filter((tx) => tx.date <= (endDate as string));
    }

    // Sort by date descending (newest first)
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json(transactions);
  } catch (error) {
    console.error('Error fetching account transactions:', error);
    res.status(500).json({ error: 'Failed to fetch account transactions' });
  }
});

export default router;
