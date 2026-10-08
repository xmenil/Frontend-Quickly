import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';
import { CategoriesDropdown } from './CategoriesDropdown';
import { ZoneSelector } from './ZoneSelector';
import { SearchBar } from './SearchBar';
import { CouponsModal } from './CouponsModal';
import { PlayModal } from './PlayModal';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useDataStore } from '../../store/dataStore';
import { RoleBadge } from '../ui/Badge';
import {
  ShoppingCart,
  Bell,
  ChevronDown,
  ShoppingBag,
  Store,
  Bike,
  ShieldCheck,
  MapPin,
  User,
  LogOut,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentUser, activeRole, logout, isAuthenticated } = useAuthStore();
  const { getItemCount } = useCartStore();
  const { notifications } = useDataStore();
  const navigate = useNavigate();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);
  const [showCouponsModal, setShowCouponsModal] = useState(false);
  const [showPlayModal, setShowPlayModal] = useState(false);

  const cartCount = getItemCount();
  const unreadNotifications = notifications.filter(
    (n) => (currentUser ? n.userId === currentUser.id : false) && !n.isRead
  );

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#BE185D] border-b border-[#9D174D] shadow-md select-none text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Top Row */}
          <div className="flex items-center justify-between h-14 sm:h-16 gap-3 sm:gap-6 pt-1">
            {/* Brand Logo & Zone Selector */}
            <div className="flex items-center gap-3 sm:gap-5 flex-shrink-0">
              <BrandLogo size="md" variant="white" />

              {/* Zone Selector (Extracted Component) */}
              <div className="hidden lg:block">
                <ZoneSelector variant="navbar" />
              </div>
            </div>

            {/* Desktop Search Bar (Extracted Component with 300ms debounce) */}
            <div className="hidden sm:flex flex-1 max-w-xl">
              <SearchBar variant="navbar-desktop" />
            </div>

            {/* Right Quick Actions & Role Badges */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              {/* Role Switches */}
              {activeRole === 'comercio' && (
                <Link
                  to="/comercio/tienda"
                  className="hidden xl:inline-flex items-center gap-1 text-[11px] font-bold text-white bg-white/20 border border-white/20 px-2.5 py-1 rounded-full hover:bg-white/30 transition-colors"
                >
                  <Store className="w-3 h-3 text-white" />
                  Panel Proveedor
                </Link>
              )}
              {activeRole === 'repartidor' && (
                <Link
                  to="/repartidor/solicitudes"
                  className="hidden xl:inline-flex items-center gap-1 text-[11px] font-bold text-white bg-white/20 border border-white/20 px-2.5 py-1 rounded-full hover:bg-white/30 transition-colors"
                >
                  <Bike className="w-3 h-3 text-white" />
                  Panel Repartidor
                </Link>
              )}
              {activeRole === 'admin' && (
                <Link
                  to="/admin/resumen"
                  className="hidden xl:inline-flex items-center gap-1 text-[11px] font-bold text-white bg-white/20 border border-white/20 px-2.5 py-1 rounded-full hover:bg-white/30 transition-colors"
                >
                  <ShieldCheck className="w-3 h-3 text-white" />
                  Panel Admin
                </Link>
              )}

              {/* Fast delivery pill */}
              <div className="hidden lg:flex items-center gap-1 text-[11px] font-bold text-white bg-white/15 px-2.5 py-1 rounded-full border border-white/20">
                <span>🚚 Envíos express Tingo María</span>
              </div>

              {/* Cart Button with Count Badge */}
              <Link
                to="/carrito"
                className="relative p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
                aria-label={`Ver carrito con ${cartCount} productos`}
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-white text-primary text-[10px] font-black rounded-full flex items-center justify-center shadow-sm animate-in zoom-in-75">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Notifications Bell */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowNotificationsMenu(!showNotificationsMenu)}
                  className="relative p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
                  aria-label={`Notificaciones (${unreadNotifications.length} sin leer)`}
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-300 rounded-full ring-2 ring-[#BE185D]" />
                  )}
                </button>

                {/* Notifications Popover */}
                {showNotificationsMenu && (
                  <div className="absolute right-0 mt-2 w-80 bg-white text-ink rounded-2xl shadow-floating border border-gray-100 p-3 z-50 animate-in fade-in slide-in-from-top-2">
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

              {/* User Profile Dropdown */}
              {isAuthenticated && currentUser && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-1.5 p-1 sm:px-2 sm:py-1 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-white text-primary flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                      {currentUser.name.substring(0, 2)}
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-white hidden sm:block" />
                  </button>

                  {/* Profile Menu Popover */}
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white text-ink rounded-2xl shadow-floating border border-gray-100 p-2 z-50 animate-in fade-in slide-in-from-top-2">
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
              )}
            </div>
          </div>

          {/* Sub-bar: Categorías, Ofertas, Cupones, Mercado Play, Ayuda & Auth */}
          <div className="hidden md:flex items-center justify-between py-2 border-t border-white/10 text-xs text-white">
            {/* Left Nav Navigation */}
            <div className="flex items-center gap-4 sm:gap-6">
              <CategoriesDropdown />

              <Link
                to="/negocios?q=oferta"
                className="text-white hover:text-pink-100 font-normal transition-colors"
              >
                Ofertas
              </Link>

              <button
                type="button"
                onClick={() => setShowCouponsModal(true)}
                className="text-white hover:text-pink-100 font-normal transition-colors cursor-pointer"
              >
                Cupones
              </button>

              <Link
                to="/negocios?categoria=ropa"
                className="text-white hover:text-pink-100 font-normal transition-colors"
              >
                Moda
              </Link>

              {/* Mercado Play / Quickly Play with GRATIS Badge */}
              <button
                type="button"
                onClick={() => setShowPlayModal(true)}
                className="text-white hover:text-pink-100 font-normal transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span className="bg-[#00a650] text-white text-[9px] font-black px-1 rounded uppercase tracking-wider py-0.5 shadow-sm">
                  GRATIS
                </span>
                <span className="font-medium">Mercado Play</span>
              </button>

              <Link
                to="/comercio/tienda"
                className="text-white hover:text-pink-100 font-normal transition-colors"
              >
                Vender
              </Link>

              <Link
                to="/cliente/ayuda"
                className="text-white hover:text-pink-100 font-normal transition-colors"
              >
                Ayuda
              </Link>
            </div>

            {/* Right Side Auth / Account Links */}
            <div className="flex items-center gap-4 text-xs font-normal">
              {!isAuthenticated || !currentUser ? (
                <>
                  <Link to="/registro" className="text-white hover:text-pink-100 transition-colors">
                    Crea tu cuenta
                  </Link>
                  <Link to="/login" className="text-white hover:text-pink-100 transition-colors font-medium">
                    Ingresa
                  </Link>
                  <Link to="/cliente/pedidos" className="text-white hover:text-pink-100 transition-colors">
                    Mis compras
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/cliente/pedidos"
                    className="text-white hover:text-pink-100 transition-colors font-medium"
                  >
                    Mis compras
                  </Link>
                  <Link to="/cliente/perfil" className="text-white hover:text-pink-100 transition-colors">
                    Hola {currentUser.name.split(' ')[0]}
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile Search Bar & Mobile Zone/Categories Strip */}
          <div className="sm:hidden pb-2.5 pt-1 space-y-2">
            <SearchBar variant="navbar-mobile" />

            <div className="flex items-center justify-between text-xs text-white font-medium px-1">
              <div className="flex items-center gap-2">
                <CategoriesDropdown />
                <ZoneSelector variant="compact" />
              </div>

              <div className="flex items-center gap-3 text-[11px]">
                <Link to="/negocios?q=oferta" className="hover:underline text-white">
                  Ofertas
                </Link>
                <button
                  type="button"
                  onClick={() => setShowCouponsModal(true)}
                  className="hover:underline text-white cursor-pointer"
                >
                  Cupones
                </button>
                <Link to="/cliente/pedidos" className="hover:underline text-white">
                  Pedidos
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Extracted Modals */}
      <CouponsModal isOpen={showCouponsModal} onClose={() => setShowCouponsModal(false)} />
      <PlayModal isOpen={showPlayModal} onClose={() => setShowPlayModal(false)} />
    </>
  );
};
