function listActions_(filters) {
  var user = getCurrentUser_();
  assertPermission_(user, 'read');
  var page = Math.max(Number(filters.page || 1), 1);
  var pageSize = Math.min(Math.max(Number(filters.pageSize || 10), 1), 1000);
  var items = listActionRecords_()
    .map(function (record) {
      return record.action;
    })
    .filter(function (action) {
      return isActionVisibleToUser_(user, action);
    })
    .filter(function (action) {
      return matchesActionFilters_(action, filters || {});
    });
  var total = items.length;
  var start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: page,
    pageSize: pageSize,
    total: total,
    totalPages: Math.max(Math.ceil(total / pageSize), 1)
  };
}

function getAction_(id) {
  var user = getCurrentUser_();
  assertPermission_(user, 'read');
  var record = findActionRecordById_(id);
  if (!record) {
    throw new AppError_('ACTION_NOT_FOUND', 'No se encontró la acción solicitada.', { id: id });
  }
  assertActionScope_(user, record.action);
  return record.action;
}

function getNextActionId_() {
  var user = getCurrentUser_();
  assertPermission_(user, 'create');
  return calculateNextId_();
}

function createAction_(input) {
  var user = getCurrentUser_();
  assertPermission_(user, 'create');
  var lock = LockService.getScriptLock();
  var locked = false;
  try {
    lock.waitLock(30000);
    locked = true;
    var action = normalizeActionInput_(input);
    applyUserProcessScope_(user, action);
    action.id = action.id ? validateId_(action.id) : calculateNextId_();
    action = sanitizeCreatedActionForRole_(user, action);
    assertActionIdAvailable_(action.id);
    action.fechaElaboracion = action.fechaElaboracion || Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd');
    action.estadoActual = initialStateForCreatedAction_(action);
    action.correoEnviado = false;
    action.fechasBloqueadas = false;
    assertBusinessRules_(action);
    action.estado = calculateStatus_(action);
    validateAction_(action, { requireId: true });
    var inserted = insertAction_(action);
    appendAudit_('CREATE', user, inserted.action.id, inserted.rowNumber, {}, inserted.action);
    return inserted.action;
  } finally {
    if (locked) lock.releaseLock();
  }
}

function assertActionIdAvailable_(id) {
  if (findActionRowNumberById_(id)) {
    throw new AppError_('DUPLICATE_ID', 'Ya existe una acción con ese número.', { id: id });
  }
}

function initialStateForCreatedAction_(action) {
  if (normalizeEffectiveness_(action.eficacia)) return 'CERRADA';
  if (hasPlanActivity_(action)) return 'PLAN_ACCION';
  if (normalizeText_(action.tipoAccion).toLowerCase().indexOf('mejora') >= 0) return 'PLAN_ACCION';
  return 'ANALISIS';
}

function hasPlanActivity_(action) {
  var activities = normalizeJsonField_(action.planMejoramiento);
  if (activities.some(function (activity) {
    return normalizeText_(activity.actividad) && normalizeText_(activity.fechaApertura) && normalizeText_(activity.fechaCierre);
  })) {
    return true;
  }
  return normalizeText_(action.accion) && normalizeText_(action.fechaInicioAccion || action.fechaApertura) && normalizeText_(action.fechaFinAccion || action.fechaCierre);
}

function updateAction_(input) {
  var user = getCurrentUser_();
  assertPermission_(user, 'update');
  var lock = LockService.getScriptLock();
  var locked = false;
  try {
    lock.waitLock(30000);
    locked = true;
    var id = validateId_(input.id);
    var record = findActionRecordById_(id);
    if (!record) {
      throw new AppError_('ACTION_NOT_FOUND', 'No se encontró la acción solicitada.', { id: id });
    }
    assertActionScope_(user, record.action);
    var action = normalizeActionInput_(input);
    action.id = id;
    assertActionPhasePermission_(user, record.action, action);
    action = applyRoleUpdateRestrictions_(user, record.action, action);
    applyUserProcessScope_(user, action);
    assertBusinessRules_(action);
    advanceActionStateOnSave_(user, record.action, action);
    action.estadoActual = calculateDocumentState_(action);
    action.estado = calculateStatus_(action);
    validateAction_(action, { requireId: true });
    var updated = updateActionRow_(record.rowNumber, action);
    appendAudit_('UPDATE', user, id, record.rowNumber, record.action, updated.action);
    return updated.action;
  } finally {
    if (locked) lock.releaseLock();
  }
}

