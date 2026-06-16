var CURRENT_AUTH_TOKEN_ = '';
var AUTH_TOKEN_TTL_SECONDS_ = 8 * 60 * 60;
var PASSWORD_HASH_ITERATIONS_ = 20000;

function setCurrentAuthToken_(token) {
  CURRENT_AUTH_TOKEN_ = normalizeText_(token);
}

function getCurrentUser_() {
  if (CURRENT_AUTH_TOKEN_) {
    var sessionUser = verifyAuthToken_(CURRENT_AUTH_TOKEN_);
    if (sessionUser) return sessionUser;
  }

  var email = '';
  try {
    email = Session.getActiveUser().getEmail() || '';
  } catch (error) {
    email = '';
  }

  if (!email) return anonymousUser_();

  var user = findUserByEmail_(email);
  if (!user) return buildUser_(email, email, '', 'CONSULTA');
  return user;
}

function anonymousUser_() {
  var fallback = getScriptProperty_(CONFIG.SCRIPT_PROPERTIES.AUTH_FALLBACK) || CONFIG.AUTH_FALLBACKS.READ_ONLY;
  var role = fallback === CONFIG.AUTH_FALLBACKS.ALLOW_DEVELOPMENT ? 'ADMIN' : 'CONSULTA';
  var user = buildUser_('', 'Usuario no identificado', '', role);
  user.authFallback = fallback;
  return user;
}

function findUserByEmail_(email) {
  var record = findUserAuthRecordByEmail_(email);
  if (!record || !record.activo) return null;
  return buildUser_(record.email, record.nombre, record.proceso, record.rol);
}

function findUserAuthRecordByEmail_(email) {
  var sheet = getSheet_(CONFIG.SHEETS.USERS);
  if (!sheet || sheet.getLastRow() < 2) return null;
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, CONFIG.USERS_HEADERS.length).getValues();
  var normalizedEmail = normalizeText_(email).toLowerCase();
  for (var index = 0; index < rows.length; index += 1) {
    var row = rows[index];
    if (normalizeText_(row[0]).toLowerCase() === normalizedEmail) {
      return {
        rowNumber: index + 2,
        email: normalizeText_(row[0]),
        nombre: normalizeText_(row[1]) || normalizeText_(row[0]),
        proceso: normalizeText_(row[2]).toUpperCase(),
        rol: normalizeText_(row[3]).toUpperCase() || 'CONSULTA',
        passwordSalt: normalizeText_(row[4]),
        passwordHash: normalizeText_(row[5]),
        activo: isTruthy_(row[6])
      };
    }
  }
  return null;
}

function buildUser_(email, nombre, proceso, role) {
  return {
    email: email,
    nombre: nombre,
    proceso: normalizeText_(proceso).toUpperCase(),
    rol: role,
    permissions: permissionsForRole_(role)
  };
}

function permissionsForRole_(role) {
  var allowed = CONFIG.ROLES[role] || CONFIG.ROLES.CONSULTA;
  return {
    canRead: allowed.indexOf('read') >= 0,
    canCreate: allowed.indexOf('create') >= 0,
    canUpdate: allowed.indexOf('update') >= 0,
    canAdmin: allowed.indexOf('admin') >= 0,
    canEditRegistro: allowed.indexOf('phase:registro') >= 0,
    canEditAnalisis: allowed.indexOf('phase:analisis') >= 0,
    canEditPlan: allowed.indexOf('phase:plan') >= 0,
    canEditValidacion: allowed.indexOf('phase:validacion') >= 0,
    canEditOci: allowed.indexOf('phase:oci') >= 0,
    canNotifyOci: allowed.indexOf('notify:oci') >= 0
  };
}

function assertPermission_(user, permission) {
  var key = {
    read: 'canRead',
    create: 'canCreate',
    update: 'canUpdate',
    admin: 'canAdmin'
  }[permission];
  if (!user || !user.permissions || !user.permissions[key]) {
    throw new AppError_('FORBIDDEN', 'No tiene permisos para ejecutar esta operacion.', { permission: permission });
  }
}

