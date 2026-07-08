import { env } from '@/config/env';
import { PROCESS_LEADERS, PROCESSES } from '@/config/processes';
import type { ApiResponse } from '@/types/api';
import type {
  ActionFilters,
  ActionListResponse,
  AuthSession,
  AuditRecord,
  CorrectiveAction,
  CreateUserInput,
  CreateActionInput,
  CurrentUser,
  DashboardStats,
  ManagedUser,
  Parameters,
  UpdateActionInput,
  UpdateUserInput,
} from '@/features/actions/types';
import { isActionExpired } from '@/features/actions/utils/status';

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

interface RequestParams extends Record<string, unknown> {
  filters?: ActionFilters;
  id?: number;
  actionId?: number;
}

interface RequestPayload {
  action: string;
  params?: RequestParams;
  data?: unknown;
}

const DEFAULT_TIMEOUT_MS = 30000;
const LOGIN_TIMEOUT_MS = 90000;
const AUTH_TOKEN_KEY = 'neogestion.authToken';
const NEXT_ACTION_ID_BASE = 411;

export function getStoredAuthToken(): string {
  return window.localStorage.getItem(AUTH_TOKEN_KEY) ?? '';
}

export function setStoredAuthToken(token: string): void {
  if (token) window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  else window.localStorage.removeItem(AUTH_TOKEN_KEY);
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function request<TData>(payload: RequestPayload, safeToRetry = false, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<TData> {
  const authToken = getStoredAuthToken();
  const requestPayload = authToken ? { ...payload, authToken } : payload;
  if (env.useMocks) {
    return mockRequest<TData>(requestPayload);
  }

  if (!env.apiUrl) {
    throw new ApiClientError(
      'Configure VITE_APPS_SCRIPT_URL o active VITE_USE_MOCKS=true para desarrollo local.',
      'API_URL_MISSING',
    );
  }

  const attempts = safeToRetry ? 2 : 1;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(env.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(requestPayload),
        redirect: 'follow',
        signal: controller.signal,
      });

      const rawResponse = await response.text();

      if (response.status === 401 || response.status === 403) {
        throw new ApiClientError(
          'Apps Script rechazó la solicitud. Revise que el despliegue web permita acceso desde la aplicación o use VITE_USE_MOCKS=true para desarrollo visual.',
          'APPS_SCRIPT_UNAUTHORIZED',
          { status: response.status },
        );
      }

      if (response.ok === false) {
        throw new ApiClientError(
          `Apps Script devolvió HTTP ${response.status} al ejecutar ${payload.action}.`,
          'APPS_SCRIPT_HTTP_ERROR',
          {
            action: payload.action,
            status: response.status,
            bodyPreview: rawResponse.slice(0, 600),
          },
        );
      }

      const json = parseApiResponse<TData>(rawResponse);
      if (!json.ok) {
        throw new ApiClientError(json.error.message, json.error.code, json.error.details);
      }
      return json.data;
    } catch (error) {
      lastError = error;
      if (error instanceof ApiClientError && isAuthorizationError(error.code)) {
        break;
      }
      if (attempt < attempts) {
        await sleep(350);
      }
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  if (lastError instanceof ApiClientError) throw lastError;
  if (lastError instanceof DOMException && lastError.name === 'AbortError') {
    throw new ApiClientError(
      'La solicitud superó el tiempo de espera. Revisa la conexión e intenta de nuevo; si es el primer ingreso después de publicar Apps Script, puede tardar un poco más.',
      'REQUEST_TIMEOUT',
    );
  }
  throw new ApiClientError('No fue posible comunicarse con Apps Script.', 'NETWORK_ERROR');
}

async function listAllActions(filters: ActionFilters = {}): Promise<CorrectiveAction[]> {
  const pageSize = 100;
  const firstPage = await request<ActionListResponse>(
    { action: 'listActions', params: { filters: { ...filters, page: 1, pageSize } } },
    true,
  );
  const items = [...firstPage.items];

  for (let page = 2; page <= firstPage.totalPages; page += 1) {
    const nextPage = await request<ActionListResponse>(
      { action: 'listActions', params: { filters: { ...filters, page, pageSize } } },
      true,
    );
    items.push(...nextPage.items);
  }

  return items;
}

function isAuthorizationError(code: string): boolean {
  return code === 'APPS_SCRIPT_UNAUTHORIZED' || code === 'APPS_SCRIPT_REQUIRES_LOGIN';
}

function parseApiResponse<TData>(rawResponse: string): ApiResponse<TData> {
  try {
    return JSON.parse(rawResponse) as ApiResponse<TData>;
  } catch {
    if (rawResponse.toLowerCase().includes('sign in - google accounts')) {
      throw new ApiClientError(
        'Apps Script está solicitando inicio de sesión. Cambie el acceso del despliegue web o use una URL /exec accesible para la app.',
        'APPS_SCRIPT_REQUIRES_LOGIN',
      );
    }
    throw new ApiClientError(
      'Apps Script no devolvió JSON. Revise el despliegue, permisos y URL /exec.',
      'INVALID_APPS_SCRIPT_RESPONSE',
    );
  }
}

export const apiClient = {
  login: (email: string, password: string) => request<AuthSession>({ action: 'login', data: { email, password } }, false, LOGIN_TIMEOUT_MS),
  me: () => request<CurrentUser>({ action: 'me' }, true),
  bootstrap: () => request<{ parameters: Parameters; currentUser: CurrentUser; stats: DashboardStats }>({ action: 'bootstrap' }, true),
  listUsers: () => request<ManagedUser[]>({ action: 'listUsers' }, true),
  createUser: (data: CreateUserInput) => request<ManagedUser>({ action: 'createUser', data }),
  updateUser: (data: UpdateUserInput) => request<ManagedUser>({ action: 'updateUser', data }),
  getParameters: () => request<Parameters>({ action: 'getParameters' }, true),
  getNextActionId,
  listActions: (filters: ActionFilters) => request<ActionListResponse>({ action: 'listActions', params: { filters } }, true),
  listAllActions,
  getAction: (id: number) => request<CorrectiveAction>({ action: 'getAction', params: { id } }, true),
  createAction: (data: CreateActionInput) => request<CorrectiveAction>({ action: 'createAction', data }),
  updateAction: (data: UpdateActionInput) => request<CorrectiveAction>({ action: 'updateAction', data }),
  notifyOci: (id: number) => request<CorrectiveAction>({ action: 'notifyOci', params: { id } }),
  getStats: () => request<DashboardStats>({ action: 'getStats' }, true),
  getAudit: (actionId?: number) => request<AuditRecord[]>({ action: 'getAudit', params: { actionId } }, true),
};

async function getNextActionId(): Promise<number> {
  try {
    return await request<number>({ action: 'getNextActionId' }, true);
  } catch (error) {
    if (error instanceof ApiClientError && error.code === 'UNKNOWN_ACTION') {
      const actions = await listAllActions();
      return Math.max(NEXT_ACTION_ID_BASE, ...actions.map((action) => Number(action.id) || 0)) + 1;
    }
    throw error;
  }
}

const mockParameters: Parameters = {
  origenes: ['Auditoria externa', 'Auditoria interna', 'Entes de control', 'Indicadores', 'PQRS', 'Otro'],
  tiposAccion: ['Acción correctiva', 'Acción preventiva', 'Acción de mejora'],
  procesos: PROCESSES.map((process) => process.name),
  personas: ['Ana Rodriguez', 'Carlos Perez', 'Lorena Cardenas'],
  lideresProceso: PROCESS_LEADERS,
  lideresSiplag: ['Beatriz Parra', 'Carlos Perez'],
  auditores: ['David Vargas', 'Jairo Abaunza'],
};

const mockCurrentUser: CurrentUser = {
  email: 'admin@example.com',
  nombre: 'Admin local',
  proceso: '',
  rol: 'ADMIN',
  permissions: {
    canRead: true,
    canCreate: true,
    canUpdate: true,
    canAdmin: true,
    canEditRegistro: true,
    canEditAnalisis: true,
    canEditPlan: true,
    canEditValidacion: true,
    canEditOci: true,
    canNotifyOci: true,
  },
};

const mockUsers: ManagedUser[] = [
  {
    email: 'admin',
    nombre: 'Admin local',
    proceso: '',
    rol: 'ADMIN',
    activo: true,
  },
];

const mockActions: CorrectiveAction[] = [
  {
    id: 1,
    fechaElaboracion: '2026-05-15',
    origen: 'Auditoria interna',
    tipoAccion: 'Acción correctiva',
    proceso: 'Gestión Gerencial (Dirección General)',
    identificadoPor: 'Carlos Perez',
    liderProceso: 'Lorena Cardenas',
    descripcion: 'Hallazgo inicial de referencia para validar la interfaz.',
    equipoMejoramiento: 'Equipo SIPLAG',
    equipoMejoramientoDetalle: [
      { nombre: 'Equipo SIPLAG', previas: 'N/A', votacion: '1' },
      { nombre: 'Lorena Cardenas', previas: 'N/A', votacion: '1' },
    ],
    identificacionCausas: 'Causa 1\nCausa 2',
    causaRaiz: 'Falta de seguimiento consolidado',
    causasDefinitivas: [
      { causa: '478', descripcion: 'Falta de seguimiento consolidado', votos: 1, puntaje: 5 },
      { causa: '479', descripcion: 'Control documental insuficiente', votos: 1, puntaje: 3 },
    ],
    correccion: 'Ajuste inmediato',
    accion: 'Implementar seguimiento mensual',
    planMejoramiento: [
      {
        idActividad: '1-001',
        idAccion: 1,
        numeroActividad: 1,
        actividad: 'Implementar seguimiento mensual',
        fechaApertura: '2026-05-15',
        fechaCierre: '',
        presupuesto: 0,
        responsable: 'Lorena Cardenas',
        revisionResponsable: 'Beatriz Parra',
        revisionFecha: '',
        revisionObservacion: '',
        observacionRevision: '',
        validacionResponsable: 'Carlos Perez',
        validacionFecha: '',
        validacionObservacion: '',
        evidencia: 'Carpeta de evidencia',
      },
    ],
    responsable: 'Lorena Cardenas',
    fechaApertura: '2026-05-15',
    fechaCierre: '',
    fechaInicioAccion: '2026-05-20',
    fechaFinAccion: '2026-06-30',
    presupuesto: 0,
    revisionResponsable: 'Beatriz Parra',
    revisionFecha: '',
    revisionObservacion: '',
    validacionResponsable: 'Carlos Perez',
    validacionFecha: '',
    validacionObservacion: '',
    evidencia: 'Carpeta de evidencia',
    auditorInterno: 'David Vargas',
    fechaEvaluacion: '',
    eficacia: '',
    evaluacionObservacion: '',
    estado: 'ABIERTA',
    estadoActual: 'PLAN_ACCION',
    correoEnviado: false,
    fechasBloqueadas: false,
    accionContencion: 'Control inmediato de referencia',
    recomendacionesFinales: '',
  },
];

async function mockRequest<TData>(payload: RequestPayload): Promise<TData> {
  await sleep(120);
  switch (payload.action) {
    case 'bootstrap':
      return {
        parameters: mockParameters,
        currentUser: mockCurrentUser,
        stats: buildMockStats(),
      } as TData;
    case 'login':
      return { token: 'mock-token', user: mockCurrentUser } as TData;
    case 'me':
      return mockCurrentUser as TData;
    case 'listUsers':
      return mockUsers as TData;
    case 'createUser': {
      const data = payload.data as CreateUserInput;
      if (mockUsers.some((user) => user.email.toLowerCase() === data.email.toLowerCase())) {
        throw new ApiClientError('Ya existe un usuario con ese identificador.', 'USER_ALREADY_EXISTS');
      }
      const user: ManagedUser = {
        email: data.email.trim(),
        nombre: data.nombre.trim(),
        proceso: data.proceso.trim(),
        rol: data.rol,
        activo: data.activo,
      };
      mockUsers.push(user);
      return user as TData;
    }
    case 'updateUser': {
      const data = payload.data as UpdateUserInput;
      const index = mockUsers.findIndex((user) => user.email.toLowerCase() === data.email.toLowerCase());
      if (index < 0) throw new ApiClientError('No se encontró el usuario.', 'USER_NOT_FOUND');
      const updated: ManagedUser = {
        email: mockUsers[index].email,
        nombre: data.nombre.trim(),
        proceso: data.rol === 'ADMIN' ? '' : data.proceso.trim(),
        rol: data.rol,
        activo: data.activo,
      };
      mockUsers[index] = updated;
      return updated as TData;
    }
    case 'getParameters':
      return mockParameters as TData;
    case 'getStats':
      return buildMockStats() as TData;
    case 'getNextActionId':
      return (Math.max(NEXT_ACTION_ID_BASE, ...mockActions.map((action) => action.id)) + 1) as TData;
    case 'listActions': {
      const filters = readFilters(payload.params);
      const items = filterActions(mockActions, filters);
      return {
        items,
        page: filters.page ?? 1,
        pageSize: filters.pageSize ?? 10,
        total: items.length,
        totalPages: 1,
      } as TData;
    }
    case 'getAction': {
      const id = Number(payload.params?.id);
      const action = mockActions.find((item) => item.id === id);
      if (!action) throw new ApiClientError('No se encontró la acción solicitada.', 'ACTION_NOT_FOUND');
      return action as TData;
    }
    case 'createAction': {
      const data = payload.data as CreateActionInput;
      const requestedId = data.id ?? Math.max(NEXT_ACTION_ID_BASE, ...mockActions.map((action) => action.id)) + 1;
      if (mockActions.some((action) => action.id === requestedId)) {
        throw new ApiClientError('Ya existe una acción con ese número.', 'DUPLICATE_ID', { id: requestedId });
      }
      const created: CorrectiveAction = {
        ...data,
        id: requestedId,
        estado: data.eficacia ? 'CERRADA' : 'ABIERTA',
        estadoActual: getCreatedMockStage(data),
        correoEnviado: Boolean(data.correoEnviado),
        fechasBloqueadas: Boolean(data.fechasBloqueadas),
        accionContencion: data.accionContencion ?? '',
        recomendacionesFinales: data.recomendacionesFinales ?? '',
      };
      mockActions.unshift(created);
      return created as TData;
    }
    case 'updateAction': {
      const data = payload.data as UpdateActionInput;
      const index = mockActions.findIndex((item) => item.id === data.id);
      if (index < 0) throw new ApiClientError('No se encontró la acción solicitada.', 'ACTION_NOT_FOUND');
      const updated: CorrectiveAction = {
        ...data,
        estado: data.eficacia ? 'CERRADA' : 'ABIERTA',
        estadoActual: getUpdatedMockStage(data),
        correoEnviado: areMockActivitiesReadyForOci(data) && Boolean(data.correoEnviado),
        fechasBloqueadas: Boolean(data.fechasBloqueadas),
        accionContencion: data.accionContencion ?? '',
        recomendacionesFinales: data.recomendacionesFinales ?? '',
      };
      mockActions[index] = updated;
      return updated as TData;
    }
    case 'notifyOci': {
      const id = Number(payload.params?.id);
      const index = mockActions.findIndex((item) => item.id === id);
      if (index < 0) throw new ApiClientError('No se encontró la acción solicitada.', 'ACTION_NOT_FOUND');
      if (!areMockActivitiesReadyForOci(mockActions[index])) {
        throw new ApiClientError(
          'No puede notificar a Control Interno hasta completar revisión y validación de todas las actividades.',
          'OCI_GATE_BLOCKED',
        );
      }
      mockActions[index] = { ...mockActions[index], correoEnviado: true, estadoActual: 'REVISION_OCI' };
      return mockActions[index] as TData;
    }
    case 'getAudit':
      return [] as TData;
    default:
      throw new ApiClientError('Operación no implementada en mock.', 'MOCK_NOT_IMPLEMENTED');
  }
}

function readFilters(params: RequestParams | undefined): ActionFilters {
  return params?.filters ?? {};
}

function filterActions(actions: CorrectiveAction[], filters: ActionFilters): CorrectiveAction[] {
  return actions.filter((action) => {
    if (filters.id && action.id !== Number(filters.id)) return false;
    if (filters.proceso && action.proceso !== filters.proceso) return false;
    if (filters.estado === 'VENCIDA' && !isActionExpired(action)) return false;
    if (filters.estado === 'ABIERTA' && (action.estado !== 'ABIERTA' || isActionExpired(action))) return false;
    if (filters.estado === 'CERRADA' && action.estado !== 'CERRADA') return false;
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

function getCreatedMockStage(data: CreateActionInput): CorrectiveAction['estadoActual'] {
  if (hasMockPlanActivity(data)) return 'PLAN_ACCION';
  if ((data.tipoAccion ?? '').toLowerCase().includes('mejora')) return 'PLAN_ACCION';
  return 'ANALISIS';
}

function getUpdatedMockStage(data: UpdateActionInput): CorrectiveAction['estadoActual'] {
  if (data.eficacia === 'SI') return 'CERRADA';
  if (areMockActivitiesReadyForOci(data)) return 'REVISION_OCI';
  if (data.estadoActual === 'REVISION_OCI' && areMockActivitiesExecuted(data)) return 'VALIDACION';
  if (data.estadoActual === 'REVISION_OCI') return 'PLAN_ACCION';
  if (data.fechasBloqueadas || areMockActivitiesExecuted(data)) return 'VALIDACION';
  return data.estadoActual ?? 'REGISTRO';
}

function hasMockPlanActivity(data: CreateActionInput) {
  return Boolean(
    data.planMejoramiento?.some((activity) => activity.actividad.trim() && activity.fechaApertura && activity.fechaCierre) ||
      (data.accion?.trim() && (data.fechaInicioAccion || data.fechaApertura) && (data.fechaFinAccion || data.fechaCierre)),
  );
}

function areMockActivitiesExecuted(data: CreateActionInput) {
  const activities = data.planMejoramiento ?? [];
  return (
    activities.length > 0 &&
    activities.every((activity) => activity.revisionFecha && activity.revisionObservacion.trim() && activity.observacionRevision.trim())
  );
}

function areMockActivitiesValidated(data: CreateActionInput) {
  const activities = data.planMejoramiento ?? [];
  return (
    activities.length > 0 &&
    activities.every((activity) => activity.validacionResponsable.trim() && activity.validacionFecha && activity.validacionObservacion.trim())
  );
}

function areMockActivitiesReadyForOci(data: CreateActionInput) {
  return areMockActivitiesExecuted(data) && areMockActivitiesValidated(data);
}

function buildMockStats(): DashboardStats {
  const vencidas = mockActions.filter(isActionExpired).length;
  return {
    total: mockActions.length,
    abiertas: mockActions.filter((action) => action.estado === 'ABIERTA').length,
    cerradas: mockActions.filter((action) => action.estado === 'CERRADA').length,
    vencidas,
    eficaces: mockActions.filter((action) => action.eficacia === 'SI').length,
    noEficaces: mockActions.filter((action) => action.eficacia === 'NO').length,
    porProceso: PROCESSES.map((process) => ({
      proceso: process.name,
      total: mockActions.filter((action) => action.proceso === process.name).length,
    })).filter((item) => item.total > 0),
    recientes: mockActions.slice(0, 5),
  };
}
