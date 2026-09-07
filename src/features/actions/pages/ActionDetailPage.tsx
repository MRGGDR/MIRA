import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  ExternalLink,
  FileText,
  ListChecks,
  Network,
  Pencil,
  Send,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import { FeedbackMessage, type FeedbackMessageState } from '@/components/feedback/FeedbackMessage';
import { LoadingState } from '@/components/feedback/LoadingState';
import { actionQueries } from '@/features/actions/api/actionQueries';
import {
  ACTION_FIELD_LABELS,
  ACTION_SECTION_TITLES,
  getEffectivenessLabel,
  getEvaluatorLabel,
  getEvaluationSectionTitle,
} from '@/features/actions/config/actionPresentation';
import { apiClient } from '@/services/apiClient';
import { useAuth } from '@/features/auth/AuthContext';
import type { CorrectiveAction, ImprovementPlanActivity } from '@/features/actions/types';
import { canCreatorMaintainAction, canRevMaintainAction, isActionPendingForRole } from '@/features/actions/utils/workflow';
import { isActionInUserProcessScope } from '@/features/auth/access';
import { formatDate } from '@/utils/date';

type DetailField = {
  label: string;
  value: string;
  wide?: boolean;
};

export function ActionDetailPage() {
  const id = Number(useParams().id);
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const actionQuery = useQuery(actionQueries.detail(id));
  const notifyOci = useMutation({
    mutationFn: () => apiClient.notifyOci(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['actions'] });
      await queryClient.invalidateQueries({ queryKey: ['actions', id] });
    },
  });

  if (actionQuery.isLoading) return <LoadingState label="Cargando acción..." />;
  if (actionQuery.isError) return <ErrorMessage error={actionQuery.error} />;
  if (!actionQuery.data) return <ErrorMessage error={new Error('Acción no encontrada.')} />;
  if (!isActionInUserProcessScope(actionQuery.data, user)) return <Navigate to="/acciones" replace />;

  const action = actionQuery.data;
  const effectivenessStatus =
    action.eficacia === 'SI' ? 'EFICAZ' : action.eficacia === 'NO' ? 'NO EFICAZ' : 'SIN EVALUAR';
  const lastActivity = getLastActivity(action);
  const activityCodes = buildPlanActivities(action).map((activity, index) => getActivityCode(action.id, activity, index)).join(', ');
  const readyForOci = areActivitiesReadyForOci(action);
  const canNotifyOci = Boolean(
    action.auditorInterno.trim().toLowerCase() === 'oci' &&
      (user?.permissions.canNotifyOci || user?.permissions.canAdmin) &&
      !action.correoEnviado &&
      readyForOci,
  );
  const canEditAction = Boolean(
    user?.permissions.canAdmin ||
      isActionPendingForRole(action, user?.rol) ||
      (user?.rol === 'CREADOR' && user.permissions.canUpdate && canCreatorMaintainAction(action)) ||
      (user?.rol === 'REV' && user.permissions.canEditPlan && canRevMaintainAction(action)),
  );
  const showsCauseAnalysis = !action.tipoAccion.toLowerCase().includes('mejora');
  const feedback = (location.state as { feedback?: FeedbackMessageState } | null)?.feedback;

  return (
    <div className="stack action-detail">
      <PageHeader
        title={`Mejoramiento ${action.id}`}
        description={`${action.tipoAccion} - ${action.proceso}`}
        actions={
          <>
            {canNotifyOci ? (
              <button className="button button--secondary" type="button" disabled={notifyOci.isPending} onClick={() => notifyOci.mutate()}>
                <Send aria-hidden size={18} />
                {notifyOci.isPending ? 'Notificando...' : 'Notificar a Control Interno'}
              </button>
            ) : null}
            {canEditAction ? (
              <Link className="button button--primary" to={`/acciones/${action.id}/editar`}>
                <Pencil aria-hidden size={18} />
                Editar
              </Link>
            ) : null}
          </>
        }
      />
      {feedback ? <FeedbackMessage {...feedback} /> : null}
      {notifyOci.isError ? <ErrorMessage error={notifyOci.error} /> : null}

      <section className="record-overview">
        <div className="record-overview__main">
          <span className="record-overview__eyebrow">Mejoramiento Continuo</span>
          <h3>Registro de seguimiento #{action.id}</h3>
          <p>{action.descripcion || 'Sin descripción registrada.'}</p>
        </div>
        <div className="record-overview__status">
          <StatusBadge action={action} />
          <StatusBadge status={effectivenessStatus} />
        </div>
        <div className="record-overview__grid">
          <SummaryItem label="Códigos de actividad" value={activityCodes} />
          <SummaryItem label="Sistema de Gestión" value="S I P L A G" />
          <SummaryItem label={ACTION_FIELD_LABELS.fechaElaboracion} value={formatDate(action.fechaElaboracion)} />
          <SummaryItem label="Fecha fin de la última actividad" value={formatDate(action.fechaCierre)} />
        </div>
      </section>

      <DetailSection
        icon={FileText}
        title={ACTION_SECTION_TITLES.registro}
        subtitle="Información registrada al reportar la acción."
        fields={[
          { label: ACTION_FIELD_LABELS.id, value: String(action.id) },
          { label: ACTION_FIELD_LABELS.fechaElaboracion, value: formatDate(action.fechaElaboracion) },
          { label: ACTION_FIELD_LABELS.origen, value: action.origen },
          { label: ACTION_FIELD_LABELS.tipoAccion, value: action.tipoAccion },
          { label: ACTION_FIELD_LABELS.proceso, value: action.proceso },
          { label: ACTION_FIELD_LABELS.identificadoPor, value: action.identificadoPor },
          { label: ACTION_FIELD_LABELS.liderProceso, value: action.liderProceso },
          { label: ACTION_FIELD_LABELS.auditorInterno, value: getEvaluatorLabel(action.auditorInterno) },
          { label: ACTION_FIELD_LABELS.descripcion, value: action.descripcion, wide: true },
        ]}
      />

      {showsCauseAnalysis ? (
        <DetailSection
          icon={Network}
          title={ACTION_SECTION_TITLES.analisis}
          fields={[
            { label: ACTION_FIELD_LABELS.identificacionCausas, value: action.identificacionCausas, wide: true },
            { label: ACTION_FIELD_LABELS.causaRaiz, value: action.causaRaiz, wide: true },
            { label: ACTION_FIELD_LABELS.accionContencion, value: action.accionContencion, wide: true },
          ]}
        />
      ) : null}

      <PlanSection action={action} />

      <FinalEvaluationSection action={action} />

      <section className="last-activity">
        <span>La Ultima Actividad que se realizo con el Registro fue</span>
        <strong>{lastActivity}</strong>
      </section>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="summary-item">
      <span>{label}</span>
      <strong>{value || 'Sin registrar'}</strong>
    </div>
  );
}

