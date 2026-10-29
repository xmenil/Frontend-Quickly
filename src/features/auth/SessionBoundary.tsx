import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../domain/types';

export function SessionBoundary({ children }: { children: React.ReactNode }) {
  const { initialize } = useAuthStore();

  useEffect(() => {
    void initialize();
  }, [initialize]);

  // Permitir siempre la navegación y renderizado del catálogo y vistas públicas sin bloquear
  return <>{children}</>;
}

export function RequireSession({ children, role }: { children: React.ReactNode; role?: UserRole }) {
  const { isAuthenticated, roles } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }

  if (role && !roles.includes(role)) {
    return <Navigate to="/acceso-denegado" replace />;
  }

  return <>{children}</>;
}
