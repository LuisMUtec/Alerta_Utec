const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { query } = require("../../db/query");
const { successResponse, errorResponse } = require("../utils/responses");

const JWT_SECRET = process.env.JWT_SECRET || "utec-secret-key-2025";

/**
 * Login user
 * POST /auth/login
 * Body: { email, password }
 */
exports.handler = async (event) => {
  try {
    const data = JSON.parse(event.body);
    const { email, password } = data;

    // Validate required fields
    if (!email || !password) {
      return errorResponse(400, "Email y password son requeridos");
    }

    // Find user by email
    const users = await query("Usuarios", {
      IndexName: "EmailIndex",
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: {
        ":email": email
      }
    });

    if (!users || users.length === 0) {
      return errorResponse(401, "Credenciales inválidas");
    }

    const user = users[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return errorResponse(401, "Credenciales inválidas");
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.userId,
        email: user.email,
        rol: user.rol,
        area: user.area || null
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    return successResponse(200, {
      ok: true,
      token,
      user: {
        userId: user.userId,
        rol: user.rol,
        area: user.area || null
      }
    });

  } catch (error) {
    console.error("Error en login:", error);
    return errorResponse(500, "Error al iniciar sesión", error);
  }
};
