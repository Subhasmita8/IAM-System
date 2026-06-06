// controllers/authController.js
// Thin controller layer — delegates all logic to authService

const authService = require('../services/authService');

/**
 * Helper to extract client metadata for token tracking
 */
function getClientMeta(req) {
  return {
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
  };
}

/**
 * POST /auth/register
 */
async function register(req, res, next) {
  try {
    const { username, email, password } = req.body;

    const result = await authService.register(
      { username, email, password },
      getClientMeta(req)
    );

    // Store refresh token in httpOnly cookie
    setRefreshCookie(res, result.refreshToken);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user:        result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /auth/login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const result = await authService.login(
      { email, password },
      getClientMeta(req)
    );

    setRefreshCookie(res, result.refreshToken);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user:        result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /auth/refresh-token
 * Client sends refresh token via httpOnly cookie
 */
async function refreshToken(req, res, next) {
  try {
    const oldToken = req.cookies?.refreshToken;

    if (!oldToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not provided',
      });
    }

    const { accessToken, refreshToken: newRefresh } = await authService.refreshTokens(
      oldToken,
      getClientMeta(req)
    );

    setRefreshCookie(res, newRefresh);

    return res.status(200).json({
      success: true,
      data:    { accessToken },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /auth/logout
 */
async function logout(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;
    await authService.logout(token);

    // Clear the cookie
    res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'strict' });

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (err) {
    next(err);
  }
}

// ─── Helpers ──────────────────────────────────────────────────

/**
 * Set a secure httpOnly cookie with the refresh token
 * httpOnly: JS cannot access it (XSS protection)
 * sameSite: CSRF protection
 */
function setRefreshCookie(res, token) {
  const maxAgeMs = 7 * 24 * 60 * 60 * 1000; // 7 days
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production', // HTTPS only in prod
    sameSite: 'strict',
    maxAge:   maxAgeMs,
    path:     '/auth/refresh-token', // Only sent to this path
  });
}

module.exports = { register, login, refreshToken, logout };
