'use strict';

const mongoose = require('mongoose');

const faceDataSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      ref: 'Employee',
      unique: true,
    },
    embeddings: {
      type: [[Number]], // Array of embedding arrays (multiple captures)
      required: true,
      default: [],
    },
    images: [
      {
        path: { type: String },
        capturedAt: { type: Date, default: Date.now },
      },
    ],
    captureCount: {
      type: Number,
      default: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    quality: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

faceDataSchema.index({ employeeId: 1 });

const FaceData = mongoose.model('FaceData', faceDataSchema);
module.exports = FaceData;
