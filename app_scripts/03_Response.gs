function AppError_(code, message, details) {
  this.name = 'AppError';
  this.code = code;
  this.message = message;
  this.details = details || {};
}

AppError_.prototype = Object.create(Error.prototype);
AppError_.prototype.constructor = AppError_;

function jsonSuccess_(data, meta) {
  return ContentService.createTextOutput(
    JSON.stringify({
      ok: true,
      data: data || {},
      meta: meta || {}
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

function jsonError_(error) {
  var normalized = normalizeError_(error);
  return ContentService.createTextOutput(
    JSON.stringify({
      ok: false,
      error: normalized
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

function normalizeError_(error) {
  if (error && error.name === 'AppError') {
    return {
      code: error.code,
      message: error.message,
      details: error.details || {}
    };
  }
  return {
    code: 'INTERNAL_ERROR',
    message: error && error.message ? error.message : 'Error interno no controlado.',
    details: {}
  };
}
