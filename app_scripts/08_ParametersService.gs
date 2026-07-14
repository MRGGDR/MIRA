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
  var procesos = uniqueProcessesSorted_(
    getParameterList_(values, CONFIG.PARAMETER_COLUMNS.procesos).filter(function (item) {
      var normalizedItem = normalizeText_(item);
      var upperItem = normalizedItem.toUpperCase();
      return !CONFIG.LEGACY_PROCESS_NAMES[upperItem] && normalizedItem.toLowerCase() !== 'otro proceso';
    }).concat(CONFIG.PROCESS_CATALOG)
  );
  var lideresProceso = mergeUniqueSorted_(
    getParameterList_(values, CONFIG.PARAMETER_COLUMNS.lideresProceso).filter(function (item) {
      var normalizedItem = normalizeText_(item).toLowerCase();
      return normalizedItem !== 'lider del proceso' && normalizedItem !== 'líder del proceso';
    }),
    CONFIG.INITIAL_PROCESS_LEADERS
  );
  return {
    origenes: getParameterList_(values, CONFIG.PARAMETER_COLUMNS.origenes),
    tiposAccion: getParameterList_(values, CONFIG.PARAMETER_COLUMNS.tiposAccion),
    procesos: filterProcessesForUser_(user, procesos),
    personas: getParameterList_(values, CONFIG.PARAMETER_COLUMNS.personas),
    lideresProceso: lideresProceso,
    lideresSiplag: getParameterList_(values, CONFIG.PARAMETER_COLUMNS.lideresSiplag),
    auditores: getParameterList_(values, CONFIG.PARAMETER_COLUMNS.auditores)
  };
}

function getDefaultParameters_() {
  var user = getCurrentUser_();
  return {
    origenes: ['Auditoria externa', 'Auditoria interna', 'Entes de control', 'Indicadores', 'PQRS', 'Otro'],
    tiposAccion: ['Acción correctiva', 'Acción preventiva', 'Acción de mejora'],
    procesos: filterProcessesForUser_(user, CONFIG.PROCESS_CATALOG),
    personas: [],
    lideresProceso: CONFIG.INITIAL_PROCESS_LEADERS,
    lideresSiplag: [],
    auditores: []
  };
}

function filterProcessesForUser_(user, procesos) {
  if (user.permissions && (user.permissions.canAdmin || user.rol === 'OCI' || user.rol === 'REV')) return procesos;
  var proceso = normalizeText_(user.proceso).toUpperCase();
  if (!proceso) return [];
  var legacyProcesses = CONFIG.LEGACY_PROCESS_NAMES[proceso];
  if (legacyProcesses) {
    return procesos.filter(function (item) {
      return legacyProcesses.some(function (legacyProcess) {
        return isSameProcess_(item, legacyProcess);
      });
    });
  }
  return procesos.filter(function (item) { return isSameProcess_(item, user.proceso); });
}

function getParameterList_(rows, column) {
  var values = rows.map(function (row) {
    return normalizeText_(row[column - 1]);
  });
  return uniqueSorted_(values);
}
