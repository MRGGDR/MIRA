/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Apps Script is evaluated dynamically in a VM to test the deployed authorization code itself. */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

type PlainObject = Record<string, any>;

interface BackendAuthorizationApi {
  applyRoleUpdateRestrictions_: (user: PlainObject, previous: PlainObject, requested: PlainObject) => PlainObject;
  sanitizeCreatedActionForRole_: (user: PlainObject, action: PlainObject) => PlainObject;
  isActionVisibleToUser_: (user: PlainObject, action: PlainObject) => boolean;
  assertActionScope_: (user: PlainObject, action: PlainObject) => void;
  assertActionPhasePermission_: (user: PlainObject, previous: PlainObject, requested: PlainObject) => void;
  getStats_: () => PlainObject;
  evaluate: (source: string) => unknown;
}

function loadBackendAuthorization(): BackendAuthorizationApi {
  const productionSource = [
    'app_scripts/12_Utils.gs',
    'app_scripts/07_ActionsService.gs',
    'app_scripts/09_StatsService.gs',
  ]
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n');
  const harness = `
    const CONFIG = Object.freeze({
      TIMEZONE: 'America/Bogota',
      LEGACY_PROCESS_NAMES: { PE: ['Planeación Estratégica'], GF: ['Gestión Financiera'] },
      PROCESS_CATALOG: ['Planeación Estratégica', 'Gestión Financiera'],
      STATUS_RULE: { OPEN_WHEN_EFFECTIVENESS_EMPTY: 'ABIERTA', CLOSED_WHEN_EFFECTIVENESS_PRESENT: 'CERRADA' }
    });
    function AppError_(code, message, details) {
      this.name = 'AppError';
      this.code = code;
      this.message = message;
      this.details = details || {};
    }
    AppError_.prototype = Object.create(Error.prototype);
    AppError_.prototype.constructor = AppError_;
    function syncFirstActivityFields_(action) {
      var activities = normalizeJsonField_(action.planMejoramiento);
      action.planMejoramiento = activities;
      if (!activities.length) return action;
      var first = activities[0];
      var last = activities[activities.length - 1];
      action.accion = first.actividad || '';
      action.responsable = first.responsable || '';
      action.fechaApertura = first.fechaApertura || '';
      action.fechaCierre = last.fechaCierre || first.fechaCierre || '';
      action.fechaInicioAccion = first.fechaApertura || '';
      action.fechaFinAccion = last.fechaCierre || first.fechaCierre || '';
      action.revisionResponsable = first.responsable || '';
      action.revisionFecha = first.revisionFecha || '';
      action.revisionObservacion = first.revisionObservacion || '';
      action.validacionResponsable = first.validacionResponsable || '';
      action.validacionFecha = first.validacionFecha || '';
      action.validacionObservacion = first.validacionObservacion || '';
      action.evidencia = first.evidencia || '';
      action.estado = calculateStatus_(action);
      return action;
    }
  `;
  const context = vm.createContext({
    Utilities: {
      formatDate: () => '2026-09-06',
      formatString: (_format: string, value: number) => String(value).padStart(3, '0'),
    },
  });
  vm.runInContext(`${harness}\n${productionSource}`, context);
  const api = vm.runInContext(
    `({
      applyRoleUpdateRestrictions_,
      sanitizeCreatedActionForRole_,
      isActionVisibleToUser_,
      assertActionScope_,
      assertActionPhasePermission_,
      getStats_
    })`,
    context,
  ) as Omit<BackendAuthorizationApi, 'evaluate'>;
  return {
    ...api,
    evaluate: (script: string) => vm.runInContext(script, context),
  };
}

function user(role: string, proceso = 'PE'): PlainObject {
  return {
    email: `${role.toLowerCase()}@example.com`,
    proceso,
    rol: role,
    permissions: {
      canAdmin: role === 'ADMIN',
      canUpdate: role !== 'CONSULTA',
      canEditRegistro: role === 'ADMIN' || role === 'CREADOR',
      canEditAnalisis: role === 'ADMIN' || role === 'CREADOR',
      canEditPlan: role === 'ADMIN' || role === 'REV',
      canEditValidacion: role === 'ADMIN' || role === 'VAL',
      canEditOci: role === 'ADMIN' || role === 'OCI',
    },
  };
}

