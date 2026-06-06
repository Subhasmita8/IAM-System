// controllers/roleController.js
// Handles role and permission management

const Role = require('../models/Role');
const User = require('../models/User');

/**
 * GET /roles
 * Get all roles with permission counts
 */
async function getRoles(req, res, next) {
  try {
    const roles = await Role.findAll();
    return res.status(200).json({ success: true, data: { roles } });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /roles
 * Admin only — create a new role
 */
async function createRole(req, res, next) {
  try {
    const { name, description } = req.body;

    const existing = await Role.findByName(name);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Role already exists' });
    }

    const roleId = await Role.create({ name, description });
    const role = await Role.findById(roleId);

    return res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data:    { role },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /roles/:id/permissions
 * Get permissions for a specific role
 */
async function getRolePermissions(req, res, next) {
  try {
    const roleId = parseInt(req.params.id);
    const permissions = await Role.getPermissions(roleId);
    return res.status(200).json({ success: true, data: { permissions } });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /assign-role
 * Admin only — assign a role to a user
 * Body: { userId, roleId }
 */
async function assignRole(req, res, next) {
  try {
    const { userId, roleId } = req.body;

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const updated = await User.updateRole(userId, roleId);
    if (!updated) {
      return res.status(500).json({ success: false, message: 'Failed to assign role' });
    }

    return res.status(200).json({
      success: true,
      message: `Role '${role.name}' assigned to user '${user.username}'`,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /permissions
 * List all available permissions
 */
async function getPermissions(req, res, next) {
  try {
    const permissions = await Role.getAllPermissions();
    return res.status(200).json({ success: true, data: { permissions } });
  } catch (err) {
    next(err);
  }
}

module.exports = { getRoles, createRole, getRolePermissions, assignRole, getPermissions };
