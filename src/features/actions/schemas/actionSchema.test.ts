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
      auditorInterno: 'OCI',
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
      auditorInterno: 'OCI',
      fechaInicioAccion: '2026-06-10',
      fechaFinAccion: '2026-06-01',
      presupuesto: -1,
    });

    expect(result.success).toBe(false);
  });

  it('accepts an improvement action when the evaluator is OCI or process leader', () => {
    const result = actionSchema.safeParse({
      ...getDefaultActionValues('GG'),
      origen: 'Auditoria interna',
      tipoAccion: 'Accion de mejora',
      descripcion: 'Oportunidad de mejora',
      auditorInterno: 'Lider del proceso',
    });

    expect(result.success).toBe(true);
  });

  it('rejects OCI evaluation when REV or VAL activity fields are missing', () => {
    const values = getDefaultActionValues('GG');
    const result = actionSchema.safeParse({
      ...values,
      origen: 'Auditoria interna',
      tipoAccion: 'Accion correctiva',
      descripcion: 'Hallazgo',
      auditorInterno: 'OCI',
      estadoActual: 'REVISION_OCI',
      fechaEvaluacion: '2026-06-10',
      eficacia: 'SI',
      planMejoramiento: [
        {
          ...values.planMejoramiento[0],
          actividad: 'Actividad 1',
          fechaApertura: '2026-06-01',
          fechaCierre: '2026-06-30',
          responsable: 'Responsable',
          revisionFecha: '2026-06-15',
          revisionObservacion: '',
          validacionResponsable: 'Validador',
          validacionFecha: '2026-06-16',
          validacionObservacion: 'Validacion realizada',
        },
      ],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.path.includes('revisionObservacion'))).toBe(true);
  });

  it('accepts OCI evaluation when every activity has REV and VAL complete', () => {
    const values = getDefaultActionValues('GG');
    const result = actionSchema.safeParse({
      ...values,
      origen: 'Auditoria interna',
      tipoAccion: 'Accion correctiva',
      descripcion: 'Hallazgo',
      auditorInterno: 'OCI',
      estadoActual: 'REVISION_OCI',
      fechaEvaluacion: '2026-06-10',
      eficacia: 'SI',
      planMejoramiento: [
        {
          ...values.planMejoramiento[0],
          actividad: 'Actividad 1',
          fechaApertura: '2026-06-01',
          fechaCierre: '2026-06-30',
          responsable: 'Responsable',
          revisionFecha: '2026-06-15',
          revisionObservacion: 'Ejecucion realizada',
          validacionResponsable: 'Validador',
          validacionFecha: '2026-06-16',
          validacionObservacion: 'Validacion realizada',
        },
      ],
    });

    expect(result.success).toBe(true);
  });
});