function notifyOci_(id) {
  var user = getCurrentUser_();
  assertPermission_(user, 'update');
  if (!user.permissions.canNotifyOci && !user.permissions.canAdmin) {
    throw new AppError_('FORBIDDEN', 'No tiene permisos para notificar a Control Interno.');
  }
  var lock = LockService.getScriptLock();
  var locked = false;
  try {
    lock.waitLock(30000);
    locked = true;
    var record = findActionRecordById_(id);
    if (!record) throw new AppError_('ACTION_NOT_FOUND', 'No se encontró la acción solicitada.', { id: id });
    assertActionScope_(user, record.action);
    var action = record.action;
    if (!isOciEvaluator_(action)) {
      throw new AppError_('OCI_GATE_BLOCKED', 'Esta acción tiene como evaluador al líder del proceso; no debe enviarse a OCI.');
    }
    if (!areActivitiesReadyForOci_(action)) {
      throw new AppError_('OCI_GATE_BLOCKED', 'No puede notificar a Control Interno hasta completar revisión y validación de todas las actividades.');
    }
    action.correoEnviado = true;
    action.estadoActual = 'REVISION_OCI';
    action.estado = calculateStatus_(action);
    var updated = updateActionRow_(record.rowNumber, action);
    appendAudit_('UPDATE', user, id, record.rowNumber, record.action, updated.action);
    return updated.action;
  } finally {
    if (locked) lock.releaseLock();
  }
}

function isActionVisibleToUser_(user, action) {
  if (hasGlobalProcessScope_(user)) return true;
  var proceso = normalizeText_(user.proceso).toUpperCase();
  if (!proceso) return false;
  var legacyProcesses = CONFIG.LEGACY_PROCESS_NAMES[proceso];
  if (legacyProcesses) {
    return legacyProcesses.some(function (legacyProcess) {
      return isSameProcess_(action.proceso, legacyProcess);
    });
  }
  return isSameProcess_(action.proceso, user.proceso);
}

function assertActionScope_(user, action) {
  if (isActionVisibleToUser_(user, action)) return;
  throw new AppError_('FORBIDDEN', 'No tiene permisos para acceder a registros de otro proceso.', {
    procesoUsuario: user.proceso,
    procesoAccion: action.proceso
  });
}

function applyUserProcessScope_(user, action) {
  if (hasGlobalProcessScope_(user)) return;
  var proceso = normalizeText_(user.proceso).toUpperCase();
  if (!proceso) {
    throw new AppError_('FORBIDDEN', 'El usuario no tiene proceso asignado.', { email: user.email });
  }
  var processNames = getProcessNamesForAccess_(user.proceso);
  var requestedProcess = normalizeText_(action.proceso);
  var requestedProcessIsAllowed = requestedProcess && processNames.some(function (processName) {
    return isSameProcess_(requestedProcess, processName);
  });
  action.proceso = requestedProcessIsAllowed
    ? getProcessName_(requestedProcess)
    : (processNames[0] || normalizeText_(user.proceso));
}

function hasGlobalProcessScope_(user) {
  return Boolean(user && user.permissions && (user.permissions.canAdmin || user.rol === 'OCI'));
}

function assertBusinessRules_(action) {
  var actionType = normalizeText_(action.tipoAccion).toLowerCase();
  var evaluator = normalizeText_(action.auditorInterno);
  var normalizedEvaluator = evaluator.toLowerCase();
  if (actionType.indexOf('preventiva') >= 0) {
    throw new AppError_('VALIDATION_ERROR', 'La acción preventiva está bloqueada para este flujo.', { tipoAccion: action.tipoAccion });
  }
  if (actionType.indexOf('correctiva') >= 0 && evaluator !== 'OCI') {
    throw new AppError_('VALIDATION_ERROR', 'El evaluador de una acción correctiva debe ser OCI.', { auditorInterno: action.auditorInterno });
  }
  if (
    actionType.indexOf('mejora') >= 0 &&
    normalizedEvaluator !== 'oci' &&
    normalizedEvaluator !== 'lider del proceso'
  ) {
    throw new AppError_('VALIDATION_ERROR', 'Seleccione OCI o Lider del proceso como evaluador.', { auditorInterno: action.auditorInterno });
  }
}

function advanceActionStateOnSave_(user, previous, action) {
  var phase = normalizeDocumentState_(previous.estadoActual || action.estadoActual);
  if (!areActivitiesReadyForOci_(action)) {
    action.correoEnviado = false;
  }
  if ((user.permissions.canAdmin || user.permissions.canEditPlan) && phase === 'PLAN_ACCION' && areActivitiesExecuted_(action)) {
    action.fechasBloqueadas = true;
  }
  if ((user.permissions.canAdmin || user.permissions.canEditValidacion) && phase === 'VALIDACION' && areActivitiesReadyForOci_(action) && isOciEvaluator_(action)) {
    action.correoEnviado = true;
  }
}

