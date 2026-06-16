import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import { LoadingState } from '@/components/feedback/LoadingState';
import { actionQueries } from '@/features/actions/api/actionQueries';
import { ActionForm } from '@/features/actions/components/ActionForm';
import { useUpdateAction } from '@/features/actions/hooks/useActionMutations';
import { useParameters } from '@/features/actions/hooks/useParameters';
import type { ActionFormValues } from '@/features/actions/schemas/actionSchema';
import { actionToFormValues } from '@/features/actions/utils/actionDefaults';
import { useAuth } from '@/features/auth/AuthContext';

export function ActionEditPage() {
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const actionQuery = useQuery(actionQueries.detail(id));
  const parametersQuery = useParameters();
  const updateAction = useUpdateAction();
  const { user } = useAuth();

  async function submit(values: ActionFormValues) {
    if (!window.confirm('Desea guardar los cambios de esta accion?')) return;
    const updated = await updateAction.mutateAsync({ ...values, id });
    void navigate(`/acciones/${updated.id}`);
  }

  if (actionQuery.isLoading || parametersQuery.isLoading) return <LoadingState label="Cargando accion..." />;
  if (actionQuery.isError) return <ErrorMessage error={actionQuery.error} />;
  if (!actionQuery.data) return <ErrorMessage error={new Error('Accion no encontrada.')} />;

  return (
    <div className="stack">
      <PageHeader title={`Editar accion ${id}`} description="La actualizacion se aplica solo al ID exacto." />
      {parametersQuery.isError ? <ErrorMessage error={parametersQuery.error} /> : null}
      {updateAction.isError ? <ErrorMessage error={updateAction.error} /> : null}
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
