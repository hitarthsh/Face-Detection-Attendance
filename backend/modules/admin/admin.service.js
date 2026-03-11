'use strict';

const User = require('../auth/auth.schema');
const Employee = require('../employees/employee.schema');
const Attendance = require('../attendance/attendance.schema');
const FaceData = require('../face/face.schema');
const logger = require('../../utils/logger');

const getDashboardStats = async () => {
  const today = new Date().toISOString().split('T')[0];

  const [
    totalEmployees,
    activeEmployees,
    faceRegistered,
    todayPresent,
    todayLate,
    totalUsers,
  ] = await Promise.all([
    Employee.countDocuments(),
    Employee.countDocuments({ isActive: true }),
    Employee.countDocuments({ faceRegistered: true }),
    Attendance.countDocuments({ date: today, status: { $in: ['present', 'late'] } }),
    Attendance.countDocuments({ date: today, status: 'late' }),
    User.countDocuments(),
  ]);

  const weeklyStats = await Attendance.aggregate([
    {
      $match: {
        date: {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
      },
    },
    {
      $group: {
        _id: '$date',
        present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
        late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
        total: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const departmentStats = await Attendance.aggregate([
    { $match: { date: today } },
    {
      $group: {
        _id: '$department',
        present: { $sum: 1 },
        avgConfidence: { $avg: '$confidenceScore' },
      },
    },
  ]);

  return {
    overview: {
      totalEmployees,
      activeEmployees,
      faceRegistered,
      todayPresent,
      todayLate,
      todayAbsent: activeEmployees - todayPresent,
      totalUsers,
      attendanceRate:
        activeEmployees > 0
          ? `${Math.round((todayPresent / activeEmployees) * 100)}%`
          : '0%',
    },
    weeklyStats,
    departmentStats,
  };
};

const getAllUsers = async () => {
  return User.find().sort({ createdAt: -1 });
};

const updateUserRole = async (userId, role) => {
  const user = await User.findByIdAndUpdate(userId, { role }, { new: true, runValidators: true });
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  return user;
};

const toggleUserStatus = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  user.isActive = !user.isActive;
  await user.save();
  return user;
};

module.exports = { getDashboardStats, getAllUsers, updateUserRole, toggleUserStatus };
