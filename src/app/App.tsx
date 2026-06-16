import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { queryClient } from '@/app/queryClient';
import { AppRouter } from '@/app/router';
import { LoaderProvider } from '@/context/LoaderContext';
import { QueryLoaderBridge } from '@/components/feedback/QueryLoaderBridge';
import { AuthProvider } from '@/features/auth/AuthContext';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LoaderProvider>
        <AuthProvider>
          <QueryLoaderBridge />
          <BrowserRouter>
            <AppRouter />
          </BrowserRouter>
        </AuthProvider>
      </LoaderProvider>
    </QueryClientProvider>
  );
}
