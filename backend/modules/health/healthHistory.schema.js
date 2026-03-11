'use strict';

const mongoose = require('mongoose');

const healthHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['healthy', 'degraded', 'down'],
      required: true,
    },
    uptime: { type: Number },
    responseTime: { type: Number },
    memoryUsage: {
      rss: Number,
      heapTotal: Number,
      heapUsed: Number,
      external: Number,
    },
    dbStatus: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

const HealthHistory = mongoose.model('HealthHistory', healthHistorySchema);
module.exports = HealthHistory;
