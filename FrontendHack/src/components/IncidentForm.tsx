import { useState } from 'react';
import { AlertCircle, MapPin, FileText, Zap, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { crearIncidente, mapFormToBackend } from '../api/incidentsApi';

export default function IncidentForm() {
  const [formData, setFormData] = useState({
    type: '',
    description: '',
    location: '',
    urgency: 'media',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.type || !formData.description || !formData.location) {
      setMessage({ type: 'error', text: 'Por favor completa todos los campos' });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      const dataParaBackend = mapFormToBackend(formData);
      const response = await crearIncidente(dataParaBackend);

      if (response.incidenteId) {
        setMessage({ type: 'success', text: '✅ Incidente reportado exitosamente' });
        setFormData({
          type: '',
          description: '',
          location: '',
          urgency: 'media',
          email: ''
        });

        // Recargar la página después de 1 segundo para mostrar el nuevo incidente
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      console.error("Error al crear incidente:", error);
      setMessage({ type: 'error', text: '❌ Error al reportar incidente' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-xl p-6"
    >
      <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <AlertCircle className="w-6 h-6 text-blue-600" />
        Reportar Incidente
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Tipo de Incidente
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            disabled={loading}
          >
            <option value="">Selecciona un tipo</option>
            <option value="medical">🏥 Emergencia Médica</option>
            <option value="fire">🔥 Incendio</option>
            <option value="security">🔒 Seguridad</option>
            <option value="infrastructure">🏗️ Infraestructura</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            <FileText className="w-4 h-4 inline mr-1" />
            Descripción
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe el incidente en detalle..."
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
            rows={4}
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            <MapPin className="w-4 h-4 inline mr-1" />
            Ubicación
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Ej: Pabellón A, Piso 3"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            <Zap className="w-4 h-4 inline mr-1" />
            Urgencia
          </label>
          <div className="grid grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, urgency: 'baja' })}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                formData.urgency === 'baja'
                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                  : 'bg-slate-100 text-slate-700 hover:bg-green-50'
              }`}
              disabled={loading}
            >
              Baja
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, urgency: 'media' })}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                formData.urgency === 'media'
                  ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/30'
                  : 'bg-slate-100 text-slate-700 hover:bg-yellow-50'
              }`}
              disabled={loading}
            >
              Media
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, urgency: 'alta' })}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                formData.urgency === 'alta'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                  : 'bg-slate-100 text-slate-700 hover:bg-orange-50'
              }`}
              disabled={loading}
            >
              Alta
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, urgency: 'critica' })}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                formData.urgency === 'critica'
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                  : 'bg-slate-100 text-slate-700 hover:bg-red-50'
              }`}
              disabled={loading}
            >
              Crítica
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`px-4 py-3 rounded-xl text-sm font-medium ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold text-base shadow-lg shadow-blue-600/30 hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5" />
              Reportar Incidente
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
}
