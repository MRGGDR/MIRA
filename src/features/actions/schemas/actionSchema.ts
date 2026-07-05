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
  actividad: optionalText,
  fechaApertura: dateString,
  fechaCierre: dateString,
  presupuesto: z.number().min(0, 'El presupuesto no puede ser negativo'),
  responsable: optionalText,
  revisionResponsable: optionalText,
  revisionFecha: dateString,
  revisionObservacion: optionalText,
  validacionResponsable: optionalText,
  validacionFecha: dateString,
  validacionObservacion: optionalText,
  evidencia: optionalText,
});

export const actionSchema = z
  .object({
    id: z.number().int('El numero debe ser entero').positive('El numero debe ser positivo').optional(),
    fechaElaboracion: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha obligatoria'),
    origen: z.string().min(1, 'Seleccione el origen'),
    tipoAccion: z.string().min(1, 'Seleccione el tipo de accion'),
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
          message: 'La validacion no puede ser anterior a la revision',
          path: ['planMejoramiento', index, 'validacionFecha'],
        });
      }
    });

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
        message: 'Registre la fecha de evaluacion',
        path: ['fechaEvaluacion'],
      });
    }
  });

export type ActionFormValues = z.infer<typeof actionSchema>;
