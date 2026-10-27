import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { BrandLogo } from '../components/shared/BrandLogo';
import { DemoSwitcher } from '../components/shared/DemoSwitcher';
import { useAuthStore } from '../store/authStore';
import { useDataStore } from '../store/dataStore';
import {
  LayoutDashboard,
  Store,
  Package,
  ShoppingBag,
  BarChart3,
  Settings,
  Menu,
  X,
  ChevronRight,
  LogOut,
  Bell,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';

export const MerchantLayout: React.FC = () => {
  const { currentUser, isAuthenticated, logout, switchMerchant } = useAuthStore();
  const { merchants, purchases } = useDataStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [storeMenuOpen, setStoreMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (!isAuthenticated || !currentUser) {
    return (
      <Navigate
        to="/login"
        state={{
          from: location.pathname,
          message: 'Inicia sesión con tu cuenta de comercio para acceder al panel',
        }}
        replace
      />
    );
  }

  if (currentUser.role !== 'comercio' && currentUser.role !== 'admin') {
    return <Navigate to="/acceso-denegado" replace />;
  }

  // Find merchant belonging to current user (prioritize explicit active merchantId)
  const currentMerchant =
    (currentUser?.merchantId ? merchants.find((m) => m.id === currentUser.merchantId) : null) ||
    merchants.find((m) => m.ownerUserId === currentUser?.id) ||
    merchants[0];

  // Calculate pending orders count for merchant
  const pendingOrdersCount = purchases.reduce((acc, p) => {
    const mo = p.merchantOrders.find((m) => m.merchantId === currentMerchant.id);
    return mo && ['pendiente', 'confirmado', 'en_preparacion'].includes(mo.status) ? acc + 1 : acc;
  }, 0);

  const navLinks = [
    { to: '/comercio/tienda', label: 'Panel principal', icon: <LayoutDashboard className="w-4 h-4" /> },
    { to: '/comercio/perfil-tienda', label: 'Mi tienda', icon: <Store className="w-4 h-4" /> },
    { to: '/comercio/productos', label: 'Productos', icon: <Package className="w-4 h-4" /> },
    {
      to: '/comercio/pedidos',
      label: 'Comandas y pedidos',
      icon: <ShoppingBag className="w-4 h-4" />,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
    },
    { to: '/comercio/reportes', label: 'Reportes de ventas', icon: <BarChart3 className="w-4 h-4" /> },
    { to: '/comercio/configuracion', label: 'Configuración', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="h-screen h-dvh overflow-hidden bg-background flex flex-col md:flex-row font-sans">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-30 transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Top Header */}
      <div className="md:hidden sticky top-0 z-30 bg-surface border-b border-border px-4 py-3 flex items-center justify-between shadow-subtle flex-shrink-0">
        <BrandLogo size="sm" showSubtitle={false} />
        <div className="flex items-center gap-2.5">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-surface-subtle text-ink-light border border-border">
            Comercio
          </span>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="touch-target p-2 text-ink-light rounded-xl hover:bg-surface-subtle"
            aria-label="Abrir menú de comercio"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Desktop Sidebar (Estática y fija en la izquierda) */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 h-full md:h-screen bg-surface border-r border-border flex flex-col flex-shrink-0 transition-transform duration-200 md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-border flex items-center justify-between flex-shrink-0">
          <BrandLogo size="sm" />
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-ink-muted hover:text-ink p-1"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 flex-1 space-y-1 overflow-y-auto">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all ${
                  isActive
                    ? 'bg-primary-50 text-primary font-bold'
                    : 'text-ink-light hover:bg-surface-subtle hover:text-ink font-medium'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <span className="text-inherit">{link.icon}</span>
                <span>{link.label}</span>
              </div>
              {link.badge && (
                <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full font-bold tabular-nums">
                  {link.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border flex flex-col gap-2">
          <Link
            to={`/negocios/${currentMerchant.id}`}
            className="flex items-center justify-between text-xs font-semibold text-ink-light hover:text-primary p-2 rounded-xl hover:bg-surface-subtle transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver tienda como cliente</span>
            </span>
            <ChevronRight className="w-4 h-4 text-ink-muted" />
          </Link>

          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="flex items-center gap-2 text-xs font-semibold text-destructive hover:bg-destructive-soft p-2 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full md:h-screen overflow-hidden">
        {/* Top Header Bar for Desktop */}
        <header className="hidden md:flex h-16 bg-surface border-b border-border px-8 items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5 text-xs">
            <span className="font-semibold text-ink">Panel del Comercio</span>
            <span className="text-ink-muted">•</span>
            <span className="text-ink-light">Tingo María</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification bell */}
            <button
              type="button"
              className="relative p-2 text-ink-light hover:text-primary transition-colors touch-target rounded-xl hover:bg-surface-subtle"
              aria-label="Notificaciones de pedidos"
            >
              <Bell className="w-5 h-5" />
              {pendingOrdersCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center tabular-nums">
                  {pendingOrdersCount}
                </span>
              )}
            </button>

            {/* Selector interactivo de Tienda Administrada */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setStoreMenuOpen(!storeMenuOpen)}
                className="flex items-center gap-2.5 pl-3 border-l border-border hover:bg-surface-subtle p-1.5 rounded-xl transition-all text-left cursor-pointer"
                title="Cambiar de tienda"
              >
                <img
                  src={currentMerchant.logoUrl}
                  alt={currentMerchant.name}
                  className="w-8 h-8 rounded-full object-cover border border-border"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="%23ECFDF5"><rect width="32" height="32" rx="16" fill="%23ECFDF5"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="%2300A859" font-family="sans-serif" font-weight="bold" font-size="12">Q</text></svg>';
                  }}
                />
                <div className="text-left leading-tight">
                  <p className="text-xs font-bold text-ink flex items-center gap-1">
                    <span>{currentMerchant.name}</span>
                    <ChevronDown className="w-3 h-3 text-ink-muted" />
                  </p>
                  <p className="text-[10px] text-primary font-semibold capitalize">{currentMerchant.category}</p>
                </div>
              </button>

              {storeMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setStoreMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-72 bg-surface rounded-2xl border border-border shadow-2xl p-1.5 z-50 animate-fadeIn text-xs max-h-80 overflow-y-auto">
                    <div className="px-2.5 py-1.5 text-[10px] font-bold text-ink-muted uppercase tracking-wider border-b border-border mb-1 flex items-center justify-between sticky top-0 bg-surface z-10">
                      <span>Cambiar Tienda Demo</span>
                      <span className="text-[9px] font-semibold text-primary">{merchants.length} tiendas</span>
                    </div>
                    {merchants.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          switchMerchant(m.id);
                          setStoreMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all ${
                          currentMerchant.id === m.id
                            ? 'bg-primary-50 text-primary font-bold'
                            : 'hover:bg-surface-subtle text-ink'
                        }`}
                      >
                        <img
                          src={m.logoUrl}
                          alt={m.name}
                          className="w-7 h-7 rounded-lg object-cover border border-border flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold truncate">{m.name}</p>
                          <p className="text-[10px] text-ink-muted capitalize truncate">{m.category}</p>
                        </div>
                        {currentMerchant.id === m.id && (
                          <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-12 scroll-smooth">
          <Outlet />
        </main>
      </div>

      <DemoSwitcher />
    </div>
  );
};
