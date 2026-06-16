function rowToAction_(row) {
  var action = {};
  CONFIG.ACTION_FIELDS.forEach(function (field, index) {
    action[field] = normalizeCellValue_(row[index], field);
  });
  action.id = Number(action.id);
  action.presupuesto = Number(action.presupuesto || 0);
  action.eficacia = normalizeEffectiveness_(action.eficacia);
  action.estado = normalizeText_(action.estado) || calculateStatus_(action);
  return action;
}

function actionToRow_(input) {
  var normalized = normalizeActionInput_(input);
  return CONFIG.ACTION_FIELDS.map(function (field) {
    if (isJsonField_(field)) return stringifyJsonField_(normalized[field]);
    if (isDateField_(field)) return parseDateForSheet_(normalized[field]);
    if (field === 'presupuesto') return Number(normalized[field] || 0);
    return normalized[field] === undefined || normalized[field] === null ? '' : normalized[field];
  });
}

function listActionRecords_() {
  var sheet = getRequiredSheet_(CONFIG.SHEETS.ACTIONS);
  var rows = getActionDataRange_(sheet);
  return rows
    .map(function (row, index) {
      return {
        rowNumber: CONFIG.ACTIONS_DATA_START_ROW + index,
        row: row,
        action: rowToAction_(row)
      };
    })
    .filter(function (record) {
      return record.action.id;
    });
}

function findActionRecordById_(id) {
  var requestedId = validateId_(id);
  var records = listActionRecords_();
  for (var index = 0; index < records.length; index += 1) {
    if (Number(records[index].action.id) === Number(requestedId)) {
      return records[index];
    }
  }
  return null;
}

function calculateNextId_() {
  var records = listActionRecords_();
  var maxId = records.reduce(function (max, record) {
    return Math.max(max, Number(record.action.id) || 0);
  }, 0);
  return maxId + 1;
}

function insertAction_(action) {
  var sheet = getRequiredSheet_(CONFIG.SHEETS.ACTIONS);
  ensureActionSheetColumnCount_(sheet);
  var row = actionToRow_(action);
  var rowNumber = sheet.getLastRow() + 1;
  sheet.getRange(rowNumber, 1, 1, CONFIG.ACTION_FIELDS.length).setValues([row]);
  return {
    rowNumber: rowNumber,
    action: rowToAction_(row)
  };
}

function updateActionRow_(rowNumber, action) {
  var sheet = getRequiredSheet_(CONFIG.SHEETS.ACTIONS);
  ensureActionSheetColumnCount_(sheet);
  var row = actionToRow_(action);
  sheet.getRange(rowNumber, 1, 1, CONFIG.ACTION_FIELDS.length).setValues([row]);
  return {
    rowNumber: rowNumber,
    action: rowToAction_(row)
  };
}

function findDuplicateIds_() {
  var seen = {};
  var duplicates = [];
  listActionRecords_().forEach(function (record) {
    var id = String(record.action.id);
    if (seen[id]) {
      duplicates.push(Number(id));
    }
    seen[id] = true;
  });
  return duplicates;
}
