import type { CorrectiveAction, DocumentState, UserRole } from '@/features/actions/types';
import { getVisualStatus, isActionExpired } from '@/features/actions/utils/status';

export type WorkflowRole = 'CREADOR' | 'REV' | 'VAL' | 'OCI' | 'CERRADA';

export interface WorkflowStageMeta {
  state: DocumentState;
  label: string;
  shortLabel: string;
  ownerRole: WorkflowRole;
  ownerLabel: string;
  tone: 'draft' | 'review' | 'validation' | 'oci' | 'closed';
}

export const WORKFLOW_STAGES: Record<DocumentState, WorkflowStageMeta> = {
  REGISTRO: {
    state: 'REGISTRO',
    label: 'Registro del hallazgo',
    shortLabel: 'Registro',
    ownerRole: 'CREADOR',
    ownerLabel: 'Creador',
    tone: 'draft',
  },
  ANALISIS: {
    state: 'ANALISIS',
    label: 'Analisis de causas',
    shortLabel: 'Analisis',
    ownerRole: 'CREADOR',
    ownerLabel: 'Creador',
    tone: 'draft',
  },
  PLAN_ACCION: {
    state: 'PLAN_ACCION',
    label: 'Plan de accion',
    shortLabel: 'Plan',
    ownerRole: 'REV',
    ownerLabel: 'Revisor',
    tone: 'review',
  },
  VALIDACION: {
    state: 'VALIDACION',
    label: 'Validacion',
    shortLabel: 'Validacion',
    ownerRole: 'VAL',
    ownerLabel: 'Validador',
    tone: 'validation',
  },
  REVISION_OCI: {
    state: 'REVISION_OCI',
    label: 'Revision OCI',
    shortLabel: 'OCI',
    ownerRole: 'OCI',
    ownerLabel: 'Control Interno',
    tone: 'oci',
  },
  CERRADA: {
    state: 'CERRADA',
    label: 'Cerrada',
    shortLabel: 'Cerrada',
    ownerRole: 'CERRADA',
    ownerLabel: 'Terminada',
    tone: 'closed',
  },
};

const ROLE_STATES: Partial<Record<UserRole, DocumentState[]>> = {
  CREADOR: ['REGISTRO', 'ANALISIS'],
  REV: ['PLAN_ACCION'],
  VAL: ['VALIDACION'],
  OCI: ['REVISION_OCI'],
};

export function getWorkflowStage(action: CorrectiveAction): WorkflowStageMeta {
  return WORKFLOW_STAGES[action.estadoActual] ?? WORKFLOW_STAGES.REGISTRO;
}

export function isActionPendingForRole(action: CorrectiveAction, role: UserRole | undefined): boolean {
  if (!role || role === 'CONSULTA' || role === 'ANONIMO') return false;
  if (role === 'ADMIN') return action.estadoActual !== 'CERRADA';
  return Boolean(ROLE_STATES[role]?.includes(action.estadoActual));
}

export function countPendingForRole(actions: CorrectiveAction[], role: UserRole | undefined): number {
  return actions.filter((action) => isActionPendingForRole(action, role)).length;
}

export function buildWorkflowRoleQueues(actions: CorrectiveAction[]) {
  return [
    { role: 'CREADOR' as const, label: 'Creador', states: ['REGISTRO', 'ANALISIS'] as DocumentState[] },
    { role: 'REV' as const, label: 'Revisor', states: ['PLAN_ACCION'] as DocumentState[] },
    { role: 'VAL' as const, label: 'Validador', states: ['VALIDACION'] as DocumentState[] },
    { role: 'OCI' as const, label: 'OCI', states: ['REVISION_OCI'] as DocumentState[] },
  ].map((queue) => ({
    ...queue,
    items: actions.filter((action) => queue.states.includes(action.estadoActual)),
  }));
}

export function buildWorkflowTrafficLight(actions: CorrectiveAction[], role: UserRole | undefined) {
  const pendingForRole = countPendingForRole(actions, role);
  const expired = actions.filter((action) => getVisualStatus(action) === 'VENCIDA' || isActionExpired(action)).length;
  const openOnTime = actions.filter((action) => getVisualStatus(action) === 'ABIERTA' && !isActionExpired(action)).length;

  return {
    red: expired,
    yellow: pendingForRole,
    green: openOnTime,
  };
}
