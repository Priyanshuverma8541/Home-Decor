'use strict';
const Project = require('../models/Project');
const config = require('../config/env');

let cache = { at: 0, set: new Set() };
async function allowedOriginSet() {
  if (Date.now() - cache.at < 60000) return cache.set;
  const origins = await Project.find({ status: 'active' }).distinct('allowedOrigins');
  cache = { at: Date.now(), set: new Set([...origins, ...config.frontendOrigins]) };
  return cache.set;
}
const invalidateOrigins = () => { cache.at = 0; };
module.exports = { allowedOriginSet, invalidateOrigins };
