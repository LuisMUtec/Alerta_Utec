import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  // Estado reactivo para autenticación
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar autenticación al cargar y cuando cambie localStorage
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      setIsAuthenticated(!!token);
      setIsLoading(false);
    };

    checkAuth();

    // Escuchar cambios en localStorage (para logout en otras pestañas)
    window.addEventListener('storage', checkAuth);
    
    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  // Mostrar loading mientras verifica autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Ruta de login - pública */}
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/" replace /> : <Login />
        } />

        {/* Ruta principal - protegida, requiere autenticación */}
        <Route path="/" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />

        {/* Panel de administración - solo para autoridades, seguridad y administrativos */}
        <Route path="/admin" element={
          <ProtectedRoute requireRoles={["autoridad", "seguridad", "administrativo"]}>
            <Admin />
          </ProtectedRoute>
        } />

        {/* Redirigir cualquier ruta no definida */}
        <Route path="*" element={
          isAuthenticated ? <Navigate to="/" replace /> : <Navigate to="/login" replace />
        } />
      </Routes>
    </Router>
  );
}

export default App;
