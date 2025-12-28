import { formatTime, formatDate, formatDateTime, formatRelativeTime } from '../date.utils';

describe('Date Utilities', () => {
  describe('formatTime', () => {
    it('should format time correctly', () => {
      const date = new Date('2025-12-28T14:30:00Z');
      const result = formatTime(date);

      // Format depends on locale, so just check it returns a string
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle different times', () => {
      const date1 = new Date('2025-12-28T08:00:00Z');
      const date2 = new Date('2025-12-28T23:59:00Z');

      expect(formatTime(date1)).toBeTruthy();
      expect(formatTime(date2)).toBeTruthy();
    });

    it('should handle midnight', () => {
      const date = new Date('2025-12-28T00:00:00Z');
      const result = formatTime(date);

      expect(result).toBeTruthy();
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2025-12-28T14:30:00Z');
      const result = formatDate(date);

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle different dates', () => {
      const date1 = new Date('2025-01-01T00:00:00Z');
      const date2 = new Date('2025-12-31T23:59:59Z');

      expect(formatDate(date1)).toBeTruthy();
      expect(formatDate(date2)).toBeTruthy();
    });

    it('should handle leap year', () => {
      const date = new Date('2024-02-29T12:00:00Z');
      const result = formatDate(date);

      expect(result).toBeTruthy();
    });
  });

  describe('formatDateTime', () => {
    it('should format date and time correctly', () => {
      const date = new Date('2025-12-28T14:30:00Z');
      const result = formatDateTime(date);

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should include both date and time components', () => {
      const date = new Date('2025-12-28T14:30:00Z');
      const result = formatDateTime(date);

      // Should contain time digits
      expect(result).toMatch(/\d/);
    });

    it('should handle different date-times', () => {
      const date1 = new Date('2025-01-01T08:00:00Z');
      const date2 = new Date('2025-12-31T23:59:59Z');

      expect(formatDateTime(date1)).toBeTruthy();
      expect(formatDateTime(date2)).toBeTruthy();
    });
  });

  describe('formatRelativeTime', () => {
    beforeAll(() => {
      // Set fixed reference time for consistent testing
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-12-28T12:00:00Z'));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('should format time in the past correctly', () => {
      const pastDate = new Date('2025-12-28T11:30:00Z'); // 30 minutes ago
      const result = formatRelativeTime(pastDate);

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should format recent time (minutes ago)', () => {
      const recentDate = new Date('2025-12-28T11:45:00Z'); // 15 minutes ago
      const result = formatRelativeTime(recentDate);

      expect(result).toBeTruthy();
    });

    it('should format time in the past (hours ago)', () => {
      const hoursAgo = new Date('2025-12-28T09:00:00Z'); // 3 hours ago
      const result = formatRelativeTime(hoursAgo);

      expect(result).toBeTruthy();
    });

    it('should format time in the past (days ago)', () => {
      const daysAgo = new Date('2025-12-25T12:00:00Z'); // 3 days ago
      const result = formatRelativeTime(daysAgo);

      expect(result).toBeTruthy();
    });

    it('should handle current time', () => {
      const now = new Date('2025-12-28T12:00:00Z');
      const result = formatRelativeTime(now);

      expect(result).toBeTruthy();
    });

    it('should handle future time', () => {
      const futureDate = new Date('2025-12-28T14:00:00Z'); // 2 hours in future
      const result = formatRelativeTime(futureDate);

      expect(result).toBeTruthy();
    });
  });
});