function activity(overrides: PlainObject = {}): PlainObject {
  return {
    idActividad: '412-001',
    idAccion: 412,
    numeroActividad: 1,
    actividad: 'Actividad original',
    fechaApertura: '2026-09-01',
    fechaCierre: '2026-12-01',
    presupuesto: 0,
    responsable: 'Responsable original',
    evidencia: '',
    revisionResponsable: 'Responsable original',
    revisionFecha: '',
    revisionObservacion: '',
    observacionRevision: '',
    validacionResponsable: 'Lider Uno',
    validacionFecha: '',
    validacionObservacion: '',
    ...overrides,
  };
}

function action(overrides: PlainObject = {}): PlainObject {
  return {
    id: 412,
    fechaElaboracion: '2026-09-01',
    origen: 'Auditoria interna',
    tipoAccion: 'Accion correctiva',
    proceso: 'Planeacion Estrategica',
    identificadoPor: 'Persona original',
    liderProceso: 'Lider Uno',
    descripcion: 'Descripcion original',
    identificacionCausas: 'Causas originales',
    causaRaiz: 'Causa original',
    accionContencion: 'Contencion original',
    auditorInterno: 'OCI',
    fechaEvaluacion: '',
    eficacia: '',
    evaluacionObservacion: '',
    estado: 'ABIERTA',
    estadoActual: 'PLAN_ACCION',
    correoEnviado: false,
    fechasBloqueadas: false,
    planMejoramiento: [activity()],
    ...overrides,
  };
}

function local<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

describe('Apps Script process authorization', () => {
  const backend = loadBackendAuthorization();

  it.each(['REV', 'VAL', 'CREADOR', 'CONSULTA'])('limits %s to its assigned process', (role) => {
    const scopedUser = user(role);
    expect(backend.isActionVisibleToUser_(scopedUser, action())).toBe(true);
    expect(backend.isActionVisibleToUser_(scopedUser, action({ proceso: 'Gestion Financiera' }))).toBe(false);
    expect(() => backend.assertActionScope_(scopedUser, action({ proceso: 'Gestion Financiera' }))).toThrow();
  });

  it.each(['ADMIN', 'OCI'])('keeps %s with global process access', (role) => {
    expect(backend.isActionVisibleToUser_(user(role, ''), action({ proceso: 'Gestion Financiera' }))).toBe(true);
  });

  it('denies scoped users that do not have a process assignment', () => {
    expect(backend.isActionVisibleToUser_(user('REV', ''), action())).toBe(false);
  });
});

