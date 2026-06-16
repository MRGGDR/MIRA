import { describe, expect, it, vi } from 'vitest';
import { isActionExpired } from '@/features/actions/utils/status';

describe('isActionExpired', () => {
  it('detects open actions with past end date', () => {
    vi.setSystemTime(new Date('2026-06-10T12:00:00-05:00'));

    expect(isActionExpired({ estado: 'ABIERTA', fechaFinAccion: '2026-06-09' })).toBe(true);
    expect(isActionExpired({ estado: 'CERRADA', fechaFinAccion: '2026-06-09' })).toBe(false);
    expect(isActionExpired({ estado: 'ABIERTA', fechaFinAccion: '2026-06-11' })).toBe(false);

    vi.useRealTimers();
  });
});
