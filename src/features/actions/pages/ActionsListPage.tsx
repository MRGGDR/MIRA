import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eraser,
  Eye,
  FilePlus2,
  ListFilter,
  Pencil,
  Search,
  UserCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AccessContextBanner } from '@/components/common/AccessContextBanner';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import { getProcessName, getProcessNamesForAccess } from '@/config/processes';
import { actionQueries } from '@/features/actions/api/actionQueries';
import type { ActionFilters, CorrectiveAction, CurrentUser, DocumentState } from '@/features/actions/types';
import { getVisualStatus, isActionExpired } from '@/features/actions/utils/status';
import {
  buildWorkflowRoleQueues,
  buildWorkflowTrafficLight,
  getWorkflowStage,
  isActionPendingForRole,
  WORKFLOW_STAGES,
} from '@/features/actions/utils/workflow';
import { useAuth } from '@/features/auth/AuthContext';
import { formatDate } from '@/utils/date';
import { compactText, uniqueOptionSorted } from '@/utils/format';

const defaultFilters: ActionFilters = { page: 1, pageSize: 10 };
const statusLabels: Record<string, string> = {
  ABIERTA: 'Abierta',
  CERRADA: 'Cerrada',
  VENCIDA: 'Vencida',
};
const efficacyLabels: Record<string, string> = {
  SI: 'Eficaz',
  NO: 'No eficaz',
  SIN_EVALUAR: 'Sin evaluar',
};
const stageFilterLabels: Record<DocumentState, string> = Object.fromEntries(
  Object.entries(WORKFLOW_STAGES).map(([state, meta]) => [state, meta.label]),
) as Record<DocumentState, string>;

function countActiveFilters(filters: ActionFilters, stageFilter: string, scopedProcess: string): number {
  return [
    filters.id,
    filters.search,
    scopedProcess ? undefined : filters.proceso,
    filters.estado,
    filters.eficacia,
    filters.responsable,
    stageFilter,
  ].filter(Boolean).length;
}

function buildPageSummary(items: CorrectiveAction[]) {
  return {
    total: items.length,
    abiertas: items.filter((action) => getVisualStatus(action) === 'ABIERTA').length,
    cerradas: items.filter((action) => action.estado === 'CERRADA').length,
    vencidas: items.filter(isActionExpired).length,
  };
}

function buildFilterOptions(items: CorrectiveAction[]) {
  const efficacyValue = (action: CorrectiveAction) => action.eficacia || 'SIN_EVALUAR';

  return {
    ids: uniqueSorted(items.map((action) => String(action.id)), (value) => Number(value)),
    reports: uniqueSorted(items.map((action) => action.descripcion).filter(Boolean)),
    procesos: uniqueOptionSorted(items.map((action) => action.proceso).filter(Boolean)),
    estados: uniqueSorted(items.map((action) => getVisualStatus(action))),
    eficacias: uniqueSorted(items.map(efficacyValue)),
    responsables: uniqueSorted(items.map((action) => action.responsable).filter(Boolean)),
    etapas: uniqueSorted(items.map((action) => action.estadoActual).filter(Boolean)),
  };
}

function filterActionsClient(items: CorrectiveAction[], filters: ActionFilters, stageFilter: string) {
  return items.filter((action) => {
    if (filters.id && action.id !== Number(filters.id)) return false;
    if (stageFilter && action.estadoActual !== stageFilter) return false;
    if (filters.proceso && action.proceso !== filters.proceso) return false;
    if (filters.estado && getVisualStatus(action) !== filters.estado) return false;
    if (filters.eficacia === 'SIN_EVALUAR' && action.eficacia) return false;
    if (filters.eficacia && filters.eficacia !== 'SIN_EVALUAR' && action.eficacia !== filters.eficacia) return false;
    if (filters.responsable && action.responsable !== filters.responsable) return false;
    if (filters.search) {
      const text = [action.descripcion, action.accion, action.causaRaiz, action.responsable].join(' ').toLowerCase();
      if (!text.includes(filters.search.toLowerCase())) return false;
    }
    return true;
  });
}

