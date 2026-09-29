'use strict';
const { objectId } = require('../validators/schemas');
const { bad } = require('../utils/appError');

const validate = (schema) => (req, _res, next) => {
  const r = schema.safeParse(req.body ?? {});
  if (!r.success) return next(r.error);
  req.body = r.data;
  next();
};
const validId = (param = 'id') => (req, _res, next) => (objectId.safeParse(req.params[param]).success ? next() : next(bad('Invalid identifier')));
module.exports = { validate, validId };
