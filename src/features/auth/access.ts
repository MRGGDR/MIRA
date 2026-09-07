import { getProcessNamesForAccess, isSameProcess } from '@/config/processes';
import type { CorrectiveAction, CurrentUser } from '@/features/actions/types';

export function hasGlobalProcessScope(user: CurrentUser | null | undefined): boolean {
  return Boolean(user?.permissions.canAdmin || user?.rol === 'OCI');
}

export function getUserProcessScope(user: CurrentUser | null | undefined): string[] {
  if (!user || hasGlobalProcessScope(user)) return [];
  return getProcessNamesForAccess(user.proceso);
}

export function isActionInUserProcessScope(
  action: Pick<CorrectiveAction, 'proceso'>,
  user: CurrentUser | null | undefined,
): boolean {
  if (!user) return false;
  if (hasGlobalProcessScope(user)) return true;
  return Boolean(user.proceso) && isSameProcess(action.proceso, user.proceso);
}

export function filterActionsForUserScope(
  actions: CorrectiveAction[],
  user: CurrentUser | null | undefined,
): CorrectiveAction[] {
  return actions.filter((action) => isActionInUserProcessScope(action, user));
}
