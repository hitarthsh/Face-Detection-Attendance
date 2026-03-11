'use strict';

const attendanceService = require('./attendance.service');

const checkIn = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Face image required' });
    }
    const locationData = req.body.latitude
      ? { latitude: parseFloat(req.body.latitude), longitude: parseFloat(req.body.longitude) }
      : null;
    const record = await attendanceService.checkIn(req.file.buffer, locationData);
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

const checkOut = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Face image required' });
    }
    const locationData = req.body.latitude
      ? { latitude: parseFloat(req.body.latitude), longitude: parseFloat(req.body.longitude) }
      : null;
    const record = await attendanceService.checkOut(req.file.buffer, locationData);
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

const getTodayAttendance = async (req, res, next) => {
  try {
    const result = await attendanceService.getTodayAttendance(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getReport = async (req, res, next) => {
  try {
    const result = await attendanceService.getReport(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

module.exports = { checkIn, checkOut, getTodayAttendance, getReport };
