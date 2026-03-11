'use strict';

const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      ref: 'Employee',
    },
    employeeName: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    date: {
      type: String, // YYYY-MM-DD format for easy querying
      required: true,
    },
    checkIn: {
      time: { type: Date },
      location: {
        latitude: { type: Number },
        longitude: { type: Number },
      },
      image: { type: String },
    },
    checkOut: {
      time: { type: Date },
      location: {
        latitude: { type: Number },
        longitude: { type: Number },
      },
      image: { type: String },
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'half_day', 'on_leave'],
      default: 'present',
    },
    confidenceScore: {
      type: Number,
      min: 0,
      max: 1,
      required: true,
    },
    workDuration: {
      type: Number, // minutes
      default: 0,
    },
    notes: {
      type: String,
      maxlength: 500,
    },
    isManual: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Compound unique index: one record per employee per day
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ status: 1 });

// Virtual: compute work duration on fly if not saved
attendanceSchema.virtual('computedDuration').get(function () {
  if (this.checkIn?.time && this.checkOut?.time) {
    return Math.floor((this.checkOut.time - this.checkIn.time) / 60000);
  }
  return null;
});

const Attendance = mongoose.model('Attendance', attendanceSchema);
module.exports = Attendance;
