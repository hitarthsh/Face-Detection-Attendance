'use strict';

const mongoose = require('mongoose');
const HealthHistory = require('./healthHistory.schema');
const logger = require('../../utils/logger');

const getHealthStatus = async () => {
  const start = Date.now();
  let dbStatus = 'connected';

  try {
    await mongoose.connection.db.admin().ping();
  } catch {
    dbStatus = 'disconnected';
  }

  const responseTime = Date.now() - start;
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();

  const status =
    dbStatus === 'connected' ? 'healthy' : 'degraded';

  const healthData = {
    status,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(uptime),
    uptimeHuman: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
    responseTime,
    database: { status: dbStatus },
    memory: {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
    },
    version: process.env.npm_package_version || '1.0.0',
    nodeVersion: process.version,
  };

  // Persist health snapshot (async, don't await)
  HealthHistory.create({
    status,
    uptime: Math.floor(uptime),
    responseTime,
    memoryUsage: {
      rss: memoryUsage.rss,
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed,
      external: memoryUsage.external,
    },
    dbStatus,
  }).catch((err) => logger.warn(`Health history save failed: ${err.message}`));

  return healthData;
};

module.exports = { getHealthStatus };