function DetailSection({
  title,
  subtitle,
  icon: Icon,
  fields,
}: {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  fields: DetailField[];
}) {
  return (
    <section className="detail-card">
      <SectionHeading icon={Icon} title={title} subtitle={subtitle} />
      <div className="detail-grid">
        {fields.map((field) => (
          <DetailValue key={field.label} field={field} />
        ))}
      </div>
    </section>
  );
}

function PlanSection({ action }: { action: CorrectiveAction }) {
  const activities = buildPlanActivities(action);
  const containmentResponse = activities.find((activity) => activity.observacionRevision.trim())?.observacionRevision ?? '';

  return (
    <section className="detail-card">
      <SectionHeading
        icon={ListChecks}
        title={ACTION_SECTION_TITLES.plan}
        subtitle="Información diligenciada para cada actividad."
      />
      {containmentResponse ? (
        <div className="plan-control-row">
          <div className="plan-control-row__observation">
            <span>{ACTION_FIELD_LABELS.respuestaContencion}</span>
            <p>{containmentResponse}</p>
          </div>
        </div>
      ) : null}
      <div className="plan-report-list">
        {activities.map((activity, index) => (
          <PlanActivityReport actionId={action.id} activity={activity} index={index} key={getActivityCode(action.id, activity, index)} />
        ))}
      </div>
    </section>
  );
}

function PlanActivityReport({ actionId, activity, index }: { actionId: number; activity: ImprovementPlanActivity; index: number }) {
  const activityNumber = activity.numeroActividad || index + 1;
  const activityCode = getActivityCode(actionId, activity, index);
  return (
    <article className="plan-activity-report">
      <div className="plan-activity-report__head">
        <span className="plan-activity-report__number">{activityNumber}</span>
        <strong>Actividad {activityNumber}</strong>
      </div>
      <div className="plan-activity-report__meta">
        <PlanMeta label={ACTION_FIELD_LABELS.idActividad} value={activityCode} />
        <PlanMeta label={ACTION_FIELD_LABELS.actividad} value={activity.actividad} multiline />
        <PlanMeta label={ACTION_FIELD_LABELS.fechaApertura} value={formatDate(activity.fechaApertura)} />
        <PlanMeta label={ACTION_FIELD_LABELS.fechaCierre} value={formatDate(activity.fechaCierre)} />
        <PlanMeta label={ACTION_FIELD_LABELS.responsable} value={activity.responsable} />
        <div className="plan-meta">
          <span>{ACTION_FIELD_LABELS.evidencia}</span>
          <EvidenceLink url={activity.evidencia} />
        </div>
      </div>
      <div className="plan-control-list">
        <PlanControlRow
          chip={<span className="control-chip">Ejecución</span>}
          date={formatDate(activity.revisionFecha)}
          observation={activity.revisionObservacion}
          dateLabel={ACTION_FIELD_LABELS.revisionFecha}
          observationLabel={ACTION_FIELD_LABELS.revisionObservacion}
        />
        <PlanControlRow
          chip={<span className="control-chip control-chip--validation">Validación</span>}
          date={formatDate(activity.validacionFecha)}
          observation={activity.validacionObservacion}
          responsible={activity.validacionResponsable}
          responsibleLabel={ACTION_FIELD_LABELS.validacionResponsable}
          dateLabel={ACTION_FIELD_LABELS.validacionFecha}
          observationLabel={ACTION_FIELD_LABELS.validacionObservacion}
        />
      </div>
    </article>
  );
}

