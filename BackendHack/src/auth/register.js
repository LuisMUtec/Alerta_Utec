const AWS = require("aws-sdk");
const { v4 } = require("uuid");
const bcrypt = require("bcryptjs");
const { put } = require("../../db/put");
const { query } = require("../../db/query");
const { successResponse, errorResponse } = require("../utils/responses");

/**
 * Register a new user
 * POST /auth/register
 * Body: { email, password, rol }
 */
exports.handler = async (event) => {
  try {
    const data = JSON.parse(event.body);
    const { email, password, rol, area } = data;

    // Validate required fields
    if (!email || !password || !rol) {
      return errorResponse(400, "Email, password y rol son requeridos");
    }

    // Validar que autoridades tengan un área asignada
    if (rol === "autoridad" && !area) {
      return errorResponse(400, "El campo 'area' es requerido para usuarios con rol autoridad");
    }

    // Check if user already exists
    const existingUsers = await query("Usuarios", {
      IndexName: "EmailIndex",
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: {
        ":email": email
      }
    });

    if (existingUsers && existingUsers.length > 0) {
      return errorResponse(400, "El email ya está registrado");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userId = "USR_" + v4().slice(0, 5);
    const newUser = {
      userId,
      email,
      password: hashedPassword,
      rol,
      fechaCreacion: new Date().toISOString()
    };

    // Agregar área solo si es autoridad
    if (rol === "autoridad" && area) {
      newUser.area = area;
    }

    await put("Usuarios", newUser);

    // Suscribir automáticamente el email del usuario al topic SNS
    await subscribeToSNSTopic(email, rol);

    return successResponse(200, {
      ok: true,
      userId,
      message: "Usuario registrado correctamente. Revisa tu email para confirmar la suscripción a notificaciones."
    });

  } catch (error) {
    console.error("Error en register:", error);
    return errorResponse(500, "Error al registrar usuario", error);
  }
};

/**
 * Subscribe user email to SNS topic for incident notifications
 */
async function subscribeToSNSTopic(email, rol) {
  try {
    const sns = new AWS.SNS();
    const topicArn = process.env.SNS_TOPIC_ARN;

    if (!topicArn) {
      console.error("SNS_TOPIC_ARN no está configurado");
      return;
    }

    // Solo suscribir a usuarios de seguridad y administrativos
    // Estudiantes pueden reportar pero no necesitan recibir todas las notificaciones
    // Autoridades reciben notificaciones según su área
    if (rol === "seguridad" || rol === "administrativo" || rol === "autoridad") {
      await sns.subscribe({
        Protocol: "email",
        TopicArn: topicArn,
        Endpoint: email
      }).promise();

      console.log(`Suscripción SNS creada para ${email} (${rol})`);
    } else {
      console.log(`Usuario ${email} con rol ${rol} no fue suscrito a notificaciones`);
    }
  } catch (error) {
    // No fallar el registro si la suscripción falla
    console.error("Error al suscribir a SNS:", error);
  }
}
