import { useEffect, useState, useCallback, useMemo } from 'react';
import { Search, Filter, Download, Calendar, FileText, FileCheck, Receipt, Loader2, ExternalLink, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { documentsApi, UserDocument, AuditLog, BulkDownloadJob } from '../lib/api';
import './Documents.css';

const ROWS_PER_PAGE = 100;

function Documents() {
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [accountIdFilter, setAccountIdFilter] = useState('');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [bulkDownloadJob, setBulkDownloadJob] = useState<BulkDownloadJob | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const docs = await documentsApi.list({
        type: typeFilter !== 'all' ? typeFilter : undefined,
        accountId: accountIdFilter || undefined,
        startDate: dateRange.start || undefined,
        endDate: dateRange.end || undefined,
      });
      setDocuments(docs);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, accountIdFilter, dateRange]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.bookAndRecordsId.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [documents, searchQuery]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredDocuments.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const endIndex = startIndex + ROWS_PER_PAGE;
  const paginatedDocuments = filteredDocuments.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, accountIdFilter, dateRange]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'Monthly Statement':
        return <FileText size={18} className="doc-icon statement" />;
      case 'Daily Confirm':
        return <FileCheck size={18} className="doc-icon confirm" />;
      case 'Tax 1099':
        return <Receipt size={18} className="doc-icon tax" />;
      default:
        return <FileText size={18} className="doc-icon" />;
    }
  };

  const handleDownload = async (documentId: string) => {
    try {
      setDownloadingId(documentId);
      const { downloadUrl } = await documentsApi.getDownloadUrl(documentId);
      
      // Open the pre-signed S3 URL in a new tab
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleSelectDocument = (documentId: string) => {
    const newSelected = new Set(selectedDocuments);
    if (newSelected.has(documentId)) {
      newSelected.delete(documentId);
    } else {
      newSelected.add(documentId);
    }
    setSelectedDocuments(newSelected);
  };

  const handleSelectAll = () => {
    const currentPageIds = paginatedDocuments.map((d) => d.id);
    const allSelected = currentPageIds.every((id) => selectedDocuments.has(id));
    
    if (allSelected) {
      // Deselect all on current page
      const newSelected = new Set(selectedDocuments);
      currentPageIds.forEach((id) => newSelected.delete(id));
      setSelectedDocuments(newSelected);
    } else {
      // Select all on current page
      const newSelected = new Set(selectedDocuments);
      currentPageIds.forEach((id) => newSelected.add(id));
      setSelectedDocuments(newSelected);
    }
  };

  const handleBulkDownload = async () => {
    if (selectedDocuments.size === 0) {
      alert('Please select at least one document to download.');
      return;
    }

    try {
      const job = await documentsApi.startBulkDownload(Array.from(selectedDocuments));
      setBulkDownloadJob(job);
      
      // Poll for job status
      pollBulkDownloadStatus(job.id);
    } catch (error) {
      console.error('Error initiating bulk download:', error);
      alert('Failed to initiate bulk download. Please try again.');
    }
  };

  const pollBulkDownloadStatus = async (jobId: string) => {
    try {
      const status = await documentsApi.getBulkDownloadStatus(jobId);
      setBulkDownloadJob(status);

      if (status.status === 'processing' || status.status === 'pending') {
        // Continue polling
        setTimeout(() => pollBulkDownloadStatus(jobId), 2000);
      } else if (status.status === 'completed' && status.downloadUrl) {
        // Download ready
        window.open(status.downloadUrl, '_blank');
      }
    } catch (error) {
      console.error('Error polling bulk download status:', error);
    }
  };

  const handleShowAuditLogs = async () => {
    try {
      const logs = await documentsApi.getAuditLogs();
      setAuditLogs(logs);
      setShowAuditLogs(true);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  };

  if (loading) {
    return (
      <div className="documents">
        <div className="documents-loading-skeleton">
          <div className="skeleton-header">
            <div className="skeleton-line wide"></div>
            <div className="skeleton-line medium"></div>
          </div>
          <div className="skeleton-filters">
            <div className="skeleton-box"></div>
            <div className="skeleton-box"></div>
            <div className="skeleton-box"></div>
          </div>
          <div className="skeleton-table">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton-row"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="documents">
      <div className="documents-header">
        <div>
          <h1 className="documents-title">Documents & Statements</h1>
          <p className="documents-subtitle">
            Access monthly statements, daily confirms, and tax documents
          </p>
        </div>
        <div className="header-actions">
          <button onClick={handleShowAuditLogs} className="audit-log-button">
            <User size={18} />
            Audit Logs
          </button>
          <button
            onClick={handleBulkDownload}
            className="bulk-download-button"
            disabled={selectedDocuments.size === 0 || bulkDownloadJob?.status === 'processing'}
          >
            {bulkDownloadJob?.status === 'processing' ? (
              <>
                <Loader2 size={18} className="spin" />
                Processing ({bulkDownloadJob.progress}%)
              </>
            ) : (
              <>
                <Download size={18} />
                Bulk Download ({selectedDocuments.size})
              </>
            )}
          </button>
        </div>
      </div>

      {bulkDownloadJob?.status === 'processing' && (
        <div className="bulk-download-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${bulkDownloadJob.progress}%` }}
            ></div>
          </div>
          <span className="progress-text">
            Preparing {selectedDocuments.size} documents for download...
          </span>
        </div>
      )}

      <div className="documents-filters">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by document name or Book & Records ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-group">
          <User size={18} />
          <input
            type="text"
            placeholder="Account ID"
            value={accountIdFilter}
            onChange={(e) => setAccountIdFilter(e.target.value)}
            className="account-id-input"
          />
        </div>
        <div className="filter-group">
          <Filter size={18} />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Document Types</option>
            <option value="Monthly Statement">Monthly Statements</option>
            <option value="Daily Confirm">Daily Confirms</option>
            <option value="Tax 1099">Tax 1099s</option>
          </select>
        </div>
        <div className="date-range-group">
          <Calendar size={18} />
          <input
            type="date"
            placeholder="Start Date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="date-input"
          />
          <span>to</span>
          <input
            type="date"
            placeholder="End Date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="date-input"
          />
        </div>
      </div>

      <div className="documents-table-container">
        <table className="documents-table">
          <thead>
            <tr>
              <th className="checkbox-cell">
                <input
                  type="checkbox"
                  checked={paginatedDocuments.length > 0 && paginatedDocuments.every((d) => selectedDocuments.has(d.id))}
                  onChange={handleSelectAll}
                />
              </th>
              <th>Document Type</th>
              <th>Book & Records ID</th>
              <th>Account ID</th>
              <th>User Name</th>
              <th>Document Date</th>
              <th>File Name</th>
              <th>Size</th>
              <th>Last Accessed</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedDocuments.length === 0 ? (
              <tr>
                <td colSpan={10} className="empty-state">
                  <FileText size={48} className="empty-icon" />
                  <p>No documents found</p>
                  <span>Try adjusting your filters</span>
                </td>
              </tr>
            ) : (
              paginatedDocuments.map((document) => (
                <tr key={document.id} className={selectedDocuments.has(document.id) ? 'selected' : ''}>
                  <td className="checkbox-cell">
                    <input
                      type="checkbox"
                      checked={selectedDocuments.has(document.id)}
                      onChange={() => handleSelectDocument(document.id)}
                    />
                  </td>
                  <td>
                    <span className="document-type-badge">
                      {getDocumentIcon(document.type)}
                      {document.type}
                    </span>
                  </td>
                  <td className="mono">{document.bookAndRecordsId}</td>
                  <td className="mono">{document.accountId}</td>
                  <td>{document.userName || '—'}</td>
                  <td>{new Date(document.date).toLocaleDateString()}</td>
                  <td className="file-name">{document.fileName}</td>
                  <td>{formatFileSize(document.size)}</td>
                  <td>
                    {document.accessedAt ? (
                      <div className="last-accessed">
                        <div>{new Date(document.accessedAt).toLocaleDateString()}</div>
                        {document.accessedBy && (
                          <div className="accessed-by">{document.accessedBy}</div>
                        )}
                      </div>
                    ) : (
                      <span className="never-accessed">Never accessed</span>
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => handleDownload(document.id)}
                      className="download-button"
                      disabled={downloadingId === document.id}
                    >
                      {downloadingId === document.id ? (
                        <Loader2 size={16} className="spin" />
                      ) : (
                        <ExternalLink size={16} />
                      )}
                      {downloadingId === document.id ? 'Loading...' : 'Download'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pagination-controls">
          <div className="pagination-info">
            Showing {startIndex + 1}–{Math.min(endIndex, filteredDocuments.length)} of {filteredDocuments.length} documents
          </div>
          <div className="pagination-buttons">
            <button
              className="pagination-button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={18} />
              Previous
            </button>
            <div className="pagination-pages">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  // Show first, last, current, and pages around current
                  return (
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1
                  );
                })
                .reduce<(number | 'ellipsis')[]>((acc, page, idx, arr) => {
                  if (idx > 0 && page - (arr[idx - 1] as number) > 1) {
                    acc.push('ellipsis');
                  }
                  acc.push(page);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === 'ellipsis' ? (
                    <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      className={`pagination-page ${currentPage === item ? 'active' : ''}`}
                      onClick={() => handlePageChange(item)}
                    >
                      {item}
                    </button>
                  )
                )}
            </div>
            <button
              className="pagination-button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Audit Logs Modal */}
      {showAuditLogs && (
        <div className="audit-modal-overlay" onClick={() => setShowAuditLogs(false)}>
          <div className="audit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="audit-modal-header">
              <h2>Document Access Audit Logs</h2>
              <button className="close-button" onClick={() => setShowAuditLogs(false)}>
                ×
              </button>
            </div>
            <div className="audit-modal-content">
              {auditLogs.length === 0 ? (
                <div className="audit-empty">No audit logs found</div>
              ) : (
                <table className="audit-table">
                  <thead>
                    <tr>
                      <th>Document ID</th>
                      <th>User</th>
                      <th>Action</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="mono">{log.documentId}</td>
                        <td>{log.userName}</td>
                        <td>
                          <span className={`action-badge ${log.action}`}>{log.action}</span>
                        </td>
                        <td>{new Date(log.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Documents;
