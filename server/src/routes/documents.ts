import express, { Router } from 'express';
import { getHarborClient } from '../harbor';
import {
  convertHarborDocumentToUIFormat,
  mapUITypeToHarborDocumentType,
} from '../utils/harborConverters';
import { HarborDocumentType } from '../types/harbor';
import { getDocuments } from '../storage/documentService';
import { getS3StorageClient } from '../storage/s3Storage';
import { createBulkDownloadJob, getBulkDownloadJob } from '../services/bulkDownloadService';

const router = Router();

// Mock documents data (for development/fallback)
const mockDocuments = [
  {
    id: 'DOC-001',
    type: 'Monthly Statement',
    accountId: 'ACC-12345',
    bookAndRecordsId: 'BR-987654321',
    date: '2025-12-31',
    fileName: 'Monthly-Statement-BR-987654321-2025-12-31.pdf',
    size: 245678,
    accessedAt: '2026-01-25T10:30:00Z',
    accessedBy: 'Admin User',
    userName: 'John Smith',
  },
  {
    id: 'DOC-002',
    type: 'Daily Confirm',
    accountId: 'ACC-12345',
    bookAndRecordsId: 'BR-987654321',
    date: '2026-01-14',
    fileName: 'Daily-Confirm-BR-987654321-2026-01-14.pdf',
    size: 123456,
    userName: 'John Smith',
  },
  {
    id: 'DOC-003',
    type: 'Tax 1099',
    accountId: 'ACC-12345',
    bookAndRecordsId: 'BR-987654321',
    date: '2025-12-30',
    fileName: 'Tax-1099-BR-987654321-2025-12-31.pdf',
    size: 345678,
    accessedAt: '2026-01-20T14:20:00Z',
    accessedBy: 'Compliance Officer',
    userName: 'John Smith',
  },
  {
    id: 'DOC-004',
    type: 'Monthly Statement',
    accountId: 'ACC-23456',
    bookAndRecordsId: 'BR-987654322',
    date: '2025-12-31',
    fileName: 'Monthly-Statement-BR-987654322-2025-12-31.pdf',
    size: 234567,
    userName: 'Sarah Johnson',
  },
  {
    id: 'DOC-005',
    type: 'Monthly Statement',
    accountId: 'ACC-34567',
    bookAndRecordsId: 'BR-987654323',
    date: '2025-12-31',
    fileName: 'Monthly-Statement-BR-987654323-2025-12-31.pdf',
    size: 256789,
    userName: 'Michael Chen',
  },
  {
    id: 'DOC-006',
    type: 'Daily Confirm',
    accountId: 'ACC-23456',
    bookAndRecordsId: 'BR-987654322',
    date: '2026-01-19',
    fileName: 'Daily-Confirm-BR-987654322-2026-01-19.pdf',
    size: 134567,
    userName: 'Sarah Johnson',
  },
];

// Mock audit logs
const mockAuditLogs = [
  {
    id: 'AUDIT-001',
    documentId: 'DOC-001',
    userId: 'user-123',
    userName: 'Admin User',
    action: 'viewed',
    timestamp: '2026-01-25T10:30:00Z',
  },
  {
    id: 'AUDIT-002',
    documentId: 'DOC-003',
    userId: 'user-456',
    userName: 'Compliance Officer',
    action: 'downloaded',
    timestamp: '2026-01-20T14:20:00Z',
  },
  {
    id: 'AUDIT-003',
    documentId: 'DOC-002',
    userId: 'user-123',
    userName: 'Admin User',
    action: 'viewed',
    timestamp: '2026-01-24T09:15:00Z',
  },
  {
    id: 'AUDIT-004',
    documentId: 'DOC-001',
    userId: 'user-789',
    userName: 'Support Agent',
    action: 'downloaded',
    timestamp: '2026-01-23T16:45:00Z',
  },
];

// Feature flag for Harbor API (set to true when ready to use real API)
const USE_HARBOR_API = process.env.USE_HARBOR_API === 'true';

