import AWS from 'aws-sdk';
import { Readable } from 'stream';

/**
 * S3 Storage Client for document retrieval
 * Handles 17a-4 compliant document storage and retrieval
 */
export class S3StorageClient {
  private s3: AWS.S3;
  private bucketName: string;

  constructor(bucketName: string, region: string = 'us-east-1') {
    this.bucketName = bucketName;
    this.s3 = new AWS.S3({
      region,
    });
  }

  /**
   * Get a document from S3
   */
  async getDocument(key: string): Promise<Buffer> {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: key,
      };

      const data = await this.s3.getObject(params).promise();
      return data.Body as Buffer;
    } catch (error) {
      console.error('Error retrieving document from S3:', error);
      throw new Error(`Failed to retrieve document: ${key}`);
    }
  }

  /**
   * List documents matching a pattern
   */
  async listDocuments(prefix: string, maxKeys: number = 1000): Promise<string[]> {
    try {
      const params = {
        Bucket: this.bucketName,
        Prefix: prefix,
        MaxKeys: maxKeys,
      };

      const data = await this.s3.listObjectsV2(params).promise();
      return (data.Contents || []).map((obj) => obj.Key || '');
    } catch (error) {
      console.error('Error listing documents from S3:', error);
      throw new Error('Failed to list documents');
    }
  }

  /**
   * Get document metadata
   */
  async getDocumentMetadata(key: string): Promise<AWS.S3.HeadObjectOutput> {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: key,
      };

      return await this.s3.headObject(params).promise();
    } catch (error) {
      console.error('Error getting document metadata:', error);
      throw new Error(`Failed to get document metadata: ${key}`);
    }
  }

  /**
   * Generate a presigned URL for document download
   */
  async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: key,
        Expires: expiresIn,
      };

      return this.s3.getSignedUrlPromise('getObject', params);
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      throw new Error('Failed to generate download URL');
    }
  }

  /**
   * Download multiple documents and create a ZIP
   * Note: For large bulk downloads, consider using a background job
   */
  async bulkDownload(keys: string[]): Promise<Buffer> {
    // TODO: Implement ZIP creation using archiver or similar
    // This is a placeholder
    throw new Error('Bulk download not yet implemented');
  }
}

// Singleton instance
let s3StorageInstance: S3StorageClient | null = null;

export function getS3StorageClient(): S3StorageClient {
  if (!s3StorageInstance) {
    const bucketName = process.env.AWS_S3_BUCKET || '';
    const region = process.env.AWS_REGION || 'us-east-1';

    if (!bucketName) {
      throw new Error('AWS_S3_BUCKET environment variable is required');
    }

    s3StorageInstance = new S3StorageClient(bucketName, region);
  }
  return s3StorageInstance;
}
