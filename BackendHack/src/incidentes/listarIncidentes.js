const { scan, query } = require("../../db/query");
const { successResponse, errorResponse } = require("../utils/responses");
const { withCors } = require("../utils/withCors");
const { requireAuth } = require("../utils/auth");

/**
 * List incidents based on user role and permissions
 * GET /incidentes
 * Headers: { Authorization: "Bearer <token>" }
 */
exports.handler = withCors(async (event) => {
  try {
    // Require authentication
    const auth = requireAuth(event);
    if (!auth.authenticated) {
      return auth.error;
    }

    const { userId, rol, area } = auth.user;
    let incidentes = [];

    console.log(`Usuario autenticado: userId=${userId}, rol=${rol}, area=${area}`);

    // Filtrar según rol
    if (rol === "estudiante") {
      // Estudiantes solo ven sus propios incidentes
      console.log(`Filtrando incidentes para estudiante: userId=${userId}`);
      
      try {
        incidentes = await query("Incidentes", {
          IndexName: "UserIdIndex",
          KeyConditionExpression: "userId = :userId",
          ExpressionAttributeValues: {
            ":userId": userId
          }
        });
        
        console.log(`Incidentes encontrados para estudiante: ${incidentes.length}`);
      } catch (error) {
        console.error("Error al consultar índice UserIdIndex:", error);
        // Si falla el índice, intentar con scan y filtrar manualmente
        const allIncidentes = await scan("Incidentes");
        incidentes = allIncidentes.filter(inc => inc.userId === userId);
        console.log(`Usando filtrado manual: ${incidentes.length} incidentes encontrados`);
      }
    } else if (rol === "autoridad" && area) {
      // Autoridades ven incidentes de su área
      const allIncidentes = await scan("Incidentes");
      
      console.log(`Filtrando incidentes para autoridad de área: ${area}`);
      console.log(`Total de incidentes antes de filtrar: ${allIncidentes.length}`);
      
      // Filtrar por el campo 'area' del incidente
      incidentes = allIncidentes.filter(inc => {
        const incidenteArea = inc.area || 'general';
        const match = incidenteArea.toLowerCase() === area.toLowerCase();
        console.log(`Incidente ${inc.incidenteId}: area="${incidenteArea}", match=${match}`);
        return match;
      });
      
      console.log(`Incidentes filtrados para área ${area}: ${incidentes.length}`);
    } else if (rol === "administrativo") {
      // Administrativos ven todo
      incidentes = await scan("Incidentes");
    } else {
      // Otros roles sin permisos
      return errorResponse(403, "No tienes permisos para ver incidentes");
    }

    // Sort by creation date (newest first)
    const sortedIncidentes = incidentes.sort((a, b) => {
      return new Date(b.fechaCreacion) - new Date(a.fechaCreacion);
    });

    // Format response
    const items = sortedIncidentes.map(inc => ({
      incidenteId: inc.incidenteId,
      tipo: inc.tipo,
      area: inc.area || 'general',
      estado: inc.estado,
      ubicacion: inc.ubicacion,
      urgencia: inc.urgencia,
      descripcion: inc.descripcion,
      fechaCreacion: inc.fechaCreacion,
      emailReportante: inc.emailReportante,
      userId: inc.userId
    }));

    return successResponse(200, {
      ok: true,
      items,
      filtrado: rol === "estudiante" ? "mis_incidentes" : rol === "autoridad" ? "area" : "todos"
    });

  } catch (error) {
    console.error("Error en listarIncidentes:", error);
    return errorResponse(500, "Error al listar incidentes", error);
  }
});