describe('Apps Script field-level authorization', () => {
  const backend = loadBackendAuthorization();

  it('lets REV update review fields while preserving definitions, validation and final evaluation', () => {
    const previous = action();
    const requested = local(previous);
    Object.assign(requested, {
      descripcion: 'Ataque a la descripcion',
      proceso: 'Gestion Financiera',
      fechaEvaluacion: '2026-09-06',
      eficacia: 'SI',
      evaluacionObservacion: 'Cierre indebido',
    });
    Object.assign(requested.planMejoramiento[0], {
      actividad: 'Actividad manipulada',
      responsable: 'Responsable manipulado',
      evidencia: 'https://drive.example/evidencia',
      revisionFecha: '2026-09-06',
      revisionObservacion: 'Ejecutada correctamente',
      observacionRevision: 'Contencion revisada',
      validacionFecha: '2026-09-06',
      validacionObservacion: 'SI',
    });

    const result = local(backend.applyRoleUpdateRestrictions_(user('REV'), previous, requested));
    expect(result.descripcion).toBe('Descripcion original');
    expect(result.proceso).toBe('Planeacion Estrategica');
    expect(result.eficacia).toBe('');
    expect(result.planMejoramiento[0]).toMatchObject({
      actividad: 'Actividad original',
      responsable: 'Responsable original',
      evidencia: 'https://drive.example/evidencia',
      revisionFecha: '2026-09-06',
      revisionObservacion: 'Ejecutada correctamente',
      observacionRevision: 'Contencion revisada',
      validacionFecha: '',
      validacionObservacion: '',
    });
  });

  it('does not let REV rewrite an activity after VAL has started validating it', () => {
    const previous = action({
      estadoActual: 'VALIDACION',
      planMejoramiento: [
        activity({
          evidencia: 'evidencia original',
          revisionFecha: '2026-09-05',
          revisionObservacion: 'Revision original',
          validacionFecha: '2026-09-06',
          validacionObservacion: 'SI',
        }),
      ],
    });
    const requested = local(previous);
    requested.planMejoramiento[0].evidencia = 'evidencia manipulada';
    requested.planMejoramiento[0].revisionObservacion = 'Revision manipulada';

    const result = local(backend.applyRoleUpdateRestrictions_(user('REV'), previous, requested));
    expect(result.planMejoramiento[0].evidencia).toBe('evidencia original');
    expect(result.planMejoramiento[0].revisionObservacion).toBe('Revision original');
  });

  it('lets VAL validate reviewed activities but not alter REV or action fields', () => {
    const previous = action({
      estadoActual: 'VALIDACION',
      planMejoramiento: [activity({ revisionFecha: '2026-09-05', revisionObservacion: 'Ejecutada' })],
    });
    const requested = local(previous);
    requested.descripcion = 'Descripcion manipulada';
    Object.assign(requested.planMejoramiento[0], {
      actividad: 'Actividad manipulada',
      evidencia: 'evidencia manipulada',
      revisionObservacion: 'Revision manipulada',
      validacionResponsable: 'Otro validador',
      validacionFecha: '2026-09-06',
      validacionObservacion: 'SI',
    });

    const result = local(backend.applyRoleUpdateRestrictions_(user('VAL'), previous, requested));
    expect(result.descripcion).toBe('Descripcion original');
    expect(result.planMejoramiento[0]).toMatchObject({
      actividad: 'Actividad original',
      evidencia: '',
      revisionObservacion: 'Ejecutada',
      validacionResponsable: 'Lider Uno',
      validacionFecha: '2026-09-06',
      validacionObservacion: 'SI',
    });
  });

  it('does not let VAL validate an activity before REV completes its review', () => {
    const previous = action({ estadoActual: 'VALIDACION' });
    const requested = local(previous);
    requested.planMejoramiento[0].validacionFecha = '2026-09-06';
    requested.planMejoramiento[0].validacionObservacion = 'SI';

    const result = local(backend.applyRoleUpdateRestrictions_(user('VAL'), previous, requested));
    expect(result.planMejoramiento[0].validacionFecha).toBe('');
    expect(result.planMejoramiento[0].validacionObservacion).toBe('');
  });

  it('lets VAL perform final evaluation only when the process leader is the evaluator', () => {
    const reviewed = activity({ revisionFecha: '2026-09-05', revisionObservacion: 'Ejecutada' });
    const previous = action({
      estadoActual: 'VALIDACION',
      auditorInterno: 'Lider del proceso',
      planMejoramiento: [reviewed],
    });
    const requested = local(previous);
    Object.assign(requested.planMejoramiento[0], {
      validacionFecha: '2026-09-06',
      validacionObservacion: 'SI',
    });
    Object.assign(requested, {
      fechaEvaluacion: '2026-09-06',
      eficacia: 'SI',
      evaluacionObservacion: 'Evaluacion del lider',
    });

    const result = local(backend.applyRoleUpdateRestrictions_(user('VAL'), previous, requested));
    expect(result).toMatchObject({
      fechaEvaluacion: '2026-09-06',
      eficacia: 'SI',
      evaluacionObservacion: 'Evaluacion del lider',
    });
  });

  it('lets OCI update only final evaluation fields', () => {
    const previous = action({
      estadoActual: 'REVISION_OCI',
      planMejoramiento: [
        activity({
          revisionFecha: '2026-09-05',
          revisionObservacion: 'Ejecutada',
          validacionFecha: '2026-09-06',
          validacionObservacion: 'SI',
        }),
      ],
    });
    const requested = local(previous);
    requested.descripcion = 'Descripcion manipulada';
    requested.planMejoramiento[0].validacionObservacion = 'NO';
    Object.assign(requested, {
      fechaEvaluacion: '2026-09-06',
      eficacia: 'NO',
      evaluacionObservacion: 'No fue eficaz',
    });

    const result = local(backend.applyRoleUpdateRestrictions_(user('OCI', ''), previous, requested));
    expect(result.descripcion).toBe('Descripcion original');
    expect(result.planMejoramiento[0].validacionObservacion).toBe('SI');
    expect(result).toMatchObject({
      fechaEvaluacion: '2026-09-06',
      eficacia: 'NO',
      evaluacionObservacion: 'No fue eficaz',
    });
  });

  it('prevents CREADOR from changing a plan after operational progress exists', () => {
    const previous = action({ planMejoramiento: [activity({ evidencia: 'https://drive.example/evidencia' })] });
    const requested = local(previous);
    requested.planMejoramiento = [activity({ actividad: 'Cambio indebido', evidencia: '' }), activity()];

    const result = local(backend.applyRoleUpdateRestrictions_(user('CREADOR'), previous, requested));
    expect(result.planMejoramiento).toHaveLength(1);
    expect(result.planMejoramiento[0].actividad).toBe('Actividad original');
    expect(result.planMejoramiento[0].evidencia).toBe('https://drive.example/evidencia');
  });

  it('strips review, validation and evaluation data from non-admin creation requests', () => {
    const malicious = action({
      id: 500,
      eficacia: 'SI',
      fechaEvaluacion: '2026-09-06',
      evaluacionObservacion: 'Cierre indebido',
      planMejoramiento: [
        activity({
          evidencia: 'evidencia indebida',
          revisionFecha: '2026-09-06',
          revisionObservacion: 'revision indebida',
          validacionFecha: '2026-09-06',
          validacionObservacion: 'SI',
        }),
      ],
    });

    const result = local(backend.sanitizeCreatedActionForRole_(user('CREADOR'), malicious));
    expect(result).toMatchObject({ fechaEvaluacion: '', eficacia: '', evaluacionObservacion: '' });
    expect(result.planMejoramiento[0]).toMatchObject({
      evidencia: '',
      revisionFecha: '',
      revisionObservacion: '',
      validacionFecha: '',
      validacionObservacion: '',
    });
  });
});

