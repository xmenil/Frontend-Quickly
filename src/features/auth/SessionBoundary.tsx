import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { RemoteState } from '../operations/shared';
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
  const { isAuthenticated, roles, sessionStatus, sessionError, initialize, currentUser } = useAuthStore();
  const location = useLocation();

  if (sessionStatus !== "ready") return <RemoteState loading={sessionStatus === "checking"} error={sessionError || undefined} retry={() => void initialize()} />;
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }

  if (currentUser?.status !== "activo" || role && !roles.includes(role)) {
    return <Navigate to="/acceso-denegado" replace />;
  }

  return <>{children}</>;
}
