function setupProject() {
  var spreadsheet = getSpreadsheet_();
  spreadsheet.setSpreadsheetTimeZone(CONFIG.TIMEZONE);
  var summary = [];
  var actionsSheet = ensureSheet_(spreadsheet, CONFIG.SHEETS.ACTIONS);
  var parametersSheet = ensureSheet_(spreadsheet, CONFIG.SHEETS.PARAMETERS);
  var usersSheet = ensureSheet_(spreadsheet, CONFIG.SHEETS.USERS);
  var auditSheet = ensureSheet_(spreadsheet, CONFIG.SHEETS.AUDIT);

  setupActionsSheet_(actionsSheet, summary);
  setupParametersSheet_(parametersSheet, summary);
  setupHeaderOnlySheet_(usersSheet, CONFIG.USERS_HEADERS, summary);
  setupHeaderOnlySheet_(auditSheet, CONFIG.AUDIT_HEADERS, summary);

  Logger.log(summary.join('\n'));
  return summary;
}

function setupActionsSheet_(sheet, summary) {
  if (!normalizeText_(sheet.getRange(CONFIG.ACTIONS_HEADER_ROW, 1).getValue())) {
    ensureActionSheetColumnCount_(sheet);
    sheet.getRange(CONFIG.ACTIONS_TITLE_ROW, 2, 1, 7).merge().setValue('A. DESCRIPCIÓN DEL HALLAZGO');
    sheet.getRange(CONFIG.ACTIONS_TITLE_ROW, 10, 1, 3).merge().setValue('B. ANÁLISIS DE CAUSAS');
    sheet.getRange(CONFIG.ACTIONS_TITLE_ROW, 13, 1, 7).merge().setValue('C. PLAN DE ACTIVIDADES');
    sheet.getRange(CONFIG.ACTIONS_TITLE_ROW, 20, 1, 3).merge().setValue('REVISIÓN');
    sheet.getRange(CONFIG.ACTIONS_TITLE_ROW, 23, 1, 4).merge().setValue('VALIDACIÓN');
    sheet.getRange(CONFIG.ACTIONS_TITLE_ROW, 27, 1, 5).merge().setValue('D. EVALUACIÓN DE LAS ACCIONES');
    sheet.getRange(CONFIG.ACTIONS_HEADER_ROW, 1, 1, CONFIG.ACTIONS_HEADERS.length).setValues([CONFIG.ACTIONS_HEADERS]);
    sheet.setFrozenRows(CONFIG.ACTIONS_HEADER_ROW);
    sheet.getRange(CONFIG.ACTIONS_HEADER_ROW, 1, 1, CONFIG.ACTIONS_HEADERS.length).setFontWeight('bold');
    summary.push('Base configurada sin sobrescribir datos existentes.');
  } else {
    ensureActionSheetColumnCount_(sheet);
    sheet.getRange(CONFIG.ACTIONS_HEADER_ROW, 1, 1, CONFIG.ACTIONS_HEADERS.length).setValues([CONFIG.ACTIONS_HEADERS]);
    sheet.getRange(CONFIG.ACTIONS_HEADER_ROW, 1, 1, CONFIG.ACTIONS_HEADERS.length).setFontWeight('bold');
    summary.push('Base actualizada con encabezados completos sin modificar registros.');
  }
}

function ensureActionSheetColumnCount_(sheet) {
  ensureSheetColumnCount_(sheet, CONFIG.ACTION_FIELDS.length);
}

function ensureSheetColumnCount_(sheet, columnCount) {
  var missingColumns = columnCount - sheet.getMaxColumns();
  if (missingColumns > 0) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), missingColumns);
  }
}

function setupParametersSheet_(sheet, summary) {
  if (!normalizeText_(sheet.getRange(1, 1).getValue())) {
    sheet.getRange(1, 1, 1, CONFIG.PARAMETER_HEADERS.length).setValues([CONFIG.PARAMETER_HEADERS]);
    var processValues = CONFIG.INITIAL_PROCESSES.map(function (process) {
      return [process[0]];
    });
    sheet.getRange(2, CONFIG.PARAMETER_COLUMNS.procesos, processValues.length, 1).setValues(processValues);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, CONFIG.PARAMETER_HEADERS.length).setFontWeight('bold');
    summary.push('Parametros creada con procesos iniciales.');
  } else {
    summary.push('Parametros ya tenia datos; no se modifico.');
  }
}

function setupHeaderOnlySheet_(sheet, headers, summary) {
  ensureSheetColumnCount_(sheet, headers.length);
  if (!normalizeText_(sheet.getRange(1, 1).getValue())) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    summary.push(sheet.getName() + ' configurada.');
  } else {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    summary.push(sheet.getName() + ' actualizada con encabezados completos sin modificar registros.');
  }
}

function validateConfiguration() {
  var errors = [];
  var spreadsheetId = getScriptProperty_(CONFIG.SCRIPT_PROPERTIES.SPREADSHEET_ID) || CONFIG.SPREADSHEET_ID_FALLBACK;
  if (!spreadsheetId) errors.push('Falta SPREADSHEET_ID.');
  if (!getScriptProperty_(CONFIG.SCRIPT_PROPERTIES.AUTH_TOKEN_SECRET)) errors.push('Falta AUTH_TOKEN_SECRET.');
  var spreadsheet = spreadsheetId ? SpreadsheetApp.openById(spreadsheetId) : null;
  if (!spreadsheet) throw new AppError_('CONFIGURATION_ERROR', 'No se pudo abrir el spreadsheet.', { errors: errors });

  [CONFIG.SHEETS.ACTIONS, CONFIG.SHEETS.PARAMETERS, CONFIG.SHEETS.USERS, CONFIG.SHEETS.AUDIT].forEach(function (name) {
    if (!spreadsheet.getSheetByName(name)) errors.push('No existe la hoja ' + name + '.');
  });

  var base = spreadsheet.getSheetByName(CONFIG.SHEETS.ACTIONS);
  if (base) {
    if (base.getMaxColumns() < CONFIG.ACTION_FIELDS.length) errors.push('Base debe tener al menos ' + CONFIG.ACTION_FIELDS.length + ' columnas.');
    var headers = base.getRange(CONFIG.ACTIONS_HEADER_ROW, 1, 1, CONFIG.ACTIONS_HEADERS.length).getValues()[0];
    CONFIG.ACTIONS_HEADERS.forEach(function (expected, index) {
      if (normalizeText_(headers[index]) !== normalizeText_(expected)) {
        errors.push('Encabezado inesperado en columna ' + (index + 1) + ': ' + headers[index]);
      }
    });
    var records = listActionRecords_();
    records.forEach(function (record) {
      if (!Number.isFinite(Number(record.action.id))) errors.push('ID no numerico en fila ' + record.rowNumber + '.');
    });
    var duplicates = findDuplicateIds_();
    if (duplicates.length) errors.push('IDs duplicados: ' + duplicates.join(', '));
  }

  if (errors.length) {
    throw new AppError_('CONFIGURATION_ERROR', 'La configuracion requiere ajustes.', { errors: errors });
  }
  return { ok: true, message: 'Configuracion valida.' };
}
