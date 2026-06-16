function listActions_(filters) {
  var user = getCurrentUser_();
  assertPermission_(user, 'read');
  var page = Math.max(Number(filters.page || 1), 1);
  var pageSize = Math.min(Math.max(Number(filters.pageSize || 10), 1), 100);
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
    action.id = calculateNextId_();
    action.fechaElaboracion = action.fechaElaboracion || Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd');
    action.estadoActual = normalizeText_(action.tipoAccion).toLowerCase().indexOf('mejora') >= 0 ? 'PLAN_ACCION' : 'ANALISIS';
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

function updateAction_(input) {
  var user = getCurrentUser_();
  assertPermission_(user, 'update');
  var id = validateId_(input.id);
  var record = findActionRecordById_(id);
  if (!record) {
    throw new AppError_('ACTION_NOT_FOUND', 'No se encontró la acción solicitada.', { id: id });
  }
  assertActionScope_(user, record.action);
  var action = normalizeActionInput_(input);
  action.id = id;
  applyUserProcessScope_(user, action);
  assertActionPhasePermission_(user, record.action, action);
  assertBusinessRules_(action);
  advanceActionStateOnSave_(user, record.action, action);
  action.estadoActual = calculateDocumentState_(action);
  action.estado = calculateStatus_(action);
  validateAction_(action, { requireId: true });
  var updated = updateActionRow_(record.rowNumber, action);
  appendAudit_('UPDATE', user, id, record.rowNumber, record.action, updated.action);
  return updated.action;
}

function notifyOci_(id) {
  var user = getCurrentUser_();
  assertPermission_(user, 'update');
  if (!user.permissions.canNotifyOci && !user.permissions.canAdmin) {
    throw new AppError_('FORBIDDEN', 'No tiene permisos para notificar a Control Interno.');
  }
  var record = findActionRecordById_(id);
  if (!record) throw new AppError_('ACTION_NOT_FOUND', 'No se encontro la accion solicitada.', { id: id });
  assertActionScope_(user, record.action);
  var action = record.action;
  action.correoEnviado = true;
  action.estadoActual = 'REVISION_OCI';
  action.estado = calculateStatus_(action);
  var updated = updateActionRow_(record.rowNumber, action);
  appendAudit_('UPDATE', user, id, record.rowNumber, record.action, updated.action);
  return updated.action;
}

function isActionVisibleToUser_(user, action) {
  if (user.permissions && user.permissions.canAdmin) return true;
  var proceso = normalizeText_(user.proceso).toUpperCase();
  if (!proceso) return false;
  return normalizeText_(action.proceso).toUpperCase() === proceso;
}

function assertActionScope_(user, action) {
  if (isActionVisibleToUser_(user, action)) return;
  throw new AppError_('FORBIDDEN', 'No tiene permisos para acceder a registros de otro proceso.', {
    procesoUsuario: user.proceso,
    procesoAccion: action.proceso
  });
}

function applyUserProcessScope_(user, action) {
  if (user.permissions && user.permissions.canAdmin) return;
  var proceso = normalizeText_(user.proceso).toUpperCase();
  if (!proceso) {
    throw new AppError_('FORBIDDEN', 'El usuario no tiene proceso asignado.', { email: user.email });
  }
  action.proceso = proceso;
}

function assertBusinessRules_(action) {
  if (normalizeText_(action.tipoAccion).toLowerCase().indexOf('preventiva') >= 0) {
    throw new AppError_('VALIDATION_ERROR', 'La accion preventiva esta bloqueada para este flujo.', { tipoAccion: action.tipoAccion });
  }
  if (normalizeText_(action.tipoAccion).toLowerCase().indexOf('correctiva') >= 0 && !normalizeText_(action.accionContencion)) {
    throw new AppError_('VALIDATION_ERROR', 'La accion correctiva requiere accion de contencion.', { accionContencion: 'Campo obligatorio.' });
  }
}

function advanceActionStateOnSave_(user, previous, action) {
  var phase = normalizeDocumentState_(previous.estadoActual || action.estadoActual);
  if ((user.permissions.canAdmin || user.permissions.canEditPlan) && phase === 'PLAN_ACCION') {
    action.fechasBloqueadas = true;
  }
}

function assertActionPhasePermission_(user, previous, next) {
  if (user.permissions.canAdmin) return;
  var phase = normalizeDocumentState_(previous.estadoActual || next.estadoActual);
  var allowed =
    (phase === 'REGISTRO' && user.permissions.canEditRegistro) ||
    (phase === 'ANALISIS' && user.permissions.canEditAnalisis) ||
    (phase === 'PLAN_ACCION' && user.permissions.canEditPlan) ||
    (phase === 'VALIDACION' && user.permissions.canEditValidacion) ||
    (phase === 'REVISION_OCI' && user.permissions.canEditOci);
  if (!allowed) {
    throw new AppError_('FORBIDDEN', 'No puede editar esta fase del documento.', { estadoActual: phase, rol: user.rol });
  }
}

function matchesActionFilters_(action, filters) {
  if (filters.id && Number(action.id) !== Number(filters.id)) return false;
  if (filters.proceso && normalizeText_(action.proceso) !== normalizeText_(filters.proceso)) return false;
  if (filters.tipoAccion && normalizeText_(action.tipoAccion) !== normalizeText_(filters.tipoAccion)) return false;
  if (filters.origen && normalizeText_(action.origen) !== normalizeText_(filters.origen)) return false;
  if (filters.estado) {
    var requestedStatus = normalizeText_(filters.estado);
    if (requestedStatus === 'VENCIDA' && !isActionExpired_(action)) return false;
    if (requestedStatus === 'ABIERTA' && (normalizeText_(action.estado) !== 'ABIERTA' || isActionExpired_(action))) return false;
    if (requestedStatus === 'CERRADA' && normalizeText_(action.estado) !== 'CERRADA') return false;
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
