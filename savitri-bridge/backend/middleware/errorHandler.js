'use strict';
const { ZodError } = require('zod');
const config = require('../config/env');

const notFoundHandler = (req, res) => res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Route not found: ${req.method} ${req.path}` } });

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  let status = err.status || 500; let code = err.code || 'INTERNAL_ERROR'; let message = err.message; let details = err.details;

  if (err instanceof ZodError) {
    status = 400; code = 'VALIDATION_ERROR';
    details = err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    message = details.map((d) => (d.field ? `${d.field}: ${d.message}` : d.message)).join('; ');
  } else if (err.name === 'CastError') { status = 400; code = 'VALIDATION_ERROR'; message = 'Invalid identifier'; }
  else if (err.code === 11000) { status = 409; code = 'DUPLICATE'; message = 'A record with the same unique value already exists'; }
  else if (err.name === 'MulterError') { status = 400; code = 'UPLOAD_ERROR'; message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large (max 3 MB)' : 'Invalid upload'; }
  else if (err.type === 'entity.too.large') { status = 413; code = 'PAYLOAD_TOO_LARGE'; message = 'Request body too large'; }
  else if (err.type === 'entity.parse.failed') { status = 400; code = 'INVALID_JSON'; message = 'Malformed JSON body'; }
  else if (err.message === 'CORS_NOT_ALLOWED') { status = 403; code = 'CORS_NOT_ALLOWED'; message = 'Origin not allowed'; }
  else if (!err.isOperational) {
    console.error('[error]', req.method, req.path, err.stack || err.message);
    if (config.isProd) { status = 500; code = 'INTERNAL_ERROR'; message = 'Something went wrong on the server'; details = undefined; }
  }
  const body = { success: false, error: { code, message } };
  if (details) body.error.details = details;
  res.status(status).json(body);
}
module.exports = { errorHandler, notFoundHandler };
