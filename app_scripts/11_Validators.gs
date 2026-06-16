function validateId_(id) {
  var numberId = Number(id);
  if (!Number.isFinite(numberId) || numberId <= 0 || Math.floor(numberId) !== numberId) {
    throw new AppError_('INVALID_ID', 'El ID debe ser un entero positivo.', { id: id });
  }
  return numberId;
}

function validateAction_(action, options) {
  var errors = {};
  if (options && options.requireId) {
    try {
      validateId_(action.id);
    } catch (error) {
      errors.id = error.message;
    }
  }
  ['fechaElaboracion', 'origen', 'tipoAccion', 'proceso', 'descripcion'].forEach(function (field) {
    if (!normalizeText_(action[field])) {
      errors[field] = 'Campo obligatorio.';
    }
  });
  validateRequiredFieldsForState_(action, errors);
  if (!isValidIsoDate_(action.fechaElaboracion)) errors.fechaElaboracion = 'Fecha inválida.';
  if (Number(action.presupuesto || 0) < 0) errors.presupuesto = 'El presupuesto no puede ser negativo.';
  if (CONFIG.EFFECTIVENESS_VALUES.indexOf(normalizeEffectiveness_(action.eficacia)) < 0) {
    errors.eficacia = 'Valor de eficacia inválido.';
  }
  assertDateOrder_(action, 'fechaApertura', 'fechaCierre', errors);
  assertDateOrder_(action, 'fechaInicioAccion', 'fechaFinAccion', errors);
  validatePlanActivities_(action.planMejoramiento, errors);
  if (Object.keys(errors).length) {
    throw new AppError_('VALIDATION_ERROR', 'La acción no cumple las validaciones.', errors);
  }
}

function validateRequiredFieldsForState_(action, errors) {
  var state = normalizeDocumentState_(action.estadoActual);
  var planIsRequired = isTruthy_(action.fechasBloqueadas) || ['VALIDACION', 'REVISION_OCI', 'CERRADA'].indexOf(state) >= 0;
  if (planIsRequired) {
    ['accion', 'fechaInicioAccion', 'fechaFinAccion'].forEach(function (field) {
      if (!normalizeText_(action[field])) {
        errors[field] = 'Campo obligatorio para el plan de accion.';
      }
    });
  }
  if (normalizeEffectiveness_(action.eficacia) === 'SI' && !normalizeText_(action.fechaEvaluacion)) {
    errors.fechaEvaluacion = 'Campo obligatorio para cerrar la accion.';
  }
}

function assertDateOrder_(action, startField, endField, errors) {
  var start = normalizeText_(action[startField]);
  var end = normalizeText_(action[endField]);
  if (start && end && start > end) {
    errors[endField] = 'La fecha final no puede ser anterior a la inicial.';
  }
}

function validatePlanActivities_(activities, errors) {
  normalizeJsonField_(activities).forEach(function (activity, index) {
    var prefix = 'planMejoramiento[' + index + ']';
    if (Number(activity.presupuesto || 0) < 0) {
      errors[prefix + '.presupuesto'] = 'El presupuesto no puede ser negativo.';
    }
    if (normalizeText_(activity.fechaApertura) && normalizeText_(activity.fechaCierre) && activity.fechaCierre < activity.fechaApertura) {
      errors[prefix + '.fechaCierre'] = 'La fecha de cierre no puede ser anterior a la apertura.';
    }
    if (normalizeText_(activity.revisionFecha) && normalizeText_(activity.validacionFecha) && activity.validacionFecha < activity.revisionFecha) {
      errors[prefix + '.validacionFecha'] = 'La validacion no puede ser anterior a la revision.';
    }
  });
}
