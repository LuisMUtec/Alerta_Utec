import { AlertTriangle, Menu } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl p-2.5 shadow-lg">
              <AlertTriangle className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Alerta UTEC</span>
              <span className="text-xs text-slate-500 font-medium">Campus Seguro</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="hidden sm:flex bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg text-sm">
              Iniciar Sesión
            </button>
            <button className="sm:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