function assertActionPhasePermission_(user, previous, next) {
  if (user.permissions.canAdmin) return;
  var phase = normalizeDocumentState_(previous.estadoActual || next.estadoActual);
  var role = normalizeText_(user.rol).toUpperCase();
  var previousActivities = normalizeJsonField_(previous.planMejoramiento);
  if (
    role === 'CREADOR' &&
    ['REGISTRO', 'ANALISIS'].indexOf(phase) < 0 &&
    hasActivityOperationalProgress_(previousActivities)
  ) {
    throw new AppError_('FORBIDDEN', 'El plan ya tiene avances de revisiÃ³n o validaciÃ³n y no puede ser modificado por CREADOR.');
  }
  if (
    role === 'REV' &&
    !previousActivities.some(function (activity) { return !hasActivityValidationProgress_(activity); })
  ) {
    throw new AppError_('FORBIDDEN', 'No hay actividades disponibles para ediciÃ³n REV.');
  }
  if (role === 'OCI' && !isOciEvaluator_(previous)) {
    throw new AppError_('FORBIDDEN', 'La evaluaciÃ³n final de esta acciÃ³n corresponde al lÃ­der del proceso.');
  }
  var allowed =
    (phase === 'REGISTRO' && user.permissions.canEditRegistro) ||
    (phase === 'ANALISIS' && user.permissions.canEditAnalisis) ||
    (phase === 'PLAN_ACCION' && user.permissions.canEditPlan) ||
    (phase === 'VALIDACION' && user.permissions.canEditValidacion) ||
    (phase === 'REVISION_OCI' && user.permissions.canEditOci) ||
    (['PLAN_ACCION', 'VALIDACION', 'REVISION_OCI'].indexOf(phase) >= 0 && user.permissions.canEditPlan) ||
    (phase !== 'CERRADA' && user.rol === 'CREADOR' && user.permissions.canUpdate);
  if (!allowed) {
    throw new AppError_('FORBIDDEN', 'No puede editar esta fase del documento.', { estadoActual: phase, rol: user.rol });
  }
}

/**
 * Applies field-level authorization on the server. The form sends the complete
 * action on every save, so disabled controls cannot be trusted as an access
 * boundary. Only fields owned by the current role are accepted from the request.
 */
function applyRoleUpdateRestrictions_(user, previousAction, requestedAction) {
  var role = normalizeText_(user && user.rol).toUpperCase();
  if (role === 'ADMIN') return requestedAction;

  var result = cloneAction_(previousAction);
  var previousActivities = Array.isArray(previousAction.planMejoramiento)
    ? previousAction.planMejoramiento
    : [];
  var requestedActivities = Array.isArray(requestedAction.planMejoramiento)
    ? requestedAction.planMejoramiento
    : [];

  if (role === 'CREADOR') {
    var phase = normalizeDocumentState_(previousAction.estadoActual);
    if (phase === 'REGISTRO') {
      copyActionFields_(result, requestedAction, [
        'fechaElaboracion',
        'origen',
        'tipoAccion',
        'proceso',
        'identificadoPor',
        'liderProceso',
        'descripcion',
        'auditorInterno'
      ]);
    }
    if (phase === 'ANALISIS') {
      copyActionFields_(result, requestedAction, [
        'identificacionCausas',
        'causaRaiz',
        'accionContencion'
      ]);
    }
    if (
      phase !== 'CERRADA' &&
      !hasActivityOperationalProgress_(previousActivities)
    ) {
      result.planMejoramiento = requestedActivities.map(function (activity, index) {
        return sanitizeActivityDefinition_(activity, result, index);
      });
    }
  } else if (role === 'REV') {
    result.planMejoramiento = previousActivities.map(function (activity, index) {
      var merged = cloneAction_(activity);
      var requested = findRequestedActivity_(requestedActivities, activity, index);
      if (!requested || hasActivityValidationProgress_(activity)) return merged;
      copyActionFields_(merged, requested, ['evidencia', 'revisionFecha', 'revisionObservacion']);
      if (index === 0) merged.observacionRevision = requested.observacionRevision;
      merged.revisionResponsable = normalizeText_(activity.responsable);
      return merged;
    });
  } else if (role === 'VAL') {
    result.planMejoramiento = previousActivities.map(function (activity, index) {
      var merged = cloneAction_(activity);
      var requested = findRequestedActivity_(requestedActivities, activity, index);
      if (!requested || !isActivityReviewedForAuthorization_(activity)) return merged;
      copyActionFields_(merged, requested, ['validacionFecha', 'validacionObservacion']);
      merged.validacionResponsable = normalizeText_(result.liderProceso);
      return merged;
    });
    if (isProcessLeaderEvaluator_(result) && areActivitiesReadyForOci_(result)) {
      copyActionFields_(result, requestedAction, ['fechaEvaluacion', 'eficacia', 'evaluacionObservacion']);
    }
  } else if (role === 'OCI' && isOciEvaluator_(result)) {
    copyActionFields_(result, requestedAction, ['fechaEvaluacion', 'eficacia', 'evaluacionObservacion']);
  }

  syncFirstActivityFields_(result);
  return result;
}

