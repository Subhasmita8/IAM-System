// routes/roles.js

const express = require('express');
const router  = express.Router();

const roleController = require('../controllers/roleController');
const authenticate   = require('../middleware/authenticate');
const { requireRole, requirePermission } = require('../middleware/authorize');
const { createRoleRules, assignRoleRules, handleValidationErrors } = require('../middleware/validate');

// GET /roles — admin + manager
router.get('/', authenticate, requirePermission('roles', 'read'), roleController.getRoles);

// POST /roles — admin only
router.post(
  '/',
  authenticate,
  requirePermission('roles', 'create'),
  createRoleRules,
  handleValidationErrors,
  roleController.createRole
);

// GET /roles/:id/permissions
router.get(
  '/:id/permissions',
  authenticate,
  requirePermission('roles', 'read'),
  roleController.getRolePermissions
);

// POST /assign-role — admin only
router.post(
  '/assign',
  authenticate,
  requireRole('admin'),
  assignRoleRules,
  handleValidationErrors,
  roleController.assignRole
);

// GET /permissions
router.get(
  '/permissions/all',
  authenticate,
  requirePermission('roles', 'read'),
  roleController.getPermissions
);

module.exports = router;
