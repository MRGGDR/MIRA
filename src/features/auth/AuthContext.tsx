import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { apiClient, getStoredAuthToken, setStoredAuthToken } from '@/services/apiClient';
import type { CurrentUser } from '@/features/actions/types';

interface AuthContextValue {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(getStoredAuthToken()));

  useEffect(() => {
    let active = true;
    async function loadSession() {
      if (!getStoredAuthToken()) return;
      try {
        const currentUser = await apiClient.me();
        if (active) setUser(currentUser);
      } catch {
        setStoredAuthToken('');
        if (active) setUser(null);
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void loadSession();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const session = await apiClient.login(email, password);
    setStoredAuthToken(session.token);
    setUser(session.user);
  }, []);

  const logout = useCallback(() => {
    setStoredAuthToken('');
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
    }),
    [isLoading, login, logout, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}
