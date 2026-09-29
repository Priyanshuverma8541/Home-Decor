'use strict';
const express = require('express');
const helmet = require('helmet');
const config = require('./config/env');
const sanitize = require('./utils/sanitize');
const { adminCors, publicCors } = require('./middleware/cors');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
app.set('trust proxy', 1); // Render terminates TLS in front of the app
app.disable('x-powered-by');
app.use(helmet());
app.use(express.json({ limit: '50kb' }));
app.use(sanitize);

app.get('/health', (_req, res) => res.json({ success: true, data: { status: 'ok', time: new Date().toISOString() } }));

app.use('/api/v1/public', publicCors, require('./routes/publicRoutes'));
app.use('/api/v1/admin', adminCors, require('./routes/adminRoutes'));
// Reserved for future trusted server-to-server integrations (Savitri backend channel, Salesforce Marketing Cloud). Not implemented in V1.
app.use('/api/v1/integration', (_req, res) => res.status(501).json({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Server integration API is planned for a future version. See docs/SFMC_FUTURE_INTEGRATION.md.' } }));

app.use(notFoundHandler);
app.use(errorHandler);
module.exports = app;