function PlanMeta({ label, value, multiline = false }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div className={`plan-meta ${multiline ? 'plan-meta--multiline' : ''}`}>
      <span>{label}</span>
      <strong>{value || 'Sin registrar'}</strong>
    </div>
  );
}

function EvidenceLink({ url }: { url: string }) {
  const href = url.trim();
  if (!href) return <strong>Sin registrar</strong>;
  if (!/^https?:\/\//i.test(href)) return <strong>Sin enlace</strong>;
  return (
    <a className="button button--secondary plan-evidence-link" href={href} rel="noreferrer" target="_blank">
      <ExternalLink aria-hidden size={16} />
      Abrir evidencia
    </a>
  );
}

function PlanControlRow({
  chip,
  responsible,
  date,
  observation,
  responsibleLabel,
  dateLabel,
  observationLabel,
}: {
  chip: ReactNode;
  responsible?: string;
  date: string;
  observation: string;
  responsibleLabel?: string;
  dateLabel: string;
  observationLabel: string;
}) {
  return (
    <div className="plan-control-row">
      <div className={`plan-control-row__head ${responsibleLabel ? '' : 'plan-control-row__head--compact'}`}>
        <div className="plan-control-row__type">{chip}</div>
        {responsibleLabel ? (
          <div className="plan-control-row__person">
            <span>{responsibleLabel}</span>
            <strong>{responsible || 'Sin registrar'}</strong>
          </div>
        ) : null}
        <div className="plan-control-row__date">
          <span>{dateLabel}</span>
          <strong>{date || 'Sin registrar'}</strong>
        </div>
      </div>
      <div className="plan-control-row__observation">
        <span>{observationLabel}</span>
        <p>{observation || 'Sin registrar'}</p>
      </div>
    </div>
  );
}

function FinalEvaluationSection({ action }: { action: CorrectiveAction }) {
  return (
    <DetailSection
      icon={ShieldCheck}
      title={getEvaluationSectionTitle(action.auditorInterno)}
      fields={[
        { label: ACTION_FIELD_LABELS.fechaEvaluacion, value: formatDate(action.fechaEvaluacion) },
        { label: getEffectivenessLabel(action.auditorInterno), value: action.eficacia },
        { label: ACTION_FIELD_LABELS.evaluacionObservacion, value: action.evaluacionObservacion, wide: true },
      ]}
    />
  );
}

function SectionHeading({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="detail-section-heading">
      <span className="detail-section-heading__icon">
        <Icon aria-hidden size={18} />
      </span>
      <div>
        <h3>{title}</h3>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
    </div>
  );
}

function DetailValue({ field }: { field: DetailField }) {
  return (
    <div className={`detail-value ${field.wide ? 'detail-value--wide' : ''}`}>
      <span>{field.label}</span>
      <p>{field.value || 'Sin registrar'}</p>
    </div>
  );
}

function buildPlanActivities(action: CorrectiveAction): ImprovementPlanActivity[] {
  if (action.planMejoramiento?.length) {
    return action.planMejoramiento.filter(
      (activity) =>
        activity.actividad ||
        activity.responsable ||
        activity.revisionObservacion ||
        activity.observacionRevision ||
        activity.validacionObservacion ||
        activity.evidencia ||
        activity.fechaApertura ||
        activity.fechaCierre,
    );
  }
  return [
    {
      actividad: action.accion,
      fechaApertura: action.fechaApertura,
      fechaCierre: action.fechaCierre,
      presupuesto: action.presupuesto,
      responsable: action.responsable,
      revisionResponsable: action.revisionResponsable,
      revisionFecha: action.revisionFecha,
      revisionObservacion: action.revisionObservacion,
      observacionRevision: '',
      validacionResponsable: action.validacionResponsable,
      validacionFecha: action.validacionFecha,
      validacionObservacion: action.validacionObservacion,
      evidencia: action.evidencia,
    },
  ];
}

function getActivityCode(actionId: number, activity: ImprovementPlanActivity, index: number): string {
  return activity.idActividad || `${actionId}-${String(activity.numeroActividad || index + 1).padStart(3, '0')}`;
}

function areActivitiesReadyForOci(action: CorrectiveAction): boolean {
  const activities = buildPlanActivities(action);
  return (
    activities.length > 0 &&
    activities.every(
      (activity) =>
        activity.revisionFecha &&
        (activity.revisionObservacion ?? '').trim() &&
        (activity.validacionResponsable ?? '').trim() &&
        activity.validacionFecha &&
        (activity.validacionObservacion ?? '').trim(),
    )
  );
}

function getLastActivity(action: CorrectiveAction): string {
  if (action.fechaEvaluacion || action.evaluacionObservacion) return 'Evaluación de las Actividades';
  if (action.validacionFecha || action.validacionObservacion) return 'Validación de Actividades';
  if (action.revisionFecha || action.revisionObservacion) return 'Revisión de Actividades';
  return 'Registro del Mejoramiento';
}
