const { errorResponse } = require('./responses');

/**
 * Wrapper to ensure CORS headers are always returned
 * even if handler throws unexpected errors
 */
function withCors(handler) {
  return async (event) => {
    try {
      return await handler(event);
    } catch (error) {
      console.error('Unhandled error in handler:', error);
      return errorResponse(500, 'Error interno del servidor', error);
    }
  };
}

module.exports = { withCors };
