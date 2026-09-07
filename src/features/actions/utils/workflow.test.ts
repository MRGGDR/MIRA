import { describe, expect, it } from 'vitest';
import type { CorrectiveAction } from '@/features/actions/types';
import {
  canCreatorMaintainAction,
  canRevMaintainAction,
  getWorkflowStage,
  isActionPendingForRole,
} from '@/features/actions/utils/workflow';

function buildAction(overrides: Partial<CorrectiveAction> = {}): CorrectiveAction {
  return {
    id: 100,
    fechaElaboracion: '2026-07-14',
    origen: 'Auditoria interna',
    tipoAccion: 'Accion correctiva',
    proceso: 'Planeación Estratégica',
    identificadoPor: 'Creador',
    liderProceso: 'Validador',
    descripcion: 'Hallazgo',
    equipoMejoramiento: '',
    equipoMejoramientoDetalle: [],
    identificacionCausas: '',
    causaRaiz: '',
    causasDefinitivas: [],
    correccion: '',
    accion: 'Actividad 1',
    planMejoramiento: [
      {
        idActividad: '100-001',
        idAccion: 100,
        numeroActividad: 1,
        actividad: 'Actividad 1',
        fechaApertura: '2026-07-14',
        fechaCierre: '2026-07-20',
        presupuesto: 0,
        responsable: 'Responsable 1',
        revisionResponsable: 'Responsable 1',
        revisionFecha: '2026-07-15',
        revisionObservacion: 'Ejecutada',
        observacionRevision: '',
        validacionResponsable: 'Validador',
        validacionFecha: '',
        validacionObservacion: '',
        evidencia: '',
      },
      {
        idActividad: '100-002',
        idAccion: 100,
        numeroActividad: 2,
        actividad: 'Actividad 2',
        fechaApertura: '2026-07-14',
        fechaCierre: '2026-07-25',
        presupuesto: 0,
        responsable: 'Responsable 2',
        revisionResponsable: 'Responsable 2',
        revisionFecha: '',
        revisionObservacion: '',
        observacionRevision: '',
        validacionResponsable: 'Validador',
        validacionFecha: '',
        validacionObservacion: '',
        evidencia: '',
      },
    ],
    responsable: 'Responsable 1',
    fechaApertura: '2026-07-14',
    fechaCierre: '2026-07-25',
    fechaInicioAccion: '2026-07-14',
    fechaFinAccion: '2026-07-25',
    presupuesto: 0,
    revisionResponsable: 'Responsable 1',
    revisionFecha: '2026-07-15',
    revisionObservacion: 'Ejecutada',
    validacionResponsable: 'Validador',
    validacionFecha: '',
    validacionObservacion: '',
    evidencia: '',
    auditorInterno: 'OCI',
    fechaEvaluacion: '',
    eficacia: '',
    evaluacionObservacion: '',
    estado: 'ABIERTA',
    estadoActual: 'VALIDACION',
    correoEnviado: false,
    fechasBloqueadas: false,
    accionContencion: '',
    recomendacionesFinales: '',
    ...overrides,
  };
}

describe('workflow role pending logic', () => {
  it('keeps REV pending while any activity has not been reviewed', () => {
    const action = buildAction();

    expect(isActionPendingForRole(action, 'REV')).toBe(true);
  });

  it('keeps VAL pending only for reviewed activities waiting validation', () => {
    const action = buildAction();

    expect(isActionPendingForRole(action, 'VAL')).toBe(true);
  });

  it('does not send the action to evaluator until every activity is reviewed and validated', () => {
    const action = buildAction();

    expect(isActionPendingForRole(action, 'OCI')).toBe(false);
  });

  it('labels the final stage as Evaluador', () => {
    const action = buildAction({ estadoActual: 'REVISION_OCI' });

    expect(getWorkflowStage(action).shortLabel).toBe('Evaluador');
    expect(getWorkflowStage(action).ownerLabel).toBe('Evaluador');
  });

  it('locks CREADOR after execution starts and REV after validation starts', () => {
    const action = buildAction();
    expect(canCreatorMaintainAction(action)).toBe(false);
    expect(canRevMaintainAction(action)).toBe(true);

    const validated = buildAction({
      planMejoramiento: action.planMejoramiento.map((activity) => ({
        ...activity,
        revisionFecha: activity.revisionFecha || '2026-07-16',
        revisionObservacion: activity.revisionObservacion || 'Ejecutada',
        validacionFecha: '2026-07-17',
        validacionObservacion: 'SI',
      })),
    });
    expect(canRevMaintainAction(validated)).toBe(false);
  });

  it('does not assign an empty action plan to REV', () => {
    const action = buildAction({ planMejoramiento: [], accion: '', responsable: '' });
    expect(isActionPendingForRole(action, 'REV')).toBe(false);
    expect(canRevMaintainAction(action)).toBe(false);
  });
});
