import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../domain/types';
import { Button } from '../../components/ui/Button';

export function SessionBoundary({ children }: { children: React.ReactNode }) {
  const { initialize, sessionStatus, sessionError } = useAuthStore();
  useEffect(() => { void initialize(); }, [initialize]);
  if (sessionStatus === 'checking') return <main className="min-h-screen grid place-items-center" role="status">Verificando tu sesión…</main>;
  if (sessionStatus === 'error') return <main className="min-h-screen grid place-items-center px-4"><div className="max-w-md space-y-4 text-center">
    <h1 className="text-xl font-bold">No pudimos conectar con Quickly</h1>
    <p role="alert">{sessionError}</p><Button onClick={() => void initialize()}>Reintentar conexión</Button>
  </div></main>;
  return <>{children}</>;
}

export function RequireSession({ children, role }: { children: React.ReactNode; role?: UserRole }) {
  const { isAuthenticated, roles } = useAuthStore();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  if (role && !roles.includes(role)) return <Navigate to="/acceso-denegado" replace />;
  return <>{children}</>;
}
