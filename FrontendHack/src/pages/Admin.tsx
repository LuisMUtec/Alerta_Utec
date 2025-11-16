import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, LogOut, RefreshCw, Bell, Activity, Clock, Wrench, CheckCircle2 } from "lucide-react";
import { listarIncidentes, actualizarEstado, mapIncidenteToFrontend } from "../api/incidentsApi";
import { connectWebSocket, disconnectWebSocket } from "../sockets/websocket";
import IncidentCard from "../components/IncidentCard";
import { Incident } from "../types";

interface Stats {
  total: number;
  pendientes: number;
  enAtencion: number;
  resueltos: number;
}

export default function Admin() {
  const navigate = useNavigate();
  const [incidentes, setIncidentes] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pendientes: 0,
    enAtencion: 0,
    resueltos: 0
  });

  const mostrarNotificacion = (texto: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Alerta UTEC", { body: texto });
    }
  };

  const cargarIncidentes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listarIncidentes();
      const incidentesMapeados = data.map(mapIncidenteToFrontend);
      setIncidentes(incidentesMapeados);
    } catch (error) {
      console.error("Error al cargar incidentes:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const calcularEstadisticas = useCallback(() => {
    setStats({
      total: incidentes.length,
      pendientes: incidentes.filter(i => i.status === "pending").length,
      enAtencion: incidentes.filter(i => i.status === "in_progress").length,
      resueltos: incidentes.filter(i => i.status === "resolved").length
    });
  }, [incidentes]);

  useEffect(() => {
    calcularEstadisticas();
  }, [calcularEstadisticas]);

  useEffect(() => {
    // Verificar autenticación y rol
    const rol = localStorage.getItem("rol");
    if (rol !== "administrador" && rol !== "seguridad") {
      alert("❌ No tienes permisos para acceder a esta página");
      navigate("/");
      return;
    }

    cargarIncidentes();

    // Conectar WebSocket para actualizaciones en tiempo real
    const handleMessage = (mensaje: unknown) => {
      console.log("📨 Mensaje WebSocket recibido:", mensaje);

      const msg = mensaje as Record<string, unknown>;

      if (msg.evento === "nuevo_incidente") {
        cargarIncidentes();
        mostrarNotificacion("🆕 Nuevo incidente reportado");
      }

      if (msg.evento === "estado_actualizado") {
        cargarIncidentes();
        mostrarNotificacion(`📝 Incidente actualizado`);
      }
    };

    connectWebSocket(handleMessage);
    setWsConnected(true);

    return () => {
      disconnectWebSocket();
    };
  }, [navigate, cargarIncidentes]);

  const handleUpdateEstado = async (id: string, nuevoEstado: string) => {
    try {
      await actualizarEstado(id, nuevoEstado);
      setIncidentes(prev =>
        prev.map(inc =>
          inc.id === id
            ? { ...inc, status: nuevoEstado as 'pending' | 'in_progress' | 'resolved' }
            : inc
        )
      );
    } catch (error) {
      alert("❌ Error al actualizar estado");
      console.error(error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const solicitarPermisoNotificaciones = () => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-lg text-gray-600">
          <Activity className="w-6 h-6 animate-spin text-blue-500" />
          Cargando panel de administración...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white border-b border-gray-200 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-5 py-5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-extrabold text-blue-600 flex items-center gap-2">
            <Activity className="w-8 h-8" />
            Panel de Administración
          </h1>
          <nav className="flex gap-3 items-center flex-wrap">
            <Link to="/" className="flex items-center gap-2 no-underline text-blue-600 font-semibold text-sm px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-all">
              <Home className="w-4 h-4" />
              Inicio
            </Link>
            <span className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg font-medium ${
              wsConnected ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></span>
              {wsConnected ? "WebSocket Conectado" : "Desconectado"}
            </span>
            <motion.button
              onClick={handleLogout}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold text-sm shadow-lg hover:from-red-600 hover:to-red-700 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Salir
            </motion.button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-2xl border-l-4 border-blue-500 shadow-lg hover:shadow-xl transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <Activity className="w-8 h-8 text-blue-500" />
              <h3 className="text-4xl font-bold text-gray-800">{stats.total}</h3>
            </div>
            <p className="text-sm font-semibold text-gray-600">Total Incidentes</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-2xl border-l-4 border-yellow-500 shadow-lg hover:shadow-xl transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <Clock className="w-8 h-8 text-yellow-500" />
              <h3 className="text-4xl font-bold text-gray-800">{stats.pendientes}</h3>
            </div>
            <p className="text-sm font-semibold text-gray-600">⏳ Pendientes</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-2xl border-l-4 border-blue-500 shadow-lg hover:shadow-xl transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <Wrench className="w-8 h-8 text-blue-500" />
              <h3 className="text-4xl font-bold text-gray-800">{stats.enAtencion}</h3>
            </div>
            <p className="text-sm font-semibold text-gray-600">🔧 En Atención</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-6 rounded-2xl border-l-4 border-green-500 shadow-lg hover:shadow-xl transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
              <h3 className="text-4xl font-bold text-gray-800">{stats.resueltos}</h3>
            </div>
            <p className="text-sm font-semibold text-gray-600">✅ Resueltos</p>
          </motion.div>
        </div>

        <div className="flex flex-wrap gap-4 mb-8">
          <motion.button
            onClick={cargarIncidentes}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:from-green-600 hover:to-emerald-700 transition-all"
          >
            <RefreshCw className="w-5 h-5" />
            Actualizar Lista
          </motion.button>
          <motion.button
            onClick={solicitarPermisoNotificaciones}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all"
          >
            <Bell className="w-5 h-5" />
            Habilitar Notificaciones
          </motion.button>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-xl">
          <h2 className="text-2xl font-bold text-blue-600 mb-6">📋 Todos los Incidentes</h2>
          {incidentes.length === 0 ? (
            <p className="text-center py-10 text-gray-600">No hay incidentes registrados</p>
          ) : (
            <div className="flex flex-col gap-5">
              {incidentes.map((incidente, index) => (
                <motion.div
                  key={incidente.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <IncidentCard
                    incident={incidente}
                    onStatusChange={handleUpdateEstado}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
