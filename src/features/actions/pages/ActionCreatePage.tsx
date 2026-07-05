import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import { FeedbackMessage } from '@/components/feedback/FeedbackMessage';
import { LoadingState } from '@/components/feedback/LoadingState';
import { useLoader } from '@/context/LoaderContext';
import { ActionForm } from '@/features/actions/components/ActionForm';
import { useCreateAction } from '@/features/actions/hooks/useActionMutations';
import { useParameters } from '@/features/actions/hooks/useParameters';
import type { ActionFormValues } from '@/features/actions/schemas/actionSchema';
import { getDefaultActionValues } from '@/features/actions/utils/actionDefaults';
import { useAuth } from '@/features/auth/AuthContext';
import { getProcessNamesForAccess } from '@/config/processes';

export function ActionCreatePage() {
  const [searchParams] = useSearchParams();
  const [saveError, setSaveError] = useState<unknown>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const parametersQuery = useParameters();
  const createAction = useCreateAction();
  const { user } = useAuth();
  const { show, hide } = useLoader();
  const canCreateReport = Boolean(user?.permissions.canAdmin || (user?.rol === 'CREADOR' && user.permissions.canCreate));
  const proceso = user?.permissions.canAdmin ? (searchParams.get('proceso') ?? '') : (getProcessNamesForAccess(user?.proceso ?? '')[0] ?? '');

  async function submit(values: ActionFormValues) {
    setSaveError(null);
    show('Guardando accion...');
    try {
      const action = await createAction.mutateAsync(values);
      await queryClient.invalidateQueries({ queryKey: ['actions', action.id] });
      void navigate(`/acciones/${action.id}`, {
        state: {
          feedback: {
            type: 'success',
            title: 'Accion guardada',
            message: `La accion ${action.id} se guardo correctamente.`,
          },
        },
      });
    } catch (caught) {
      setSaveError(caught);
    } finally {
      hide();
    }
  }

  if (parametersQuery.isLoading) return <LoadingState label="Cargando parametros..." />;
  if (!canCreateReport) return <Navigate to="/acciones" replace />;

  return (
    <div className="stack">
      <PageHeader title="Reportar accion" description="Registro unico para todos los procesos." />
      {parametersQuery.isError ? <ErrorMessage error={parametersQuery.error} /> : null}
      {saveError ? (
        <FeedbackMessage
          type="error"
          title="No se pudo guardar la accion"
          message={saveError instanceof Error ? saveError.message : 'Ocurrio un error inesperado al guardar.'}
        />
      ) : null}
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
