import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { BrandLogo } from '../components/shared/BrandLogo';
import { DemoSwitcher } from '../components/shared/DemoSwitcher';
import { useAuthStore } from '../store/authStore';
import { useDataStore } from '../store/dataStore';
import {
  Store,
  Package,
  ShoppingBag,
  BarChart3,
  Settings,
  Menu,
  X,
  Power,
  ChevronRight,
  LogOut,
  Bell,
} from 'lucide-react';

export const MerchantLayout: React.FC = () => {
  const { currentUser, logout } = useAuthStore();
  const { merchants, updateMerchantProfile, purchases } = useDataStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Find merchant belonging to current user (default fallback to La Selva Gourmet)
  const currentMerchant =
    merchants.find((m) => m.ownerUserId === currentUser?.id || m.id === currentUser?.merchantId) ||
    merchants[0];

  // Calculate pending orders count for merchant
  const pendingOrdersCount = purchases.reduce((acc, p) => {
    const mo = p.merchantOrders.find((m) => m.merchantId === currentMerchant.id);
    return mo && ['pendiente', 'confirmado', 'en_preparacion'].includes(mo.status) ? acc + 1 : acc;
  }, 0);

  const toggleStoreStatus = () => {
    updateMerchantProfile(currentMerchant.id, {
      isOpen: !currentMerchant.isOpen,
    });
  };

  const navLinks = [
    { to: '/comercio/tienda', label: 'Mi Tienda', icon: <Store className="w-5 h-5" /> },
    { to: '/comercio/productos', label: 'Catálogo de Productos', icon: <Package className="w-5 h-5" /> },
    {
      to: '/comercio/pedidos',
      label: 'Gestión de Pedidos',
      icon: <ShoppingBag className="w-5 h-5" />,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
    },
    { to: '/comercio/reportes', label: 'Ventas y Reportes', icon: <BarChart3 className="w-5 h-5" /> },
    { to: '/comercio/configuracion', label: 'Configuración', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-subtle">
        <BrandLogo size="sm" showSubtitle={false} />
        <div className="flex items-center gap-2">
          {/* Quick Open/Close Toggle */}
          <button
            type="button"
            onClick={toggleStoreStatus}
            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors ${
              currentMerchant.isOpen
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                currentMerchant.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
              }`}
            />
            <span>{currentMerchant.isOpen ? 'Abierto' : 'Cerrado'}</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="touch-target p-2 text-gray-600 rounded-xl hover:bg-gray-100"
            aria-label="Abrir menú de comercio"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside
        className={`fixed md:sticky top-0 inset-y-0 left-0 z-40 w-64 lg:w-72 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand & Store Header */}
        <div className="p-5 border-b border-gray-100 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <BrandLogo size="md" />
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-2 p-3 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <img
                src={currentMerchant.logoUrl}
                alt={currentMerchant.name}
                className="w-10 h-10 rounded-xl object-cover border border-gray-200 shadow-sm"
              />
              <div className="flex-1 min-w-0">
                <h2 className="text-xs font-extrabold text-ink truncate">{currentMerchant.name}</h2>
                <p className="text-[11px] text-gray-500 capitalize">{currentMerchant.category}</p>
              </div>
            </div>

            {/* Open / Close Button */}
            <button
              type="button"
              onClick={toggleStoreStatus}
              className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                currentMerchant.isOpen
                  ? 'bg-emerald-100/70 text-emerald-800 hover:bg-emerald-200/60'
                  : 'bg-red-100/70 text-red-800 hover:bg-red-200/60'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{currentMerchant.isOpen ? 'Tienda Abierta para pedidos' : 'Tienda Cerrada temporalmente'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 flex-1 space-y-1.5 overflow-y-auto">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `touch-target flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-ink'
                }`
              }
            >
              <div className="flex items-center gap-3">
                {link.icon}
                <span>{link.label}</span>
              </div>
              {link.badge && (
                <span className="bg-amber-400 text-slate-900 text-xs px-2 py-0.5 rounded-full font-extrabold shadow-sm">
                  {link.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 flex flex-col gap-2">
          <Link
            to="/"
            className="flex items-center justify-between text-xs font-semibold text-gray-600 hover:text-primary p-2 rounded-xl hover:bg-gray-50"
          >
            <span>Ver tienda como cliente</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Link>

          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="flex items-center gap-2 text-xs font-semibold text-red-600 hover:bg-red-50 p-2 rounded-xl"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-12">
        <Outlet />
      </main>

      <DemoSwitcher />
    </div>
  );
};
