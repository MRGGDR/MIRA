function parseRequest_(method, e) {
  var payload = {};
  if (method === 'POST' && e.postData && e.postData.contents) {
    payload = JSON.parse(e.postData.contents);
  }
  if (method === 'GET') {
    payload = {
      action: e.parameter && e.parameter.action ? e.parameter.action : 'health',
      params: e.parameter || {}
    };
  }
  return {
    method: method,
    action: payload.action || 'health',
    params: payload.params || {},
    data: payload.data || {},
    authToken: payload.authToken || ''
  };
}

function routeRequest_(request) {
  setCurrentAuthToken_(request.authToken || request.params.authToken || request.data.authToken || '');
  switch (request.action) {
    case 'health':
      return { data: health_() };
    case 'login':
      return { data: login_(request.data) };
    case 'me':
      return { data: me_() };
    case 'bootstrap':
      return { data: bootstrap_() };
    case 'getParameters':
      return { data: getParameters_() };
    case 'listActions':
      return { data: listActions_(request.params.filters || {}) };
    case 'getAction':
      return { data: getAction_(request.params.id) };
    case 'createAction':
      return { data: createAction_(request.data) };
    case 'updateAction':
      return { data: updateAction_(request.data) };
    case 'notifyOci':
      return { data: notifyOci_(request.params.id || request.data.id) };
    case 'getStats':
      return { data: getStats_() };
    case 'getAudit':
      return { data: getAudit_(request.params.actionId) };
    default:
      throw new AppError_('UNKNOWN_ACTION', 'Operación no soportada.', { action: request.action });
  }
}

function health_() {
  return {
    status: 'ok',
    timezone: CONFIG.TIMEZONE,
    timestamp: formatDateTime_(new Date())
  };
}

function bootstrap_() {
  var currentUser = getCurrentUser_();
  assertPermission_(currentUser, 'read');
  return {
    parameters: getParameters_(),
    currentUser: currentUser,
    stats: getStats_()
  };
}
