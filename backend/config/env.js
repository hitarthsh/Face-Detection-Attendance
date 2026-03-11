'use strict';

const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,

  // MongoDB
  MONGODB_URI:
    process.env.NODE_ENV === 'production'
      ? process.env.MONGODB_URI_PROD
      : process.env.MONGODB_URI || 'mongodb://localhost:27017/face_attendance',

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
