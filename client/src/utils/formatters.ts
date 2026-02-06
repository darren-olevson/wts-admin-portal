/**
 * Utility functions for formatting values consistently across the application.
 */

/**
 * Format a number as currency (USD).
 * 
 * @param value - The number to format
 * @param options - Optional formatting options
 * @returns Formatted currency string
 * 
 * @example
 * formatCurrency(1234.56) // "$1,234.56"
 * formatCurrency(1234.56, { showSign: true }) // "+$1,234.56"
 * formatCurrency(-1234.56, { showSign: true }) // "-$1,234.56"
 */
export function formatCurrency(
  value: number | null | undefined,
  options: {
    showSign?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '$0.00';
  }

  const {
    showSign = false,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options;

  const absValue = Math.abs(value);
  const formatted = absValue.toLocaleString('en-US', {
    minimumFractionDigits,
    maximumFractionDigits,
  });

  if (showSign) {
    const sign = value >= 0 ? '+' : '-';
    return `${sign}$${formatted}`;
  }

  return value < 0 ? `-$${formatted}` : `$${formatted}`;
}

/**
 * Format a number with locale-specific thousands separator.
 * 
 * @param value - The number to format
 * @returns Formatted number string
 * 
 * @example
 * formatNumber(1234567) // "1,234,567"
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  return value.toLocaleString('en-US');
}

/**
 * Format a date string or Date object.
 * 
 * @param date - Date string or Date object
 * @param options - Formatting options
 * @returns Formatted date string
 * 
 * @example
 * formatDate('2024-01-15') // "1/15/2024"
 * formatDate('2024-01-15', { format: 'long' }) // "January 15, 2024"
 * formatDate('2024-01-15', { format: 'short' }) // "Jan 15"
 */
export function formatDate(
  date: string | Date | null | undefined,
  options: {
    format?: 'default' | 'long' | 'short' | 'iso';
  } = {}
): string {
  if (!date) return '-';

  const { format = 'default' } = options;

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return '-';
    }

    switch (format) {
      case 'long':
        return dateObj.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      case 'short':
        return dateObj.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
      case 'iso':
        return dateObj.toISOString().split('T')[0];
      default:
        return dateObj.toLocaleDateString('en-US');
    }
  } catch {
    return '-';
  }
}

/**
 * Format a date for display with time.
 * 
 * @param date - Date string or Date object
 * @returns Formatted date and time string
 * 
 * @example
 * formatDateTime('2024-01-15T14:30:00Z') // "1/15/2024, 2:30 PM"
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return '-';
    }

    return dateObj.toLocaleString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
}

/**
 * Get relative time from now (e.g., "2 days ago", "in 3 hours").
 * 
 * @param date - Date string or Date object
 * @returns Relative time string
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return '-';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return '-';
    }

    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        if (diffMinutes < 1) return 'Just now';
        return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
      }
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    }

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) === 1 ? '' : 's'} ago`;
    
    return formatDate(dateObj);
  } catch {
    return '-';
  }
}

/**
 * Truncate a string with ellipsis.
 * 
 * @param str - String to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated string
 */
export function truncate(str: string | null | undefined, maxLength: number): string {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 3)}...`;
}

/**
 * Format a percentage value.
 * 
 * @param value - Number to format as percentage
 * @param decimalPlaces - Number of decimal places
 * @returns Formatted percentage string
 */
export function formatPercent(
  value: number | null | undefined,
  decimalPlaces: number = 2
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  return `${value.toFixed(decimalPlaces)}%`;
}
