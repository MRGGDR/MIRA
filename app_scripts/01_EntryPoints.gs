function doGet(e) {
  return handleRequest_('GET', e);
}

function doPost(e) {
  return handleRequest_('POST', e);
}

function handleRequest_(method, e) {
  try {
    var request = parseRequest_(method, e || {});
    var result = routeRequest_(request);
    return jsonSuccess_(result.data, result.meta);
  } catch (error) {
    return jsonError_(error);
  }
}
