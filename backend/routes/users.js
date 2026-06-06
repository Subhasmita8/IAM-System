// routes/users.js

const express = require('express');
const router  = express.Router();

const userController = require('../controllers/userController');
const authenticate   = require('../middleware/authenticate');
const { requireRole, requirePermission } = require('../middleware/authorize');
const {
  registerRules,
  handleValidationErrors,
} = require('../middleware/validate');

// GET /users/me — any authenticated user
router.get('/me', authenticate, userController.getMe);

// GET /users — admin + manager (read permission)
router.get(
  '/',
  authenticate,
  requirePermission('users', 'read'),
  userController.getUsers
);

// GET /users/:id
router.get(
  '/:id',
  authenticate,
  requirePermission('users', 'read'),
  userController.getUserById
);

// POST /users — admin only (create permission)
router.post(
  '/',
  authenticate,
  requirePermission('users', 'create'),
  registerRules,
  handleValidationErrors,
  userController.createUser
);

// DELETE /users/:id — admin only (delete permission)
router.delete(
  '/:id',
  authenticate,
  requirePermission('users', 'delete'),
  userController.deleteUser
);

module.exports = router;
