'use strict';

const Employee = require('./employee.schema');
const logger = require('../../utils/logger');

const createEmployee = async (data) => {
  const existing = await Employee.findOne({
    $or: [{ employeeId: data.employeeId }, { email: data.email }],
  });
  if (existing) {
    const error = new Error('Employee ID or email already exists');
    error.statusCode = 409;
    throw error;
  }
  const employee = await Employee.create(data);
  logger.info(`Employee created: ${employee.employeeId}`);
  return employee;
};

const getAllEmployees = async ({ page = 1, limit = 20, search, department, isActive }) => {
  const query = {};
  if (search) query.$text = { $search: search };
  if (department) query.department = department;
  if (isActive !== undefined) query.isActive = isActive === 'true';

  const skip = (page - 1) * limit;
  const [employees, total] = await Promise.all([
    Employee.find(query).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
    Employee.countDocuments(query),
  ]);

  return {
    employees,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      limit: Number(limit),
    },
  };
};

const getEmployeeById = async (id) => {
  const employee = await Employee.findOne({ $or: [{ _id: id }, { employeeId: id }] });
  if (!employee) {
    const error = new Error('Employee not found');
    error.statusCode = 404;
    throw error;
  }
  return employee;
};

const updateEmployee = async (id, data) => {
  const employee = await Employee.findOneAndUpdate(
    { $or: [{ _id: id }, { employeeId: id }] },
    data,
    { new: true, runValidators: true }
  );
  if (!employee) {
    const error = new Error('Employee not found');
    error.statusCode = 404;
    throw error;
  }
  logger.info(`Employee updated: ${employee.employeeId}`);
  return employee;
};

const deleteEmployee = async (id) => {
  const employee = await Employee.findOneAndDelete({ $or: [{ _id: id }, { employeeId: id }] });
  if (!employee) {
    const error = new Error('Employee not found');
    error.statusCode = 404;
    throw error;
  }
  logger.info(`Employee deleted: ${employee.employeeId}`);
  return { message: 'Employee deleted successfully' };
};

const getEmployeesWithEmbeddings = async () => {
  return Employee.find({ faceRegistered: true, isActive: true }).select('+faceEmbedding');
};

module.exports = {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getEmployeesWithEmbeddings,
};
