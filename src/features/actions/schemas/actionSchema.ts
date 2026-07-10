import { z } from 'zod';

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use el formato AAAA-MM-DD')
  .or(z.literal(''));

const optionalText = z.string().trim();

const teamMemberSchema = z.object({
  nombre: optionalText,
  previas: optionalText,
  votacion: optionalText,
});

const definitiveCauseSchema = z.object({
  causa: optionalText,
  descripcion: optionalText,
  votos: z.number().min(0, 'Los votos no pueden ser negativos'),
  puntaje: z.number().min(0, 'El puntaje no puede ser negativo'),
});

const planActivitySchema = z.object({
  idActividad: optionalText.optional(),
  idAccion: z.number().optional(),
  numeroActividad: z.number().optional(),
  actividad: optionalText,
  fechaApertura: dateString,
  fechaCierre: dateString,
  presupuesto: z.number().min(0, 'El presupuesto no puede ser negativo'),
  responsable: optionalText,
  revisionResponsable: optionalText,
  revisionFecha: dateString,
  revisionObservacion: optionalText,
  observacionRevision: optionalText,
  validacionResponsable: optionalText,
  validacionFecha: dateString,
  validacionObservacion: optionalText,
  evidencia: optionalText,
});

export const actionSchema = z
  .object({
    id: z.number().int('El número debe ser entero').positive('El número debe ser positivo').optional(),
    fechaElaboracion: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha obligatoria'),
    origen: z.string().min(1, 'Seleccione el origen'),
    tipoAccion: z.string().min(1, 'Seleccione el tipo de acción'),
    proceso: z.string().min(1, 'Seleccione el proceso'),
    identificadoPor: z.string().trim(),
    liderProceso: z.string().trim(),
    descripcion: z.string().trim().min(1, 'Describa el hallazgo'),
    equipoMejoramiento: z.string().trim(),
    equipoMejoramientoDetalle: z.array(teamMemberSchema),
    identificacionCausas: z.string().trim(),
    causaRaiz: z.string().trim(),
    causasDefinitivas: z.array(definitiveCauseSchema),
    correccion: z.string().trim(),
    accion: z.string().trim(),
    planMejoramiento: z.array(planActivitySchema),
    responsable: z.string().trim(),
    fechaApertura: dateString,
    fechaCierre: dateString,
    fechaInicioAccion: dateString,
    fechaFinAccion: dateString,
    presupuesto: z.number().min(0, 'El presupuesto no puede ser negativo'),
    revisionResponsable: z.string().trim(),
    revisionFecha: dateString,
    revisionObservacion: z.string().trim(),
    validacionResponsable: z.string().trim(),
    validacionFecha: dateString,
    validacionObservacion: z.string().trim(),
    evidencia: z.string().trim(),
    auditorInterno: z.string().trim(),
    fechaEvaluacion: dateString,
    eficacia: z.enum(['SI', 'NO', '']),
    evaluacionObservacion: z.string().trim(),
    estado: z.enum(['ABIERTA', 'CERRADA', 'VENCIDA']).optional(),
    estadoActual: z.enum(['REGISTRO', 'ANALISIS', 'PLAN_ACCION', 'VALIDACION', 'REVISION_OCI', 'CERRADA']),
    correoEnviado: z.boolean(),
    fechasBloqueadas: z.boolean(),
    accionContencion: z.string().trim(),
    recomendacionesFinales: z.string().trim(),
  })
  .superRefine((value, ctx) => {
    const checks: Array<[string, string, string]> = [
      ['fechaApertura', 'fechaCierre', 'La fecha de cierre no puede ser anterior a la apertura'],
      ['fechaInicioAccion', 'fechaFinAccion', 'La fecha fin no puede ser anterior al inicio'],
    ];

    checks.forEach(([startKey, endKey, message]) => {
      const start = value[startKey as keyof typeof value];
      const end = value[endKey as keyof typeof value];
      if (typeof start === 'string' && typeof end === 'string' && start && end && end < start) {
        ctx.addIssue({
          code: 'custom',
          message,
          path: [endKey],
        });
      }
    });

    value.planMejoramiento.forEach((activity, index) => {
      if (activity.fechaApertura && activity.fechaCierre && activity.fechaCierre < activity.fechaApertura) {
        ctx.addIssue({
          code: 'custom',
          message: 'La fecha de cierre no puede ser anterior a la apertura',
          path: ['planMejoramiento', index, 'fechaCierre'],
        });
      }
      if (activity.revisionFecha && activity.validacionFecha && activity.validacionFecha < activity.revisionFecha) {
        ctx.addIssue({
          code: 'custom',
          message: 'La validación no puede ser anterior a la revisión',
          path: ['planMejoramiento', index, 'validacionFecha'],
        });
      }
    });

    const activeActivities = value.planMejoramiento
      .map((activity, index) => ({ activity, index }))
      .filter(({ activity }) =>
        activity.actividad.trim() ||
        activity.responsable.trim() ||
        activity.fechaApertura ||
        activity.fechaCierre ||
        activity.evidencia.trim() ||
        activity.revisionFecha ||
        activity.revisionObservacion.trim() ||
        activity.observacionRevision.trim() ||
        activity.validacionFecha ||
        activity.validacionObservacion.trim(),
      );
    const normalizedActionType = value.tipoAccion.toLowerCase();
    const isCorrective = normalizedActionType.includes('correctiva');
    const isImprovement = normalizedActionType.includes('mejora');
    const evaluator = value.auditorInterno.trim();

    if (isCorrective && evaluator !== 'OCI') {
      ctx.addIssue({
        code: 'custom',
        message: 'El evaluador de una acción correctiva debe ser OCI',
        path: ['auditorInterno'],
      });
    }

    if (isImprovement && evaluator !== 'OCI' && evaluator !== 'Líder del proceso' && evaluator !== 'Lider del proceso') {
      ctx.addIssue({
        code: 'custom',
        message: 'Seleccione OCI o Lider del proceso como evaluador',
        path: ['auditorInterno'],
      });
    }

    const isOciEvaluation =
      ['REVISION_OCI', 'CERRADA'].includes(value.estadoActual) ||
      Boolean(value.eficacia || value.fechaEvaluacion || value.evaluacionObservacion.trim());

    if (isOciEvaluation) {
      if (!activeActivities.length) {
        ctx.addIssue({
          code: 'custom',
          message: 'Registre al menos una actividad antes de evaluar en OCI',
          path: ['planMejoramiento'],
        });
      }
      activeActivities.forEach(({ activity, index }) => {
        const requiredFields: Array<[keyof typeof activity, string]> = [
          ['revisionFecha', 'Registre la fecha de ejecución REV'],
          ['revisionObservacion', 'Registre la descripción de ejecución'],
          ['validacionResponsable', 'Registre el responsable de validación'],
          ['validacionFecha', 'Registre la fecha de validación'],
          ['validacionObservacion', 'Registre la observación de validación'],
        ];
        requiredFields.forEach(([field, message]) => {
          const fieldValue = activity[field];
          const textValue = typeof fieldValue === 'string' ? fieldValue.trim() : String(fieldValue ?? '').trim();
          if (!textValue) {
            ctx.addIssue({
              code: 'custom',
              message,
              path: ['planMejoramiento', index, field],
            });
          }
        });
      });
    }

    const requiresPlan = value.estadoActual === 'PLAN_ACCION' || value.fechasBloqueadas || ['VALIDACION', 'REVISION_OCI', 'CERRADA'].includes(value.estadoActual);
    if (requiresPlan) {
      const hasPlanActivity = value.planMejoramiento.some((activity) => activity.actividad.trim() && activity.fechaApertura && activity.fechaCierre);
      if (!hasPlanActivity) {
        const requiredPlanFields: Array<[keyof typeof value, string]> = [
          ['accion', 'Registre la actividad'],
          ['fechaInicioAccion', 'Registre la fecha de inicio de actividad'],
          ['fechaFinAccion', 'Registre la fecha fin de actividad'],
        ];

        requiredPlanFields.forEach(([field, message]) => {
          const rawValue = value[field];
          const textValue = typeof rawValue === 'string' ? rawValue : '';
          if (!textValue.trim()) {
            ctx.addIssue({
              code: 'custom',
              message,
              path: [field],
            });
          }
        });
      }

      value.planMejoramiento.forEach((activity, index) => {
        const hasAnyActivityData = activity.actividad.trim() || activity.responsable.trim() || activity.fechaApertura || activity.fechaCierre;
        if (hasAnyActivityData && !activity.actividad.trim()) {
          ctx.addIssue({
            code: 'custom',
            message: 'Registre la actividad',
            path: ['planMejoramiento', index, 'actividad'],
          });
        }
        if (hasAnyActivityData && !activity.fechaApertura) {
          ctx.addIssue({
            code: 'custom',
            message: 'Registre la fecha de inicio de actividad',
            path: ['planMejoramiento', index, 'fechaApertura'],
          });
        }
        if (hasAnyActivityData && !activity.fechaCierre) {
          ctx.addIssue({
            code: 'custom',
            message: 'Registre la fecha fin de actividad',
            path: ['planMejoramiento', index, 'fechaCierre'],
          });
        }
      });
    }

    if (value.eficacia === 'SI' && !value.fechaEvaluacion) {
      ctx.addIssue({
        code: 'custom',
        message: 'Registre la fecha de evaluación',
        path: ['fechaEvaluacion'],
      });
    }
  });

export type ActionFormValues = z.infer<typeof actionSchema>;
