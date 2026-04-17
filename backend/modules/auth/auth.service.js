'use strict';

const User = require('./auth.schema');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../../config/env');
const logger = require('../../utils/logger');

/**
 * Generate JWT tokens
 */
const generateTokens = (userId, role) => {
  const accessToken = jwt.sign({ id: userId, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
  const refreshToken = jwt.sign({ id: userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
  return { accessToken, refreshToken };
};

/**
 * Register a new user
 */
const register = async ({ name, email, password, role }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error('Email already registered');
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create({ name, email, password, role });
  logger.info(`New user registered: ${email}`);
  return user;
};

/**
 * Login user and return tokens
 */
const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error('Account is deactivated. Contact admin.');
    error.statusCode = 403;
    throw error;
  }

  const { accessToken, refreshToken } = generateTokens(user._id, user.role);

  // Store refresh token hash
  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save();

  logger.info(`User logged in: ${email}`);
  return { user, accessToken, refreshToken };
};

/**
 * Refresh access token
 */
const refreshAccessToken = async (refreshToken) => {
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
  } catch {
    const error = new Error('Invalid or expired refresh token');
    error.statusCode = 401;
    throw error;
  }

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== refreshToken) {
    const error = new Error('Refresh token mismatch');
    error.statusCode = 401;
    throw error;
  }

  const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id, user.role);
  user.refreshToken = newRefreshToken;
  await user.save();

  return { accessToken, refreshToken: newRefreshToken };
};

/**
 * Logout - clear refresh token
 */
const logout = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
  logger.info(`User logged out: ${userId}`);
};

/**
 * Get current user profile
 */
const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  return user;
};

/**
 * Create password reset token for a user if account exists.
 * Returns a generic success response to avoid email enumeration.
 */
const requestPasswordReset = async ({ email }) => {
  const user = await User.findOne({ email }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    return {
      message: 'If an account with this email exists, a reset token has been generated.',
    };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.passwordResetToken = resetTokenHash;
  user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  await user.save({ validateBeforeSave: false });

  logger.info(`Password reset requested: ${email}`);

  const response = {
    message: 'If an account with this email exists, a reset token has been generated.',
  };

  if (env.isDev()) {
    response.resetToken = resetToken;
    response.expiresAt = user.passwordResetExpires;
  }

  return response;
};

/**
 * Reset password using a valid, non-expired reset token.
 */
const resetPassword = async ({ token, newPassword }) => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: tokenHash,
    passwordResetExpires: { $gt: new Date() },
  }).select('+password +passwordResetToken +passwordResetExpires +refreshToken');

  if (!user) {
    const error = new Error('Invalid or expired reset token');
    error.statusCode = 400;
    throw error;
  }

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshToken = null;
  await user.save();

  logger.info(`Password reset completed: ${user.email}`);
  return { message: 'Password reset successful. Please login again.' };
};

module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
  getProfile,
  requestPasswordReset,
  resetPassword,
};
