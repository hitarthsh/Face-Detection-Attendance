'use strict';

const express = require('express');
const router = express.Router();
const faceController = require('./face.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const { upload, uploadMemory, handleUploadError } = require('../../middlewares/upload.middleware');

router.use(authenticate);

// Register face — disk storage (save image for training audit)
router.post(
  '/register',
  authorize('admin', 'manager'),
  handleUploadError(upload.single('image')),
  faceController.registerFace
);

// Verify face — memory storage (no need to persist verification images)
router.post(
  '/verify',
  handleUploadError(uploadMemory.single('image')),
  faceController.verifyFace
);

module.exports = router;
