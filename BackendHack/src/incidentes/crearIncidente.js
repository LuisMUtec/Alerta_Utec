const AWS = require("aws-sdk");
const { v4 } = require("uuid");
const { put } = require("../../db/put");
const { query } = require("../../db/query");
const { successResponse, errorResponse } = require("../utils/responses");
const { withCors } = require("../utils/withCors");
const { requireAuth } = require("../utils/auth");

const dynamo = new AWS.DynamoDB.DocumentClient();

/**
 * Create a new incident (requires authentication)
 * POST /incidentes
 * Body: { tipo, descripcion, ubicacion, urgencia }
 * Headers: { Authorization: "Bearer <token>" }
 */
exports.handler = withCors(async (event) => {
  try {
    // Require authentication
    const auth = requireAuth(event);
    if (!auth.authenticated) {
      return auth.error;
    }

    const { userId, email } = auth.user;

    const data = JSON.parse(event.body);
    const { tipo, descripcion, ubicacion, urgencia } = data;

    // Validate required fields
    if (!tipo || !descripcion || !ubicacion || !urgencia) {
      return errorResponse(400, "Tipo, descripcion, ubicacion y urgencia son requeridos");
    }

    // Create incident
    const incidenteId = "INC_" + v4().slice(0, 6);

    const item = {
      incidenteId,
      tipo,
      descripcion,
      ubicacion,
      urgencia,
      userId,
      emailReportante: email,
      estado: "pendiente",
      fechaCreacion: new Date().toISOString(),
      historial: [
        {
          accion: "creado",
          fecha: new Date().toISOString(),
          usuario: email
        }
      ]
    };

    await put("Incidentes", item);

    // Notify WebSocket connections and SNS (don't block on errors)
    notifyWebSocketClients(item).catch(err => 
      console.error("Error en notificación WebSocket:", err)
    );
    publishToSNS(item).catch(err => 
      console.error("Error en notificación SNS:", err)
    );

    return successResponse(200, {
      ok: true,
      incidenteId,
      estado: "pendiente"
    });

  } catch (error) {
    console.error("Error en crearIncidente:", error);
    return errorResponse(500, "Error al crear incidente", error);
  }
});

/**
 * Publish incident to SNS topic for email notifications
 */
async function publishToSNS(incidente) {
  try {
    const sns = new AWS.SNS();
    const topicArn = process.env.SNS_TOPIC_ARN;

    if (!topicArn) {
      console.error("SNS_TOPIC_ARN no está configurado");
      return;
    }

    // Formato legible para email de texto plano
    const tipoLabels = {
      emergencia_medica: "Emergencia Médica",
      seguridad: "Seguridad",
      infraestructura: "Infraestructura",
      otro: "Otro"
    };

    const urgenciaLabels = {
      baja: "Baja",
      media: "Media",
      alta: "Alta",
      critica: "Crítica"
    };

    const mensaje = `
🚨 NUEVO INCIDENTE REPORTADO - ALERTA UTEC

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ID: ${incidente.incidenteId}
Tipo: ${tipoLabels[incidente.tipo] || incidente.tipo}
Urgencia: ${urgenciaLabels[incidente.urgencia] || incidente.urgencia}
Estado: ${incidente.estado}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

UBICACIÓN:
${incidente.ubicacion}

DESCRIPCIÓN:
${incidente.descripcion}

FECHA Y HORA:
${new Date(incidente.fechaCreacion).toLocaleString('es-PE', {
  dateStyle: 'full',
  timeStyle: 'long'
})}

${incidente.emailReportante ? `CONTACTO DEL REPORTANTE:\n${incidente.emailReportante}\n\n` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Accede al panel de administración para gestionar este incidente.

--
Sistema de Alertas UTEC
Notificación automática
    `.trim();

    await sns.publish({
      TopicArn: topicArn,
      Message: mensaje,
      Subject: `🚨 [${urgenciaLabels[incidente.urgencia]}] ${tipoLabels[incidente.tipo]} - ${incidente.incidenteId}`
    }).promise();

    console.log("Notificación SNS enviada exitosamente");
  } catch (error) {
    console.error("Error publicando a SNS:", error);
  }
}

/**
 * Send notification to all WebSocket connections
 */
async function notifyWebSocketClients(incidente) {
  try {
    // Get WebSocket endpoint from environment or construct it
    const apiGatewayEndpoint = process.env.WEBSOCKET_ENDPOINT ||
      "3lgmyhtvpa.execute-api.us-east-1.amazonaws.com/dev";

    const apiGateway = new AWS.ApiGatewayManagementApi({
      endpoint: apiGatewayEndpoint
    });

    // Get all connections
    const connections = await dynamo.scan({
      TableName: "WebSocketConnections"
    }).promise();

    if (!connections.Items || connections.Items.length === 0) {
      console.log("No hay conexiones WebSocket activas");
      return;
    }

    const message = JSON.stringify({
      evento: "nuevo_incidente",
      data: incidente
    });

    console.log(`Enviando notificación a ${connections.Items.length} conexiones`);

    // Send to all connections
    const sendPromises = connections.Items.map(async ({ connectionId }) => {
      try {
        await apiGateway.postToConnection({
          ConnectionId: connectionId,
          Data: message
        }).promise();
        console.log(`Notificación enviada a: ${connectionId}`);
      } catch (error) {
        console.error(`Error enviando a ${connectionId}:`, error.message);
        // If connection is stale, delete it
        if (error.statusCode === 410) {
          console.log(`Eliminando conexión obsoleta: ${connectionId}`);
          await dynamo.delete({
            TableName: "WebSocketConnections",
            Key: { connectionId }
          }).promise();
        }
      }
    });

    await Promise.all(sendPromises);
    console.log("Notificaciones WebSocket enviadas exitosamente");
  } catch (error) {
    console.error("Error notificando WebSocket:", error);
  }
}
