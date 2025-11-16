const jwt = require("jsonwebtoken");
const { errorResponse } = require("./responses");

const JWT_SECRET = process.env.JWT_SECRET || "utec-secret-key-2025";

/**
 * Verify JWT token from Authorization header
 * @param {string} authHeader - Authorization header (Bearer token)
 * @returns {Object} Decoded token payload with userId, email, rol
 * @throws {Error} If token is invalid or missing
 */
function verifyToken(authHeader) {
  if (!authHeader) {
    throw new Error("Token no proporcionado");
  }

  const token = authHeader.startsWith("Bearer ") 
    ? authHeader.substring(7) 
    : authHeader;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new Error("Token inválido o expirado");
  }
}

/**
 * Middleware to require authentication
 * Returns user data if authenticated, or error response if not
 * @param {Object} event - Lambda event object
 * @returns {Object} { authenticated: boolean, user?: Object, error?: Object }
 */
function requireAuth(event) {
  try {
    const authHeader = event.headers?.Authorization || event.headers?.authorization;
    const user = verifyToken(authHeader);
    return { authenticated: true, user };
  } catch (error) {
    return { 
      authenticated: false, 
      error: errorResponse(401, error.message || "No autorizado")
    };
  }
}

module.exports = {
  verifyToken,
  requireAuth
};
