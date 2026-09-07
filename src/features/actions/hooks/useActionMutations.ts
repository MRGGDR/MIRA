import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import type { CreateActionInput, UpdateActionInput } from '@/features/actions/types';

export function useCreateAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateActionInput) => apiClient.createAction(input),
    onSuccess: (action) => {
      queryClient.setQueryData(['actions', action.id], action);
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ['actions'] }),
        queryClient.invalidateQueries({ queryKey: ['stats'] }),
      ]);
    },
  });
}

export function useUpdateAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateActionInput) => apiClient.updateAction(input),
    onSuccess: (action) => {
      queryClient.setQueryData(['actions', action.id], action);
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ['actions'] }),
        queryClient.invalidateQueries({ queryKey: ['stats'] }),
      ]);
    },
  });
}
