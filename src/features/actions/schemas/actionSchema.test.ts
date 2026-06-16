import { describe, expect, it } from 'vitest';
import { actionSchema } from '@/features/actions/schemas/actionSchema';
import { getDefaultActionValues } from '@/features/actions/utils/actionDefaults';

describe('actionSchema', () => {
  it('accepts a valid create payload', () => {
    const result = actionSchema.safeParse({
      ...getDefaultActionValues('GG'),
      origen: 'Auditoria interna',
      tipoAccion: 'Accion correctiva',
      descripcion: 'Hallazgo',
      accion: 'Plan de accion',
      accionContencion: 'Contencion inmediata',
    });

    expect(result.success).toBe(true);
  });

  it('rejects negative budgets and invalid date order', () => {
    const result = actionSchema.safeParse({
      ...getDefaultActionValues('GG'),
      origen: 'Auditoria interna',
      tipoAccion: 'Accion correctiva',
      descripcion: 'Hallazgo',
      accion: 'Plan de accion',
      accionContencion: 'Contencion inmediata',
      fechaInicioAccion: '2026-06-10',
      fechaFinAccion: '2026-06-01',
      presupuesto: -1,
    });

    expect(result.success).toBe(false);
  });
});
