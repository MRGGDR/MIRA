import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  FilePlus2,
  Search,
  SlidersHorizontal,
  Target,
  TrendingUp,
  UserCheck,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Link } from 'react-router-dom';
import { AccessContextBanner } from '@/components/common/AccessContextBanner';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import { getProcessName, getProcessNamesForAccess, PROCESSES } from '@/config/processes';
import { actionQueries } from '@/features/actions/api/actionQueries';
import type { CorrectiveAction } from '@/features/actions/types';
import { getVisualStatus, isActionExpired } from '@/features/actions/utils/status';
import { buildWorkflowRoleQueues, buildWorkflowTrafficLight, isActionPendingForRole } from '@/features/actions/utils/workflow';
import { useAuth } from '@/features/auth/AuthContext';
import { compactText, uniqueOptionSorted } from '@/utils/format';

const DEFAULT_ORIGIN_OPTIONS = ['Auditoria externa', 'Auditoria interna', 'Entes de control', 'Indicadores', 'PQRS', 'Otro'];

const KPI_CONFIG = [
  {
    key: 'total',
    label: 'Total Acciones',
    sublabel: 'Registradas en sistema',
    icon: BarChart3,
    gradient: 'linear-gradient(135deg, #213362 0%, #07519D 100%)',
    accent: '#FFCD00',
    shadow: '0 8px 28px rgba(7,81,157,0.45)',
  },
  {
    key: 'abiertas',
    label: 'En Seguimiento',
    sublabel: 'Acciones abiertas activas',
    icon: Clock,
    gradient: 'linear-gradient(135deg, #C46800 0%, #EE7C00 100%)',
    accent: '#FFE183',
    shadow: '0 8px 28px rgba(238,124,0,0.45)',
  },
  {
    key: 'cerradas',
    label: 'Cerradas',
    sublabel: 'Acciones completadas',
    icon: CheckCircle2,
    gradient: 'linear-gradient(135deg, #1f5219 0%, #3a7d2e 100%)',
    accent: '#A8CF45',
    shadow: '0 8px 28px rgba(58,125,46,0.45)',
  },
  {
    key: 'vencidas',
    label: 'Vencidas',
    sublabel: 'Requieren atención urgente',
    icon: AlertTriangle,
    gradient: 'linear-gradient(135deg, #7a2e2e 0%, #A24646 100%)',
    accent: '#EECD6E',
    shadow: '0 8px 28px rgba(162,70,70,0.45)',
  },
] as const;

/* ─── Tooltip personalizado ─────────────────────────────────────────────── */
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      {label && <p className="chart-tooltip__label">{label}</p>}
      {payload.map((entry) => (
        <p key={entry.name} className="chart-tooltip__row" style={{ color: entry.color }}>
          <span>{entry.name}:</span> <strong>{entry.value}</strong>
        </p>
      ))}
    </div>
  );
}

/* ─── Leyenda personalizada del donut ───────────────────────────────────── */
function DonutLegend({ items }: { items: Array<{ label: string; value: number; color: string }> }) {
  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  return (
    <div className="donut-legend">
      {items.map((item) => (
        <div className="donut-legend__item" key={item.label}>
          <span className="donut-legend__dot" style={{ background: item.color }} />
          <span className="donut-legend__label">{item.label}</span>
          <span className="donut-legend__value">{item.value}</span>
          <span className="donut-legend__pct">{Math.round((item.value / total) * 100)}%</span>
        </div>
      ))}
    </div>
  );
}

function filterDashboardActions(
  actions: CorrectiveAction[],
  filters: { origen: string; estado: string; proceso: string; eficacia: string },
) {
  return actions.filter((action) => {
    if (filters.origen && action.origen !== filters.origen) return false;
    if (filters.proceso && action.proceso !== filters.proceso) return false;
    if (filters.estado && getVisualStatus(action) !== filters.estado) return false;
    if (filters.eficacia === 'SIN_EVALUAR' && action.eficacia) return false;
    if (filters.eficacia && filters.eficacia !== 'SIN_EVALUAR' && action.eficacia !== filters.eficacia) return false;
    return true;
  });
}

