import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import type { CreateActionInput, UpdateActionInput } from '@/features/actions/types';

export function useCreateAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateActionInput) => apiClient.createAction(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['actions'] });
      await queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useUpdateAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateActionInput) => apiClient.updateAction(input),
    onSuccess: async (action) => {
      await queryClient.invalidateQueries({ queryKey: ['actions'] });
      await queryClient.invalidateQueries({ queryKey: ['actions', action.id] });
      await queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
