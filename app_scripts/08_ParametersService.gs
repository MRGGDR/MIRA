function getParameters_() {
  var user = getCurrentUser_();
  assertPermission_(user, 'read');
  var sheet;
  try {
    sheet = getRequiredSheet_(CONFIG.SHEETS.PARAMETERS);
  } catch (error) {
    return getDefaultParameters_();
  }
  var lastRow = Math.max(sheet.getLastRow(), 2);
  var values = sheet.getRange(2, 1, lastRow - 1, CONFIG.PARAMETER_HEADERS.length).getValues();
  var procesos = mergeUniqueSorted_(
    getParameterList_(values, CONFIG.PARAMETER_COLUMNS.procesos),
    CONFIG.INITIAL_PROCESSES.map(function (process) {
      return process[0];
    })
  );
  return {
    origenes: getParameterList_(values, CONFIG.PARAMETER_COLUMNS.origenes),
    tiposAccion: getParameterList_(values, CONFIG.PARAMETER_COLUMNS.tiposAccion),
    procesos: filterProcessesForUser_(user, procesos),
    personas: getParameterList_(values, CONFIG.PARAMETER_COLUMNS.personas),
    lideresProceso: getParameterList_(values, CONFIG.PARAMETER_COLUMNS.lideresProceso),
    lideresSiplag: getParameterList_(values, CONFIG.PARAMETER_COLUMNS.lideresSiplag),
    auditores: getParameterList_(values, CONFIG.PARAMETER_COLUMNS.auditores)
  };
}

function getDefaultParameters_() {
  var user = getCurrentUser_();
  var procesos = CONFIG.INITIAL_PROCESSES.map(function (process) {
    return process[0];
  });
  return {
    origenes: ['Auditoria externa', 'Auditoria interna', 'Entes de control', 'Indicadores', 'PQRS', 'Otro'],
    tiposAccion: ['Accion correctiva', 'Accion preventiva', 'Accion de mejora'],
    procesos: filterProcessesForUser_(user, procesos),
    personas: [],
    lideresProceso: [],
    lideresSiplag: [],
    auditores: []
  };
}

function filterProcessesForUser_(user, procesos) {
  if (user.permissions && user.permissions.canAdmin) return procesos;
  var proceso = normalizeText_(user.proceso).toUpperCase();
  return proceso ? procesos.filter(function (item) { return normalizeText_(item).toUpperCase() === proceso; }) : [];
}

function getParameterList_(rows, column) {
  var values = rows.map(function (row) {
    return normalizeText_(row[column - 1]);
  });
  return uniqueSorted_(values);
}