// GET /api/documents - List documents with filters
router.get('/', async (req, res) => {
  try {
    const { type, accountId, startDate, endDate } = req.query;

    if (USE_HARBOR_API && accountId) {
      // Use Harbor API
      const harborClient = getHarborClient();
      const harborType = type
        ? (mapUITypeToHarborDocumentType(type as string) as HarborDocumentType)
        : 'STATEMENTS_MONTHLY'; // Default type

      const documents = await harborClient.getDocuments({
        accountId: accountId as string,
        type: harborType,
        from: startDate as string,
        to: endDate as string,
      });

      const uiDocuments = documents.map(convertHarborDocumentToUIFormat);
      return res.json(uiDocuments);
    }

    try {
      const documents = await getDocuments({
        type: type as string | undefined,
        bookAndRecordsId: accountId as string | undefined,
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
      });

      const response = documents.map((doc) => ({
        id: doc.id,
        type: doc.type,
        accountId: doc.bookAndRecordsId,
        bookAndRecordsId: doc.bookAndRecordsId,
        date: doc.date,
        fileName: doc.fileName,
        size: doc.size,
      }));

      return res.json(response);
    } catch (error) {
      console.warn('Falling back to mock documents:', error);
    }

    // Fallback to mock data
    let filtered = [...mockDocuments];

    if (type) {
      filtered = filtered.filter((d) => d.type === type);
    }
    if (accountId) {
      filtered = filtered.filter((d) => d.accountId === accountId);
    }
    if (startDate) {
      filtered = filtered.filter((d) => d.date >= (startDate as string));
    }
    if (endDate) {
      filtered = filtered.filter((d) => d.date <= (endDate as string));
    }

    res.json(filtered);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// GET /api/documents/audit-logs - Get document access audit logs
// Note: This route must be defined before /:documentId to avoid conflicts
router.get('/audit-logs', async (req, res) => {
  try {
    const { documentId, userId } = req.query;

    let filtered = [...mockAuditLogs];

    if (documentId) {
      filtered = filtered.filter((log) => log.documentId === documentId);
    }

    if (userId) {
      filtered = filtered.filter((log) => log.userId === userId);
    }

    // Sort by timestamp descending
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json(filtered);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// GET /api/documents/bulk-download/:downloadId - Get bulk download job status
router.get('/bulk-download/:downloadId', async (req, res) => {
  try {
    const { downloadId } = req.params;
    const job = getBulkDownloadJob(downloadId);

    if (!job) {
      return res.status(404).json({ error: 'Bulk download job not found' });
    }

    res.json(job);
  } catch (error) {
    console.error('Error fetching bulk download status:', error);
    res.status(500).json({ error: 'Failed to fetch bulk download status' });
  }
});

// GET /api/documents/:documentId - Get document download URL
router.get('/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;

    if (USE_HARBOR_API) {
      // Use Harbor API to get pre-signed S3 URL
      const harborClient = getHarborClient();
      const documentDetail = await harborClient.getDocumentDownloadUrl(documentId);
      return res.json(convertHarborDocumentToUIFormat(documentDetail));
    }

    try {
      const s3 = getS3StorageClient();
      const downloadUrl = await s3.getPresignedUrl(documentId);
      return res.json({ downloadUrl });
    } catch (error) {
      console.warn('Falling back to mock download URL:', error);
    }

    const mockDoc = mockDocuments.find((d) => d.id === documentId);
    if (!mockDoc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const expirationTime = Date.now() + 3600000;
    const mockPresignedUrl = `https://wts-documents.s3.amazonaws.com/${mockDoc.fileName}?X-Amz-Expires=3600&X-Amz-Signature=mock-signature-${documentId}&expires=${expirationTime}`;

    res.json({
      ...mockDoc,
      downloadUrl: mockPresignedUrl,
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// POST /api/documents/bulk-download - Initiate bulk download
router.post('/bulk-download', async (req, res) => {
  try {
    const { documentIds } = req.body;

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({ error: 'documentIds array is required' });
    }

    const job = createBulkDownloadJob(documentIds);

    res.json({
      success: true,
      downloadId: job.id,
      documentCount: documentIds.length,
      message: 'Bulk download initiated',
    });
  } catch (error) {
    console.error('Error initiating bulk download:', error);
    res.status(500).json({ error: 'Failed to initiate bulk download' });
  }
});

export default router;
