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
    { to: '/comercio/tienda', label: 'Inicio', icon: <Store className="w-4 h-4" /> },
    { to: '/comercio/perfil-tienda', label: 'Mi tienda', icon: <Store className="w-4 h-4" /> },
    { to: '/comercio/productos', label: 'Productos', icon: <Package className="w-4 h-4" /> },
    {
      to: '/comercio/pedidos',
      label: 'Pedidos',
      icon: <ShoppingBag className="w-4 h-4" />,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
    },
    { to: '/comercio/pedidos', label: 'Seguimiento', icon: <Power className="w-4 h-4" /> },
    { to: '/comercio/reportes', label: 'Reportes', icon: <BarChart3 className="w-4 h-4" /> },
    { to: '/comercio/configuracion', label: 'Configuración', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50/60 flex flex-col md:flex-row font-sans">
      {/* Mobile Top Header */}
      <div className="md:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-subtle">
        <BrandLogo size="sm" showSubtitle={false} />
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary text-white">
            PROVEEDOR
          </span>
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

      {/* Desktop Sidebar - clean white with soft berry active tint */}
      <aside
        className={`fixed md:sticky top-0 inset-y-0 left-0 z-40 w-60 bg-white border-r border-gray-100 flex flex-col transition-transform duration-200 md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand & Store Header */}
        <div className="p-4 border-b border-gray-100 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <BrandLogo size="sm" />
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Links - active is soft pink background with berry icon & text */}
        <nav className="p-3 flex-1 space-y-1 overflow-y-auto">
          {navLinks.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-primary-50 text-primary font-bold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-ink font-medium'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <span className="text-inherit">{link.icon}</span>
                <span>{link.label}</span>
              </div>
              {link.badge && (
                <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
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
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar for Desktop matching reference image */}
        <header className="hidden md:flex h-16 bg-white border-b border-gray-100 px-8 items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary text-white shadow-sm">
              PROVEEDOR
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification bell with badge 2 */}
            <button
              type="button"
              className="relative p-2 text-gray-500 hover:text-primary transition-colors"
              aria-label="Notificaciones"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                2
              </span>
            </button>

            {/* Merchant User Avatar and Name */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-gray-100">
              <img
                src={currentMerchant.logoUrl}
                alt={currentMerchant.name}
                className="w-8 h-8 rounded-full object-cover border border-gray-200"
              />
              <div className="text-left leading-tight">
                <p className="text-xs font-bold text-ink">{currentMerchant.name}</p>
                <p className="text-[10px] text-gray-400 capitalize">{currentMerchant.category}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-12">
          <Outlet />
        </main>
      </div>

      <DemoSwitcher />
    </div>
  );
};
