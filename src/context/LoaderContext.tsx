import { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { GlobalLoader } from '@/components/feedback/GlobalLoader';

interface LoaderState {
  visible: boolean;
  exiting: boolean;
  message: string;
}

interface LoaderContextValue {
  show: (message?: string) => void;
  hide: () => void;
}

const LoaderContext = createContext<LoaderContextValue | null>(null);

export function LoaderProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LoaderState>({
    visible: false,
    exiting: false,
    message: 'Procesando...',
  });

  const counterRef = useRef(0);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((message = 'Procesando...') => {
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
    counterRef.current++;
    setState({ visible: true, exiting: false, message });
  }, []);

  const hide = useCallback(() => {
    counterRef.current = Math.max(0, counterRef.current - 1);
    if (counterRef.current === 0) {
      setState(prev => ({ ...prev, exiting: true }));
      exitTimerRef.current = setTimeout(() => {
        setState({ visible: false, exiting: false, message: '' });
        exitTimerRef.current = null;
      }, 280);
    }
  }, []);

  return (
    <LoaderContext.Provider value={{ show, hide }}>
      {children}
      {state.visible && (
        <GlobalLoader message={state.message} exiting={state.exiting} />
      )}
    </LoaderContext.Provider>
  );
}

export function useLoader() {
  const ctx = useContext(LoaderContext);
  if (!ctx) throw new Error('useLoader debe estar dentro de LoaderProvider');
  return ctx;
}
