function appendAudit_(operation, user, actionId, rowNumber, previousData, nextData) {
  var row = [
    formatDateTime_(new Date()),
    user.email || user.nombre || 'NO_IDENTIFICADO',
    operation,
    actionId,
    rowNumber,
    JSON.stringify(previousData || {}),
    JSON.stringify(nextData || {})
  ];
  appendRow_(CONFIG.SHEETS.AUDIT, row);
}

function getAudit_(actionId) {
  var user = getCurrentUser_();
  assertPermission_(user, 'admin');
  var sheet = getRequiredSheet_(CONFIG.SHEETS.AUDIT);
  if (sheet.getLastRow() < 2) return [];
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, CONFIG.AUDIT_HEADERS.length).getValues();
  return rows
    .map(function (row) {
      return {
        timestamp: normalizeCellValue_(row[0], 'timestamp'),
        usuario: normalizeText_(row[1]),
        operacion: normalizeText_(row[2]),
        accionId: Number(row[3]),
        fila: Number(row[4]),
        datosAnterioresJson: normalizeText_(row[5]),
        datosNuevosJson: normalizeText_(row[6])
      };
    })
    .filter(function (record) {
      return !actionId || Number(record.accionId) === Number(actionId);
    });
}
