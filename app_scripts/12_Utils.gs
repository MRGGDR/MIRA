function getScriptProperty_(key) {
  return PropertiesService.getScriptProperties().getProperty(key);
}

function normalizeText_(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\s+/g, ' ').trim();
}

function normalizeProcessKey_(value) {
  var text = normalizeText_(value);
  if (!text) return '';
  if (typeof text.normalize === 'function') {
    text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
  return text.toLowerCase();
}

function getProcessAliasKeys_(value) {
  var key = normalizeProcessKey_(value);
  var aliases = {
    'bienes muebles e inmuebles': ['subproceso gestion bienes'],
    'gestion control disciplinario interno': ['gestion de control disciplinario'],
    'gestion de tecnologias de la informacion': ['tecnologias de la informacion'],
    'gestion del conocimiento del riesgo': ['gestion de conocimiento del riesgo'],
    'gestion documental': ['subproceso gestion documental'],
    'servicios administrativos': ['subproceso servicios administrativos'],
    'sistema integrado de planeacion y gestion': ['siplag']
  };
  var keys = [key];
  Object.keys(aliases).forEach(function (aliasKey) {
    var aliasValues = aliases[aliasKey];
    if (aliasKey === key) keys = keys.concat(aliasValues);
    if (aliasValues.indexOf(key) >= 0) keys.push(aliasKey);
  });
  return keys.filter(function (item, index) {
    return item && keys.indexOf(item) === index;
  });
}

function getProcessNamesForAccess_(codeOrName) {
  var text = normalizeText_(codeOrName);
  if (!text) return [];
  var upper = text.toUpperCase();
  if (CONFIG.LEGACY_PROCESS_NAMES[upper]) return CONFIG.LEGACY_PROCESS_NAMES[upper];
  var keys = getProcessAliasKeys_(text);
  var catalogMatch = CONFIG.PROCESS_CATALOG.find(function (processName) {
    return keys.indexOf(normalizeProcessKey_(processName)) >= 0;
  });
  return [catalogMatch || text];
}

function getProcessName_(codeOrName) {
  var names = getProcessNamesForAccess_(codeOrName);
  return names[0] || normalizeText_(codeOrName);
}

function isSameProcess_(left, right) {
  var leftNames = getProcessNamesForAccess_(left);
  var rightNames = getProcessNamesForAccess_(right);
  return leftNames.some(function (leftName) {
    return rightNames.some(function (rightName) {
      var leftKeys = getProcessAliasKeys_(leftName);
      var rightKeys = getProcessAliasKeys_(rightName);
      return leftKeys.some(function (leftKey) {
        return rightKeys.indexOf(leftKey) >= 0;
      });
    });
  });
}

function normalizeMultilineText_(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\r\n/g, '\n').trim();
}

function normalizeActionInput_(input) {
  var normalized = {};
  CONFIG.ACTION_FIELDS.forEach(function (field) {
    var value = input ? input[field] : '';
    if (field === 'id') {
      normalized[field] = value ? Number(value) : '';
    } else if (field === 'presupuesto') {
      normalized[field] = Number(value || 0);
    } else if (isJsonField_(field)) {
      normalized[field] = normalizeJsonField_(value);
    } else if (field === 'eficacia') {
      normalized[field] = normalizeEffectiveness_(value);
    } else if (field === 'estado') {
      normalized[field] = normalizeText_(value);
    } else if (field === 'estadoActual') {
      normalized[field] = normalizeDocumentState_(value);
    } else if (field === 'correoEnviado' || field === 'fechasBloqueadas') {
      normalized[field] = isTruthy_(value);
    } else if (['descripcion', 'equipoMejoramiento', 'identificacionCausas', 'causaRaiz', 'correccion', 'accion', 'accionContencion', 'revisionObservacion', 'validacionObservacion', 'evaluacionObservacion', 'evidencia'].indexOf(field) >= 0) {
      normalized[field] = normalizeMultilineText_(value);
    } else {
      normalized[field] = normalizeText_(value);
    }
  });
  normalized.planMejoramiento = normalizeJsonField_(input ? input.planMejoramiento : []);
  normalized.equipoMejoramiento = normalizeText_(input ? input.equipoMejoramiento : '');
  normalized.equipoMejoramientoDetalle = normalizeJsonField_(input ? input.equipoMejoramientoDetalle : []);
  normalized.causasDefinitivas = normalizeJsonField_(input ? input.causasDefinitivas : []);
  normalized.correccion = normalizeMultilineText_(input ? input.correccion : '');
  normalized.recomendacionesFinales = normalizeMultilineText_(input ? input.recomendacionesFinales : '');
  syncFirstActivityFields_(normalized);
  normalized.estadoActual = calculateDocumentState_(normalized);
  normalized.estado = calculateStatus_(normalized);
  return normalized;
}

function isJsonField_(field) {
  return ['equipoMejoramientoDetalle', 'causasDefinitivas', 'planMejoramiento'].indexOf(field) >= 0;
}

