import type { PaginatedResponse } from '@/types/api';

export type ActionStatus = 'ABIERTA' | 'CERRADA' | 'VENCIDA';
export type Effectiveness = 'SI' | 'NO' | '';
export type DocumentState = 'REGISTRO' | 'ANALISIS' | 'PLAN_ACCION' | 'VALIDACION' | 'REVISION_OCI' | 'CERRADA';
export type UserRole = 'ADMIN' | 'CREADOR' | 'REV' | 'VAL' | 'OCI' | 'CONSULTA' | 'ANONIMO';

export interface ImprovementTeamMember {
  nombre: string;
  previas: string;
  votacion: string;
}

export interface DefinitiveCause {
  causa: string;
  descripcion: string;
  votos: number;
  puntaje: number;
}

export interface ImprovementPlanActivity {
  actividad: string;
  fechaApertura: string;
  fechaCierre: string;
  presupuesto: number;
  responsable: string;
  revisionResponsable: string;
  revisionFecha: string;
  revisionObservacion: string;
  validacionResponsable: string;
  validacionFecha: string;
  validacionObservacion: string;
  evidencia: string;
}

export interface CorrectiveAction {
  id: number;
  fechaElaboracion: string;
  origen: string;
  tipoAccion: string;
  proceso: string;
  identificadoPor: string;
  liderProceso: string;
  descripcion: string;
  equipoMejoramiento: string;
  equipoMejoramientoDetalle: ImprovementTeamMember[];
  identificacionCausas: string;
  causaRaiz: string;
  causasDefinitivas: DefinitiveCause[];
  correccion: string;
  accion: string;
  planMejoramiento: ImprovementPlanActivity[];
  responsable: string;
  fechaApertura: string;
  fechaCierre: string;
  fechaInicioAccion: string;
  fechaFinAccion: string;
  presupuesto: number;
  revisionResponsable: string;
  revisionFecha: string;
  revisionObservacion: string;
  validacionResponsable: string;
  validacionFecha: string;
  validacionObservacion: string;
  evidencia: string;
  auditorInterno: string;
  fechaEvaluacion: string;
  eficacia: Effectiveness;
  evaluacionObservacion: string;
  estado: ActionStatus;
  estadoActual: DocumentState;
  correoEnviado: boolean;
  fechasBloqueadas: boolean;
  accionContencion: string;
  recomendacionesFinales: string;
}

export type CreateActionInput = Omit<CorrectiveAction, 'id' | 'estado'> & {
  id?: number;
  estado?: ActionStatus;
};

export type UpdateActionInput = CreateActionInput & {
  id: number;
};

export interface ActionFilters {
  id?: string;
  search?: string;
  proceso?: string;
  tipoAccion?: string;
  origen?: string;
  estado?: string;
  eficacia?: string;
  responsable?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  page?: number;
  pageSize?: number;
}

export interface Parameters {
  origenes: string[];
  tiposAccion: string[];
  procesos: string[];
  personas: string[];
  lideresProceso: string[];
  lideresSiplag: string[];
  auditores: string[];
}

export interface DashboardStats {
  total: number;
  abiertas: number;
  cerradas: number;
  vencidas: number;
  eficaces: number;
  noEficaces: number;
  porProceso: Array<{ proceso: string; total: number }>;
  recientes: CorrectiveAction[];
}

export interface AuditRecord {
  timestamp: string;
  usuario: string;
  operacion: 'CREATE' | 'UPDATE';
  accionId: number;
  fila: number;
  datosAnterioresJson: string;
  datosNuevosJson: string;
}

export interface CurrentUser {
  email: string;
  nombre: string;
  proceso: string;
  rol: UserRole;
  permissions: {
    canRead: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canAdmin: boolean;
    canEditRegistro?: boolean;
    canEditAnalisis?: boolean;
    canEditPlan?: boolean;
    canEditValidacion?: boolean;
    canEditOci?: boolean;
    canNotifyOci?: boolean;
  };
}

export interface ManagedUser {
  email: string;
  nombre: string;
  proceso: string;
  rol: UserRole;
  activo: boolean;
}

export interface CreateUserInput {
  email: string;
  nombre: string;
  proceso: string;
  rol: UserRole;
  password: string;
  activo: boolean;
}

export interface UpdateUserInput {
  email: string;
  nombre: string;
  proceso: string;
  rol: UserRole;
  password?: string;
  activo: boolean;
}

export interface AuthSession {
  token: string;
  user: CurrentUser;
}

export type ActionListResponse = PaginatedResponse<CorrectiveAction>;
