'use strict';

const Attendance = require('./attendance.schema');
const faceService = require('../face/face.service');
const logger = require('../../utils/logger');

const getTodayDate = () => new Date().toISOString().split('T')[0];

/**
 * Check in via face recognition
 */
const checkIn = async (imageBuffer, locationData) => {
  // Verify face
  const faceResult = await faceService.verifyFace(imageBuffer);

  if (!faceResult.matched) {
    const error = new Error('Face not recognized. Please ensure face is clearly visible.');
    error.statusCode = 401;
    throw error;
  }

  const today = getTodayDate();
  const now = new Date();

  // Check if already checked in today
  const existing = await Attendance.findOne({
    employeeId: faceResult.employeeId,
    date: today,
  });

  if (existing?.checkIn?.time) {
    const error = new Error('Already checked in today');
    error.statusCode = 409;
    throw error;
  }

  // Determine status (late if after 9:30 AM)
  const checkInHour = now.getHours();
  const checkInMin = now.getMinutes();
  const isLate = checkInHour > 9 || (checkInHour === 9 && checkInMin > 30);

  const attendanceData = {
    employeeId: faceResult.employeeId,
    employeeName: faceResult.employeeName,
    department: faceResult.department,
    date: today,
    checkIn: {
      time: now,
      location: locationData || {},
    },
    status: isLate ? 'late' : 'present',
    confidenceScore: faceResult.confidence,
  };

  let attendance;
  if (existing) {
    attendance = await Attendance.findByIdAndUpdate(existing._id, attendanceData, { new: true });
  } else {
    attendance = await Attendance.create(attendanceData);
  }

  logger.info(`Check-in: ${faceResult.employeeId} at ${now.toISOString()}`);
  return attendance;
};

/**
 * Check out via face recognition
 */
const checkOut = async (imageBuffer, locationData) => {
  const faceResult = await faceService.verifyFace(imageBuffer);

  if (!faceResult.matched) {
    const error = new Error('Face not recognized');
    error.statusCode = 401;
    throw error;
  }

  const today = getTodayDate();
  const now = new Date();

  const attendance = await Attendance.findOne({
    employeeId: faceResult.employeeId,
    date: today,
  });

  if (!attendance || !attendance.checkIn?.time) {
    const error = new Error('No check-in record found for today');
    error.statusCode = 404;
    throw error;
  }

  if (attendance.checkOut?.time) {
    const error = new Error('Already checked out today');
    error.statusCode = 409;
    throw error;
  }

  const durationMinutes = Math.floor((now - attendance.checkIn.time) / 60000);

  attendance.checkOut = { time: now, location: locationData || {} };
  attendance.workDuration = durationMinutes;
  if (durationMinutes < 240) attendance.status = 'half_day'; // Less than 4 hours
  await attendance.save();

  logger.info(`Check-out: ${faceResult.employeeId} at ${now.toISOString()}, duration: ${durationMinutes}min`);
  return attendance;
};

/**
 * Get today's attendance
 */
const getTodayAttendance = async ({ page = 1, limit = 50, department }) => {
  const today = getTodayDate();
  const query = { date: today };
  if (department) query.department = department;

  const skip = (page - 1) * limit;
  const [records, total] = await Promise.all([
    Attendance.find(query).skip(skip).limit(Number(limit)).sort({ 'checkIn.time': -1 }),
    Attendance.countDocuments(query),
  ]);

  return { records, total, date: today };
};

/**
 * Get attendance report for date range
 */
const getReport = async ({ startDate, endDate, employeeId, department, page = 1, limit = 50 }) => {
  const query = {};
  if (startDate && endDate) {
    query.date = { $gte: startDate, $lte: endDate };
  }
  if (employeeId) query.employeeId = employeeId;
  if (department) query.department = department;

  const skip = (page - 1) * limit;
  const [records, total] = await Promise.all([
    Attendance.find(query)
      .skip(skip)
      .limit(Number(limit))
      .sort({ date: -1, 'checkIn.time': -1 }),
    Attendance.countDocuments(query),
  ]);

  // Summary stats
  const stats = await Attendance.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgConfidence: { $avg: '$confidenceScore' },
      },
    },
  ]);

  return {
    records,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      limit: Number(limit),
    },
    stats,
  };
};

module.exports = { checkIn, checkOut, getTodayAttendance, getReport };
