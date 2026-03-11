'use strict';

const express = require('express');
const router = express.Router();

// Module routes
const authRoutes = require('../auth/auth.routes');
const employeeRoutes = require('../employees/employee.routes');
const faceRoutes = require('../face/face.routes');
const attendanceRoutes = require('../attendance/attendance.routes');
const adminRoutes = require('../admin/admin.routes');
const healthRoutes = require('../health/health.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);
router.use('/face', faceRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/admin', adminRoutes);
router.use('/health', healthRoutes);

module.exports = router;
