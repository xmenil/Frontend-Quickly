import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useDataStore } from '../../store/dataStore';
import { RoleBadge } from '../ui/Badge';
import {
  Search,
  ShoppingCart,
  Bell,
  MapPin,
  User,
  LogOut,
  ChevronDown,
  ShoppingBag,
  Store,
  Bike,
  ShieldCheck,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentUser, activeRole, logout, isAuthenticated } = useAuthStore();
  const { getItemCount } = useCartStore();
  const { zones, notifications } = useDataStore();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState(zones[0]?.id || 'z_centro');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);

  const cartCount = getItemCount();
  const unreadNotifications = notifications.filter(
    (n) => (currentUser ? n.userId === currentUser.id : false) && !n.isRead
  );

  const selectedZone = zones.find((z) => z.id === selectedZoneId) || zones[0];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/negocios?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3 sm:gap-6">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <BrandLogo size="md" />

            {/* Zone Selector (Desktop / Tablet) */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-xs text-ink hover:bg-gray-100 transition-colors">
              <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <select
                value={selectedZoneId}
                onChange={(e) => setSelectedZoneId(e.target.value)}
                className="bg-transparent font-medium focus:outline-none cursor-pointer pr-1"
                aria-label="Seleccionar zona de entrega en Tingo María"
              >
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Bar (Desktop / Tablet) */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden sm:flex flex-1 max-w-md relative items-center"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar juanes, tacacho, farmacias, bodegas..."
              className="w-full bg-gray-50 border border-gray-200 rounded-full py-2 pl-10 pr-4 text-sm text-ink placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
          </form>

          {/* Actions & Role Links */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick role dashboard link based on active role */}
            {activeRole === 'comercio' && (
              <Link
                to="/comercio/tienda"
                className="hidden lg:inline-flex items-center gap-1.5 text-xs font-bold text-selva-700 bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors"
              >
                <Store className="w-3.5 h-3.5" />
                Panel Comercio
              </Link>
            )}
            {activeRole === 'repartidor' && (
              <Link
                to="/repartidor/solicitudes"
                className="hidden lg:inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-full hover:bg-purple-100 transition-colors"
              >
                <Bike className="w-3.5 h-3.5" />
                Panel Repartidor
              </Link>
            )}
            {activeRole === 'admin' && (
              <Link
                to="/admin/usuarios"
                className="hidden lg:inline-flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-50 px-3 py-1.5 rounded-full hover:bg-red-100 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Panel Admin
              </Link>
            )}

            {/* Cart Button */}
            <Link
              to="/carrito"
              className="touch-target relative p-2.5 rounded-xl text-ink hover:text-primary hover:bg-primary-light transition-colors"
              aria-label={`Ver carrito con ${cartCount} productos`}
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-primary text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-sm animate-in zoom-in-75">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotificationsMenu(!showNotificationsMenu)}
                className="touch-target relative p-2.5 rounded-xl text-ink hover:text-primary hover:bg-primary-light transition-colors"
                aria-label={`Notificaciones (${unreadNotifications.length} sin leer)`}
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications.length > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-primary rounded-full ring-2 ring-white" />
                )}
              </button>

              {/* Notification Popover */}
              {showNotificationsMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-floating border border-gray-100 p-3 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-2">
                    <span className="font-bold text-sm text-ink">Notificaciones</span>
                    <Link
                      to="/cliente/notificaciones"
                      onClick={() => setShowNotificationsMenu(false)}
                      className="text-xs text-primary font-semibold hover:underline"
                    >
                      Ver todas
                    </Link>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {unreadNotifications.length === 0 ? (
                      <p className="text-xs text-gray-400 py-3 text-center">
                        No tienes notificaciones pendientes.
                      </p>
                    ) : (
                      unreadNotifications.slice(0, 4).map((n) => (
                        <div key={n.id} className="p-2 bg-gray-50 rounded-xl text-xs space-y-0.5">
                          <p className="font-semibold text-ink">{n.title}</p>
                          <p className="text-gray-500 line-clamp-2">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              {isAuthenticated && currentUser ? (
                <button
                  type="button"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="touch-target flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                    {currentUser.name.substring(0, 2)}
                  </div>
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-xs font-bold text-ink truncate max-w-[110px]">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] text-gray-500 capitalize">{activeRole}</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
                </button>
              ) : (
                <Link
                  to="/login"
                  className="text-sm font-bold text-primary hover:text-primary-hover px-3 py-2"
                >
                  Iniciar sesión
                </Link>
              )}

              {/* Profile Menu Popover */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-floating border border-gray-100 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="p-2.5 border-b border-gray-100 mb-1">
                    <p className="font-bold text-sm text-ink truncate">{currentUser?.name}</p>
                    <p className="text-xs text-gray-400 truncate">{currentUser?.email}</p>
                    <div className="mt-1.5">
                      <RoleBadge role={activeRole} />
                    </div>
                  </div>

                  <div className="space-y-0.5 text-xs text-gray-700">
                    <Link
                      to="/cliente/pedidos"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 font-medium"
                    >
                      <ShoppingBag className="w-4 h-4 text-gray-400" />
                      Mis Pedidos
                    </Link>
                    <Link
                      to="/cliente/direcciones"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 font-medium"
                    >
                      <MapPin className="w-4 h-4 text-gray-400" />
                      Direcciones guardadas
                    </Link>
                    <Link
                      to="/cliente/perfil"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 font-medium"
                    >
                      <User className="w-4 h-4 text-gray-400" />
                      Mi Perfil
                    </Link>
                  </div>

                  <div className="pt-1 mt-1 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setShowProfileMenu(false);
                        navigate('/login');
                      }}
                      className="flex items-center gap-2 w-full p-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar Sesión Demo
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search Bar (under header on small screens) */}
        <div className="sm:hidden pb-3 pt-1">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar en Tingo María..."
              className="w-full bg-gray-50 border border-gray-200 rounded-full py-2 pl-9 pr-4 text-xs text-ink placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 pointer-events-none" />
          </form>
        </div>
      </div>
    </header>
  );
};
