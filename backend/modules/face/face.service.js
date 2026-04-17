'use strict';

const FaceData = require('./face.schema');
const Employee = require('../employees/employee.schema');
const { generateEmbedding, findBestMatch } = require('../../utils/faceMatcher');
const logger = require('../../utils/logger');

/**
 * Register face for an employee
 */
const registerFace = async (employeeId, imageFile) => {
  // Verify employee exists
  const employee = await Employee.findOne({ employeeId }).select('+faceEmbedding');
  if (!employee) {
    const error = new Error('Employee not found');
    error.statusCode = 404;
    throw error;
  }

  // Generate embedding from uploaded image
  const imagePath = imageFile.path;
  const embedding = await generateEmbedding(imagePath);

  if (!embedding) {
    const error = new Error('No face detected in the provided image. Please use a clear face photo.');
    error.statusCode = 422;
    throw error;
  }

  // Upsert face data
  let faceData = await FaceData.findOne({ employeeId });
  if (faceData) {
    faceData.embeddings.push(embedding);
    faceData.images.push({ path: imageFile.filename, capturedAt: new Date() });
    faceData.captureCount += 1;
    faceData.lastUpdated = new Date();
    await faceData.save();
  } else {
    faceData = await FaceData.create({
      employeeId,
      embeddings: [embedding],
      images: [{ path: imageFile.filename, capturedAt: new Date() }],
      captureCount: 1,
    });
  }

  // Also store the latest embedding in Employee document for quick lookup
  employee.faceEmbedding = embedding;
  employee.faceRegistered = true;
  employee.profileImage = imageFile.filename;
  await employee.save();

  logger.info(`Face registered for employee: ${employeeId}`);
  return {
    message: 'Face registered successfully',
    employeeId,
    captureCount: faceData.captureCount,
  };
};

/**
 * Verify a face against all registered employees
 */
const verifyFace = async (imageBuffer) => {
  const incomingEmbedding = await generateEmbedding(imageBuffer);

  if (!incomingEmbedding) {
    const error = new Error('No face detected in the image');
    error.statusCode = 422;
    throw error;
  }

  // Fetch all registered employees with embeddings
  const employees = await Employee.find({ faceRegistered: true, isActive: true })
    .select('+faceEmbedding employeeId name department')
    .lean();

  if (employees.length === 0) {
    return { matched: false, message: 'No registered faces in database' };
  }

  const storedEmbeddings = employees.map((e) => ({
    employeeId: e.employeeId,
    embedding: e.faceEmbedding,
    name: e.name,
    department: e.department,
  }));

  const { employeeId, confidence, isMatch } = findBestMatch(incomingEmbedding, storedEmbeddings);

  if (!isMatch) {
    return { matched: false, confidence: 0, message: 'No matching employee found' };
  }

  const matchedEmployee = storedEmbeddings.find((e) => e.employeeId === employeeId);
  logger.info(`Face verified: ${employeeId} (confidence: ${(confidence * 100).toFixed(1)}%)`);

  return {
    matched: true,
    employeeId,
    employeeName: matchedEmployee.name,
    department: matchedEmployee.department,
    confidence,
    confidencePercent: `${(confidence * 100).toFixed(1)}%`,
  };
};

module.exports = { registerFace, verifyFace };
