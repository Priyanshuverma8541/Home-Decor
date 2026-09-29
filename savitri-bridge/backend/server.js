'use strict';
const config = require('./config/env'); // validates environment first; exits with a clear message if invalid
const app = require('./app');
const { connectDB } = require('./config/db');
const { seedInitialAdmin } = require('./controllers/authController');
const scheduler = require('./jobs/scheduler');

(async () => {
  try {
    await connectDB();
    await require('./models/PushSubscription').init();
    await seedInitialAdmin();
    const server = app.listen(config.port, () => console.log(`[server] SavitriBridge API listening on :${config.port} (${config.isProd ? 'production' : 'development'})`));
    scheduler.start();
    const shutdown = () => { console.log('[server] shutting down'); server.close(() => process.exit(0)); setTimeout(() => process.exit(0), 8000).unref(); };
    process.on('SIGTERM', shutdown); process.on('SIGINT', shutdown);
  } catch (e) {
    console.error('[server] failed to start:', e.message);
    process.exit(1);
  }
})();
process.on('unhandledRejection', (e) => console.error('[unhandledRejection]', e && e.message));
