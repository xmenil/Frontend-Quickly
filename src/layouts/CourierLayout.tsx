import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { BrandLogo } from '../components/shared/BrandLogo';
import { DemoSwitcher } from '../components/shared/DemoSwitcher';
import { useAuthStore } from '../store/authStore';
import { useDataStore } from '../store/dataStore';
import { ClipboardList, Navigation, History, DollarSign, User } from 'lucide-react';

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
      {/* Top Mobile Bar - unified clean style */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-subtle">
        <div className="flex items-center gap-2">
          <BrandLogo size="sm" showSubtitle={false} />
          <span className="text-[10px] font-bold bg-primary text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
            REPARTIDOR
          </span>
        </div>

        {/* Online / Offline Toggle */}
        <button
          type="button"
          onClick={handleToggleOnline}
          className={`touch-target px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
            currentCourier.isAvailable
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm'
              : 'bg-gray-100 text-gray-500 border border-gray-200'
          }`}
          aria-label={currentCourier.isAvailable ? 'Poner en descanso' : 'Poner en línea'}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              currentCourier.isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
            }`}
          />
          <span>{currentCourier.isAvailable ? 'Disponible' : 'En Pausa'}</span>
        </button>
      </header>

      {/* Main Content (Mobile Optimized) */}
      <main className="flex-1 p-4 pb-24 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Sticky Mobile Navigation - clean white with primary berry active */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-30 bg-white border-t border-gray-100 shadow-lg">
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `touch-target flex flex-col items-center justify-center gap-1 text-[11px] transition-colors ${
                  isActive
                    ? 'text-primary font-bold bg-primary-50/50'
                    : 'text-gray-400 hover:text-gray-600 font-medium'
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
