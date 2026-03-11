'use strict';

/**
 * Face Matcher Utility
 * Uses @vladmandic/face-api (pure JS, no native bindings) + jimp for image loading
 * Compatible with Node.js v22+
 */

const path = require('path');
const logger = require('./logger');
const env = require('../config/env');

// Lazy-loaded modules
let faceapi = null;
let Jimp = null;
let tf = null;
let isModelLoaded = false;

/**
 * Load face-api dependencies lazily
 */
const loadDependencies = async () => {
  if (!faceapi) {
    faceapi = require('@vladmandic/face-api');
    tf = faceapi.tf;
    Jimp = require('jimp');
  }
};

/**
 * Initialize face detector models (singleton)
 * Models are bundled with @vladmandic/face-api
 */
const initDetector = async () => {
  if (isModelLoaded) return;

  await loadDependencies();

  logger.info('Loading face detection models...');

  // Use models bundled inside the package
  const modelsPath = path.join(
    require.resolve('@vladmandic/face-api'),
    '../../model'
  );

  await faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(modelsPath);
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath);

  isModelLoaded = true;
  logger.info('Face detection models loaded successfully');
};

/**
 * Load an image (Buffer or file path) as a faceapi-compatible tensor
 * @param {Buffer|string} imageSource
 * @returns {tf.Tensor3D}
 */
const loadImageAsTensor = async (imageSource) => {
  await loadDependencies();

  let image;
  if (Buffer.isBuffer(imageSource)) {
    image = await Jimp.read(imageSource);
  } else {
    image = await Jimp.read(imageSource);
  }

  // Resize for performance, max 640px wide
  if (image.width > 640) {
    image.resize(640, Jimp.AUTO);
  }

  const { width, height } = image;
  const numChannels = 3;
  const pixelData = new Uint8Array(width * height * numChannels);

  let idx = 0;
  image.scan(0, 0, width, height, function (x, y, offset) {
    pixelData[idx++] = this.bitmap.data[offset];     // R
    pixelData[idx++] = this.bitmap.data[offset + 1]; // G
    pixelData[idx++] = this.bitmap.data[offset + 2]; // B
    // skip alpha channel
  });

  // Create tf.Tensor3D from raw pixel data and return as HTMLImageElement-like object
  // faceapi accepts tf.Tensor3D directly
  const tensor = tf.tensor3d(pixelData, [height, width, numChannels]);
  return tensor;
};

/**
 * Generate a 128-dimension face descriptor embedding from an image.
 * @param {Buffer|string} imageSource - image buffer or file path
 * @returns {Float32Array|null} - 128-dim embedding or null if no face found
 */
const generateEmbedding = async (imageSource) => {
  try {
    await initDetector();

    const tensor = await loadImageAsTensor(imageSource);

    // Detect face + landmarks + descriptor
    const result = await faceapi
      .detectSingleFace(tensor)
      .withFaceLandmarks()
      .withFaceDescriptor();

    // Free tensor memory
    tensor.dispose();

    if (!result) {
      logger.warn('No face detected in the image');
      return null;
    }

    logger.debug(`Generated 128-dim face embedding`);
    return Array.from(result.descriptor); // return as plain array for MongoDB storage
  } catch (error) {
    logger.error(`generateEmbedding error: ${error.message}`);
    throw error;
  }
};

/**
 * Euclidean distance between two 128-dim descriptors
 * @param {number[]|Float32Array} a
 * @param {number[]|Float32Array} b
 * @returns {number}
 */
const euclideanDistance = (a, b) => {
  if (a.length !== b.length) {
    throw new Error(`Descriptor length mismatch: ${a.length} vs ${b.length}`);
  }
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += (a[i] - b[i]) ** 2;
  }
  return Math.sqrt(sum);
};

/**
 * Compare two face embeddings (lower distance = better match)
 * face-api.js uses euclidean distance on 128-dim vectors.
 * Typical threshold: 0.6 (same person if distance < 0.6)
 * @param {number[]} embedding1
 * @param {number[]} embedding2
 * @returns {{ isMatch: boolean, confidence: number, distance: number }}
 */
const compareFaces = (embedding1, embedding2) => {
  try {
    if (!embedding1 || !embedding2) {
      return { isMatch: false, confidence: 0, distance: Infinity };
    }

    const distance = euclideanDistance(embedding1, embedding2);

    // Convert distance to 0-1 confidence (distance 0 = 100%, distance >= 1 = 0%)
    const confidence = Math.max(0, 1 - distance);

    // Match if distance below threshold (default 0.6)
    const threshold = env.FACE_MATCH_THRESHOLD || 0.6;
    const isMatch = distance <= threshold;

    logger.debug(
      `Face comparison: distance=${distance.toFixed(4)}, confidence=${(confidence * 100).toFixed(1)}%, match=${isMatch}`
    );

    return { isMatch, confidence, distance };
  } catch (error) {
    logger.error(`compareFaces error: ${error.message}`);
    return { isMatch: false, confidence: 0, distance: Infinity };
  }
};

/**
 * Find best matching employee from a list of stored embeddings
 * @param {number[]} incomingEmbedding
 * @param {Array<{ employeeId: string, embedding: number[] }>} storedEmbeddings
 * @returns {{ employeeId: string|null, confidence: number, isMatch: boolean }}
 */
const findBestMatch = (incomingEmbedding, storedEmbeddings) => {
  if (!storedEmbeddings || storedEmbeddings.length === 0) {
    return { employeeId: null, confidence: 0, isMatch: false };
  }

  let bestMatch = null;
  let bestConfidence = 0;
  let bestDistance = Infinity;

  for (const stored of storedEmbeddings) {
    if (!stored.embedding) continue;
    const { isMatch, confidence, distance } = compareFaces(stored.embedding, incomingEmbedding);
    if (isMatch && distance < bestDistance) {
      bestDistance = distance;
      bestConfidence = confidence;
      bestMatch = stored.employeeId;
    }
  }

  return {
    employeeId: bestMatch,
    confidence: bestConfidence,
    isMatch: bestMatch !== null,
  };
};

module.exports = {
  generateEmbedding,
  compareFaces,
  findBestMatch,
  initDetector,
};
