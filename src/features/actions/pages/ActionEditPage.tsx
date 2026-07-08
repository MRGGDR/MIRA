import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import { FeedbackMessage } from '@/components/feedback/FeedbackMessage';
import { LoadingState } from '@/components/feedback/LoadingState';
import { useLoader } from '@/context/LoaderContext';
import { actionQueries } from '@/features/actions/api/actionQueries';
import { ActionForm } from '@/features/actions/components/ActionForm';
import { useUpdateAction } from '@/features/actions/hooks/useActionMutations';
import { useParameters } from '@/features/actions/hooks/useParameters';
import type { ActionFormValues } from '@/features/actions/schemas/actionSchema';
import { actionToFormValues } from '@/features/actions/utils/actionDefaults';
import { isActionPendingForRole } from '@/features/actions/utils/workflow';
import { useAuth } from '@/features/auth/AuthContext';

export function ActionEditPage() {
  const id = Number(useParams().id);
  const [saveError, setSaveError] = useState<unknown>(null);
  const navigate = useNavigate();
  const actionQuery = useQuery(actionQueries.detail(id));
  const parametersQuery = useParameters();
  const updateAction = useUpdateAction();
  const { user } = useAuth();
  const { show, hide } = useLoader();

  async function submit(values: ActionFormValues) {
    setSaveError(null);
    show('Guardando cambios...');
    try {
      const updated = await updateAction.mutateAsync({ ...values, id });
      void navigate(`/acciones/${updated.id}`, {
        state: {
          feedback: {
            type: 'success',
            title: 'Cambios guardados',
            message: `La acción ${updated.id} se actualizó correctamente.`,
          },
        },
      });
    } catch (caught) {
      setSaveError(caught);
    } finally {
      hide();
    }
  }

  if (actionQuery.isLoading || parametersQuery.isLoading) return <LoadingState label="Cargando acción..." />;
  if (actionQuery.isError) return <ErrorMessage error={actionQuery.error} />;
  if (!actionQuery.data) return <ErrorMessage error={new Error('Acción no encontrada.')} />;
  const canRevMaintainActivities =
    user?.rol === 'REV' && Boolean(user.permissions.canEditPlan) && actionQuery.data.estadoActual !== 'CERRADA';
  const canMaintainOpenAction =
    user?.rol === 'CREADOR' &&
    Boolean(user.permissions.canUpdate) &&
    actionQuery.data.estado !== 'CERRADA' &&
    actionQuery.data.estadoActual !== 'CERRADA';
  if (!user?.permissions.canAdmin && !isActionPendingForRole(actionQuery.data, user?.rol) && !canRevMaintainActivities && !canMaintainOpenAction) {
    return <Navigate to={`/acciones/${id}`} replace />;
  }

  return (
    <div className="stack">
      <PageHeader title={`Editar acción ${id}`} description="La actualización se aplica solo al ID exacto." />
      {parametersQuery.isError ? <ErrorMessage error={parametersQuery.error} /> : null}
      {saveError ? (
        <FeedbackMessage
          type="error"
          title="No se pudieron guardar los cambios"
          message={saveError instanceof Error ? saveError.message : 'Ocurrió un error inesperado al guardar.'}
        />
      ) : null}
      <ActionForm
        mode="edit"
        initialValues={actionToFormValues(actionQuery.data)}
        parameters={parametersQuery.data}
        currentUser={user}
        isSaving={updateAction.isPending}
        onSubmit={(values) => void submit(values)}
      />
    </div>
  );
}
