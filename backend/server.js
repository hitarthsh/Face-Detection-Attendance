'use strict';

const { createApp } = require('./modules/core/app');
const { connectDB } = require('./config/db');
const env = require('./config/env');
const logger = require('./utils/logger');
const { initDetector } = require('./utils/faceMatcher');
const { seedDefaultAdmin } = require('./modules/auth/seedAdmin');

const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Ensure default admin user exists (useful for fresh deployments)
    await seedDefaultAdmin();

    // 3. Pre-warm face detection model
    logger.info('Initializing face detection model...');
    await initDetector();

    // 4. Create Express app
    const app = createApp();

    // 5. Start listening
    const server = app.listen(env.PORT, env.HOST, () => {
      logger.info(`🚀 Server running on port ${env.PORT} [${env.NODE_ENV}]`);
      logger.info(`📡 API Base (localhost): http://localhost:${env.PORT}/api`);
      logger.info(`📶 API Base (LAN): http://125.125.1.144:${env.PORT}/api`);
    });

    // ─── Graceful Shutdown ────────────────────────────────────────────────────
    const shutdown = async (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        const { disconnectDB } = require('./config/db');
        await disconnectDB();
        logger.info('Server closed. Exiting process.');
        process.exit(0);
      });

      // Force close after 10s
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      logger.error(`Unhandled Rejection: ${reason}`);
    });

    process.on('uncaughtException', (err) => {
      logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
      process.exit(1);
    });

    return server;
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
