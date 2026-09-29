'use strict';
class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status; this.code = code; this.details = details; this.isOperational = true;
  }
}
const bad = (msg, details) => new AppError(400, 'VALIDATION_ERROR', msg, details);
const notFound = (what = 'Resource') => new AppError(404, 'NOT_FOUND', `${what} not found`);
const forbidden = (msg = 'You do not have permission to do this') => new AppError(403, 'FORBIDDEN', msg);
const conflict = (msg) => new AppError(409, 'CONFLICT', msg);
module.exports = { AppError, bad, notFound, forbidden, conflict };
