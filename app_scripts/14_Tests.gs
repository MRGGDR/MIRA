function testHealth() {
  Logger.log(JSON.stringify(health_()));
}

function testGetParameters() {
  Logger.log(JSON.stringify(getParameters_()));
}

function testListActions() {
  Logger.log(JSON.stringify(listActions_({ page: 1, pageSize: 5 })));
}

function testGetAction() {
  Logger.log(JSON.stringify(getAction_(1)));
}

function testValidateAction() {
  var sample = normalizeActionInput_({
    id: 1,
    fechaElaboracion: '2026-06-10',
    origen: 'Auditoria interna',
    tipoAccion: 'Accion correctiva',
    proceso: 'GG',
    descripcion: 'Hallazgo de prueba',
    accion: 'Accion de prueba',
    presupuesto: 0,
    eficacia: ''
  });
  validateAction_(sample, { requireId: true });
  Logger.log('Validacion correcta.');
}

function testCalculateNextId() {
  Logger.log(calculateNextId_());
}

function testFindDuplicateIds() {
  Logger.log(JSON.stringify(findDuplicateIds_()));
}
