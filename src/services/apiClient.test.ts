import { afterEach, describe, expect, it, vi } from 'vitest';

describe('apiClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('returns data when Apps Script responds ok', async () => {
    vi.stubEnv('VITE_APPS_SCRIPT_URL', 'https://script.google.com/macros/s/test/exec');
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({
        text: () => Promise.resolve(JSON.stringify({ ok: true, data: { status: 'ok' } })),
      })),
    );
    const { apiClient } = await import('@/services/apiClient');

    const data = await apiClient.getStats();

    expect(data).toEqual({ status: 'ok' });
  });

  it('throws ApiClientError when Apps Script responds with error contract', async () => {
    vi.stubEnv('VITE_APPS_SCRIPT_URL', 'https://script.google.com/macros/s/test/exec');
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({
        text: () => Promise.resolve(JSON.stringify({
          ok: false,
          error: { code: 'ACTION_NOT_FOUND', message: 'No encontrada.' },
        })),
      })),
    );
    const { apiClient, ApiClientError } = await import('@/services/apiClient');

    await expect(apiClient.getStats()).rejects.toBeInstanceOf(ApiClientError);
  });
});
