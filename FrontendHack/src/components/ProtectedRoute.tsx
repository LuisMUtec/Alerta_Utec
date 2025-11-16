import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRoles?: string[];
}

export default function ProtectedRoute({ children, requireRoles }: ProtectedRouteProps) {
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const validateAuth = () => {
      const token = localStorage.getItem("token");
      const rol = localStorage.getItem("rol");
      const userId = localStorage.getItem("userId");

      // Validar que existan todos los datos necesarios
      if (!token || !rol || !userId) {
        // Limpiar localStorage si está incompleto
        localStorage.clear();
        setIsValid(false);
        setIsValidating(false);
        return;
      }

      // Si se requieren roles específicos, verificar
      if (requireRoles && requireRoles.length > 0) {
        if (!requireRoles.includes(rol)) {
          setIsValid(false);
          setIsValidating(false);
          return;
        }
      }

      setIsValid(true);
      setIsValidating(false);
    };

    validateAuth();
  }, [requireRoles]);

  // Mostrar loading mientras valida
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium">Verificando...</p>
        </div>
      </div>
    );
  }

  // Si no es válido, redirigir
  if (!isValid) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
