'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path');

const env = require('../../config/env');
const logger = require('../../utils/logger');
const mainRouter = require('./router');
const { errorMiddleware, notFound } = require('../../middlewares/error.middleware');

const createApp = () => {
  const app = express();

  // ─── Security Headers ────────────────────────────────────────────────────────
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // ─── CORS ────────────────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: (origin, callback) => {
        const allowedOrigins = env.CLIENT_URL.split(',').map((o) => o.trim());
        // Allow requests with no origin (mobile apps, Postman, etc)
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    })
  );

  // ─── Compression ─────────────────────────────────────────────────────────────
  app.use(compression());

  // ─── Body Parsers ────────────────────────────────────────────────────────────
  // Allow primitive JSON payloads (e.g. "null") so we can return validation errors
  // instead of low-level JSON parse failures to the mobile client.
  app.use(express.json({ limit: '10mb', strict: false }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ─── MongoDB Injection Prevention ────────────────────────────────────────────
  app.use(mongoSanitize());

  // ─── HTTP Request Logging ────────────────────────────────────────────────────
  const morganFormat = env.isDev() ? 'dev' : 'combined';
  app.use(
    morgan(morganFormat, {
      stream: { write: (msg) => logger.http(msg.trim()) },
      skip: (req) => req.url === '/api/health',
    })
  );

  // ─── Rate Limiting ───────────────────────────────────────────────────────────
  const apiLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    message: { success: false, message: 'Too many requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Stricter limiter for auth endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: { success: false, message: 'Too many auth attempts. Please try again in 15 minutes.' },
  });

  app.use('/api/auth', authLimiter);
  app.use('/api', apiLimiter);

  // ─── Static Files ────────────────────────────────────────────────────────────
  app.use('/uploads', express.static(path.join(__dirname, '../../../uploads')));

  // ─── API Routes ──────────────────────────────────────────────────────────────
  app.use('/api', mainRouter);

  // ─── Root Endpoint ───────────────────────────────────────────────────────────
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'Face Attendance API Server',
      version: '1.0.0',
      docs: '/api/health',
    });
  });

  // ─── 404 & Error Handlers ────────────────────────────────────────────────────
  app.use(notFound);
  app.use(errorMiddleware);

  return app;
};

module.exports = { createApp };
