import { describe, expect, it } from 'vitest';
import type { CurrentUser } from '@/features/actions/types';
import { hasGlobalProcessScope, isActionInUserProcessScope } from '@/features/auth/access';

function buildUser(role: CurrentUser['rol'], proceso: string, canAdmin = false): CurrentUser {
  return {
    email: `${role.toLowerCase()}@example.com`,
    nombre: role,
    proceso,
    rol: role,
    permissions: {
      canRead: true,
      canCreate: false,
      canUpdate: false,
      canAdmin,
    },
  };
}

describe('process access scope', () => {
  it.each(['REV', 'VAL', 'CREADOR', 'CONSULTA'] as const)('limits %s to the process assigned to the user', (role) => {
    const user = buildUser(role, 'PE');

    expect(hasGlobalProcessScope(user)).toBe(false);
    expect(isActionInUserProcessScope({ proceso: 'Planeacion Estrategica' }, user)).toBe(true);
    expect(isActionInUserProcessScope({ proceso: 'Gestion Financiera' }, user)).toBe(false);
  });

  it('denies scoped roles without an assigned process', () => {
    expect(isActionInUserProcessScope({ proceso: 'Planeacion Estrategica' }, buildUser('VAL', ''))).toBe(false);
  });

  it('keeps ADMIN and OCI as global roles', () => {
    expect(hasGlobalProcessScope(buildUser('ADMIN', '', true))).toBe(true);
    expect(hasGlobalProcessScope(buildUser('OCI', ''))).toBe(true);
  });
});