function normalizeJsonField_(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return value;
  var text = normalizeMultilineText_(value);
  if (!text) return [];
  try {
    var parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function stringifyJsonField_(value) {
  var normalized = normalizeJsonField_(value);
  return normalized.length ? JSON.stringify(normalized) : '';
}

function normalizeEffectiveness_(value) {
  var text = normalizeText_(value).toUpperCase();
  if (text === 'SI' || text === 'NO') return text;
  return '';
}

function calculateStatus_(action) {
  if (normalizeDocumentState_(action.estadoActual) === 'CERRADA') return 'CERRADA';
  if (isActionExpired_(action)) return 'VENCIDA';
  return normalizeEffectiveness_(action.eficacia)
    ? CONFIG.STATUS_RULE.CLOSED_WHEN_EFFECTIVENESS_PRESENT
    : CONFIG.STATUS_RULE.OPEN_WHEN_EFFECTIVENESS_EMPTY;
}

function normalizeDocumentState_(value) {
  var text = normalizeText_(value).toUpperCase();
  var allowed = ['REGISTRO', 'ANALISIS', 'PLAN_ACCION', 'VALIDACION', 'REVISION_OCI', 'CERRADA'];
  return allowed.indexOf(text) >= 0 ? text : 'REGISTRO';
}

function calculateDocumentState_(action) {
  if (normalizeEffectiveness_(action.eficacia) === 'SI') return 'CERRADA';
  var current = normalizeDocumentState_(action.estadoActual);
  if (areActivitiesReadyForOci_(action)) {
    return isOciEvaluator_(action) ? 'REVISION_OCI' : 'VALIDACION';
  }
  if ((current === 'REVISION_OCI' || current === 'CERRADA') && areActivitiesExecuted_(action)) return 'VALIDACION';
  if (current === 'REVISION_OCI' || current === 'CERRADA') return 'PLAN_ACCION';
  if (current === 'REGISTRO' && normalizeText_(action.tipoAccion).toLowerCase().indexOf('mejora') >= 0) return 'PLAN_ACCION';
  if (current === 'ANALISIS' && normalizeText_(action.accion)) return 'PLAN_ACCION';
  if ((current === 'PLAN_ACCION' || current === 'VALIDACION') && hasAnyActivityExecuted_(action)) return 'VALIDACION';
  return current;
}

function isOciEvaluator_(action) {
  return normalizeText_(action.auditorInterno).toLowerCase() === 'oci';
}

function isProcessLeaderEvaluator_(action) {
  return normalizeText_(action.auditorInterno).toLowerCase() === 'lider del proceso';
}

function areActivitiesExecuted_(action) {
  var activities = normalizeJsonField_(action.planMejoramiento);
  if (!activities.length) return false;
  return activities.every(function (activity) {
    return normalizeText_(activity.revisionFecha) &&
      normalizeText_(activity.revisionObservacion);
  });
}

function hasAnyActivityExecuted_(action) {
  var activities = normalizeJsonField_(action.planMejoramiento);
  return activities.some(function (activity) {
    return normalizeText_(activity.revisionFecha) &&
      normalizeText_(activity.revisionObservacion);
  });
}

function areActivitiesValidated_(action) {
  var activities = normalizeJsonField_(action.planMejoramiento);
  if (!activities.length) return false;
  return activities.every(function (activity) {
    return normalizeText_(activity.validacionResponsable) &&
      normalizeText_(activity.validacionFecha) &&
      normalizeText_(activity.validacionObservacion);
  });
}

function areActivitiesReadyForOci_(action) {
  return areActivitiesExecuted_(action) && areActivitiesValidated_(action);
}

function isDateField_(field) {
  return [
    'fechaElaboracion',
    'fechaApertura',
    'fechaCierre',
    'fechaInicioAccion',
    'fechaFinAccion',
    'revisionFecha',
    'validacionFecha',
    'fechaEvaluacion'
  ].indexOf(field) >= 0;
}

function parseDateForSheet_(value) {
  var text = normalizeText_(value);
  if (!text) return '';
  var parts = text.split('-');
  if (parts.length !== 3) return text;
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

function normalizeCellValue_(value, field) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, CONFIG.TIMEZONE, 'yyyy-MM-dd');
  }
  if (isDateField_(field) && typeof value === 'number') {
    var excelEpoch = new Date(Date.UTC(1899, 11, 30));
    excelEpoch.setUTCDate(excelEpoch.getUTCDate() + value);
    return Utilities.formatDate(excelEpoch, CONFIG.TIMEZONE, 'yyyy-MM-dd');
  }
  if (field === 'id' || field === 'idAccion' || field === 'numeroActividad') return Number(value || 0);
  if (field === 'presupuesto') return Number(value || 0);
  if (field === 'correoEnviado' || field === 'fechasBloqueadas') return isTruthy_(value);
  if (isJsonField_(field)) return normalizeJsonField_(value);
  return normalizeText_(value);
}

function formatDateTime_(date) {
  return Utilities.formatDate(date, CONFIG.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");
}

function isValidIsoDate_(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(normalizeText_(value));
}

function isActionExpired_(action) {
  var today = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd');
  return action.estado === 'ABIERTA' && action.fechaFinAccion && action.fechaFinAccion < today;
}

function uniqueSorted_(values) {
  var seen = {};
  values.forEach(function (value) {
    var text = normalizeText_(value);
    if (text) seen[text] = true;
  });
  return Object.keys(seen).sort(function (a, b) {
    return a.localeCompare(b, 'es');
  });
}

function uniqueProcessesSorted_(values) {
  var seen = {};
  values.forEach(function (value) {
    var text = getProcessName_(value);
    var key = getProcessAliasKeys_(text)[0];
    if (key && !seen[key]) seen[key] = text;
  });
  return Object.keys(seen).map(function (key) {
    return seen[key];
  }).sort(function (a, b) {
    return a.localeCompare(b, 'es');
  });
}

function mergeUniqueSorted_(left, right) {
  return uniqueSorted_((left || []).concat(right || []));
}

function isTruthy_(value) {
  if (value === true) return true;
  var text = normalizeText_(value).toLowerCase();
  return ['true', 'si', 'sí', '1', 'activo', 'x'].indexOf(text) >= 0;
}
