/**
 * 404 Handler for undefined API routes
 */
export function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist.`
  });
}

/**
 * Centralized error handling middleware
 */
export function errorHandler(err, req, res, next) {
  // Handle Multer upload limits
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: 'FILE_TOO_LARGE',
      message: 'Audio upload exceeds the 25 MB limit.'
    });
  }

  // Handle JSON parse errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'MALFORMED_JSON',
      message: 'The request body contains invalid JSON.'
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const errorCode = err.code || (statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST');

  console.error(`[ERROR] ${req.method} ${req.path} (${statusCode}):`, err.message);

  res.status(statusCode).json({
    success: false,
    error: errorCode,
    message: err.message || 'An unexpected error occurred processing the request.'
  });
}
