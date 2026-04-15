'use strict';

const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

/** Strip whitespace / wrapping quotes from dashboard secrets (Render, etc.). */
function normalizeEnvString(value) {
  if (value == null) return '';
  let s = String(value).trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

/**
 * Atlas / hosted Mongo — use the first usable URI (same order dev + prod).
 * Supports Render: MONGODB_URI_PROD, or MONGODB_URI, or Atlas-linked DATABASE_URL.
 */
function resolveMongoUri() {
  const candidates = [
    process.env.MONGODB_URI,
    process.env.MONGODB_URI_PROD,
    process.env.MONGO_URL,
    process.env.DATABASE_URL,
  ];
  for (const raw of candidates) {
    const s = normalizeEnvString(raw);
    if (s.startsWith('mongodb://') || s.startsWith('mongodb+srv://')) {
      return s;
    }
  }
  const isProd = (process.env.NODE_ENV || 'development') === 'production';
  return isProd ? '' : 'mongodb://localhost:27017/face_attendance';
}

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  HOST: process.env.HOST || '0.0.0.0',

  MONGODB_URI: resolveMongoUri(),

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_dev_secret_change_in_prod',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',

  // Upload
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024, // 10MB

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,

  // Face Recognition
  FACE_MATCH_THRESHOLD: parseFloat(process.env.FACE_MATCH_THRESHOLD) || 0.6,
  FACE_CONFIDENCE_MIN: parseFloat(process.env.FACE_CONFIDENCE_MIN) || 0.9,

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_DIR: process.env.LOG_DIR || 'logs',

  // CORS
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',

  isDev() {
    return this.NODE_ENV === 'development';
  },
  isProd() {
    return this.NODE_ENV === 'production';
  },
};

module.exports = env;
