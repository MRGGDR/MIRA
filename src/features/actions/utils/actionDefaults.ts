import type { ActionFormValues } from '@/features/actions/schemas/actionSchema';
import type { CorrectiveAction } from '@/features/actions/types';
import { todayIso } from '@/utils/date';

export function getDefaultActionValues(proceso = ''): ActionFormValues {
  return {
    fechaElaboracion: todayIso(),
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
    planMejoramiento: [],
    responsable: '',
    fechaApertura: todayIso(),
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
    planMejoramiento: action.planMejoramiento ?? [],
    presupuesto: Number(action.presupuesto || 0),
    correoEnviado: Boolean(action.correoEnviado),
    fechasBloqueadas: Boolean(action.fechasBloqueadas),
    accionContencion: action.accionContencion ?? '',
    recomendacionesFinales: action.recomendacionesFinales ?? '',
  };
}
