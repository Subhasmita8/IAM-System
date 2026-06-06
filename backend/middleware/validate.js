// middleware/validate.js
// express-validator based validation rules for each route

const { body, validationResult } = require('express-validator');

/**
 * handleValidationErrors — run after validation chains
 * Returns 422 with all field errors if validation fails
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors:  errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

// ─── Validation Rule Sets ─────────────────────────────────────

const registerRules = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be 3-50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),

  body('email')
    .trim()
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and a number'),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const createRoleRules = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Role name must be 2-50 characters')
    .matches(/^[a-z_]+$/)
    .withMessage('Role name must be lowercase letters and underscores only'),
  body('description').optional().trim().isLength({ max: 255 }),
];

const assignRoleRules = [
  body('userId').isInt({ min: 1 }).withMessage('Valid user ID required'),
  body('roleId').isInt({ min: 1 }).withMessage('Valid role ID required'),
];

module.exports = {
  handleValidationErrors,
  registerRules,
  loginRules,
  createRoleRules,
  assignRoleRules,
};
