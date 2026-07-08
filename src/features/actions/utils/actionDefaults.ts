import type { ActionFormValues } from '@/features/actions/schemas/actionSchema';
import type { CorrectiveAction } from '@/features/actions/types';
import { todayIso } from '@/utils/date';

export function getDefaultActionValues(proceso = ''): ActionFormValues {
  const today = todayIso();
  return {
    fechaElaboracion: today,
    origen: '',
    tipoAccion: '',
    proceso,
    identificadoPor: '',
    liderProceso: '',
    descripcion: '',
    equipoMejoramiento: '',
    equipoMejoramientoDetalle: [],
    identificacionCausas: '',
    causaRaiz: '',
    causasDefinitivas: [],
    correccion: '',
    accion: '',
    planMejoramiento: [
      {
        idActividad: '',
        idAccion: undefined,
        numeroActividad: 1,
        actividad: '',
        fechaApertura: today,
        fechaCierre: '',
        presupuesto: 0,
        responsable: '',
        revisionResponsable: '',
        revisionFecha: '',
        revisionObservacion: '',
        observacionRevision: '',
        validacionResponsable: '',
        validacionFecha: '',
        validacionObservacion: '',
        evidencia: '',
      },
    ],
    responsable: '',
    fechaApertura: today,
    fechaCierre: '',
    fechaInicioAccion: '',
    fechaFinAccion: '',
    presupuesto: 0,
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
    accionContencion: '',
    recomendacionesFinales: '',
  };
}

export function actionToFormValues(action: CorrectiveAction): ActionFormValues {
  return {
    ...action,
    equipoMejoramientoDetalle: action.equipoMejoramientoDetalle ?? [],
    causasDefinitivas: action.causasDefinitivas ?? [],
    planMejoramiento: (action.planMejoramiento ?? []).map((activity) => ({
      ...activity,
      idActividad: activity.idActividad ?? '',
      idAccion: activity.idAccion,
      numeroActividad: activity.numeroActividad,
      evidencia: activity.evidencia ?? '',
      observacionRevision: activity.observacionRevision ?? '',
    })),
    presupuesto: Number(action.presupuesto || 0),
    correoEnviado: Boolean(action.correoEnviado),
    fechasBloqueadas: Boolean(action.fechasBloqueadas),
    accionContencion: action.accionContencion ?? '',
    recomendacionesFinales: action.recomendacionesFinales ?? '',
  };
}
