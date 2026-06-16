import { z } from 'zod';

const envSchema = z.object({
  VITE_APPS_SCRIPT_URL: z.string().url().optional().or(z.literal('')),
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
