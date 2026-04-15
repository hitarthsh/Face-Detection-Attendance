'use strict';

const faceService = require('./face.service');

const registerFace = async (req, res, next) => {
  try {
    const bodyEmployeeId = req.body?.employeeId;
    const headerEmployeeId = req.headers['x-employee-id'];
    const employeeId = String(bodyEmployeeId || headerEmployeeId || '').trim();
    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'employeeId is required' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Face image is required' });
    }
    const result = await faceService.registerFace(employeeId, req.file);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const verifyFace = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Face image is required' });
    }
    const result = await faceService.verifyFace(req.file.buffer);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { registerFace, verifyFace };
