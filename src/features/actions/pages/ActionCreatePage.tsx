import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import { FeedbackMessage } from '@/components/feedback/FeedbackMessage';
import { LoadingState } from '@/components/feedback/LoadingState';
import { useLoader } from '@/context/LoaderContext';
import { actionQueries } from '@/features/actions/api/actionQueries';
import { ActionForm } from '@/features/actions/components/ActionForm';
import { useCreateAction } from '@/features/actions/hooks/useActionMutations';
import { useParameters } from '@/features/actions/hooks/useParameters';
import type { ActionFormValues } from '@/features/actions/schemas/actionSchema';
import { getDefaultActionValues } from '@/features/actions/utils/actionDefaults';
import { useAuth } from '@/features/auth/AuthContext';
import { getProcessNamesForAccess } from '@/config/processes';

const NEXT_ACTION_ID_BASE = 411;

export function ActionCreatePage() {
  const [searchParams] = useSearchParams();
  const [saveError, setSaveError] = useState<unknown>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const parametersQuery = useParameters();
  const nextActionIdQuery = useQuery(actionQueries.nextActionId());
  const createAction = useCreateAction();
  const { user } = useAuth();
  const { show, hide } = useLoader();
  const canCreateReport = Boolean(user?.permissions.canAdmin || (user?.rol === 'CREADOR' && user.permissions.canCreate));
  const proceso = user?.permissions.canAdmin ? (searchParams.get('proceso') ?? '') : (getProcessNamesForAccess(user?.proceso ?? '')[0] ?? '');
  const nextActionId = nextActionIdQuery.data ?? NEXT_ACTION_ID_BASE + 1;
  const initialValues = useMemo(() => getDefaultActionValues(proceso, nextActionId), [nextActionId, proceso]);

  async function submit(values: ActionFormValues) {
    setSaveError(null);
    show('Guardando acción...');
    try {
      const action = await createAction.mutateAsync(values);
      await queryClient.invalidateQueries({ queryKey: ['actions', action.id] });
      void navigate(`/acciones/${action.id}`, {
        state: {
          feedback: {
            type: 'success',
            title: 'Acción guardada',
            message: `La acción ${action.id} se guardó correctamente.`,
          },
        },
      });
    } catch (caught) {
      setSaveError(caught);
    } finally {
      hide();
    }
  }

  if (parametersQuery.isLoading || nextActionIdQuery.isLoading) return <LoadingState label="Cargando parámetros..." />;
  if (!canCreateReport) return <Navigate to="/acciones" replace />;

  return (
    <div className="stack">
      <PageHeader title="Reportar acción" description="Registro único para todos los procesos." />
      {parametersQuery.isError ? <ErrorMessage error={parametersQuery.error} /> : null}
      {nextActionIdQuery.isError ? <ErrorMessage error={nextActionIdQuery.error} /> : null}
      {saveError ? (
        <FeedbackMessage
          type="error"
          title="No se pudo guardar la acción"
          message={saveError instanceof Error ? saveError.message : 'Ocurrió un error inesperado al guardar.'}
        />
      ) : null}
      <ActionForm
        mode="create"
        initialValues={initialValues}
        parameters={parametersQuery.data}
        currentUser={user}
        isSaving={createAction.isPending}
        onSubmit={(values) => void submit(values)}
      />
    </div>
  );
}
