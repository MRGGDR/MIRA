import { AlertTriangle, CheckCircle2, Clock, CircleDashed, XCircle } from 'lucide-react';
import type { CorrectiveAction } from '@/features/actions/types';
import { getVisualStatus } from '@/features/actions/utils/status';

interface StatusBadgeProps {
  action?: Pick<CorrectiveAction, 'estado' | 'fechaFinAccion' | 'eficacia'>;
  status?: 'ABIERTA' | 'CERRADA' | 'VENCIDA' | 'EFICAZ' | 'NO EFICAZ' | 'SIN EVALUAR';
}

export function StatusBadge({ action, status }: StatusBadgeProps) {
  const resolvedStatus =
    status ?? (action ? getVisualStatus(action) : 'SIN EVALUAR');
  const iconMap = {
    ABIERTA: Clock,
    CERRADA: CheckCircle2,
    VENCIDA: AlertTriangle,
    EFICAZ: CheckCircle2,
    'NO EFICAZ': XCircle,
    'SIN EVALUAR': CircleDashed,
  };
  const classMap = {
    ABIERTA: 'status--open',
    CERRADA: 'status--closed',
    VENCIDA: 'status--expired',
    EFICAZ: 'status--effective',
    'NO EFICAZ': 'status--ineffective',
    'SIN EVALUAR': 'status--neutral',
  };
  const Icon = iconMap[resolvedStatus];
  return (
    <span className={`status ${classMap[resolvedStatus]}`}>
      <Icon aria-hidden size={14} />
      {resolvedStatus}
    </span>
  );
}
