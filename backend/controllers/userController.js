// controllers/userController.js
// Handles user management endpoints (admin-facing)

const User = require('../models/User');
const Role = require('../models/Role');
const bcrypt = require('bcryptjs');

/**
 * GET /users
 * Admin only — list all users with pagination
 */
async function getUsers(req, res, next) {
  try {
    const limit  = Math.min(parseInt(req.query.limit)  || 20, 100); // Cap at 100
    const offset = Math.max(parseInt(req.query.offset) || 0,  0);

    const users = await User.findAll({ limit, offset });

    return res.status(200).json({
      success: true,
      data:    { users, limit, offset },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /users/:id
 * Admin or the user themselves
 */
async function getUserById(req, res, next) {
  try {
    const userId = parseInt(req.params.id);

    // Non-admins can only view themselves
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /users
 * Admin only — create a user with any role
 */
async function createUser(req, res, next) {
  try {
    const { username, email, password, roleName = 'user' } = req.body;

    const role = await Role.findByName(roleName);
    if (!role) {
      return res.status(400).json({ success: false, message: `Role '${roleName}' not found` });
    }

    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = await User.create({ username, email, passwordHash, roleId: role.id });
    const newUser = await User.findById(userId);

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data:    { user: newUser },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /users/:id
 * Admin only — removes user from DB
 */
async function deleteUser(req, res, next) {
  try {
    const userId = parseInt(req.params.id);

    // Prevent self-deletion
    if (req.user.id === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account',
      });
    }

    const deleted = await User.delete(userId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /users/me
 * Returns the authenticated user's own profile
 */
async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.status(200).json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}

module.exports = { getUsers, getUserById, createUser, deleteUser, getMe };
