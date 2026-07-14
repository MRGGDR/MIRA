function getStats_() {
  var user = getCurrentUser_();
  assertPermission_(user, 'read');
  var actions = listActionRecords_().map(function (record) {
    return record.action;
  }).filter(function (action) {
    return isActionVisibleToUser_(user, action);
  });
  var processTotals = {};
  actions.forEach(function (action) {
    var processName = getProcessName_(action.proceso);
    processTotals[processName] = (processTotals[processName] || 0) + 1;
  });
  return {
    total: actions.length,
    abiertas: actions.filter(function (action) { return action.estado === 'ABIERTA'; }).length,
    cerradas: actions.filter(function (action) { return action.estado === 'CERRADA'; }).length,
    vencidas: actions.filter(isActionExpired_).length,
    eficaces: actions.filter(function (action) { return action.eficacia === 'SI'; }).length,
    noEficaces: actions.filter(function (action) { return action.eficacia === 'NO'; }).length,
    porProceso: Object.keys(processTotals).sort().map(function (proceso) {
      return { proceso: proceso, total: processTotals[proceso] };
    }),
    recientes: actions.slice(-5).reverse()
  };
}
