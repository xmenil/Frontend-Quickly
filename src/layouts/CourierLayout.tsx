import React, { useState } from 'react';
import { Outlet, NavLink, Navigate, useLocation } from 'react-router-dom';
import { BrandLogo } from '../components/shared/BrandLogo';
import { RoleSwitcher } from '../components/shared/RoleSwitcher';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { useAuthStore } from '../store/authStore';
import { courierChanged } from '../features/courier/courierModel';
import { operationsApi } from '../services/api/operationsApi';
import { useRemote, RemoteState } from '../features/operations/shared';
import { ClipboardList, Navigation, History, DollarSign, User, MapPin, Power, AlertCircle } from 'lucide-react';

export const CourierLayout: React.FC = () => {
  const { currentUser, isAuthenticated, roles, sessionStatus, sessionError, initialize } = useAuthStore();
  const resource = useRemote('layout-courier:' + sessionStatus, signal => sessionStatus === 'ready' && isAuthenticated && roles.some(role => role === 'repartidor' || role === 'admin') ? operationsApi.courier(signal) : Promise.resolve(null));
  React.useEffect(() => { window.addEventListener('quickly:courier-changed', resource.reload); return () => window.removeEventListener('quickly:courier-changed', resource.reload); }, [resource.reload]);
  const profile = resource.data;
  const currentCourier = profile ? { id: profile.id, isAvailable: profile.isOnline, currentZone: profile.zoneName } : null;
  const [busy, setBusy] = useState(false); const lock = React.useRef(false);
  const [availabilityMessage, setAvailabilityMessage] = useState('');
  const [availabilityError, setAvailabilityError] = useState('');
  const location = useLocation();

  if (sessionStatus !== "ready") return <RemoteState loading={sessionStatus === "checking"} error={sessionError || undefined} retry={() => void initialize()} />;
  if (!isAuthenticated || !currentUser) {
    return (
      <Navigate
        to="/login"
        state={{
          from: location.pathname,
          message: 'Inicia sesión con tu cuenta de repartidor para acceder al panel',
        }}
        replace
      />
    );
  }

  if (currentUser.status !== 'activo' || !roles.some(role => role === 'repartidor' || role === 'admin')) {
    return <Navigate to="/acceso-denegado" replace />;
  }
  const handleToggleOnline = async () => {
    if (!currentCourier || lock.current || profile?.status !== 'active') return; lock.current = true; setBusy(true); setAvailabilityMessage(''); setAvailabilityError(''); const owner = currentUser.id;
    try { const expected = !currentCourier.isAvailable; await operationsApi.availability(expected); const result = await operationsApi.courier(); if (!result || result.isOnline !== expected) throw new Error('No se pudo verificar la disponibilidad. Actualiza el perfil antes de reintentar.'); if (useAuthStore.getState().currentUser?.id !== owner) return; setAvailabilityMessage(result.isOnline ? 'Disponibilidad activada.' : 'Disponibilidad pausada.'); resource.reload(); courierChanged(); }
    catch(e) { setAvailabilityError(e instanceof Error ? e.message : 'No se pudo actualizar la disponibilidad.'); } finally { lock.current = false; setBusy(false); resource.reload(); courierChanged(); }
  };
  const navItems = [
    { to: '/repartidor/solicitudes', label: 'Solicitudes', icon: ClipboardList },
    { to: '/repartidor/entrega-activa', label: 'Entrega', icon: Navigation },
    { to: '/repartidor/historial', label: 'Historial', icon: History },
    { to: '/repartidor/ingresos', label: 'Ganancias', icon: DollarSign },
    { to: '/repartidor/perfil', label: 'Perfil', icon: User },
  ];

  const navigation = (mobile: boolean) => (
    <nav aria-label={mobile ? 'Navegación móvil del repartidor' : 'Navegación del repartidor'}
      className={mobile ? 'fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface pb-safe shadow-floating md:hidden' : 'hidden border-b border-border bg-surface md:block'}>
      <ul className={mobile ? 'grid grid-cols-5' : 'mx-auto flex max-w-7xl gap-2 px-6 py-2 lg:px-8'}>
        {navItems.map((item) => (
          <li key={item.to} className="min-w-0">
            <NavLink to={item.to} className={({ isActive }) =>
              `flex min-h-16 min-w-11 items-center justify-center gap-2 px-1 py-2 transition-colors ${mobile ? 'flex-col text-xs' : 'min-h-11 rounded-xl px-4 text-sm'} ${isActive ? 'bg-primary-50 font-semibold text-primary' : 'font-medium text-ink-light hover:bg-surface-subtle hover:text-ink'}`}>
              <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );

  return (
    <div className="h-screen h-dvh overflow-hidden flex flex-col bg-background font-sans text-ink">
      <a href="#courier-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-surface focus:p-4 focus:text-primary">Ir al contenido</a>
      <header className="shrink-0 z-20 border-b border-border bg-surface shadow-xs">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <BrandLogo size="sm" showSubtitle={false} className="min-h-11" />
          <p className="hidden text-sm font-medium text-ink-light md:block">Panel de repartidor</p>
          {currentCourier && (
            <Button type="button" variant={currentCourier.isAvailable ? 'outline' : 'primary'} size="sm"
              className="gap-2" aria-label={currentCourier.isAvailable ? 'Pausar disponibilidad' : 'Activar disponibilidad'} disabled={busy || resource.loading || !!resource.error || profile?.status !== "active"} onClick={handleToggleOnline}>
              <Power className="h-4 w-4" aria-hidden="true" />
              {currentCourier.isAvailable ? 'Pausar' : 'Activar'}
            </Button>
          )}
          <div className="flex w-full flex-wrap items-start justify-between gap-2 text-xs">
            <p className="flex min-w-0 items-start gap-2 text-ink-light">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="break-words">{currentCourier?.currentZone || 'Sin zona registrada'}</span>
            </p>
            {currentCourier && <p className={currentCourier.isAvailable ? 'font-medium text-selva' : 'font-medium text-ink-muted'}>{currentCourier.isAvailable ? 'Disponible' : 'En pausa'}</p>}
          </div>
        </div>
        {navigation(false)}
      </header>
      <main id="courier-content" tabIndex={-1} className="flex-1 overflow-y-auto scroll-smooth p-4 pb-32 sm:p-6 sm:pb-32 md:pb-12 lg:p-8 lg:pb-12">
        <div className="mx-auto w-full max-w-7xl">
          <RemoteState loading={resource.loading} error={resource.error} retry={resource.reload} />
          {availabilityMessage && <p role="status" className="mb-4 rounded-xl border border-selva-border bg-selva-soft p-3 text-sm text-selva-strong">{availabilityMessage}</p>}
          {availabilityError && <div role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-destructive-border bg-destructive-soft p-3 text-sm text-destructive-strong"><AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" /><p>{availabilityError}</p></div>}
          {currentCourier ? <Outlet key={currentUser.id} /> : <EmptyState title="No hay un perfil de repartidor disponible" description="Revisa que exista una cuenta de repartidor registrada para continuar." />}
        </div>
      </main>
      {navigation(true)}
      <RoleSwitcher />
    </div>
  );
};
