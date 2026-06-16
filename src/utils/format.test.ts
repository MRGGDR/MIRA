import { describe, expect, it } from 'vitest';
import { formatDate } from '@/utils/date';
import { formatCurrency } from '@/utils/format';

describe('format helpers', () => {
  it('formats ISO dates for display', () => {
    expect(formatDate('2026-06-10')).toBe('10/06/2026');
    expect(formatDate('')).toBe('Sin fecha');
  });

  it('formats budget as COP', () => {
    expect(formatCurrency(1500000)).toContain('1.500.000');
  });
});
