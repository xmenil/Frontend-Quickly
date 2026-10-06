import React from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { BrandLogo } from '../components/shared/BrandLogo';
import { DemoSwitcher } from '../components/shared/DemoSwitcher';
import { useAuthStore } from '../store/authStore';
import { useDataStore } from '../store/dataStore';
import { Bike, ClipboardList, Navigation, History, DollarSign, User, Power } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col max-w-md mx-auto shadow-2xl relative">
      {/* Top Mobile Bar */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrandLogo size="sm" showSubtitle={false} />
          <span className="text-[11px] font-bold bg-primary text-white px-2 py-0.5 rounded-full uppercase">
            Repartidor
          </span>
        </div>

        {/* Online / Offline Toggle */}
        <button
          type="button"
          onClick={handleToggleOnline}
          className={`touch-target px-3 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-2 transition-all ${
            currentCourier.isAvailable
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-sm'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}
          aria-label={currentCourier.isAvailable ? 'Poner en descanso' : 'Poner en línea'}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              currentCourier.isAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
            }`}
          />
          <span>{currentCourier.isAvailable ? 'Disponible' : 'En Pausa'}</span>
        </button>
      </header>

      {/* Main Content (Mobile Optimized) */}
      <main className="flex-1 p-4 pb-24 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Sticky Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-30 bg-slate-950 border-t border-slate-800">
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `touch-target flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors ${
                  isActive ? 'text-primary' : 'text-slate-400 hover:text-slate-200'
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
