import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof Error && 'code' in error) {
          const code = String(error.code);
          if (code === 'APPS_SCRIPT_UNAUTHORIZED' || code === 'APPS_SCRIPT_REQUIRES_LOGIN') {
            return false;
          }
        }
        return failureCount < 1;
      },
      retryDelay: 500,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});
