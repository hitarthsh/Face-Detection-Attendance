'use strict';

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const employeeController = require('./employee.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');

const validateEmployee = [
  body('employeeId').trim().notEmpty().withMessage('Employee ID required'),
  body('name').trim().notEmpty().withMessage('Name required'),
  body('department').trim().notEmpty().withMessage('Department required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
];

router.use(authenticate);

router.post('/', authorize('admin', 'manager'), validateEmployee, validate, employeeController.createEmployee);
router.get('/', employeeController.getAllEmployees);
router.get('/:id', employeeController.getEmployeeById);
router.put('/:id', authorize('admin', 'manager'), employeeController.updateEmployee);
router.delete('/:id', authorize('admin'), employeeController.deleteEmployee);

module.exports = router;
