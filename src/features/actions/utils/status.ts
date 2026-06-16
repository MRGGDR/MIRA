import type { CorrectiveAction } from '@/features/actions/types';
import { isBeforeToday } from '@/utils/date';

export function isActionExpired(action: Pick<CorrectiveAction, 'estado' | 'fechaFinAccion'>): boolean {
  return action.estado === 'ABIERTA' && Boolean(action.fechaFinAccion) && isBeforeToday(action.fechaFinAccion);
}

export function getVisualStatus(action: Pick<CorrectiveAction, 'estado' | 'fechaFinAccion'>): 'VENCIDA' | 'ABIERTA' | 'CERRADA' {
  return isActionExpired(action) ? 'VENCIDA' : action.estado;
}
