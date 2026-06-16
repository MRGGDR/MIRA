import { useQuery } from '@tanstack/react-query';
import { actionQueries } from '@/features/actions/api/actionQueries';

export function useParameters() {
  return useQuery(actionQueries.parameters());
}
