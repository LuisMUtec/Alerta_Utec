const API_URL = import.meta.env.VITE_API_BASE_URL || "https://tu-api-url.com/dev";

interface IncidenteBackend {
  incidenteId: string;
  tipo: string;
  descripcion: string;
  ubicacion: string;
  urgencia: string;
  estado: string;
  fechaCreacion: string;
  emailReportante?: string;
}

/**
 * Crear un nuevo incidente
 */
export async function crearIncidente(data: {
  tipo: string;
  descripcion: string;
  ubicacion: string;
  urgencia: string;
  emailReportante?: string;
}) {
  try {
    const res = await fetch(`${API_URL}/incidentes`, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json"
      }
    });
    return await res.json();
  } catch (error) {
    console.error("Error al crear incidente:", error);
    throw error;
  }
}

/**
 * Listar todos los incidentes
 */
export async function listarIncidentes(): Promise<IncidenteBackend[]> {
  try {
    const res = await fetch(`${API_URL}/incidentes`);
    const data = await res.json();
    return data.items || [];
  } catch (error) {
    console.error("Error al listar incidentes:", error);
    throw error;
  }
}

/**
 * Actualizar el estado de un incidente
 */
export async function actualizarEstado(id: string, nuevoEstado: string) {
  try {
    const res = await fetch(`${API_URL}/incidentes/${id}/estado`, {
      method: "PATCH",
      body: JSON.stringify({ nuevoEstado }),
      headers: {
        "Content-Type": "application/json"
      }
    });
    return await res.json();
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    throw error;
  }
}

/**
 * Mapear incidente del backend al formato del frontend
 */
export function mapIncidenteToFrontend(inc: IncidenteBackend): {
  id: string;
  type: 'medical' | 'security' | 'infrastructure' | 'other';
  title: string;
  description: string;
  location: string;
  status: 'pending' | 'in_progress' | 'resolved';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  email: string;
} {
  // Mapear tipo
  const tipoMap: Record<string, string> = {
    'emergencia_medica': 'medical',
    'seguridad': 'security',
    'infraestructura': 'infrastructure',
    'otro': 'other'
  };

  // Mapear estado
  const estadoMap: Record<string, string> = {
    'pendiente': 'pending',
    'en_atencion': 'in_progress',
    'resuelto': 'resolved',
    'cancelado': 'resolved'
  };

  // Mapear urgencia
  const urgenciaMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
    'baja': 'low',
    'media': 'medium',
    'alta': 'high',
    'critica': 'critical'
  };

  return {
    id: inc.incidenteId,
    type: (tipoMap[inc.tipo] || 'other') as 'medical' | 'security' | 'infrastructure' | 'other',
    title: inc.tipo.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    description: inc.descripcion,
    location: inc.ubicacion,
    status: (estadoMap[inc.estado] || 'pending') as 'pending' | 'in_progress' | 'resolved',
    urgency: urgenciaMap[inc.urgencia] || 'medium',
    timestamp: new Date(inc.fechaCreacion).toLocaleString('es-ES'),
    email: inc.emailReportante || ''
  };
}

/**
 * Mapear datos del formulario al formato del backend
 */
export function mapFormToBackend(data: {
  type: string;
  description: string;
  location: string;
  urgency: string;
  email: string;
}) {
  // Mapear tipo inverso
  const tipoMap: Record<string, string> = {
    'medical': 'emergencia_medica',
    'security': 'seguridad',
    'infrastructure': 'infraestructura',
    'other': 'otro'
  };

  return {
    tipo: tipoMap[data.type] || 'otro',
    descripcion: data.description,
    ubicacion: data.location,
    urgencia: data.urgency,
    emailReportante: data.email
  };
}

/**
 * Mapear estado del frontend al backend
 */
export function mapStatusToBackend(status: string): string {
  const estadoMap: Record<string, string> = {
    'pending': 'pendiente',
    'in_progress': 'en_atencion',
    'resolved': 'resuelto'
  };
  return estadoMap[status] || 'pendiente';
}

/**
 * Registrar un nuevo usuario
 */
export async function registrarUsuario(data: {
  email: string;
  password: string;
  rol: string;
}) {
  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json"
      }
    });
    return await res.json();
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    throw error;
  }
}

/**
 * Iniciar sesión
 */
export async function login(data: {
  email: string;
  password: string;
}) {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json"
      }
    });
    return await res.json();
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    throw error;
  }
}
