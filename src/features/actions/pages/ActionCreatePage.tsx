import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ActionForm } from '@/features/actions/components/ActionForm';
import { useCreateAction } from '@/features/actions/hooks/useActionMutations';
import { useParameters } from '@/features/actions/hooks/useParameters';
import type { ActionFormValues } from '@/features/actions/schemas/actionSchema';
import { getDefaultActionValues } from '@/features/actions/utils/actionDefaults';
import { useAuth } from '@/features/auth/AuthContext';

export function ActionCreatePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const parametersQuery = useParameters();
  const createAction = useCreateAction();
  const { user } = useAuth();
  const proceso = user?.permissions.canAdmin ? (searchParams.get('proceso') ?? '') : (user?.proceso ?? '');

  async function submit(values: ActionFormValues) {
    const action = await createAction.mutateAsync(values);
    await queryClient.invalidateQueries({ queryKey: ['actions', action.id] });
    void navigate(`/acciones/${action.id}`);
  }

  if (parametersQuery.isLoading) return <LoadingState label="Cargando parametros..." />;

  return (
    <div className="stack">
      <PageHeader title="Reportar accion" description="Registro unico para todos los procesos." />
      {parametersQuery.isError ? <ErrorMessage error={parametersQuery.error} /> : null}
      {createAction.isError ? <ErrorMessage error={createAction.error} /> : null}
      <ActionForm
        mode="create"
        initialValues={getDefaultActionValues(proceso)}
        parameters={parametersQuery.data}
        currentUser={user}
        isSaving={createAction.isPending}
        onSubmit={(values) => void submit(values)}
      />
    </div>
  );
}
