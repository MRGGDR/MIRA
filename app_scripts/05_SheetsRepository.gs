function getSpreadsheet_() {
  var spreadsheetId = getScriptProperty_(CONFIG.SCRIPT_PROPERTIES.SPREADSHEET_ID) || CONFIG.SPREADSHEET_ID_FALLBACK;
  if (!spreadsheetId) {
    throw new AppError_('SPREADSHEET_ID_MISSING', 'Configure SPREADSHEET_ID en Script Properties.');
  }
  return SpreadsheetApp.openById(spreadsheetId);
}

function getSheet_(name) {
  return getSpreadsheet_().getSheetByName(name);
}

function getRequiredSheet_(name) {
  var sheet = getSheet_(name);
  if (!sheet) {
    throw new AppError_('SHEET_NOT_FOUND', 'No existe la hoja requerida.', { sheet: name });
  }
  return sheet;
}

function getActionDataRange_(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < CONFIG.ACTIONS_DATA_START_ROW) {
    return [];
  }
  return sheet
    .getRange(
      CONFIG.ACTIONS_DATA_START_ROW,
      1,
      lastRow - CONFIG.ACTIONS_DATA_START_ROW + 1,
      CONFIG.ACTION_FIELDS.length
    )
    .getValues();
}

function appendRow_(sheetName, values) {
  var sheet = getRequiredSheet_(sheetName);
  sheet.getRange(sheet.getLastRow() + 1, 1, 1, values.length).setValues([values]);
  return sheet.getLastRow();
}

function ensureSheet_(spreadsheet, name) {
  return spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
}
