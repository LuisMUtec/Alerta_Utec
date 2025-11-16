import { useState } from 'react';
import { MapPin, Clock, AlertCircle, HeartPulse, Shield, Wrench, ChevronRight, Loader2, User, Sparkles, Laptop, Settings } from 'lucide-react';
import { Incident } from '../types';
import ConfirmCancelModal from './ConfirmCancelModal';

interface IncidentCardProps {
  incident: Incident;
  onStatusChange: (id: string, status: Incident['status']) => Promise<void>;
}

export default function IncidentCard({ incident, onStatusChange }: IncidentCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Obtener rol del usuario desde localStorage
  const userRole = localStorage.getItem('rol');
  
  // Todos los usuarios pueden cancelar los incidentes que ven
  const canCancel = incident.status !== 'cancelled' && incident.status !== 'resolved';
  
  // Solo autoridades y administrativos pueden cambiar estados (pendiente -> en atención -> resuelto)
  const canChangeStatus = userRole === 'administrativo' || userRole === 'autoridad';

  const getTypeIcon = () => {
    switch (incident.type) {
      case 'security':
        return <Shield className="w-6 h-6" />;
      case 'medical':
        return <HeartPulse className="w-6 h-6" />;
      case 'infrastructure':
        return <Wrench className="w-6 h-6" />;
      case 'cleaning':
        return <Sparkles className="w-6 h-6" />;
      case 'technology':
        return <Laptop className="w-6 h-6" />;
      case 'maintenance':
        return <Settings className="w-6 h-6" />;
      default:
        return <AlertCircle className="w-6 h-6" />;
    }
  };

  const getTypeGradient = () => {
    switch (incident.type) {
      case 'security':
        return 'from-orange-500 to-red-500';
      case 'medical':
        return 'from-red-500 to-pink-500';
      case 'infrastructure':
        return 'from-blue-500 to-cyan-500';
      case 'cleaning':
        return 'from-emerald-500 to-teal-500';
      case 'technology':
        return 'from-purple-500 to-indigo-500';
      case 'maintenance':
        return 'from-amber-500 to-yellow-500';
      default:
        return 'from-slate-500 to-slate-600';
    }
  };

  const getUrgencyGradient = () => {
    const gradients = {
      low: 'from-green-600 to-emerald-600',
      medium: 'from-amber-500 to-orange-500',
      high: 'from-orange-500 to-red-500',
      critical: 'from-red-600 to-rose-600'
    };
    const labels = {
      low: 'BAJA',
      medium: 'MEDIA',
      high: 'ALTA',
      critical: 'CRÍTICA'
    };
    return {
      gradient: gradients[incident.urgency],
      label: labels[incident.urgency]
    };
  };

  const getStatusConfig = () => {
    const configs = {
      pending: {
        label: 'Pendiente',
        gradient: 'from-amber-500 to-orange-500',
        icon: '⏱',
        nextStatus: 'in_progress' as const
      },
      in_progress: {
        label: 'En Atención',
        gradient: 'from-blue-600 to-cyan-600',
        icon: '🔄',
        nextStatus: 'resolved' as const
      },
      resolved: {
        label: 'Resuelto',
        gradient: 'from-green-600 to-emerald-600',
        icon: '✓',
        nextStatus: 'pending' as const
      },
      cancelled: {
        label: 'Cancelado',
        gradient: 'from-gray-500 to-slate-600',
        icon: '✕',
        nextStatus: 'pending' as const
      }
    };
    return configs[incident.status];
  };

  const urgency = getUrgencyGradient();
  const status = getStatusConfig();

  const handleStatusChange = async () => {
    setIsUpdating(true);
    try {
      await onStatusChange(incident.id, status.nextStatus);
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = async () => {
    setIsUpdating(true);
    try {
      await onStatusChange(incident.id, 'cancelled');
    } catch (error) {
      console.error('Error al cancelar incidente:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="group bg-white border border-slate-200 rounded-2xl p-6 card-shadow hover:border-slate-300 transition-all duration-300">
      <div className="flex gap-4">
        <div className={`bg-gradient-to-br ${getTypeGradient()} incident-icon text-white shadow-lg flex-shrink-0`}>
          {getTypeIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                {incident.title}
              </h3>
              <p className="text-xs text-slate-500 font-mono tracking-wider">
                {incident.id}
              </p>
            </div>
            <span className={`gradient-badge bg-gradient-to-r ${urgency.gradient} flex-shrink-0`}>
              {urgency.label}
            </span>
          </div>

          <p className="text-slate-700 mb-4 leading-relaxed text-sm font-medium">
            {incident.description}
          </p>

          <div className="flex flex-wrap items-center gap-5 text-sm text-slate-600 mb-5 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span className="font-medium text-slate-700">{incident.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="text-slate-600">{incident.timestamp}</span>
            </div>
            {incident.reportedBy && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="text-slate-600">
                  <span className="font-medium text-emerald-700">Reportado por:</span> {incident.reportedBy}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className={`gradient-badge bg-gradient-to-r ${status.gradient}`}>
              {status.icon} {status.label}
            </span>
            <div className="flex items-center gap-2">
              {canChangeStatus && incident.status !== 'cancelled' && (
                <button
                  onClick={handleStatusChange}
                  disabled={isUpdating}
                  className={`flex items-center gap-2 bg-gradient-to-r ${status.gradient} hover:shadow-lg text-white font-semibold py-2.5 px-4 rounded-xl transition-all duration-300 shadow-md text-sm group/btn disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    <>
                      Cambiar
                      <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              )}
              {canCancel && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  disabled={isUpdating}
                  className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:shadow-lg text-white font-semibold py-2.5 px-4 rounded-xl transition-all duration-300 shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cancelando...
                    </>
                  ) : (
                    <>
                      ✕ Cancelar Incidente
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmCancelModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancel}
        incidentTitle={incident.title}
      />
    </div>
  );
}