function buildDashboardStats(actions: CorrectiveAction[]) {
  const processTotals = new Map<string, number>();
  actions.forEach((action) => {
    processTotals.set(action.proceso, (processTotals.get(action.proceso) ?? 0) + 1);
  });

  return {
    total: actions.length,
    abiertas: actions.filter((action) => getVisualStatus(action) === 'ABIERTA').length,
    cerradas: actions.filter((action) => action.estado === 'CERRADA').length,
    vencidas: actions.filter(isActionExpired).length,
    eficaces: actions.filter((action) => action.eficacia === 'SI').length,
    noEficaces: actions.filter((action) => action.eficacia === 'NO').length,
    porProceso: Array.from(processTotals, ([proceso, total]) => ({ proceso, total })).sort((a, b) =>
      a.proceso.localeCompare(b.proceso, 'es', { numeric: true, sensitivity: 'base' }),
    ),
    recientes: [...actions].sort((a, b) => b.id - a.id).slice(0, 5),
  };
}

export function DashboardPage() {
  const [filterOrigen,  setFilterOrigen]  = useState('');
  const [filterEstado,  setFilterEstado]  = useState('');
  const [filterProceso, setFilterProceso] = useState('');
  const [filterEficacia, setFilterEficacia] = useState('');

  const actionsQuery = useQuery(actionQueries.all());
  const parametersQuery = useQuery(actionQueries.parameters());
  const { user } = useAuth();
  const hasGlobalProcessScope = Boolean(user?.permissions.canAdmin || user?.rol === 'OCI');
  const scopedProcess = hasGlobalProcessScope ? '' : (getProcessNamesForAccess(user?.proceso ?? '')[0] ?? '');
  const effectiveProcessFilter = scopedProcess || filterProceso;
  const hasFilters = Boolean(filterOrigen || filterEstado || filterEficacia || (!scopedProcess && filterProceso));

  const allActions = useMemo(() => actionsQuery.data ?? [], [actionsQuery.data]);
  const filteredActions = useMemo(
    () =>
      filterDashboardActions(allActions, {
        origen: filterOrigen,
        estado: filterEstado,
        proceso: effectiveProcessFilter,
        eficacia: filterEficacia,
      }),
    [allActions, effectiveProcessFilter, filterEficacia, filterEstado, filterOrigen],
  );
  const stats = useMemo(() => buildDashboardStats(filteredActions), [filteredActions]);
  const roleQueues = useMemo(() => buildWorkflowRoleQueues(allActions), [allActions]);
  const trafficLight = useMemo(() => buildWorkflowTrafficLight(allActions, user?.rol), [allActions, user?.rol]);
  const myPendingCount = useMemo(
    () => allActions.filter((action) => isActionPendingForRole(action, user?.rol)).length,
    [allActions, user?.rol],
  );

  if (actionsQuery.isLoading) return <DashboardSkeleton />;
  if (actionsQuery.isError) return <ErrorMessage error={actionsQuery.error} />;
  if (!actionsQuery.data) return <ErrorMessage error={new Error('No se recibieron acciones.')} />;

  const safeTotal = stats.total || 1;
  const originOptions = uniqueOptionSorted([
    ...(parametersQuery.data?.origenes ?? []),
    ...allActions.map((action) => action.origen),
    ...DEFAULT_ORIGIN_OPTIONS,
  ]);
  const processOptions = scopedProcess
    ? [scopedProcess]
    : uniqueOptionSorted([
        ...(parametersQuery.data?.procesos ?? []),
        ...allActions.map((action) => action.proceso),
        ...PROCESSES.map((process) => process.name),
      ]);

  const kpiValues = {
    total:    stats.total,
    abiertas: stats.abiertas,
    cerradas: stats.cerradas,
    vencidas: stats.vencidas,
  };
  const kpiTotal = kpiValues.total || 1;

  const closureRate = Math.round((stats.cerradas / safeTotal) * 100);
  const expiryRate = Math.round((stats.vencidas / safeTotal) * 100);
  const effectivenessRate =
    stats.cerradas > 0 ? Math.round((stats.eficaces / stats.cerradas) * 100) : 0;

  /* Chart data */
  const stateDonutData = [
    { label: 'Abiertas', value: stats.abiertas, color: '#EE7C00', filter: 'ABIERTA' },
    { label: 'Cerradas', value: stats.cerradas, color: '#3a7d2e', filter: 'CERRADA' },
    { label: 'Vencidas', value: stats.vencidas, color: '#A24646', filter: 'VENCIDA' },
  ];

  const sinEvaluar = Math.max(0, stats.cerradas - stats.eficaces - stats.noEficaces);
  const eficaciaDonutData = [
    { label: 'Eficaces', value: stats.eficaces, color: '#1B4472', filter: 'SI' },
    { label: 'No eficaces', value: stats.noEficaces, color: '#CD2180', filter: 'NO' },
    { label: 'Sin evaluar', value: sinEvaluar, color: '#D2D3D5', filter: 'SIN_EVALUAR' },
  ];

  const totalsByProcess = new Map(stats.porProceso.map((item) => [item.proceso, item.total]));
  const processChartData = processOptions.map((process) => ({
    proceso: process,
    total: totalsByProcess.get(process) ?? 0,
  }));

  const radialData = [
    { name: 'Tasa cierre', value: closureRate, fill: '#00AEE3', filter: 'CERRADA' },
    { name: 'Eficacia', value: effectivenessRate, fill: '#FFCD00', filter: 'SI' },
    { name: 'Vencimiento', value: expiryRate, fill: '#A24646', filter: 'VENCIDA' },
  ];

  function clearFilters() {
    setFilterOrigen('');
    setFilterEstado('');
    if (!scopedProcess) setFilterProceso('');
    setFilterEficacia('');
  }
  const dashboardFilterLoading = false;

  return (
    <div className="stack">
      <PageHeader
        title="MIRA"
        description="Seguimiento institucional de acciones correctivas, preventivas y de mejora — UNGRD."
        actions={
          <>
            <Link className="button button--primary" to="/acciones/nueva">
              <FilePlus2 aria-hidden size={16} />
              Reportar acción
            </Link>
            <Link className="button button--secondary" to="/acciones">
              <Search aria-hidden size={16} />
              Reportar
            </Link>
          </>
        }
      />

      {/* ── Filtros del Dashboard ───────────────────────────────────────── */}
      <AccessContextBanner user={user} surface="dashboard" />

      <div className="dash-filters">
        <div className="dash-filters__label">
          <SlidersHorizontal aria-hidden size={15} />
          <span>Filtrar</span>
        </div>
        <div className="dash-filters__controls">
          <div className="dash-filter-select">
            <label className="dash-filter-select__label" htmlFor="filter-origen">Origen</label>
            <select
              id="filter-origen"
              className="dash-filter-select__input"
              value={filterOrigen}
              onChange={e => setFilterOrigen(e.target.value)}
            >
              <option value="">Todos los orígenes</option>
              {originOptions.map(o => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>

          <div className="dash-filter-select">
            <label className="dash-filter-select__label" htmlFor="filter-proceso">Proceso</label>
            <select
              id="filter-proceso"
              className="dash-filter-select__input"
              value={effectiveProcessFilter}
              disabled={Boolean(scopedProcess)}
              onChange={e => setFilterProceso(e.target.value)}
            >
              {!scopedProcess ? <option value="">Todos los procesos</option> : null}
              {processOptions.map((p) => {
                const processName = getProcessName(p);
                return (
                  <option key={p} value={p}>
                    {p === processName ? p : `${p} - ${processName}`}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="dash-filter-select">
            <label className="dash-filter-select__label" htmlFor="filter-estado">Estado</label>
            <select
              id="filter-estado"
              className="dash-filter-select__input"
              value={filterEstado}
              onChange={e => setFilterEstado(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="ABIERTA">En Seguimiento</option>
              <option value="CERRADA">Cerrada</option>
              <option value="VENCIDA">Vencida</option>
            </select>
          </div>

          <div className="dash-filter-select">
            <label className="dash-filter-select__label" htmlFor="filter-eficacia">Eficacia</label>
            <select
              id="filter-eficacia"
              className="dash-filter-select__input"
              value={filterEficacia}
              onChange={e => setFilterEficacia(e.target.value)}
            >
              <option value="">Todas</option>
              <option value="SI">Eficaz</option>
              <option value="NO">No eficaz</option>
              <option value="SIN_EVALUAR">Sin evaluar</option>
            </select>
          </div>

          {hasFilters && (
            <>
              <div className="dash-filters__badge">
                {dashboardFilterLoading
                  ? 'Filtrando...'
                  : `${kpiValues.total} acción${kpiValues.total !== 1 ? 'es' : ''}`}
              </div>
              <button
                className="dash-filters__clear"
                onClick={clearFilters}
                type="button"
              >
                <X aria-hidden size={13} />
                Limpiar
              </button>
            </>
          )}
        </div>
      </div>


      {/* ── 4 KPI Cards ─────────────────────────────────────────────────── */}
      <section aria-label="Indicadores clave" className="kpi-grid">
        {KPI_CONFIG.map(({ key, label, sublabel, icon: Icon, gradient, accent, shadow }) => {
          const value = kpiValues[key];
          const pct = key === 'total' ? 100 : Math.round((value / kpiTotal) * 100);
          return (
            <article
              className="kpi-card"
              key={key}
              style={{ '--kpi-gradient': gradient, '--kpi-accent': accent, '--kpi-shadow': shadow } as React.CSSProperties}
            >
              <div className="kpi-card__top">
                <div className="kpi-card__icon-wrap">
                  <Icon aria-hidden size={26} />
                </div>
                <div className="kpi-card__dial" aria-hidden>
                  <svg viewBox="0 0 44 44" width="52" height="52">
                    <circle cx="22" cy="22" r="17" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="3.5" />
                    <circle
                      cx="22" cy="22" r="17"
                      fill="none"
                      stroke="var(--kpi-accent,#FFCD00)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeDasharray={`${(pct / 100) * 106.8} 106.8`}
                      transform="rotate(-90 22 22)"
                      style={{ filter: 'drop-shadow(0 0 4px var(--kpi-accent,#FFCD00))' }}
                    />
                  </svg>
                  <span className="kpi-card__dial-pct">{pct}%</span>
                </div>
              </div>
              <div className="kpi-card__value">{value}</div>
              <div className="kpi-card__label">{label}</div>
              <div className="kpi-card__desc">{sublabel}</div>
              <div className="kpi-card__bar">
                <div className="kpi-card__bar-fill" style={{ width: `${pct}%` }} />
              </div>
            </article>
          );
        })}
      </section>

      {/* ── Summary Strip ───────────────────────────────────────────────── */}
      <div className="summary-strip" aria-label="Resumen analítico">
        <div className="summary-item">
          <TrendingUp aria-hidden size={16} />
          <span>
            Tasa de cierre: <strong>{closureRate}%</strong>
          </span>
        </div>
        <div className="summary-divider" />
        <div className="summary-item">
          <Target aria-hidden size={16} />
          <span>
            Eficacia evaluada: <strong>{effectivenessRate}%</strong>
          </span>
        </div>
        <div className="summary-divider" />
        <div className="summary-item">
          <AlertTriangle aria-hidden size={16} />
          <span>
            Vencimiento: <strong>{expiryRate}%</strong>
          </span>
        </div>
        <div className="summary-divider" />
        <div className="summary-item">
          <BarChart3 aria-hidden size={16} />
          <span>
            Procesos: <strong>{stats.porProceso.length}</strong>
          </span>
        </div>
      </div>

      <section className="workflow-grid workflow-grid--dashboard" aria-label="Semaforo de flujo documental">
        <button className="workflow-traffic" type="button" onClick={() => setFilterEstado('VENCIDA')}>
          <span className="workflow-traffic__light workflow-traffic__light--red" />
          <span className="workflow-traffic__icon">
            <AlertTriangle aria-hidden size={18} />
          </span>
          <strong>{trafficLight.red}</strong>
          <span>Vencidas</span>
          <small>Atencion inmediata</small>
        </button>
        <article className="workflow-traffic">
          <span className="workflow-traffic__light workflow-traffic__light--yellow" />
          <span className="workflow-traffic__icon">
            <UserCheck aria-hidden size={18} />
          </span>
          <strong>{myPendingCount}</strong>
          <span>Mis pendientes</span>
          <small>{user?.rol === 'ADMIN' ? 'Todas las etapas abiertas' : `Rol ${user?.rol ?? 'sin rol'}`}</small>
        </article>
        <button className="workflow-traffic" type="button" onClick={() => setFilterEstado('ABIERTA')}>
          <span className="workflow-traffic__light workflow-traffic__light--green" />
          <span className="workflow-traffic__icon">
            <CheckCircle2 aria-hidden size={18} />
          </span>
          <strong>{trafficLight.green}</strong>
          <span>Abiertas al dia</span>
          <small>Seguimiento sin vencer</small>
        </button>
        <article className="workflow-card workflow-card--mine">
          <div>
            <span className="workflow-card__eyebrow">Pendientes por rol</span>
            <strong>Etapas activas del flujo</strong>
            <p>Consulta rapidamente donde se concentra el trabajo por Creador, Revisor, Validador y OCI.</p>
          </div>
          <div className="workflow-card__actions">
            {roleQueues.map((queue) => (
              <Link
                className={`workflow-role-chip ${queue.items.some((action) => isActionPendingForRole(action, user?.rol)) ? 'workflow-role-chip--mine' : ''}`}
                key={queue.role}
                to="/acciones"
              >
                <span>{queue.label}</span>
                <strong>{queue.items.length}</strong>
              </Link>
            ))}
          </div>
        </article>
      </section>

      {/* ── Charts Row ──────────────────────────────────────────────────── */}
      <div className="charts-grid">

        {/* Donut: Estado */}
        <section className="chart-card">
          <div className="chart-card__head">
            <h3 className="section-title" style={{ margin: 0 }}>Estado de Acciones</h3>
            <p className="chart-card__sub">Distribución por estado actual</p>
          </div>
          <div className="chart-card__body">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={stateDonutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="label"
                  strokeWidth={0}
                  onClick={(entry) => {
                    if (entry.filter) setFilterEstado(entry.filter);
                  }}
                >
                  {stateDonutData.map((entry) => (
                    <Cell key={entry.label} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <DonutLegend items={stateDonutData} />
          </div>
        </section>

        {/* Donut: Eficacia */}
        <section className="chart-card">
          <div className="chart-card__head">
            <h3 className="section-title" style={{ margin: 0 }}>Evaluación de Eficacia</h3>
            <p className="chart-card__sub">Sobre acciones cerradas</p>
          </div>
          <div className="chart-card__body">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={eficaciaDonutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="label"
                  strokeWidth={0}
                  onClick={(entry) => {
                    if (entry.filter) setFilterEficacia(entry.filter);
                  }}
                >
                  {eficaciaDonutData.map((entry) => (
                    <Cell key={entry.label} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <DonutLegend items={eficaciaDonutData} />
          </div>
        </section>

        {/* Radial: Tasas clave */}
        <section className="chart-card">
          <div className="chart-card__head">
            <h3 className="section-title" style={{ margin: 0 }}>Tasas Clave</h3>
            <p className="chart-card__sub">Porcentajes sobre el total</p>
          </div>
          <div className="chart-card__body" style={{ alignItems: 'flex-start' }}>
            <ResponsiveContainer width="100%" height={180}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius={25}
                outerRadius={80}
                barSize={12}
                data={radialData}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar
                  dataKey="value"
                  cornerRadius={6}
                  background={{ fill: '#f0f3f8' }}
                  onClick={(entry) => {
                    if (entry.filter === 'SI') {
                      setFilterEficacia('SI');
                    } else if (entry.filter) {
                      setFilterEstado(entry.filter);
                    }
                  }}
                />
                <Tooltip
                  formatter={(v) => [`${Number(v ?? 0)}%`]}
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                />
                <Legend
                  iconSize={8}
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  formatter={(v) => <span style={{ fontSize: 11, color: '#5d6570' }}>{v}</span>}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </section>

      </div>

      {/* ── Bar Chart: Acciones por proceso ─────────────────────────────── */}
      {processChartData.length > 0 && (
        <section className="chart-card chart-card--wide">
          <div className="chart-card__head">
            <h3 className="section-title" style={{ margin: 0 }}>Acciones por Proceso</h3>
            <p className="chart-card__sub">Todos los procesos configurados</p>
          </div>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={processChartData} margin={{ top: 8, right: 16, left: 0, bottom: 72 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef1f6" vertical={false} />
              <XAxis
                dataKey="proceso"
                interval={0}
                tick={{ fontSize: 10, fill: '#5d6570' }}
                angle={-45}
                textAnchor="end"
                height={72}
                tickMargin={10}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#5d6570' }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ fill: 'rgba(7,81,157,0.06)' }}
              />
              <Bar
                dataKey="total"
                name="Acciones"
                radius={[4, 4, 0, 0]}
                maxBarSize={24}
                onClick={(entry: { payload?: { proceso?: string } }) => {
                  const proceso = entry.payload?.proceso;
                  if (proceso) setFilterProceso(proceso);
                }}
              >
                {processChartData.map((_, i) => {
                  const palette = ['#07519D', '#1B4472', '#00AEE3', '#FFCD00', '#EE7C00', '#A8CF45', '#CD2180', '#DCA732'];
                  return <Cell key={i} fill={palette[i % palette.length]} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </section>
      )}

      {/* ── Recent Actions Feed ──────────────────────────────────────────── */}
      <section className="card card__body">
        <div className="actions-row" style={{ justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <h3 className="section-title" style={{ margin: 0 }}>Acciones Recientes</h3>
            <p className="muted" style={{ margin: '3px 0 0', fontSize: '0.82rem' }}>
              Últimos registros en el sistema
            </p>
          </div>
          <Link className="button button--secondary" to="/acciones">
            Ver todas
          </Link>
        </div>
        <div className="recent-feed">
          {stats.recientes.map((action) => (
            <Link className="recent-item" key={action.id} to={`/acciones/${action.id}`}>
              <div className="recent-item__top">
                <span className="action-id">#{action.id}</span>
                <StatusBadge action={action} />
              </div>
              <p className="recent-item__desc">{compactText(action.descripcion)}</p>
              <div className="recent-item__footer">
                <span className="process-badge">{action.proceso}</span>
                <span className="recent-item__arrow">
                  <ArrowRight aria-hidden size={13} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="stack skeleton-page" aria-busy="true" aria-live="polite">
      <section className="page-header skeleton-block skeleton-header">
        <div>
          <span className="skeleton-line skeleton-line--title" />
          <span className="skeleton-line skeleton-line--wide" />
        </div>
        <div className="actions-row">
          <span className="skeleton-button" />
          <span className="skeleton-button skeleton-button--light" />
        </div>
      </section>

      <section className="dash-filters skeleton-block">
        <span className="skeleton-line skeleton-line--label" />
        <div className="dash-filters__controls">
          <span className="skeleton-select" />
          <span className="skeleton-select" />
          <span className="skeleton-select" />
        </div>
      </section>

      <SkeletonKpiGrid />
      <section className="summary-strip skeleton-summary-strip" />

      <section className="charts-grid">
        {Array.from({ length: 3 }, (_, index) => (
          <article className="chart-card skeleton-block" key={index}>
            <span className="skeleton-line skeleton-line--heading" />
            <span className="skeleton-line skeleton-line--short" />
            <div className="skeleton-chart skeleton-chart--donut" />
            <div className="skeleton-list">
              <span />
              <span />
              <span />
            </div>
          </article>
        ))}
      </section>

      <section className="chart-card chart-card--wide skeleton-block">
        <span className="skeleton-line skeleton-line--heading" />
        <span className="skeleton-line skeleton-line--short" />
        <div className="skeleton-chart skeleton-chart--bars" />
      </section>

      <section className="card card__body skeleton-block">
        <span className="skeleton-line skeleton-line--heading" />
        <div className="recent-feed">
          {Array.from({ length: 4 }, (_, index) => (
            <article className="recent-item skeleton-recent" key={index}>
              <span className="skeleton-line skeleton-line--short" />
              <span className="skeleton-line skeleton-line--wide" />
              <span className="skeleton-line" />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function SkeletonKpiGrid({ compact = false }: { compact?: boolean }) {
  return (
    <section className={`kpi-grid skeleton-kpi-grid${compact ? ' skeleton-kpi-grid--compact' : ''}`} aria-label="Cargando indicadores">
      {Array.from({ length: 4 }, (_, index) => (
        <article className="kpi-card skeleton-kpi-card" key={index}>
          <div className="kpi-card__top">
            <span className="skeleton-icon" />
            <span className="skeleton-ring" />
          </div>
          <span className="skeleton-line skeleton-line--metric" />
          <span className="skeleton-line skeleton-line--heading" />
          <span className="skeleton-line skeleton-line--short" />
          <span className="skeleton-progress" />
        </article>
      ))}
    </section>
  );
}
