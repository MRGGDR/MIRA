import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const appsScriptUrl = env.VITE_APPS_SCRIPT_URL?.trim() ?? '';
  const useDevProxy = env.VITE_USE_DEV_PROXY === 'true';
  const proxyUrl = useDevProxy && appsScriptUrl ? new URL(appsScriptUrl) : null;

  const server = {
    host: '127.0.0.1',
    port: 5173,
    strictPort: false,
    hmr: {
      protocol: 'ws',
      host: '127.0.0.1',
      clientPort: 5173,
    },
    ...(proxyUrl && useDevProxy
      ? {
          proxy: {
            '/apps-script': {
              target: proxyUrl.origin,
              changeOrigin: true,
              secure: true,
              followRedirects: true,
              rewrite: () => `${proxyUrl.pathname}${proxyUrl.search}`,
            },
          },
        }
      : {}),
  };

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server,
  };
});
