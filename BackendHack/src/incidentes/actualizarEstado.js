const AWS = require("aws-sdk");
const { get } = require("../../db/get");
const { update } = require("../../db/update");
const { successResponse, errorResponse } = require("../utils/responses");
const { withCors } = require("../utils/withCors");
const { requireAuth } = require("../utils/auth");

const dynamo = new AWS.DynamoDB.DocumentClient();

/**
 * Update incident status (requires authorization)
 * PATCH /incidentes/{id}/estado
 * Body: { nuevoEstado }
 * Headers: { Authorization: "Bearer <token>" }
 */
exports.handler = withCors(async (event) => {
  try {
    // Require authentication
    const auth = requireAuth(event);
    if (!auth.authenticated) {
      return auth.error;
    }

    const { rol, userId } = auth.user;

    // Obtener el nuevo estado del body
    const { nuevoEstado } = JSON.parse(event.body || '{}');

    // Si el estado es "cancelado", cualquier usuario autenticado puede hacerlo
    if (nuevoEstado === "cancelado") {
      // Permitir a cualquier usuario cancelar (la lógica de quién ve qué ya está en listarIncidentes)
    } else {
      // Solo autoridades y administrativos pueden cambiar otros estados
      if (rol !== "autoridad" && rol !== "administrativo") {
        return errorResponse(403, "No tienes permisos para actualizar estados de incidentes");
      }
    }

    const incidenteId = event.pathParameters.id;

    // Validate
    if (!incidenteId || !nuevoEstado) {
      return errorResponse(400, "ID de incidente y nuevo estado son requeridos");
    }

    // Validate estado values
    const estadosValidos = ["pendiente", "en_atencion", "resuelto", "cancelado"];
    if (!estadosValidos.includes(nuevoEstado)) {
      return errorResponse(400, "Estado inválido. Valores permitidos: " + estadosValidos.join(", "));
    }

    // Get current incident
    const incidente = await get("Incidentes", { incidenteId });

    if (!incidente) {
      return errorResponse(404, "Incidente no encontrado");
    }

    // Add to history
    const nuevoHistorial = incidente.historial || [];
    nuevoHistorial.push({
      accion: `estado cambiado a ${nuevoEstado}`,
      fecha: new Date().toISOString()
    });

    // Update incident
    await update(
      "Incidentes",
      { incidenteId },
      "set estado = :e, historial = :h",
      {
        ":e": nuevoEstado,
        ":h": nuevoHistorial
      }
    );

    // Notify WebSocket connections
    await notifyWebSocketClients(incidenteId, nuevoEstado);

    // Publish to SNS for email notifications
    await publishToSNS(incidente, nuevoEstado);

    return successResponse(200, {
      ok: true,
      incidenteId,
      estado: nuevoEstado
    });

  } catch (error) {
    console.error("Error en actualizarEstado:", error);
    return errorResponse(500, "Error al actualizar estado", error);
  }
});

/**
 * Publish incident status update to SNS topic
 */
async function publishToSNS(incidente, nuevoEstado) {
  try {
    const sns = new AWS.SNS();
    const topicArn = process.env.SNS_TOPIC_ARN;

    if (!topicArn) {
      console.error("SNS_TOPIC_ARN no está configurado");
      return;
    }

    const tipoLabels = {
      emergencia_medica: "Emergencia Médica",
      seguridad: "Seguridad",
      infraestructura: "Infraestructura",
      otro: "Otro"
    };

    const estadoLabels = {
      pendiente: "Pendiente",
      en_atencion: "En Atención",
      resuelto: "Resuelto",
      cancelado: "Cancelado"
    };

    const mensaje = `
📝 ACTUALIZACIÓN DE INCIDENTE - ALERTA UTEC

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ID: ${incidente.incidenteId}
Tipo: ${tipoLabels[incidente.tipo] || incidente.tipo}
Ubicación: ${incidente.ubicacion}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔄 CAMBIO DE ESTADO:
   ${incidente.estado} → ${nuevoEstado}

ESTADO ACTUAL: ${estadoLabels[nuevoEstado] || nuevoEstado}

DESCRIPCIÓN ORIGINAL:
${incidente.descripcion}

FECHA DE ACTUALIZACIÓN:
${new Date().toLocaleString('es-PE', {
  dateStyle: 'full',
  timeStyle: 'long'
})}

${incidente.emailReportante ? `CONTACTO DEL REPORTANTE:\n${incidente.emailReportante}\n\n` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Accede al panel de administración para más detalles.

--
Sistema de Alertas UTEC
Notificación automática
    `.trim();

    await sns.publish({
      TopicArn: topicArn,
      Message: mensaje,
      Subject: `📝 Estado actualizado: ${incidente.incidenteId} → ${estadoLabels[nuevoEstado]}`
    }).promise();

    console.log("Notificación SNS de cambio de estado enviada");
  } catch (error) {
    console.error("Error publicando a SNS:", error);
  }
}

/**
 * Send notification to all WebSocket connections
 */
async function notifyWebSocketClients(incidenteId, nuevoEstado) {
  try {
    const apiGateway = new AWS.ApiGatewayManagementApi({
      endpoint: process.env.WEBSOCKET_ENDPOINT
    });

    // Get all connections
    const connections = await dynamo.scan({
      TableName: "WebSocketConnections"
    }).promise();

    const message = JSON.stringify({
      evento: "estado_actualizado",
      incidenteId,
      nuevoEstado
    });

    // Send to all connections
    const sendPromises = connections.Items.map(async ({ connectionId }) => {
      try {
        await apiGateway.postToConnection({
          ConnectionId: connectionId,
          Data: message
        }).promise();
      } catch (error) {
        // If connection is stale, delete it
        if (error.statusCode === 410) {
          await dynamo.delete({
            TableName: "WebSocketConnections",
            Key: { connectionId }
          }).promise();
        }
      }
    });

    await Promise.all(sendPromises);
  } catch (error) {
    console.error("Error notificando WebSocket:", error);
  }
}
