import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { BrandLogo } from '../components/shared/BrandLogo';
import { DemoSwitcher } from '../components/shared/DemoSwitcher';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { useAuthStore } from '../store/authStore';
import { useDataStore } from '../store/dataStore';
import { ClipboardList, Navigation, History, DollarSign, User, MapPin, Power, AlertCircle } from 'lucide-react';

export const CourierLayout: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { couriers, toggleCourierAvailability } = useDataStore();
  const [availabilityMessage, setAvailabilityMessage] = useState('');
  const [availabilityError, setAvailabilityError] = useState('');
  const currentCourier =
    couriers.find((c) => c.ownerUserId === currentUser?.id || c.id === currentUser?.courierId) ||
    couriers[0];

  const handleToggleOnline = () => {
    if (!currentCourier) return;
    setAvailabilityMessage('');
    setAvailabilityError('');
    try {
      toggleCourierAvailability(currentCourier.id);
      const updated = useDataStore.getState().couriers.find((courier) => courier.id === currentCourier.id);
      if (!updated || updated.isAvailable === currentCourier.isAvailable) {
        setAvailabilityError('No se pudo cambiar tu disponibilidad. Inténtalo nuevamente.');
        return;
      }
      setAvailabilityMessage(updated.isAvailable ? 'Disponibilidad activada.' : 'Disponibilidad pausada.');
    } catch {
      setAvailabilityError('No se pudo cambiar tu disponibilidad. Revisa tu estado antes de volver a intentarlo.');
    }
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
              className="gap-2" aria-label={currentCourier.isAvailable ? 'Pausar disponibilidad' : 'Activar disponibilidad'} onClick={handleToggleOnline}>
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
          {availabilityMessage && <p role="status" className="mb-4 rounded-xl border border-selva-border bg-selva-soft p-3 text-sm text-selva-strong">{availabilityMessage}</p>}
          {availabilityError && <div role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-destructive-border bg-destructive-soft p-3 text-sm text-destructive-strong"><AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" /><p>{availabilityError}</p></div>}
          {currentCourier ? <Outlet /> : <EmptyState title="No hay un perfil de repartidor disponible" description="Revisa que exista una cuenta de repartidor registrada para continuar." />}
        </div>
      </main>
      {navigation(true)}
      <DemoSwitcher />
    </div>
  );
};
