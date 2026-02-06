import { getS3StorageClient } from './s3Storage';

export interface DocumentMetadata {
  id: string;
  type: string;
  bookAndRecordsId: string;
  date: string;
  fileName: string;
  size: number;
  s3Key: string;
  accessedBy?: string;
  accessedAt?: string;
}

/**
 * Document naming convention: {type}-{bookAndRecordsId}-{date}.pdf
 */
export function parseDocumentFileName(fileName: string): {
  type: string;
  bookAndRecordsId: string;
  date: string;
} | null {
  const parts = fileName.replace('.pdf', '').split('-');
  if (parts.length < 3) {
    return null;
  }

  const type = parts[0];
  const bookAndRecordsId = parts[1];
  const date = parts.slice(2).join('-'); // Handle dates with dashes

  return { type, bookAndRecordsId, date };
}

/**
 * Generate S3 key from document metadata
 */
export function generateS3Key(
  type: string,
  bookAndRecordsId: string,
  date: string
): string {
  return `${type}-${bookAndRecordsId}-${date}.pdf`;
}

/**
 * Get documents by filters
 */
export async function getDocuments(filters: {
  type?: string;
  bookAndRecordsId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<DocumentMetadata[]> {
  const s3 = getS3StorageClient();
  const documents: DocumentMetadata[] = [];

  try {
    // List all documents (or filter by prefix if bookAndRecordsId provided)
    const prefix = filters.bookAndRecordsId
      ? `${filters.type || ''}-${filters.bookAndRecordsId}`
      : filters.type || '';
    
    const keys = await s3.listDocuments(prefix);

    for (const key of keys) {
      const fileName = key.split('/').pop() || key;
      const parsed = parseDocumentFileName(fileName);

      if (!parsed) continue;

      // Apply filters
      if (filters.type && parsed.type !== filters.type) continue;
      if (filters.bookAndRecordsId && parsed.bookAndRecordsId !== filters.bookAndRecordsId) continue;
      if (filters.startDate && parsed.date < filters.startDate) continue;
      if (filters.endDate && parsed.date > filters.endDate) continue;

      const metadata = await s3.getDocumentMetadata(key);

      documents.push({
        id: key,
        type: parsed.type,
        bookAndRecordsId: parsed.bookAndRecordsId,
        date: parsed.date,
        fileName,
        size: metadata.ContentLength || 0,
        s3Key: key,
      });
    }

    return documents;
  } catch (error) {
    console.error('Error retrieving documents:', error);
    throw error;
  }
}

/**
 * Log document access for audit trail
 */
export async function logDocumentAccess(
  documentId: string,
  userId: string
): Promise<void> {
  // TODO: Implement audit logging via CRM Activity APIs
  console.log(`Document ${documentId} accessed by user ${userId}`);
}
