// routes/auth.js

const express = require('express');
const router  = express.Router();

const authController = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  registerRules,
  loginRules,
  handleValidationErrors,
} = require('../middleware/validate');

// POST /auth/register
router.post(
  '/register',
  authLimiter,
  registerRules,
  handleValidationErrors,
  authController.register
);

// POST /auth/login
router.post(
  '/login',
  authLimiter,
  loginRules,
  handleValidationErrors,
  authController.login
);

// POST /auth/refresh-token  (reads httpOnly cookie)
router.post('/refresh-token', authController.refreshToken);

// POST /auth/logout
router.post('/logout', authController.logout);

module.exports = router;
