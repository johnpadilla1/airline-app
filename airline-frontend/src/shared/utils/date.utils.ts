/**
 * Date utility functions for formatting and manipulating dates
 * Type-safe date handling for the airline application
 */

/**
 * Format a date string to time only (HH:MM format)
 * @param dateString - ISO date string or null
 * @returns Formatted time string or '--:--' if null
 */
export function formatTime(dateString: string | null | undefined): string {
  if (!dateString) return '--:--';

  try {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return '--:--';
  }
}

/**
 * Format a date string to short date format
 * @param dateString - ISO date string or null
 * @returns Formatted date string (e.g., "Mon, Jan 1") or empty string if null
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '';

  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

/**
 * Format a date string to short date and time
 * @param dateString - ISO date string or null
 * @returns Formatted datetime string or empty string if null
 */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '';

  try {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return '';
  }
}

/**
 * Format a date string to relative time (e.g., "5 minutes ago")
 * @param dateString - ISO date string
 * @returns Relative time string
 */
export function formatRelativeTime(dateString: string): string {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return '';
  }
}

/**
 * Check if a date is in the past
 * @param dateString - ISO date string
 * @returns True if date is in the past
 */
export function isPast(dateString: string): boolean {
  try {
    return new Date(dateString) < new Date();
  } catch {
    return false;
  }
}

/**
 * Check if a date is in the future
 * @param dateString - ISO date string
 * @returns True if date is in the future
 */
export function isFuture(dateString: string): boolean {
  try {
    return new Date(dateString) > new Date();
  } catch {
    return false;
  }
}

/**
 * Get the duration between two dates in minutes
 * @param startDate - Start date ISO string
 * @param endDate - End date ISO string
 * @returns Duration in minutes or null if calculation fails
 */
export function getDurationMinutes(startDate: string, endDate: string): number | null {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.floor((end.getTime() - start.getTime()) / 60000);
  } catch {
    return null;
  }
}