function login_(credentials) {
  var email = normalizeText_(credentials && credentials.email).toLowerCase();
  var password = String((credentials && credentials.password) || '');
  if (!email || !password) {
    throw new AppError_('INVALID_CREDENTIALS', 'Email y contrasena son obligatorios.');
  }

  var record = findUserAuthRecordByEmail_(email);
  if (!record || !record.activo || !record.passwordSalt || !record.passwordHash) {
    throw new AppError_('INVALID_CREDENTIALS', 'Credenciales invalidas.');
  }

  if (hashPassword_(password, record.passwordSalt) !== record.passwordHash) {
    throw new AppError_('INVALID_CREDENTIALS', 'Credenciales invalidas.');
  }

  var user = buildUser_(record.email, record.nombre, record.proceso, record.rol);
  return {
    token: createAuthToken_(user),
    user: user
  };
}

function me_() {
  var user = getCurrentUser_();
  assertPermission_(user, 'read');
  return user;
}

// Ejecutar manualmente desde Apps Script para llenar password_salt/password_hash.
function generatePasswordRecordForSetup(password) {
  var salt = generateSalt_();
  return {
    password_salt: salt,
    password_hash: hashPassword_(password, salt)
  };
}

function generateSalt_() {
  return Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
}

function hashPassword_(password, salt) {
  var hash = salt + ':' + String(password);
  for (var index = 0; index < PASSWORD_HASH_ITERATIONS_; index += 1) {
    hash = bytesToHex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, hash, Utilities.Charset.UTF_8));
  }
  return hash;
}

function bytesToHex_(bytes) {
  return bytes.map(function (byte) {
    var value = byte;
    if (value < 0) value += 256;
    return ('0' + value.toString(16)).slice(-2);
  }).join('');
}

function authSecret_() {
  var secret = getScriptProperty_(CONFIG.SCRIPT_PROPERTIES.AUTH_TOKEN_SECRET);
  if (secret) return secret;
  throw new AppError_(
    'AUTH_SECRET_MISSING',
    'Configure AUTH_TOKEN_SECRET en Script Properties antes de iniciar sesion.'
  );
}

function createAuthToken_(user) {
  var header = base64UrlEncode_(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  var now = Math.floor(Date.now() / 1000);
  var payload = base64UrlEncode_(JSON.stringify({
    email: user.email,
    nombre: user.nombre,
    proceso: user.proceso,
    rol: user.rol,
    iat: now,
    exp: now + AUTH_TOKEN_TTL_SECONDS_
  }));
  var signature = signTokenPart_(header + '.' + payload);
  return header + '.' + payload + '.' + signature;
}

function verifyAuthToken_(token) {
  var parts = normalizeText_(token).split('.');
  if (parts.length !== 3) return null;
  var expected = signTokenPart_(parts[0] + '.' + parts[1]);
  if (expected !== parts[2]) return null;
  try {
    var payload = JSON.parse(base64UrlDecode_(parts[1]));
    if (!payload.exp || Number(payload.exp) < Math.floor(Date.now() / 1000)) return null;
    var record = findUserAuthRecordByEmail_(payload.email);
    if (!record || !record.activo) return null;
    return buildUser_(record.email, record.nombre, record.proceso, record.rol);
  } catch (error) {
    return null;
  }
}

function signTokenPart_(text) {
  var signature = Utilities.computeHmacSha256Signature(text, authSecret_(), Utilities.Charset.UTF_8);
  return Utilities.base64EncodeWebSafe(signature).replace(/=+$/, '');
}

function base64UrlEncode_(text) {
  return Utilities.base64EncodeWebSafe(text, Utilities.Charset.UTF_8).replace(/=+$/, '');
}

function base64UrlDecode_(text) {
  var padded = text;
  while (padded.length % 4) padded += '=';
  return Utilities.newBlob(Utilities.base64DecodeWebSafe(padded)).getDataAsString();
}
