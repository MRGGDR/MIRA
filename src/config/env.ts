import { z } from 'zod';

function normalizeOptionalUrl(value: string | undefined): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return '';
  try {
    return new URL(trimmed).toString();
  } catch {
    return '';
  }
}

const envSchema = z.object({
  VITE_APPS_SCRIPT_URL: z.string().optional().transform(normalizeOptionalUrl),
  VITE_USE_MOCKS: z
    .string()
    .optional()
    .transform((value) => value === 'true'),
  VITE_USE_DEV_PROXY: z
    .string()
    .optional()
    .transform((value) => value === 'true'),
});

const parsed = envSchema.parse(import.meta.env);

export const env = {
  appsScriptUrl: parsed.VITE_APPS_SCRIPT_URL ?? '',
  apiUrl:
    import.meta.env.DEV && parsed.VITE_USE_DEV_PROXY
      ? '/apps-script'
      : (parsed.VITE_APPS_SCRIPT_URL ?? ''),
  useMocks: parsed.VITE_USE_MOCKS,
  useDevProxy: parsed.VITE_USE_DEV_PROXY,
};
