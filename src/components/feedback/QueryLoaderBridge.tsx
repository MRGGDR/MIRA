import { useEffect, useRef } from 'react';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { useLoader } from '@/context/LoaderContext';

const SHOW_DELAY_MS = 350; // evita flash en cargas rápidas

export function QueryLoaderBridge() {
  const isFetching  = useIsFetching();
  const isMutating  = useIsMutating();
  const { show, hide } = useLoader();

  const isActive     = isFetching > 0 || isMutating > 0;
  const showingRef   = useRef(false);
  const timerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isActive) {
      if (showingRef.current) return; // ya está mostrando
      const message = isMutating > 0 ? 'Procesando...' : 'Cargando datos...';
      timerRef.current = setTimeout(() => {
        showingRef.current = true;
        show(message);
      }, SHOW_DELAY_MS);
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (showingRef.current) {
        showingRef.current = false;
        hide();
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isActive, isMutating, show, hide]);

  return null;
}
