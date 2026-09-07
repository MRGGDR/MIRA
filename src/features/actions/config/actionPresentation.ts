export const ACTION_SECTION_TITLES = {
  registro: 'A. Descripción del hallazgo',
  analisis: 'B. Análisis de causas',
  plan: 'C. Plan de actividades',
} as const;

export const ACTION_FIELD_LABELS = {
  id: 'Número de la acción',
  fechaElaboracion: 'Fecha de elaboración',
  origen: 'Origen',
  tipoAccion: 'Tipo de acción',
  proceso: 'Proceso o subproceso',
  identificadoPor: 'Reportado por',
  liderProceso: 'Líder del proceso',
  auditorInterno: 'Evaluador',
  descripcion: 'Descripción',
  identificacionCausas: 'Identificación de causas',
  causaRaiz: 'Causa raíz',
  accionContencion: 'Acción de contención',
  respuestaContencion: 'Respuesta a la acción de contención REV',
  idActividad: 'Código de actividad',
  actividad: 'Actividad',
  fechaApertura: 'Fecha inicio actividad',
  fechaCierre: 'Fecha fin actividad',
  responsable: 'Responsable de actividad',
  evidencia: 'URL de evidencia',
  revisionFecha: 'Fecha ejecución',
  revisionObservacion: 'Descripción de la ejecución',
  validacionResponsable: 'Responsable validación',
  validacionFecha: 'Fecha validación',
  validacionObservacion: 'Fue validada la actividad?',
  fechaEvaluacion: 'Fecha de evaluación',
  evaluacionObservacion: 'Observación de la acción',
} as const;

export function getEvaluationSectionTitle(evaluator: string): string {
  return evaluator.trim().toLowerCase() === 'oci'
    ? 'D. Evaluación del evaluador'
    : 'D. Evaluación del líder del proceso';
}

export function getEffectivenessLabel(evaluator: string): string {
  return evaluator.trim().toLowerCase() === 'oci' ? 'Fue eficaz?' : 'Fue validada la acción?';
}

export function getEvaluatorLabel(evaluator: string): string {
  const normalized = evaluator.trim().toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (normalized === 'oci') return 'Jefe de Control Interno';
  if (normalized === 'lider del proceso') return 'Líder del proceso';
  return evaluator;
}