function sanitizeCreatedActionForRole_(user, action) {
  var role = normalizeText_(user && user.rol).toUpperCase();
  if (role === 'ADMIN') return action;

  action.fechaEvaluacion = '';
  action.eficacia = '';
  action.evaluacionObservacion = '';
  action.correoEnviado = false;
  action.fechasBloqueadas = false;
  action.planMejoramiento = (action.planMejoramiento || []).map(function (activity, index) {
    return sanitizeActivityDefinition_(activity, action, index);
  });
  syncFirstActivityFields_(action);
  return action;
}

function sanitizeActivityDefinition_(activity, action, index) {
  var number = index + 1;
  return {
    idActividad: String(action.id) + '-' + ('000' + number).slice(-3),
    idAccion: Number(action.id),
    numeroActividad: number,
    actividad: normalizeMultilineText_(activity && activity.actividad),
    fechaApertura: normalizeText_(activity && activity.fechaApertura),
    fechaCierre: normalizeText_(activity && activity.fechaCierre),
    presupuesto: Number((activity && activity.presupuesto) || 0),
    responsable: normalizeText_(activity && activity.responsable),
    evidencia: '',
    revisionResponsable: normalizeText_(activity && activity.responsable),
    revisionFecha: '',
    revisionObservacion: '',
    validacionResponsable: normalizeText_(action.liderProceso),
    validacionFecha: '',
    validacionObservacion: '',
    observacionRevision: ''
  };
}

function hasActivityOperationalProgress_(activities) {
  return (activities || []).some(function (activity) {
    return Boolean(
      normalizeText_(activity && activity.evidencia) ||
      normalizeText_(activity && activity.revisionFecha) ||
      normalizeMultilineText_(activity && activity.revisionObservacion) ||
      normalizeMultilineText_(activity && activity.observacionRevision) ||
      normalizeText_(activity && activity.validacionFecha) ||
      normalizeMultilineText_(activity && activity.validacionObservacion)
    );
  });
}

function isActivityReviewedForAuthorization_(activity) {
  return Boolean(
    normalizeText_(activity && activity.revisionFecha) &&
    normalizeMultilineText_(activity && activity.revisionObservacion)
  );
}

function hasActivityValidationProgress_(activity) {
  return Boolean(
    normalizeText_(activity && activity.validacionFecha) ||
    normalizeMultilineText_(activity && activity.validacionObservacion)
  );
}

function findRequestedActivity_(requestedActivities, previousActivity, index) {
  var activityId = normalizeText_(previousActivity && previousActivity.idActividad);
  if (activityId) {
    var byId = (requestedActivities || []).filter(function (activity) {
      return normalizeText_(activity && activity.idActividad) === activityId;
    })[0];
    if (byId) return byId;
  }
  return requestedActivities && requestedActivities[index];
}

function copyActionFields_(target, source, fields) {
  fields.forEach(function (field) {
    target[field] = source[field];
  });
}

function cloneAction_(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function matchesActionFilters_(action, filters) {
  if (filters.id && Number(action.id) !== Number(filters.id)) return false;
  if (filters.proceso && !isSameProcess_(action.proceso, filters.proceso)) return false;
  if (filters.tipoAccion && normalizeText_(action.tipoAccion) !== normalizeText_(filters.tipoAccion)) return false;
  if (filters.origen && normalizeText_(action.origen) !== normalizeText_(filters.origen)) return false;
  if (filters.estado) {
    var requestedStatus = normalizeText_(filters.estado);
    if (calculateStatus_(action) !== requestedStatus) return false;
  }
  if (filters.eficacia) {
    var requestedEffectiveness = normalizeText_(filters.eficacia);
    if (requestedEffectiveness === 'SIN_EVALUAR' && normalizeText_(action.eficacia)) return false;
    if (requestedEffectiveness !== 'SIN_EVALUAR' && normalizeText_(action.eficacia) !== requestedEffectiveness) return false;
  }
  if (filters.responsable && normalizeText_(action.responsable).toLowerCase().indexOf(normalizeText_(filters.responsable).toLowerCase()) < 0) return false;
  if (filters.fechaDesde && action.fechaElaboracion < filters.fechaDesde) return false;
  if (filters.fechaHasta && action.fechaElaboracion > filters.fechaHasta) return false;
  if (filters.search) {
    var text = [action.descripcion, action.accion, action.causaRaiz, action.responsable].join(' ').toLowerCase();
    if (text.indexOf(normalizeText_(filters.search).toLowerCase()) < 0) return false;
  }
  return true;
}
