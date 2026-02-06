/**
 * Bulk Download Service
 * 
 * Handles async bulk document download jobs with progress tracking.
 * In production, this would integrate with AWS S3 to create ZIP archives.
 */

export interface BulkDownloadJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  documentIds: string[];
  processedCount: number;
  totalCount: number;
  progress: number;
  downloadUrl?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

interface Document {
  id: string;
  fileName: string;
  size: number;
  [key: string]: any;
}

class BulkDownloadService {
  private jobs: Map<string, BulkDownloadJob>;
  private jobTimeouts: Map<string, NodeJS.Timeout[]>;

  constructor() {
    this.jobs = new Map();
    this.jobTimeouts = new Map();
  }

  /**
   * Create a new bulk download job
   */
  createJob(documentIds: string[]): BulkDownloadJob {
    const id = `DOWNLOAD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const job: BulkDownloadJob = {
      id,
      status: 'pending',
      documentIds,
      processedCount: 0,
      totalCount: documentIds.length,
      progress: 0,
      createdAt: new Date().toISOString(),
    };
    this.jobs.set(id, job);
    return job;
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): BulkDownloadJob | null {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Update job status
   */
  private updateJob(jobId: string, update: Partial<BulkDownloadJob>): void {
    const job = this.jobs.get(jobId);
    if (!job) return;
    this.jobs.set(jobId, { ...job, ...update });
  }

  /**
   * Process a bulk download job asynchronously
   * In production, this would:
   * 1. Fetch documents from S3
   * 2. Create a ZIP archive
   * 3. Upload the ZIP to S3
   * 4. Generate a pre-signed URL
   */
  async processJob(jobId: string, availableDocuments: Document[]): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    const timeouts: NodeJS.Timeout[] = [];
    this.jobTimeouts.set(jobId, timeouts);

    // Start processing
    this.updateJob(jobId, { status: 'processing', progress: 5 });

    const documentCount = job.documentIds.length;
    const progressPerDocument = 90 / documentCount; // Reserve 5% for start, 5% for completion

    // Simulate processing each document
    for (let i = 0; i < documentCount; i++) {
      const docId = job.documentIds[i];
      const doc = availableDocuments.find(d => d.id === docId);

      // Simulate variable processing time based on document size
      const baseDelay = 200;
      const sizeDelay = doc ? Math.min(doc.size / 50000, 500) : 100;
      const delay = baseDelay + sizeDelay + (i * 150);

      const timeout = setTimeout(() => {
        const processedCount = i + 1;
        const progress = Math.min(5 + (processedCount * progressPerDocument), 95);
        
        this.updateJob(jobId, {
          processedCount,
          progress: Math.round(progress),
        });
      }, delay);

      timeouts.push(timeout);
    }

    // Complete the job
    const finalDelay = documentCount * 200 + 500;
    const completionTimeout = setTimeout(() => {
      const job = this.jobs.get(jobId);
      if (!job || job.status === 'failed') return;

      // Generate mock download URL (in production, this would be a real pre-signed S3 URL)
      const downloadUrl = this.generateDownloadUrl(jobId, job.documentIds.length);

      this.updateJob(jobId, {
        status: 'completed',
        progress: 100,
        processedCount: documentCount,
        downloadUrl,
        completedAt: new Date().toISOString(),
      });

      // Clean up timeouts
      this.jobTimeouts.delete(jobId);

      // Clean up old jobs after 1 hour
      setTimeout(() => {
        this.jobs.delete(jobId);
      }, 3600000);
    }, finalDelay);

    timeouts.push(completionTimeout);
  }

  /**
   * Cancel a job
   */
  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || job.status === 'completed') return false;

    // Clear all pending timeouts
    const timeouts = this.jobTimeouts.get(jobId);
    if (timeouts) {
      timeouts.forEach(t => clearTimeout(t));
      this.jobTimeouts.delete(jobId);
    }

    this.updateJob(jobId, {
      status: 'failed',
      error: 'Job cancelled by user',
    });

    return true;
  }

  /**
   * Generate a mock pre-signed download URL
   * In production, this would generate a real S3 pre-signed URL
   */
  private generateDownloadUrl(jobId: string, documentCount: number): string {
    const expirationTime = Date.now() + 3600000; // 1 hour
    const filename = `bulk-download-${documentCount}-documents.zip`;
    return `https://wts-documents.s3.amazonaws.com/bulk-downloads/${jobId}/${filename}?X-Amz-Expires=3600&X-Amz-Signature=mock-signature-${jobId}&expires=${expirationTime}`;
  }

  /**
   * Get all active jobs (for admin/monitoring)
   */
  getActiveJobs(): BulkDownloadJob[] {
    return Array.from(this.jobs.values()).filter(
      job => job.status === 'pending' || job.status === 'processing'
    );
  }

  /**
   * Get job statistics
   */
  getStats(): { total: number; active: number; completed: number; failed: number } {
    const jobs = Array.from(this.jobs.values());
    return {
      total: jobs.length,
      active: jobs.filter(j => j.status === 'pending' || j.status === 'processing').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
    };
  }
}

// Export singleton instance
export const bulkDownloadService = new BulkDownloadService();

// Legacy exports for backwards compatibility
export function createBulkDownloadJob(documentIds: string[]): BulkDownloadJob {
  return bulkDownloadService.createJob(documentIds);
}

export function getBulkDownloadJob(id: string): BulkDownloadJob | null {
  return bulkDownloadService.getJobStatus(id);
}
