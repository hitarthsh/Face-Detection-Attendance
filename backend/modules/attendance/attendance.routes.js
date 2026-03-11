'use strict';

const express = require('express');
const router = express.Router();
const attendanceController = require('./attendance.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { uploadMemory, handleUploadError } = require('../../middlewares/upload.middleware');

router.use(authenticate);

router.post('/checkin', handleUploadError(uploadMemory.single('image')), attendanceController.checkIn);
router.post('/checkout', handleUploadError(uploadMemory.single('image')), attendanceController.checkOut);
router.get('/today', attendanceController.getTodayAttendance);
router.get('/report', attendanceController.getReport);

module.exports = router;
