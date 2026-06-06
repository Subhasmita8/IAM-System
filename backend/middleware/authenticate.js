// middleware/authenticate.js
// Verifies JWT access token on protected routes

const tokenService = require('../services/tokenService');
const User = require('../models/User');

/**
 * authenticate middleware
 * Expects: Authorization: Bearer <access_token>
 * Attaches req.user = { id, username, email, role, permissions }
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify signature and expiry
    let payload;
    try {
      payload = tokenService.verifyAccessToken(token);
    } catch (err) {
      const isExpired = err.name === 'TokenExpiredError';
      return res.status(401).json({
        success: false,
        message: isExpired ? 'Access token expired' : 'Invalid access token',
        code:    isExpired ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID',
      });
    }

    // Optional: load fresh user from DB to catch role changes / deactivation
    // For performance, you can skip this and trust the token payload
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive',
      });
    }

    // Attach user context to request
    req.user = {
      id:       user.id,
      username: user.username,
      email:    user.email,
      role:     user.role_name,
      roleId:   user.role_id,
    };

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = authenticate;
