import { describe, expect, it } from 'vitest';
import { actionToFormValues } from '@/features/actions/utils/actionDefaults';
import type { CorrectiveAction } from '@/features/actions/types';

describe('action form transforms', () => {
  it('keeps numeric budget when mapping API action to form', () => {
    const action = {
      id: 10,
      fechaElaboracion: '2026-06-10',
      origen: 'Auditoria interna',
      tipoAccion: 'Accion correctiva',
      proceso: 'GG',
      identificadoPor: '',
      liderProceso: '',
      descripcion: 'Hallazgo',
      equipoMejoramiento: '',
      equipoMejoramientoDetalle: [],
      identificacionCausas: '',
      causaRaiz: '',
      causasDefinitivas: [],
      correccion: '',
      accion: 'Plan',
      planMejoramiento: [],
      responsable: '',
      fechaApertura: '',
      fechaCierre: '',
      fechaInicioAccion: '',
      fechaFinAccion: '',
      presupuesto: 2500,
      revisionResponsable: '',
      revisionFecha: '',
      revisionObservacion: '',
      validacionResponsable: '',
      validacionFecha: '',
      validacionObservacion: '',
      evidencia: '',
      auditorInterno: '',
      fechaEvaluacion: '',
      eficacia: '',
      evaluacionObservacion: '',
      estado: 'ABIERTA',
      estadoActual: 'REGISTRO',
      correoEnviado: false,
      fechasBloqueadas: false,
      accionContencion: 'Contencion',
      recomendacionesFinales: '',
    } satisfies CorrectiveAction;

    expect(actionToFormValues(action).presupuesto).toBe(2500);
  });
});
