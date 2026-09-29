'use strict';
const express = require('express');
const { validate } = require('../middleware/validate');
const rate = require('../middleware/rateLimits');
const S = require('../validators/schemas');
const pub = require('../controllers/publicController');

const r = express.Router();
r.use(rate.publicGeneral);
r.get('/config/:publicProjectId', pub.projectConfig);
r.post('/subscribe', rate.subscribe, validate(S.pubSubscribe), pub.subscribe);
r.post('/status', rate.subscribe, validate(S.pubIdentity), pub.status);
r.post('/metadata', rate.subscribe, validate(S.pubMetadata), pub.metadata);
r.post('/location', rate.location, validate(S.pubLocation), pub.location);
r.post('/location-permission', rate.location, validate(S.pubLocationPermission), pub.locationPermission);
r.post('/unsubscribe', rate.subscribe, validate(S.pubIdentity), pub.unsubscribe);
r.post('/click', rate.click, validate(S.pubClick), pub.click);
module.exports = r;
