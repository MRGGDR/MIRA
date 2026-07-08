import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  ClipboardCheck,
  ExternalLink,
  FileText,
  ListChecks,
  Network,
  Pencil,
  Send,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import { FeedbackMessage, type FeedbackMessageState } from '@/components/feedback/FeedbackMessage';
import { LoadingState } from '@/components/feedback/LoadingState';
import { actionQueries } from '@/features/actions/api/actionQueries';
import { apiClient } from '@/services/apiClient';
import { useAuth } from '@/features/auth/AuthContext';
import type { CorrectiveAction, ImprovementPlanActivity } from '@/features/actions/types';
import { isActionPendingForRole } from '@/features/actions/utils/workflow';
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

  const action = actionQuery.data;
  const effectivenessStatus =
    action.eficacia === 'SI' ? 'EFICAZ' : action.eficacia === 'NO' ? 'NO EFICAZ' : 'SIN EVALUAR';
  const lastActivity = getLastActivity(action);
  const activityCodes = buildPlanActivities(action).map((activity, index) => getActivityCode(action.id, activity, index)).join(', ');
  const readyForOci = areActivitiesReadyForOci(action);
  const canNotifyOci = Boolean((user?.permissions.canNotifyOci || user?.permissions.canAdmin) && !action.correoEnviado && readyForOci);
  const canEditAction = Boolean(
    user?.permissions.canAdmin ||
      isActionPendingForRole(action, user?.rol) ||
      (user?.rol === 'CREADOR' && user.permissions.canUpdate && action.estado !== 'CERRADA' && action.estadoActual !== 'CERRADA') ||
      (user?.rol === 'REV' && user.permissions.canEditPlan && action.estadoActual !== 'CERRADA'),
  );
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
          <SummaryItem label="Código" value={activityCodes} />
          <SummaryItem label="Sistema de Gestión" value="S I P L A G" />
          <SummaryItem label="Fecha de Inicio" value={formatDate(action.fechaElaboracion)} />
          <SummaryItem label="Fecha de Cierre" value={formatDate(action.fechaCierre)} />
        </div>
      </section>

      <DetailSection
        icon={FileText}
        title="Datos del Mejoramiento"
        subtitle="Encabezado principal del registro, tal como se consulta en la impresión de NeoGestión."
        fields={[
          { label: 'Mejoramiento', value: String(action.id) },
          { label: 'Sistema de Gestión', value: 'S I P L A G' },
          { label: 'Clase', value: action.origen },
          { label: 'Tipo', value: action.tipoAccion },
          { label: 'Proceso', value: action.proceso },
          { label: 'De', value: action.identificadoPor },
          { label: 'Para', value: action.liderProceso },
          { label: 'Estado', value: action.estado },
          { label: 'Evaluador', value: action.auditorInterno },
        ]}
      />

      <DetailSection
        icon={ClipboardCheck}
        title="Descripción"
        fields={[
          { label: 'Descripción', value: action.descripcion, wide: true },
        ]}
      />

      <DetailSection
        icon={ShieldCheck}
        title="Acción de Contención"
        fields={[
          { label: 'Descripción de la Acción de Contención', value: action.accionContencion, wide: true },
        ]}
      />

      <DetailSection
        icon={Network}
        title="BRAINSTORMING - Definición de Causas Potenciales"
        fields={[
          { label: 'Causa', value: action.identificacionCausas, wide: true },
          { label: 'Descripción', value: action.causaRaiz, wide: true },
          { label: 'Empleado', value: action.identificadoPor },
        ]}
      />

      <PlanSection action={action} />

      <FollowUpSection action={action} />

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

  return (
    <section className="detail-card">
      <SectionHeading
        icon={ListChecks}
        title="Plan de actividades"
        subtitle="Actividades, responsables, ejecución, evidencias y validación."
      />
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
        <span className="action-id">{activityCode}</span>
        <strong>{activity.actividad || 'Sin registrar'}</strong>
      </div>
      <div className="plan-activity-report__meta">
        <PlanMeta label="Inicio" value={formatDate(activity.fechaApertura)} />
        <PlanMeta label="Fin" value={formatDate(activity.fechaCierre)} />
        <div className="plan-meta">
          <span>Evidencia</span>
          <EvidenceLink url={activity.evidencia} />
        </div>
      </div>
      <div className="plan-control-list">
        <PlanControlRow
          chip={<span className="control-chip">Ejecución</span>}
          date={formatDate(activity.revisionFecha)}
          observation={activity.revisionObservacion}
          responsible={activity.responsable}
        />
        <PlanControlRow
          chip={<span className="control-chip control-chip--review">REV</span>}
          date={formatDate(activity.revisionFecha)}
          observation={activity.observacionRevision}
          responsible={activity.revisionResponsable || activity.responsable}
        />
        <PlanControlRow
          chip={<span className="control-chip control-chip--validation">Val</span>}
          date={formatDate(activity.validacionFecha)}
          observation={activity.validacionObservacion}
          responsible={activity.validacionResponsable}
        />
      </div>
    </article>
  );
}

function PlanMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="plan-meta">
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
}: {
  chip: ReactNode;
  responsible: string;
  date: string;
  observation: string;
}) {
  return (
    <div className="plan-control-row">
      <div className="plan-control-row__head">
        <div className="plan-control-row__type">{chip}</div>
        <div className="plan-control-row__person">
          <span>Responsable</span>
          <strong>{responsible || 'Sin registrar'}</strong>
        </div>
        <div className="plan-control-row__date">
          <span>Fecha</span>
          <strong>{date || 'Sin registrar'}</strong>
        </div>
      </div>
      <div className="plan-control-row__observation">
        <span>Observación</span>
        <p>{observation || 'Sin registrar'}</p>
      </div>
    </div>
  );
}

function FollowUpSection({ action }: { action: CorrectiveAction }) {
  const items = [
    {
      label: 'Revisión',
      person: action.revisionResponsable,
      date: formatDate(action.revisionFecha),
      text: action.revisionObservacion,
    },
    {
      label: 'Validación',
      person: action.validacionResponsable,
      date: formatDate(action.validacionFecha),
      text: action.validacionObservacion,
    },
    {
      label: 'Evaluación de las Actividades',
      person: action.auditorInterno,
      date: formatDate(action.fechaEvaluacion),
      text: action.evaluacionObservacion,
    },
  ];

  return (
    <section className="detail-card">
      <SectionHeading icon={ShieldCheck} title="Revisión, Validación y Evaluación de Actividades" />
      <div className="follow-up-grid">
        {items.map((item) => (
          <article className="follow-up-card" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.person || 'Sin responsable'}</strong>
            <small>{item.date}</small>
            <p>{item.text || 'Sin observación registrada.'}</p>
          </article>
        ))}
      </div>
    </section>
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
        (activity.observacionRevision ?? '').trim() &&
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
