import { apiClient } from '@/services/apiClient';
import type { ActionFilters } from '@/features/actions/types';

export const actionQueries = {
  bootstrap: () => ({
    queryKey: ['bootstrap'],
    queryFn: apiClient.bootstrap,
  }),
  parameters: () => ({
    queryKey: ['parameters'],
    queryFn: apiClient.getParameters,
  }),
  nextActionId: () => ({
    queryKey: ['actions', 'next-id'],
    queryFn: apiClient.getNextActionId,
  }),
  stats: () => ({
    queryKey: ['stats'],
    queryFn: apiClient.getStats,
  }),
  list: (filters: ActionFilters) => ({
    queryKey: ['actions', filters],
    queryFn: () => apiClient.listActions(filters),
  }),
  all: () => ({
    queryKey: ['actions', 'all'],
    queryFn: () => apiClient.listAllActions(),
  }),
  detail: (id: number) => ({
    queryKey: ['actions', id],
    queryFn: () => apiClient.getAction(id),
    enabled: Number.isFinite(id) && id > 0,
  }),
  audit: (actionId?: number) => ({
    queryKey: ['audit', actionId],
    queryFn: () => apiClient.getAudit(actionId),
  }),
};
