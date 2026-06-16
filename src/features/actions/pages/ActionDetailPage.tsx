import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardCheck,
  FileText,
  ListChecks,
  Network,
  Pencil,
  Send,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import { LoadingState } from '@/components/feedback/LoadingState';
import { actionQueries } from '@/features/actions/api/actionQueries';
import { apiClient } from '@/services/apiClient';
import { useAuth } from '@/features/auth/AuthContext';
import type { CorrectiveAction, DefinitiveCause, ImprovementPlanActivity, ImprovementTeamMember } from '@/features/actions/types';
import { formatDate } from '@/utils/date';
import { formatCurrency } from '@/utils/format';

type DetailField = {
  label: string;
  value: string;
  wide?: boolean;
};

export function ActionDetailPage() {
  const id = Number(useParams().id);
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

  if (actionQuery.isLoading) return <LoadingState label="Cargando accion..." />;
  if (actionQuery.isError) return <ErrorMessage error={actionQuery.error} />;
  if (!actionQuery.data) return <ErrorMessage error={new Error('Accion no encontrada.')} />;

  const action = actionQuery.data;
  const effectivenessStatus =
    action.eficacia === 'SI' ? 'EFICAZ' : action.eficacia === 'NO' ? 'NO EFICAZ' : 'SIN EVALUAR';
  const lastActivity = getLastActivity(action);
  const canNotifyOci = Boolean((user?.permissions.canNotifyOci || user?.permissions.canAdmin) && !action.correoEnviado);

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
            <Link className="button button--primary" to={`/acciones/${action.id}/editar`}>
              <Pencil aria-hidden size={18} />
              Editar
            </Link>
          </>
        }
      />
      {notifyOci.isError ? <ErrorMessage error={notifyOci.error} /> : null}

      <section className="record-overview">
        <div className="record-overview__main">
          <span className="record-overview__eyebrow">Mejoramiento Continuo</span>
          <h3>Registro de seguimiento #{action.id}</h3>
          <p>{action.descripcion || 'Sin descripcion registrada.'}</p>
        </div>
        <div className="record-overview__status">
          <StatusBadge action={action} />
          <StatusBadge status={effectivenessStatus} />
        </div>
        <div className="record-overview__grid">
          <SummaryItem label="Cod" value="000-00-06" />
          <SummaryItem label="Sistema de Gestion" value="S I P L A G" />
          <SummaryItem label="Fecha de Inicio" value={formatDate(action.fechaElaboracion)} />
          <SummaryItem label="Fecha de Cierre" value={formatDate(action.fechaCierre)} />
        </div>
      </section>

      <DetailSection
        icon={FileText}
        title="Datos del Mejoramiento"
        subtitle="Encabezado principal del registro, tal como se consulta en la impresion de NeoGestion."
        fields={[
          { label: 'Mejoramiento', value: String(action.id) },
          { label: 'Sistema de Gestion', value: 'S I P L A G' },
          { label: 'Clase', value: action.origen },
          { label: 'Tipo', value: action.tipoAccion },
          { label: 'Proceso', value: action.proceso },
          { label: 'De', value: action.identificadoPor },
          { label: 'Para', value: action.liderProceso },
          { label: 'Estado', value: action.estado },
          { label: 'Auditor', value: action.auditorInterno },
        ]}
      />

      <DetailSection
        icon={ClipboardCheck}
        title="Descripcion"
        fields={[
          { label: 'Descripcion', value: action.descripcion, wide: true },
          { label: 'Adjuntos / Evidencia', value: action.evidencia, wide: true },
        ]}
      />

      <DetailSection
        icon={ShieldCheck}
        title="Accion de Contencion"
        fields={[
          { label: 'Responsable de Seguimiento', value: action.responsable },
          { label: 'Descripcion de la Accion de Contencion', value: action.correccion, wide: true },
          { label: 'Fecha', value: formatDate(action.revisionFecha) },
          { label: 'Respuesta a la Accion de Contencion', value: action.revisionObservacion, wide: true },
        ]}
      />

      <MembersSection action={action} />

      <DetailSection
        icon={Network}
        title="BRAINSTORMING - Definicion de Causas Potenciales"
        fields={[
          { label: 'Causa', value: action.identificacionCausas, wide: true },
          { label: 'Descripcion', value: action.causaRaiz, wide: true },
          { label: 'Empleado', value: action.identificadoPor },
        ]}
      />

      <DefinitiveCausesSection action={action} />

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

