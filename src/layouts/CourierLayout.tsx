import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { BrandLogo } from '../components/shared/BrandLogo';
import { DemoSwitcher } from '../components/shared/DemoSwitcher';
import { useAuthStore } from '../store/authStore';
import { useDataStore } from '../store/dataStore';
import { ClipboardList, Navigation, History, DollarSign, User, MapPin } from 'lucide-react';

export const CourierLayout: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { couriers, toggleCourierAvailability } = useDataStore();

  const currentCourier =
    couriers.find((c) => c.ownerUserId === currentUser?.id || c.id === currentUser?.courierId) ||
    couriers[0];

  const handleToggleOnline = () => {
    toggleCourierAvailability(currentCourier.id);
  };

  const navItems = [
    { to: '/repartidor/solicitudes', label: 'Solicitudes', icon: <ClipboardList className="w-5 h-5" /> },
    { to: '/repartidor/entrega-activa', label: 'En Ruta', icon: <Navigation className="w-5 h-5" /> },
    { to: '/repartidor/historial', label: 'Historial', icon: <History className="w-5 h-5" /> },
    { to: '/repartidor/ingresos', label: 'Ganancias', icon: <DollarSign className="w-5 h-5" /> },
    { to: '/repartidor/perfil', label: 'Perfil', icon: <User className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50/70 text-ink flex flex-col max-w-md mx-auto shadow-sm border-x border-gray-100 relative font-sans">
      {/* Top Mobile Bar - G-1 Availability Status & Zone */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-2.5 flex items-center justify-between shadow-subtle">
        <div className="flex items-center gap-2">
          <BrandLogo size="sm" showSubtitle={false} />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-primary bg-primary-50 px-2 py-0.5 rounded-full border border-primary-100 w-fit">
              Repartidor
            </span>
            <span className="text-[10px] text-gray-500 font-semibold flex items-center gap-0.5 mt-0.5">
              <MapPin className="w-2.5 h-2.5 text-primary" />
              <span>{currentCourier.currentZone || 'Centro de Tingo María'}</span>
            </span>
          </div>
        </div>

        {/* G-1 Online / Offline Toggle with Green Pulsing Dot */}
        <button
          type="button"
          onClick={handleToggleOnline}
          className={`touch-target px-3 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition-all min-h-[44px] ${
            currentCourier.isAvailable
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm'
              : 'bg-gray-100 text-gray-700 border border-gray-200'
          }`}
          aria-label={currentCourier.isAvailable ? 'Poner fuera de servicio' : 'Poner en línea'}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              currentCourier.isAvailable ? 'bg-emerald-600 animate-pulse ring-2 ring-emerald-200' : 'bg-gray-400'
            }`}
          />
          <span>{currentCourier.isAvailable ? 'En línea' : 'En pausa'}</span>
        </button>
      </header>

      {/* Main Content (Mobile Optimized) */}
      <main className="flex-1 p-4 pb-24 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Sticky Mobile Navigation - Accessible contrast */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-30 bg-white border-t border-gray-200 shadow-lg">
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `touch-target flex flex-col items-center justify-center gap-0.5 text-[11px] transition-colors select-none ${
                  isActive
                    ? 'text-primary font-extrabold bg-primary-50/60'
                    : 'text-gray-600 hover:text-ink font-semibold'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <DemoSwitcher />
    </div>
  );
};
