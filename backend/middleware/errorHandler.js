// middleware/errorHandler.js
// Central error handler — must be registered LAST in Express

/**
 * Global error handler middleware.
 * Catches errors from async route handlers via next(err).
 * Returns consistent JSON error shape.
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  // Log internally (use a proper logger like Winston in production)
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    console.error(`[ERROR] ${err.message}`, err.stack);
  } else {
    console.error(`[ERROR] ${err.message}`);
  }

  // Determine status code
  const status = err.status || err.statusCode || 500;

  // Don't leak stack traces in production
  res.status(status).json({
    success: false,
    message: status === 500 && !isDev ? 'Internal server error' : err.message,
    ...(isDev && status === 500 && { stack: err.stack }),
  });
}

/**
 * 404 handler — register before errorHandler
 */
function notFound(req, res, next) {
  const err = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  err.status = 404;
  next(err);
}

module.exports = { errorHandler, notFound };
