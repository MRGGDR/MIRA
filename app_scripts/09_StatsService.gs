function getStats_() {
  var user = getCurrentUser_();
  assertPermission_(user, 'read');
  var actions = listActionRecords_().map(function (record) {
    return record.action;
  }).filter(function (action) {
    return isActionVisibleToUser_(user, action);
  });
  var processTotals = {};
  var statusTotals = { ABIERTA: 0, CERRADA: 0, VENCIDA: 0 };
  actions.forEach(function (action) {
    var processName = getProcessName_(action.proceso);
    processTotals[processName] = (processTotals[processName] || 0) + 1;
    var visualStatus = calculateStatus_(action);
    statusTotals[visualStatus] = (statusTotals[visualStatus] || 0) + 1;
  });
  return {
    total: actions.length,
    actividades: actions.reduce(function (total, action) {
      return total + normalizeJsonField_(action.planMejoramiento).length;
    }, 0),
    abiertas: statusTotals.ABIERTA,
    cerradas: statusTotals.CERRADA,
    vencidas: statusTotals.VENCIDA,
    eficaces: actions.filter(function (action) { return action.eficacia === 'SI'; }).length,
    noEficaces: actions.filter(function (action) { return action.eficacia === 'NO'; }).length,
    porProceso: Object.keys(processTotals).sort().map(function (proceso) {
      return { proceso: proceso, total: processTotals[proceso] };
    }),
    recientes: actions.slice().sort(function (left, right) {
      return Number(right.id || 0) - Number(left.id || 0);
    }).slice(0, 5)
  };
}