describe('Apps Script phase authorization', () => {
  const backend = loadBackendAuthorization();

  it('rejects REV in registration and VAL in the action-plan phase', () => {
    expect(() =>
      backend.assertActionPhasePermission_(user('REV'), action({ estadoActual: 'REGISTRO' }), action()),
    ).toThrow();
    expect(() =>
      backend.assertActionPhasePermission_(user('VAL'), action({ estadoActual: 'PLAN_ACCION' }), action()),
    ).toThrow();
  });

  it('rejects CREADOR once the action is closed', () => {
    expect(() =>
      backend.assertActionPhasePermission_(user('CREADOR'), action({ estadoActual: 'CERRADA' }), action()),
    ).toThrow();
  });

  it('rejects CREADOR after review begins and REV after validation begins', () => {
    expect(() =>
      backend.assertActionPhasePermission_(
        user('CREADOR'),
        action({ planMejoramiento: [activity({ evidencia: 'evidencia' })] }),
        action(),
      ),
    ).toThrow();
    expect(() =>
      backend.assertActionPhasePermission_(
        user('REV'),
        action({
          estadoActual: 'VALIDACION',
          planMejoramiento: [activity({ validacionFecha: '2026-09-06', validacionObservacion: 'SI' })],
        }),
        action(),
      ),
    ).toThrow();
  });
});

describe('Apps Script scoped dashboard totals', () => {
  it('counts only the assigned process and partitions all statuses correctly', () => {
    const backend = loadBackendAuthorization();
    const records = [
      action({
        id: 420,
        fechaFinAccion: '2026-12-01',
        planMejoramiento: [activity()],
      }),
      action({
        id: 419,
        estado: 'VENCIDA',
        fechaFinAccion: '2026-08-01',
        planMejoramiento: [activity(), activity({ idActividad: '419-002', numeroActividad: 2 })],
      }),
      action({
        id: 418,
        estadoActual: 'CERRADA',
        estado: 'CERRADA',
        eficacia: 'NO',
        fechaFinAccion: '2026-07-01',
        planMejoramiento: [activity()],
      }),
      action({
        id: 417,
        proceso: 'Gestion Financiera',
        estadoActual: 'CERRADA',
        estado: 'CERRADA',
        eficacia: 'SI',
        planMejoramiento: [activity(), activity(), activity()],
      }),
    ];
    backend.evaluate(`
      getCurrentUser_ = function () { return ${JSON.stringify(user('REV'))}; };
      assertPermission_ = function () {};
      listActionRecords_ = function () {
        return ${JSON.stringify(records)}.map(function (item) { return { action: item }; });
      };
    `);

    const stats = local(backend.getStats_());
    expect(stats).toMatchObject({
      total: 3,
      actividades: 4,
      abiertas: 1,
      cerradas: 1,
      vencidas: 1,
      eficaces: 0,
      noEficaces: 1,
    });
    expect(stats.abiertas + stats.cerradas + stats.vencidas).toBe(stats.total);
    expect(stats.porProceso).toEqual([{ proceso: 'Planeación Estratégica', total: 3 }]);
    expect(stats.recientes.map((item: PlainObject) => item.id)).toEqual([420, 419, 418]);
  });
});
