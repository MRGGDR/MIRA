import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { GlobalLoader } from '@/components/feedback/GlobalLoader';
import { useAuth } from '@/features/auth/AuthContext';

export function RequireAuth({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const location = useLocation();

  if (auth.isLoading) return <GlobalLoader message="Validando sesión..." />;
  if (!auth.isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}
