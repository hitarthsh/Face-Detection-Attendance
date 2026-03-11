'use strict';

const express = require('express');
const router = express.Router();
const healthService = require('./health.service');

router.get('/', async (req, res, next) => {
  try {
    const health = await healthService.getHealthStatus();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json({ success: true, data: health });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
