'use strict';
const express = require('express');
const multer = require('multer');
const { authenticate, authorize, R } = require('../middleware/auth');
const { validate, validId } = require('../middleware/validate');
const rate = require('../middleware/rateLimits');
const S = require('../validators/schemas');
const auth = require('../controllers/authController');
const admins = require('../controllers/adminsController');
const projects = require('../controllers/projectsController');
const subscribers = require('../controllers/subscribersController');
const campaigns = require('../controllers/campaignsController');
const templates = require('../controllers/templatesController');
const analytics = require('../controllers/analyticsController');
const logs = require('../controllers/logsController');
const exportsC = require('../controllers/exportsController');
const uploads = require('../controllers/uploadsController');
const settings = require('../controllers/settingsController');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 3 * 1024 * 1024, files: 1 } });
const r = express.Router();

// ---- auth (login is the only unauthenticated admin route; there is NO public signup) ----
r.post('/auth/login', rate.login, validate(S.login), auth.login);
r.use(authenticate);
r.get('/auth/me', auth.me);
r.post('/auth/change-password', validate(S.changePassword), auth.changePassword);

// ---- admin users: Super Admin only ----
r.get('/admins', authorize(...R.SUPER), admins.list);
r.post('/admins', authorize(...R.SUPER), validate(S.adminCreate), admins.create);
r.patch('/admins/:id', authorize(...R.SUPER), validId(), validate(S.adminUpdate), admins.update);
r.post('/admins/:id/reset-password', authorize(...R.SUPER), validId(), validate(S.adminReset), admins.resetPassword);

// ---- projects ----
r.get('/projects', authorize(...R.ALL), projects.list);
r.post('/projects', authorize(...R.OPS), validate(S.project), projects.create);
r.get('/projects/:id', authorize(...R.ALL), validId(), projects.get);
r.put('/projects/:id', authorize(...R.OPS), validId(), validate(S.project.partial()), projects.update);
r.patch('/projects/:id/status', authorize(...R.OPS), validId(), projects.setStatus);

// ---- subscribers ----
r.get('/subscribers', authorize(...R.ALL), subscribers.list);
r.get('/subscribers/:subscriberId', authorize(...R.ALL), subscribers.get);
r.post('/subscribers/:subscriberId/test-push', authorize(...R.WRITE), rate.send, validate(S.testPush), subscribers.testPush);
r.post('/subscribers/:subscriberId/disable', authorize(...R.OPS), subscribers.disable);
r.post('/subscribers/:subscriberId/enable', authorize(...R.OPS), subscribers.enable);
r.delete('/subscribers/:subscriberId', authorize(...R.OPS), subscribers.remove);

// ---- campaigns ----
r.get('/campaigns', authorize(...R.ALL), campaigns.list);
r.post('/campaigns', authorize(...R.WRITE), validate(S.campaign), campaigns.create);
r.post('/campaigns/estimate', authorize(...R.ALL), validate(S.estimate), campaigns.estimate);
r.get('/campaigns/:id', authorize(...R.ALL), validId(), campaigns.get);
r.get('/campaigns/:id/attempts', authorize(...R.ALL), validId(), campaigns.attempts);
r.put('/campaigns/:id', authorize(...R.WRITE), validId(), validate(S.campaign), campaigns.update);
r.delete('/campaigns/:id', authorize(...R.WRITE), validId(), campaigns.remove);
r.post('/campaigns/:id/send', authorize(...R.WRITE), rate.send, validId(), validate(S.confirmSend), campaigns.send);
r.post('/campaigns/:id/schedule', authorize(...R.WRITE), rate.send, validId(), validate(S.schedule), campaigns.schedule);
r.post('/campaigns/:id/cancel', authorize(...R.WRITE), validId(), campaigns.cancel);
r.post('/campaigns/:id/duplicate', authorize(...R.WRITE), validId(), campaigns.duplicate);

// ---- templates ----
r.get('/templates', authorize(...R.ALL), templates.list);
r.post('/templates', authorize(...R.WRITE), validate(S.template), templates.create);
r.get('/templates/:id', authorize(...R.ALL), validId(), templates.get);
r.put('/templates/:id', authorize(...R.WRITE), validId(), validate(S.template), templates.update);
r.post('/templates/:id/duplicate', authorize(...R.WRITE), validId(), templates.duplicate);
r.patch('/templates/:id/toggle', authorize(...R.WRITE), validId(), templates.toggle);
r.delete('/templates/:id', authorize(...R.WRITE), validId(), templates.remove);

// ---- media ----
r.post('/uploads/image', authorize(...R.WRITE), rate.upload, upload.single('file'), uploads.image);

// ---- analytics, logs, exports, settings ----
r.get('/analytics/overview', authorize(...R.ALL), analytics.overview);
r.get('/analytics/report', authorize(...R.ALL), analytics.report);
r.get('/logs/audit', authorize(...R.LOGS), logs.audit);
r.get('/logs/failures', authorize(...R.LOGS), logs.failures);
r.get('/exports/subscribers.csv', authorize(...R.WRITE), exportsC.subscribers);
r.get('/exports/campaigns.csv', authorize(...R.WRITE), exportsC.campaigns);
r.get('/exports/campaign-performance.csv', authorize(...R.WRITE), exportsC.campaignPerformance);
r.get('/exports/push-failures.csv', authorize(...R.WRITE), exportsC.failures);
r.get('/exports/click-tracking.csv', authorize(...R.WRITE), exportsC.clicks);
r.get('/settings', authorize(...R.OPS), settings.get);

module.exports = r;
