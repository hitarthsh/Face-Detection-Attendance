'use strict';

const bcrypt = require('bcryptjs');
const User = require('./auth.schema');
const logger = require('../../utils/logger');

const DEFAULT_ADMIN_EMAIL = 'admin@company.com';
const DEFAULT_ADMIN_PASSWORD = 'hitarth@11';
const DEFAULT_ADMIN_NAME = 'Super Admin';

const isEnabled = () => {
  const raw = String(process.env.AUTO_SEED_DEFAULT_ADMIN ?? 'true')
    .trim()
    .toLowerCase();
  return !['0', 'false', 'off', 'no'].includes(raw);
};

const seedDefaultAdmin = async () => {
  if (!isEnabled()) {
    logger.info('Default admin seeding disabled (AUTO_SEED_DEFAULT_ADMIN=false)');
    return;
  }

  const email = String(process.env.DEFAULT_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL)
    .trim()
    .toLowerCase();
  const password = String(process.env.DEFAULT_ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD);
  const name = String(process.env.DEFAULT_ADMIN_NAME || DEFAULT_ADMIN_NAME).trim();

  if (!email || !password) {
    logger.warn('Default admin seeding skipped: missing email/password');
    return;
  }

  const existing = await User.findOne({ email }).select('+password');
  if (!existing) {
    await User.create({
      name,
      email,
      password,
      role: 'admin',
      isActive: true,
    });
    logger.info(`Default admin created: ${email}`);
    return;
  }

  // Keep login reliable across deployments by syncing the known default password.
  existing.password = await bcrypt.hash(password, 12);
  existing.role = 'admin';
  existing.isActive = true;
  await existing.save();
  logger.info(`Default admin ensured: ${email}`);
};

module.exports = { seedDefaultAdmin };
