import { Link } from "react-router-dom";
import { LogOut, Shield, User, AlertTriangle, Menu } from "lucide-react";
import IncidentForm from "../components/IncidentForm";
import IncidentList from "../components/IncidentList";

export default function Home() {
  const userId = localStorage.getItem("userId");
  const rol = localStorage.getItem("rol");
  const area = localStorage.getItem("area");

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Moderno */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 rounded-xl p-2">
                <AlertTriangle className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold text-blue-600">Alerta UTEC</span>
                <span className="text-xs text-slate-500 font-medium">Campus Seguro</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {userId ? (
                <>
                  <span className="hidden sm:flex items-center gap-2 text-sm text-slate-600 px-3 py-1.5 rounded-lg bg-slate-100">
                    <User className="w-3.5 h-3.5" />
                    {rol}
                    {area && rol === "autoridad" && (
                      <span className="ml-1 text-blue-600 font-semibold">
                        ({area})
                      </span>
                    )}
                  </span>
                  {(rol === "administrativo" || rol === "seguridad" || rol === "autoridad") && (
                    <Link
                      to="/admin"
                      className="hidden sm:flex items-center gap-2 no-underline bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-xl transition-colors text-sm"
                    >
                      <Shield className="w-4 h-4" />
                      Panel Admin
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Salir</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="hidden sm:flex bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-xl transition-colors text-sm no-underline"
                  >
                    Iniciar Sesión
                  </Link>
                  <button className="sm:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors">
                    <Menu className="w-5 h-5 text-slate-600" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section Moderno */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-10 text-center">
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-2 leading-tight">
            Sistema de Alertas en{' '}
            <span className="text-blue-600">Tiempo Real</span>
          </h1>
          <p className="text-slate-600 text-base max-w-2xl mx-auto">
            Reporta incidentes y mantente informado sobre la seguridad en el campus universitario
          </p>
          {rol === "estudiante" && (
            <div className="mt-4 max-w-2xl mx-auto">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                <strong>📋 Nota:</strong> Como estudiante, solo puedes ver los incidentes que tú has reportado.
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Todos los usuarios pueden crear incidentes */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <IncidentForm />
            </div>
          </div>

          <div className="lg:col-span-2">
            <IncidentList />
          </div>
        </div>
      </main>
    </div>
  );
}
