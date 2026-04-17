'use strict';

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const env = require('../config/env');
const logger = require('../utils/logger');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../', env.UPLOAD_DIR, 'faces');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `face-${uniqueSuffix}${ext}`);
  },
});

const imageFileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('Only JPEG, PNG, and WebP images are allowed');
    error.statusCode = 400;
    cb(error, false);
  }
};

const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: env.MAX_FILE_SIZE,
    files: 5,
  },
});

// Memory storage for in-memory processing (face verification)
const memoryStorage = multer.memoryStorage();
const uploadMemory = multer({
  storage: memoryStorage,
  fileFilter: imageFileFilter,
  limits: {
    // Verification runs in-memory; keep payloads small to prevent OOM spikes.
    fileSize: Math.min(env.MAX_FILE_SIZE, 3 * 1024 * 1024),
    files: 1,
  },
});

/**
 * Multer error handler middleware wrapper
 */
const handleUploadError = (uploadFn) => (req, res, next) => {
  uploadFn(req, res, (err) => {
    if (!err) return next();

    logger.warn(`Upload error: ${err.message}`);

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: `File too large. Maximum size: ${env.MAX_FILE_SIZE / 1024 / 1024}MB`,
        });
      }
      return res.status(400).json({ success: false, message: err.message });
    }

    next(err);
  });
};

module.exports = {
  upload,
  uploadMemory,
  handleUploadError,
  uploadDir,
};
