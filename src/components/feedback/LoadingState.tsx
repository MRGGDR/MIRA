import { GlobalLoader } from '@/components/feedback/GlobalLoader';

export function LoadingState({ label = 'Cargando información...' }: { label?: string }) {
  return <GlobalLoader message={label} />;
}
