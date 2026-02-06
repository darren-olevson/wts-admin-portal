import { useState, useCallback } from 'react';

interface UseCSVExportResult {
  /** Whether export is in progress */
  exporting: boolean;
  /** Export error message, if any */
  error: string | null;
  /** Function to trigger the export */
  exportToCSV: (filename?: string) => Promise<void>;
  /** Reset the error state */
  clearError: () => void;
}

/**
 * Custom hook for exporting data to CSV files.
 * Handles loading state, error handling, and file download.
 * 
 * @param fetchCSV - Async function that returns CSV string data
 * @param defaultFilename - Default filename for the export (without extension)
 * 
 * @example
 * const { exporting, exportToCSV } = useCSVExport(
 *   () => moneyMovementApi.exportTransactionsCSV(filters),
 *   'transactions'
 * );
 * 
 * <button onClick={() => exportToCSV()} disabled={exporting}>
 *   {exporting ? 'Exporting...' : 'Export CSV'}
 * </button>
 */
export function useCSVExport(
  fetchCSV: () => Promise<string>,
  defaultFilename: string = 'export'
): UseCSVExportResult {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportToCSV = useCallback(async (filename?: string) => {
    setExporting(true);
    setError(null);

    try {
      const csvData = await fetchCSV();
      
      // Create a blob from the CSV data
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // Generate filename with date
      const date = new Date().toISOString().split('T')[0];
      const finalFilename = `${filename || defaultFilename}-${date}.csv`;
      
      link.href = url;
      link.download = finalFilename;
      link.style.display = 'none';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export CSV';
      setError(errorMessage);
      console.error('CSV export error:', err);
    } finally {
      setExporting(false);
    }
  }, [fetchCSV, defaultFilename]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { exporting, error, exportToCSV, clearError };
}

/**
 * Utility function to convert an array of objects to CSV string.
 * 
 * @param data - Array of objects to convert
 * @param columns - Optional column definitions for ordering and renaming
 * @returns CSV string
 * 
 * @example
 * const csv = arrayToCSV(users, [
 *   { key: 'name', header: 'Full Name' },
 *   { key: 'email', header: 'Email Address' },
 * ]);
 */
export function arrayToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns?: { key: keyof T; header: string }[]
): string {
  if (data.length === 0) return '';

  // Determine columns
  const cols = columns || Object.keys(data[0]).map(key => ({ 
    key: key as keyof T, 
    header: String(key) 
  }));

  // Build header row
  const headerRow = cols.map(col => escapeCSVValue(col.header)).join(',');

  // Build data rows
  const dataRows = data.map(row => 
    cols.map(col => escapeCSVValue(String(row[col.key] ?? ''))).join(',')
  );

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Escape a value for CSV (handles quotes and commas).
 */
function escapeCSVValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export default useCSVExport;
