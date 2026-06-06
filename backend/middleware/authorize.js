// middleware/authorize.js
// Role-Based Access Control middleware — use AFTER authenticate

const Role = require('../models/Role');

/**
 * requireRole(...roles)
 * Restricts access to users with one of the specified roles.
 *
 * Usage: router.get('/admin', authenticate, requireRole('admin'), handler)
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
      });
    }

    next();
  };
}

/**
 * requirePermission(resource, action)
 * Restricts access to users whose role has the specified permission.
 * Queries DB for role permissions (can be cached with Redis in production).
 *
 * Usage: router.delete('/users/:id', authenticate, requirePermission('users', 'delete'), handler)
 */
function requirePermission(resource, action) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
      }

      // Load permissions for this user's role
      const permissions = await Role.getPermissions(req.user.roleId);

      const hasPermission = permissions.some(
        (p) => p.resource === resource && p.action === action
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Missing permission: ${resource}:${action}`,
        });
      }

      // Attach permissions to req for downstream use
      req.userPermissions = permissions;
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { requireRole, requirePermission };