function uniqueSorted<T extends string>(values: T[], sorter?: (value: T) => string | number): T[] {
  return Array.from(new Set(values)).sort((a, b) => {
    const left = sorter ? sorter(a) : a;
    const right = sorter ? sorter(b) : b;
    if (typeof left === 'number' && typeof right === 'number') return left - right;
    return String(left).localeCompare(String(right), 'es', { numeric: true, sensitivity: 'base' });
  });
}

function getDefaultStageForRole(role: string | undefined): DocumentState | '' {
  if (role === 'REV') return 'PLAN_ACCION';
  if (role === 'VAL') return 'VALIDACION';
  if (role === 'OCI') return 'REVISION_OCI';
  return '';
}

function canCreateReports(user: CurrentUser | null | undefined): boolean {
  return Boolean(user?.permissions.canAdmin || (user?.rol === 'CREADOR' && user.permissions.canCreate));
}

function canManageAction(action: CorrectiveAction, user: CurrentUser | null | undefined): boolean {
  if (!user) return false;
  if (user.permissions.canAdmin) return true;
  if (user.rol === 'CREADOR' && user.permissions.canUpdate && action.estado !== 'CERRADA' && action.estadoActual !== 'CERRADA') return true;
  if (user.rol === 'REV' && user.permissions.canEditPlan && action.estadoActual !== 'CERRADA') return true;
  return isActionPendingForRole(action, user.rol);
}

function hasGlobalProcessScope(user: CurrentUser | null | undefined): boolean {
  return Boolean(user?.permissions.canAdmin || user?.rol === 'OCI');
}