function MembersSection({ action }: { action: CorrectiveAction }) {
  const members = buildTeamMembers(action);

  return (
    <section className="detail-card">
      <SectionHeading icon={Users} title="Miembros del Equipo de Mejoramiento Continuo" />
      <div className="table-wrap improvement-table-wrap">
        <table className="data-table improvement-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Previas</th>
              <th>Votacion</th>
            </tr>
          </thead>
          <tbody>
            {members.length ? (
              members.map((member, index) => (
                <tr key={`${member.nombre}-${index}`}>
                  <td>{member.nombre || 'Sin registrar'}</td>
                  <td>{member.previas || 'Sin registrar'}</td>
                  <td>{member.votacion || 'Sin registrar'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3}>Sin registrar</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DefinitiveCausesSection({ action }: { action: CorrectiveAction }) {
  const causes = buildDefinitiveCauses(action);

  return (
    <section className="detail-card">
      <SectionHeading icon={ListChecks} title="Definicion de Causas Definitivas" />
      <div className="table-wrap improvement-table-wrap">
        <table className="data-table improvement-table">
          <thead>
            <tr>
              <th>Causa</th>
              <th>Descripcion</th>
              <th>Votos</th>
              <th>Puntaje</th>
            </tr>
          </thead>
          <tbody>
            {causes.map((cause, index) => (
              <tr key={`${cause.causa}-${index}`}>
                <td>{cause.causa || 'Sin registrar'}</td>
                <td>{cause.descripcion || 'Sin registrar'}</td>
                <td>{cause.votos}</td>
                <td>{cause.puntaje.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
        title="Plan de Mejoramiento"
        subtitle="Actividad, responsables, fechas, presupuesto y controles asociados al seguimiento."
      />
      <div className="table-wrap improvement-table-wrap">
        <table className="data-table improvement-table plan-table">
          <thead>
            <tr>
              <th>Actividad</th>
              <th>Apertura</th>
              <th>Cierre</th>
              <th>Presupuesto</th>
              <th>Tipo</th>
              <th>Responsables</th>
              <th>Fecha Control</th>
              <th>Observacion</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((activity, index) => (
              <PlanActivityRows activity={activity} key={`${activity.actividad}-${index}`} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PlanActivityRows({ activity }: { activity: ImprovementPlanActivity }) {
  return (
    <>
      <tr>
        <td rowSpan={2}>
          <strong>{activity.actividad || 'Sin registrar'}</strong>
        </td>
        <td rowSpan={2}>{formatDate(activity.fechaApertura)}</td>
        <td rowSpan={2}>{formatDate(activity.fechaCierre)}</td>
        <td rowSpan={2}>{formatCurrency(activity.presupuesto)}</td>
        <td>
          <span className="control-chip">Rev</span>
        </td>
        <td>{activity.revisionResponsable || activity.responsable || 'Sin registrar'}</td>
        <td>{formatDate(activity.revisionFecha)}</td>
        <td>{activity.revisionObservacion || 'Sin registrar'}</td>
      </tr>
      <tr>
        <td>
          <span className="control-chip control-chip--validation">Val</span>
        </td>
        <td>{activity.validacionResponsable || 'Sin registrar'}</td>
        <td>{formatDate(activity.validacionFecha)}</td>
        <td>{activity.validacionObservacion || 'Sin registrar'}</td>
      </tr>
    </>
  );
}

function FollowUpSection({ action }: { action: CorrectiveAction }) {
  const items = [
    {
      label: 'Revision',
      person: action.revisionResponsable,
      date: formatDate(action.revisionFecha),
      text: action.revisionObservacion,
    },
    {
      label: 'Validacion',
      person: action.validacionResponsable,
      date: formatDate(action.validacionFecha),
      text: action.validacionObservacion,
    },
    {
      label: 'Evaluacion de las Actividades',
      person: action.auditorInterno,
      date: formatDate(action.fechaEvaluacion),
      text: action.evaluacionObservacion,
    },
  ];

  return (
    <section className="detail-card">
      <SectionHeading icon={ShieldCheck} title="Revision, Validacion y Evaluacion de Actividades" />
      <div className="follow-up-grid">
        {items.map((item) => (
          <article className="follow-up-card" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.person || 'Sin responsable'}</strong>
            <small>{item.date}</small>
            <p>{item.text || 'Sin observacion registrada.'}</p>
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

function splitList(value: string): string[] {
  return value
    .split(/\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildTeamMembers(action: CorrectiveAction): ImprovementTeamMember[] {
  if (action.equipoMejoramientoDetalle?.length) {
    return action.equipoMejoramientoDetalle.filter((member) => member.nombre || member.previas || member.votacion);
  }
  return splitList(action.equipoMejoramiento).map((member) => ({
    nombre: member,
    previas: '',
    votacion: '',
  }));
}

function buildDefinitiveCauses(action: CorrectiveAction): DefinitiveCause[] {
  if (action.causasDefinitivas?.length) {
    return action.causasDefinitivas.filter((cause) => cause.causa || cause.descripcion || cause.votos || cause.puntaje);
  }
  return [
    {
      causa: action.causaRaiz,
      descripcion: action.correccion,
      votos: action.causaRaiz ? 1 : 0,
      puntaje: action.causaRaiz ? 1 : 0,
    },
  ];
}

function buildPlanActivities(action: CorrectiveAction): ImprovementPlanActivity[] {
  if (action.planMejoramiento?.length) {
    return action.planMejoramiento.filter(
      (activity) =>
        activity.actividad ||
        activity.responsable ||
        activity.revisionObservacion ||
        activity.validacionObservacion ||
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
      validacionResponsable: action.validacionResponsable,
      validacionFecha: action.validacionFecha,
      validacionObservacion: action.validacionObservacion,
    },
  ];
}

function getLastActivity(action: CorrectiveAction): string {
  if (action.fechaEvaluacion || action.evaluacionObservacion) return 'Evaluacion de las Actividades';
  if (action.validacionFecha || action.validacionObservacion) return 'Validacion de Actividades';
  if (action.revisionFecha || action.revisionObservacion) return 'Revision de Actividades';
  return 'Registro del Mejoramiento';
}
