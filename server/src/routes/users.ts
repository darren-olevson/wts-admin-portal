import express, { Router } from 'express';
import { mockWithdrawals, mockUsers, mockUserDocuments } from '../utils/mockData';
import { getHarborClient } from '../harbor';
import {
  convertHarborClientToUser,
  convertHarborDocumentToUIFormat,
} from '../utils/harborConverters';

const router = Router();

// Feature flag for Harbor API
const USE_HARBOR_API = process.env.USE_HARBOR_API === 'true';

// GET /api/users/search - Search users
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || (q as string).trim().length === 0) {
      return res.json([]);
    }

    const query = (q as string).toLowerCase();
    const results = mockUsers.filter((user) => {
      // For name, use startsWith to match users whose name begins with the query
      const nameMatches = user.displayName.toLowerCase().startsWith(query);
      // For IDs and email, use includes for partial matching
      const idMatches =
        user.wbClientId.toLowerCase().includes(query) ||
        user.id.toLowerCase().includes(query) ||
        user.accountId.toLowerCase().includes(query);
      // For email, only match if query looks like email or matches the local part
      const emailLocalPart = user.email.toLowerCase().split('@')[0];
      const emailMatches = emailLocalPart.startsWith(query);
      
      return nameMatches || idMatches || emailMatches;
    });

    res.json(results);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// GET /api/users/:userId - Get user details
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (USE_HARBOR_API) {
      // Use Harbor API
      const harborClient = getHarborClient();

      // Fetch client and their accounts
      const client = await harborClient.getClient(userId);
      const accounts = await harborClient.getAccountsByClient(userId);

      // Convert to UI format
      const user = convertHarborClientToUser(client, accounts);

      // Get user's withdrawal history (still using mock for now)
      const withdrawals = mockWithdrawals
        .filter((w) => w.clientId === userId)
        .map((w) => ({
          id: w.id,
          amount: w.amount,
          status: w.status,
          requestDate: w.requestDate,
        }));

      return res.json({ ...user, withdrawals, accounts });
    }

    // Use mock data
    const user = mockUsers.find((u) => u.id === userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's withdrawal history
    const withdrawals = mockWithdrawals
      .filter((w) => w.clientId === userId)
      .map((w) => ({
        id: w.id,
        amount: w.amount,
        status: w.status,
        requestDate: w.requestDate,
      }));

    res.json({ ...user, withdrawals });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// GET /api/users/:userId/account-summary - Get account summary
router.get('/:userId/account-summary', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = mockUsers.find((u) => u.id === userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      accountId: user.accountId,
      totalEquity: user.totalEquity,
      gains: user.gains,
      cash: user.cash,
      positions: user.positions,
      availableToWithdraw: user.availableToWithdraw,
      target: user.target,
      portfolioType: user.portfolioType,
      brokerageAccountNumber: user.brokerageAccountNumber,
      brokerageAccountId: user.brokerageId,
      accountStatus: user.accountStatus,
    });
  } catch (error) {
    console.error('Error fetching account summary:', error);
    res.status(500).json({ error: 'Failed to fetch account summary' });
  }
});

// GET /api/users/:userId/documents - Get user tax documents
router.get('/:userId/documents', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, from, to } = req.query;

    if (USE_HARBOR_API) {
      // Use Harbor API - need to get user's accounts first
      const harborClient = getHarborClient();
      const accounts = await harborClient.getAccountsByClient(userId);

      if (accounts.length === 0) {
        return res.json([]);
      }

      // Fetch documents for the primary account
      const accountId = accounts[0].accountId;
      const documents = await harborClient.getDocuments({
        accountId,
        type: (type as any) || 'TAX_FORMS',
        from: from as string,
        to: to as string,
      });

      const uiDocuments = documents.map(convertHarborDocumentToUIFormat);
      return res.json(uiDocuments);
    }

    // Use mock data
    const documents = mockUserDocuments.filter((doc) => doc.userId === userId);
    res.json(documents);
  } catch (error) {
    console.error('Error fetching user documents:', error);
    res.status(500).json({ error: 'Failed to fetch user documents' });
  }
});

export default router;