export function ActionsListPage() {
  const { user } = useAuth();
  const defaultStageForRole = getDefaultStageForRole(user?.rol);
  const [draftFilters, setDraftFilters] = useState<ActionFilters>(defaultFilters);
  const [filters, setFilters] = useState<ActionFilters>(defaultFilters);
  const [draftStageFilter, setDraftStageFilter] = useState<DocumentState | ''>(defaultStageForRole);
  const [stageFilter, setStageFilter] = useState<DocumentState | ''>(defaultStageForRole);
  const allActionsQuery = useQuery(actionQueries.all());
  const canCreate = canCreateReports(user);
  const scopedProcess = hasGlobalProcessScope(user) ? '' : (getProcessNamesForAccess(user?.proceso ?? '')[0] ?? '');
  const effectiveProcessFilter = scopedProcess || filters.proceso || '';
  const effectiveDraftProcessFilter = scopedProcess || draftFilters.proceso || '';

  const activeFilters = countActiveFilters(filters, stageFilter, scopedProcess);
  const sourceItems = useMemo(() => allActionsQuery.data ?? [], [allActionsQuery.data]);
  const reportSummary = useMemo(() => buildPageSummary(sourceItems), [sourceItems]);
  const filterOptions = useMemo(() => buildFilterOptions(sourceItems), [sourceItems]);
  const filteredItems = useMemo(
    () => filterActionsClient(sourceItems, { ...filters, proceso: effectiveProcessFilter || undefined }, stageFilter),
    [effectiveProcessFilter, filters, sourceItems, stageFilter],
  );
  const roleQueues = useMemo(() => buildWorkflowRoleQueues(sourceItems), [sourceItems]);
  const trafficLight = useMemo(() => buildWorkflowTrafficLight(sourceItems, user?.rol), [sourceItems, user?.rol]);
  const myPendingItems = useMemo(
    () => sourceItems.filter((action) => isActionPendingForRole(action, user?.rol)),
    [sourceItems, user?.rol],
  );
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 10;
  const totalPages = Math.max(Math.ceil(filteredItems.length / pageSize), 1);
  const pageItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);
  const actionsQuery = {
    data: allActionsQuery.data
      ? {
          items: pageItems,
          page,
          pageSize,
          total: filteredItems.length,
          totalPages,
        }
      : undefined,
    isLoading: allActionsQuery.isLoading,
    isError: allActionsQuery.isError,
    error: allActionsQuery.error,
  };
  const showReportSkeleton = !allActionsQuery.data && allActionsQuery.isLoading;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters({ ...draftFilters, proceso: scopedProcess || draftFilters.proceso, page: 1 });
    setStageFilter(draftStageFilter);
  }

  function updateFilter(name: keyof ActionFilters, value: string) {
    setDraftFilters((current) => ({ ...current, [name]: value || undefined }));
  }

  function clearFilters() {
    setDraftFilters(scopedProcess ? { ...defaultFilters, proceso: scopedProcess } : defaultFilters);
    setFilters(scopedProcess ? { ...defaultFilters, proceso: scopedProcess } : defaultFilters);
    setDraftStageFilter('');
    setStageFilter('');
  }

  function filterByStage(stage: DocumentState | '') {
    setDraftStageFilter(stage);
    setStageFilter(stage);
    setFilters((current) => ({ ...current, page: 1 }));
  }

  function updateStatusQuickFilter(status: string) {
    setDraftFilters((current) => ({ ...current, estado: status }));
    setFilters((current) => ({ ...current, estado: status, page: 1 }));
  }

  return (
    <div className="stack report-page">
      <section className="report-hero" aria-label="Resumen del modulo de reporte">
        <div className="report-hero__content">
          <span className="report-hero__eyebrow">Gestion SIPLAG</span>
          <h3>Reporte y seguimiento en un solo flujo</h3>
          <p>
            {canCreate
              ? 'Crea nuevos reportes y consulta el seguimiento de las acciones registradas.'
              : 'Consulta las acciones disponibles para tu etapa y diligencia solo la parte que corresponde a tu rol.'}
          </p>
        </div>
        <div className="report-hero__actions">
          {canCreate ? (
            <Link className="button button--primary" to="/acciones/nueva">
              <FilePlus2 aria-hidden size={18} />
              Crear reporte
            </Link>
          ) : null}
          <a className="button button--secondary" href="#report-filters">
            <Search aria-hidden size={18} />
            {canCreate ? 'Buscar registro' : 'Ver disponibles'}
          </a>
        </div>
      </section>

      <AccessContextBanner user={user} surface="reportar" />

      {showReportSkeleton ? (
        <ReportLoadingSkeleton />
      ) : (
        <>
          {actionsQuery.data ? (
            <section className="report-summary-grid" aria-label="Resumen de reportes por estado">
              <ReportSummaryCard icon={ListFilter} tone="total" value={reportSummary.total} label="Total reportadas" />
              <ReportSummaryCard icon={Clock} tone="open" value={reportSummary.abiertas} label="Abiertas" />
              <ReportSummaryCard icon={CheckCircle2} tone="closed" value={reportSummary.cerradas} label="Cerradas" />
              <ReportSummaryCard icon={AlertTriangle} tone="expired" value={reportSummary.vencidas} label="Vencidas" />
            </section>
          ) : null}

          {actionsQuery.data ? (
            <section className="workflow-grid" aria-label="Semaforo y pendientes por rol">
              <WorkflowTrafficCard
                detail="Atencion inmediata"
                icon={AlertTriangle}
                label="Vencidas"
                tone="red"
                value={trafficLight.red}
                onClick={() => updateStatusQuickFilter('VENCIDA')}
              />
              <WorkflowTrafficCard
                detail={user?.rol === 'ADMIN' ? 'Todas las etapas abiertas' : `Rol ${user?.rol ?? 'sin rol'}`}
                icon={UserCheck}
                label="Mis pendientes"
                tone="yellow"
                value={trafficLight.yellow}
              />
              <WorkflowTrafficCard
                detail="Seguimiento sin vencer"
                icon={CheckCircle2}
                label="Abiertas al dia"
                tone="green"
                value={trafficLight.green}
                onClick={() => updateStatusQuickFilter('ABIERTA')}
              />
              <article className="workflow-card workflow-card--mine">
                <div>
                  <span className="workflow-card__eyebrow">Bandeja por rol</span>
                  <strong>{myPendingItems.length} reporte(s) para gestionar</strong>
                  <p>
                    {myPendingItems.length
                      ? 'Filtra por la etapa que requiere tu intervencion.'
                      : 'No tienes reportes pendientes en tu etapa actual.'}
                  </p>
                </div>
                <div className="workflow-card__actions">
                  {roleQueues.map((queue) => (
                    <button
                      className={`workflow-role-chip ${queue.items.some((action) => isActionPendingForRole(action, user?.rol)) ? 'workflow-role-chip--mine' : ''}`}
                      key={queue.role}
                      type="button"
                      onClick={() => filterByStage(queue.states[0])}
                    >
                      <span>{queue.label}</span>
                      <strong>{queue.items.length}</strong>
                    </button>
                  ))}
                </div>
              </article>
            </section>
          ) : null}

      <form id="report-filters" className="card card__body report-filters" onSubmit={submit}>
        <div className="report-section-head">
          <div>
            <h3 className="section-title">Consultar reportes</h3>
            <p className="muted">Combina filtros para encontrar acciones por número, proceso, responsable o estado.</p>
          </div>
          <span className="report-filter-count">{activeFilters} filtro(s) activo(s)</span>
        </div>

        <div className="form-grid report-filter-grid">
          <div className="form-field">
            <label htmlFor="filter-id">Número exacto</label>
            <select id="filter-id" value={draftFilters.id ?? ''} onChange={(event) => updateFilter('id', event.target.value)}>
              <option value="">Todos</option>
              {filterOptions.ids.map((id) => (
                <option key={id} value={id}>
                  #{id}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="filter-search">Reporte</label>
            <select id="filter-search" value={draftFilters.search ?? ''} onChange={(event) => updateFilter('search', event.target.value)}>
              <option value="">Todos</option>
              {filterOptions.reports.map((report) => (
                <option key={report} value={report}>
                  {compactText(report, 80)}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="filter-process">Proceso</label>
            <select
              id="filter-process"
              value={effectiveDraftProcessFilter}
              disabled={Boolean(scopedProcess)}
              onChange={(event) => updateFilter('proceso', event.target.value)}
            >
              {!scopedProcess ? <option value="">Todos</option> : null}
              {(scopedProcess ? [scopedProcess] : filterOptions.procesos).map((process) => {
                const processName = getProcessName(process);
                return (
                  <option key={process} value={process}>
                    {process === processName ? process : `${process} - ${processName}`}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="filter-status">Estado</label>
            <select id="filter-status" value={draftFilters.estado ?? ''} onChange={(event) => updateFilter('estado', event.target.value)}>
              <option value="">Todos</option>
              {filterOptions.estados.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status] ?? status}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="filter-efficacy">Eficacia</label>
            <select id="filter-efficacy" value={draftFilters.eficacia ?? ''} onChange={(event) => updateFilter('eficacia', event.target.value)}>
              <option value="">Todas</option>
              {filterOptions.eficacias.map((efficacy) => (
                <option key={efficacy} value={efficacy}>
                  {efficacyLabels[efficacy] ?? efficacy}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="filter-responsible">Responsable</label>
            <select
              id="filter-responsible"
              value={draftFilters.responsable ?? ''}
              onChange={(event) => updateFilter('responsable', event.target.value)}
            >
              <option value="">Todos</option>
              {filterOptions.responsables.map((responsible) => (
                <option key={responsible} value={responsible}>
                  {responsible}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="filter-stage">Etapa del flujo</label>
            <select id="filter-stage" value={draftStageFilter} onChange={(event) => setDraftStageFilter(event.target.value as DocumentState | '')}>
              <option value="">Todas</option>
              {filterOptions.etapas.map((stage) => (
                <option key={stage} value={stage}>
                  {stageFilterLabels[stage] ?? stage}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="actions-row" style={{ marginTop: 16 }}>
          <button className="button button--primary" type="submit">
            <Search aria-hidden size={18} />
            Buscar
          </button>
          <button className="button button--secondary" type="button" onClick={clearFilters}>
            <Eraser aria-hidden size={18} />
            Limpiar filtros
          </button>
        </div>
      </form>

      {actionsQuery.isError ? <ErrorMessage error={actionsQuery.error} /> : null}
      {actionsQuery.data ? (
        <section className="card card__body report-results">
          <div className="report-section-head">
            <div>
              <h3 className="section-title">Registros encontrados</h3>
              <p className="muted">
                {actionsQuery.data.total} resultado(s) para los filtros actuales.
              </p>
            </div>
            {canCreate ? (
              <Link className="button button--secondary" to="/acciones/nueva">
                <FilePlus2 aria-hidden size={16} />
                Reportar nuevo
              </Link>
            ) : null}
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Elaboracion</th>
                  <th>Proceso</th>
                  <th>Tipo de acción</th>
                  <th>Reporte</th>
                  <th>Responsable</th>
                  <th>Fecha fin</th>
                  <th>Estado</th>
                  <th>Etapa</th>
                  <th>Eficacia</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {actionsQuery.data.items.length === 0 ? (
                  <tr>
                    <td colSpan={11}>
                      <div className="empty-state">
                        <strong>No hay reportes para estos filtros.</strong>
                        <span>
                          {canCreate
                            ? 'Ajusta la búsqueda o registra una nueva acción.'
                            : 'Ajusta la búsqueda o espera a que una acción llegue a tu etapa.'}
                        </span>
                        {canCreate ? (
                          <Link className="button button--primary" to="/acciones/nueva">
                            <FilePlus2 aria-hidden size={16} />
                            Reportar acción
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ) : (
                  actionsQuery.data.items.map((action) => (
                    <tr className="data-table__row" key={action.id}>
                      <td>
                        <span className="action-id">#{action.id}</span>
                      </td>
                      <td>{formatDate(action.fechaElaboracion)}</td>
                      <td>
                        <span className="process-badge">{action.proceso}</span>
                      </td>
                      <td>{action.tipoAccion}</td>
                      <td>
                        <p className="report-description">{compactText(action.descripcion, 120)}</p>
                      </td>
                      <td>{action.responsable || 'Sin responsable'}</td>
                      <td>{formatDate(action.fechaFinAccion)}</td>
                      <td>
                        <StatusBadge action={action} />
                      </td>
                      <td>
                        <WorkflowStageBadge action={action} />
                      </td>
                      <td>
                        <StatusBadge status={action.eficacia === 'SI' ? 'EFICAZ' : action.eficacia === 'NO' ? 'NO EFICAZ' : 'SIN EVALUAR'} />
                      </td>
                      <td>
                        <div className="actions-row report-table-actions">
                          <Link className="button button--secondary" to={`/acciones/${action.id}`} aria-label={`Ver acción ${action.id}`}>
                            <Eye aria-hidden size={16} />
                          </Link>
                          {canManageAction(action, user) ? (
                            <Link className="button button--secondary" to={`/acciones/${action.id}/editar`} aria-label={`Gestionar acción ${action.id}`}>
                              <Pencil aria-hidden size={16} />
                            </Link>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="actions-row" style={{ marginTop: 16 }}>
            <button
              className="button button--secondary"
              type="button"
              disabled={(filters.page ?? 1) <= 1}
              onClick={() => setFilters((current) => ({ ...current, page: (current.page ?? 1) - 1 }))}
            >
              Anterior
            </button>
            <span className="muted">
              Pagina {actionsQuery.data.page} de {actionsQuery.data.totalPages}
            </span>
            <button
              className="button button--secondary"
              type="button"
              disabled={actionsQuery.data.page >= actionsQuery.data.totalPages}
              onClick={() => setFilters((current) => ({ ...current, page: (current.page ?? 1) + 1 }))}
            >
              Siguiente
            </button>
          </div>
        </section>
      ) : null}
        </>
      )}
    </div>
  );
}

function WorkflowStageBadge({ action }: { action: CorrectiveAction }) {
  const stage = getWorkflowStage(action);
  return (
    <span className={`workflow-stage workflow-stage--${stage.tone}`}>
      <span>{stage.shortLabel}</span>
      <small>{stage.ownerLabel}</small>
    </span>
  );
}

function WorkflowTrafficCard({
  tone,
  value,
  label,
  detail,
  icon: Icon,
  onClick,
}: {
  tone: 'red' | 'yellow' | 'green';
  value: number;
  label: string;
  detail: string;
  icon: LucideIcon;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className={`workflow-traffic__light workflow-traffic__light--${tone}`} />
      <span className="workflow-traffic__icon">
        <Icon aria-hidden size={18} />
      </span>
      <strong>{value}</strong>
      <span>{label}</span>
      <small>{detail}</small>
    </>
  );

  if (onClick) {
    return (
      <button className="workflow-traffic" type="button" onClick={onClick}>
        {content}
      </button>
    );
  }

  return <article className="workflow-traffic">{content}</article>;
}

function ReportLoadingSkeleton() {
  return (
    <section className="stack skeleton-page report-loading-skeleton" aria-busy="true" aria-live="polite">
      <section className="report-summary-grid" aria-label="Cargando resumen de reportes">
        {Array.from({ length: 4 }, (_, index) => (
          <article className="report-summary-card skeleton-block" key={index}>
            <span className="skeleton-icon" />
            <div>
              <span className="skeleton-line skeleton-line--metric" />
              <span className="skeleton-line skeleton-line--short" />
            </div>
          </article>
        ))}
      </section>

      <section className="card card__body report-filters skeleton-block">
        <div className="report-section-head">
          <div>
            <span className="skeleton-line skeleton-line--heading" />
            <span className="skeleton-line skeleton-line--wide" />
          </div>
          <span className="skeleton-pill" />
        </div>
        <div className="form-grid report-filter-grid">
          {Array.from({ length: 6 }, (_, index) => (
            <div className="form-field" key={index}>
              <span className="skeleton-line skeleton-line--label" />
              <span className="skeleton-select skeleton-select--full" />
            </div>
          ))}
        </div>
        <div className="actions-row" style={{ marginTop: 16 }}>
          <span className="skeleton-button" />
          <span className="skeleton-button skeleton-button--light" />
        </div>
      </section>

      <section className="card card__body report-results skeleton-block">
        <div className="report-section-head">
          <div>
            <span className="skeleton-line skeleton-line--heading" />
            <span className="skeleton-line skeleton-line--short" />
          </div>
          <span className="skeleton-button skeleton-button--light" />
        </div>
        <div className="table-wrap">
          <div className="skeleton-table" aria-hidden>
            {Array.from({ length: 6 }, (_, rowIndex) => (
              <div className="skeleton-table__row" key={rowIndex}>
                {Array.from({ length: 7 }, (_, cellIndex) => (
                  <span className="skeleton-line" key={cellIndex} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    </section>
  );
}

function ReportSummaryCard({
  icon: Icon,
  tone,
  value,
  label,
}: {
  icon: LucideIcon;
  tone: 'total' | 'open' | 'closed' | 'expired';
  value: number;
  label: string;
}) {
  return (
    <article className="report-summary-card">
      <span className={`report-summary-card__icon report-summary-card__icon--${tone}`}>
        <Icon aria-hidden size={18} />
      </span>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </article>
  );
}
