import { useEffect, useState } from 'react';
import { Filter, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import IncidentCard from './IncidentCard';
import { Incident } from '../types';
import { listarIncidentes, actualizarEstado, mapIncidenteToFrontend, mapStatusToBackend } from '../api/incidentsApi';

export default function IncidentList() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'resolved'>('all');

  useEffect(() => {
    cargarIncidentes();
  }, []);

  const cargarIncidentes = async () => {
    try {
      setLoading(true);
      const data = await listarIncidentes();
      const incidentesMapeados = data.map(mapIncidenteToFrontend);
      setIncidents(incidentesMapeados);
    } catch (error) {
      console.error("Error al cargar incidentes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const estadoBackend = mapStatusToBackend(newStatus);
      await actualizarEstado(id, estadoBackend);

      setIncidents(prev =>
        prev.map(inc =>
          inc.id === id
            ? { ...inc, status: newStatus as 'pending' | 'in_progress' | 'resolved' }
            : inc
        )
      );
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      throw error;
    }
  };

  const filteredIncidents = incidents.filter(inc => {
    if (filter === 'all') return true;
    return inc.status === filter;
  });

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Filter className="w-6 h-6 text-blue-600" />
          Incidentes Activos
        </h2>
        <button
          onClick={cargarIncidentes}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <button
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            filter === 'all'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'bg-white text-slate-700 hover:bg-blue-50 border border-slate-200'
          }`}
          onClick={() => setFilter('all')}
        >
          Todos ({incidents.length})
        </button>
        <button
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            filter === 'pending'
              ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/30'
              : 'bg-white text-slate-700 hover:bg-yellow-50 border border-slate-200'
          }`}
          onClick={() => setFilter('pending')}
        >
          Pendientes ({incidents.filter((i) => i.status === 'pending').length})
        </button>
        <button
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            filter === 'in_progress'
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
              : 'bg-white text-slate-700 hover:bg-blue-50 border border-slate-200'
          }`}
          onClick={() => setFilter('in_progress')}
        >
          En Curso ({incidents.filter((i) => i.status === 'in_progress').length})
        </button>
        <button
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            filter === 'resolved'
              ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
              : 'bg-white text-slate-700 hover:bg-green-50 border border-slate-200'
          }`}
          onClick={() => setFilter('resolved')}
        >
          Resueltos ({incidents.filter((i) => i.status === 'resolved').length})
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-600 font-medium">Cargando incidentes...</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {filteredIncidents.length === 0 ? (
            <p className="text-center py-10 text-slate-500">No hay incidentes para mostrar</p>
          ) : (
            filteredIncidents.map((incident, index) => (
              <motion.div
                key={incident.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <IncidentCard incident={incident} onStatusChange={handleStatusChange} />
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
