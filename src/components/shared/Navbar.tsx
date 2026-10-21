import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  Menu,
  X,
  Tag,
  Sparkles,
  HelpCircle,
  Film,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentUser, activeRole, logout, isAuthenticated } = useAuthStore();
  const { getItemCount } = useCartStore();
  const { notifications } = useDataStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [showCouponsModal, setShowCouponsModal] = useState(false);
  const [showPlayModal, setShowPlayModal] = useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close floating popovers when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setShowNotificationsMenu(false);
      }
      if (profileRef.current && !profileRef.current.contains(target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Close menus on route navigation
  useEffect(() => {
    setShowNotificationsMenu(false);
    setShowProfileMenu(false);
    setShowMobileDrawer(false);
  }, [location.pathname, location.search]);

  // Active section detection so buttons paint when selected
  const isOfertasActive =
    location.pathname === '/negocios' &&
    (location.search.includes('q=oferta') || location.search.includes('descuento'));
  const isCuponesActive = showCouponsModal || location.pathname === '/cupones';
  const isModaActive =
    location.pathname === '/negocios' &&
    (location.search.includes('categoria=ropa') || location.search.includes('moda'));
  const isPlayActive = showPlayModal || location.pathname === '/play';
  const isVenderActive = location.pathname.startsWith('/comercio');
  const isAyudaActive = location.pathname === '/cliente/ayuda';

  const isRegistroActive = location.pathname === '/registro';
  const isLoginActive = location.pathname === '/login';
  const isPedidosActive = location.pathname === '/cliente/pedidos';
  const isPerfilActive = location.pathname === '/cliente/perfil';

  const getNavBtnClass = (active: boolean) =>
    active
      ? 'bg-white text-primary font-black px-3 py-1 rounded-full shadow-sm ring-1 ring-white/50 transition-all cursor-pointer'
      : 'text-white hover:text-white hover:bg-white/15 px-2.5 py-1 rounded-full font-medium transition-all cursor-pointer';

  const cartCount = getItemCount();
  const unreadNotifications = notifications.filter(
    (n) => (currentUser ? n.userId === currentUser.id : false) && !n.isRead
  );

  return (
    <>
      <header className="sticky top-0 z-30 bg-primary border-b border-primary-dark/20 shadow-md select-none text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Top Row */}
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-6 pt-1">
            {/* Hamburger Button (Mobile) & Brand Logo & Zone Selector */}
            <div className="flex items-center gap-2 sm:gap-5 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowMobileDrawer(true)}
                className="md:hidden p-1.5 -ml-1 text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                aria-label="Abrir menú de navegación"
              >
                <Menu className="w-6 h-6" />
              </button>

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

              {/* Notifications Bell with Outside Click Protection */}
              <div className="relative" ref={notificationsRef}>
                <button
                  type="button"
                  onClick={() => {
                    setShowNotificationsMenu((prev) => !prev);
                    setShowProfileMenu(false);
                  }}
                  className="relative p-2 rounded-lg text-white hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label={`Notificaciones (${unreadNotifications.length} sin leer)`}
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-300 rounded-full ring-2 ring-primary-dark" />
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

              {/* User Profile Dropdown with Outside Click Protection */}
              {isAuthenticated && currentUser ? (
                <div className="relative" ref={profileRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu((prev) => !prev);
                      setShowNotificationsMenu(false);
                    }}
                    className="flex items-center gap-1.5 p-1 sm:px-2 sm:py-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
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
                          className="flex items-center gap-2 w-full p-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          Cerrar Sesión Demo
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="p-1 sm:px-2 text-white hover:bg-white/10 rounded-full transition-colors flex items-center justify-center"
                  aria-label="Ingresar a tu cuenta"
                >
                  <div className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white">
                    <User className="w-4 h-4" />
                  </div>
                </Link>
              )}
            </div>
          </div>

          {/* Sub-bar: Categorías, Ofertas, Cupones, Mercado Play, Ayuda & Auth */}
          <div className="hidden md:flex items-center justify-between py-1.5 border-t border-white/10 text-xs text-white">
            {/* Left Nav Navigation */}
            <div className="flex items-center gap-2 sm:gap-3">
              <CategoriesDropdown />

              <Link
                to="/negocios?q=oferta"
                className={getNavBtnClass(isOfertasActive)}
              >
                Ofertas
              </Link>

              <button
                type="button"
                onClick={() => setShowCouponsModal(true)}
                className={getNavBtnClass(isCuponesActive)}
              >
                Cupones
              </button>

              <Link
                to="/negocios?categoria=ropa"
                className={getNavBtnClass(isModaActive)}
              >
                Moda
              </Link>

              {/* Mercado Play / Quickly Play with GRATIS Badge */}
              <button
                type="button"
                onClick={() => setShowPlayModal(true)}
                className={`${getNavBtnClass(isPlayActive)} flex items-center gap-1.5`}
              >
                <span className="bg-[#00a650] text-white text-[9px] font-black px-1 rounded uppercase tracking-wider py-0.5 shadow-sm">
                  GRATIS
                </span>
                <span>Mercado Play</span>
              </button>

              <Link
                to="/comercio/tienda"
                className={getNavBtnClass(isVenderActive)}
              >
                Vender
              </Link>

              <Link
                to="/cliente/ayuda"
                className={getNavBtnClass(isAyudaActive)}
              >
                Ayuda
              </Link>
            </div>

            {/* Right Side Auth / Account Links */}
            <div className="flex items-center gap-2 text-xs">
              {!isAuthenticated || !currentUser ? (
                <>
                  <Link
                    to="/registro"
                    className={getNavBtnClass(isRegistroActive)}
                  >
                    Crea tu cuenta
                  </Link>
                  <Link
                    to="/login"
                    className={getNavBtnClass(isLoginActive)}
                  >
                    Ingresa
                  </Link>
                  <Link
                    to="/cliente/pedidos"
                    className={getNavBtnClass(isPedidosActive)}
                  >
                    Mis compras
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/cliente/pedidos"
                    className={getNavBtnClass(isPedidosActive)}
                  >
                    Mis compras
                  </Link>
                  <Link
                    to="/cliente/perfil"
                    className={getNavBtnClass(isPerfilActive)}
                  >
                    Hola {currentUser.name.split(' ')[0]}
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile Search Bar & Mobile Zone/Categories Pills */}
          <div className="sm:hidden pb-3 pt-1 space-y-2.5">
            <SearchBar variant="navbar-mobile" />

            <div className="flex items-center gap-2 text-xs font-medium px-0.5">
              <CategoriesDropdown variant="compact" />
              <ZoneSelector variant="compact" />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer (Menú Hamburguesa) */}
      {showMobileDrawer && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop oscurecedor */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setShowMobileDrawer(false)}
          />

          {/* Drawer panel */}
          <div className="fixed inset-y-0 left-0 max-w-[85%] w-80 bg-white text-ink shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="bg-primary text-white p-4 flex items-center justify-between shadow-xs">
              <BrandLogo size="sm" variant="white" />
              <button
                type="button"
                onClick={() => setShowMobileDrawer(false)}
                className="p-1.5 rounded-lg text-white hover:bg-white/20 transition-colors cursor-pointer"
                aria-label="Cerrar menú"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Perfil del Usuario o Botones de Login */}
            <div className="p-4 bg-emerald-50/60 border-b border-emerald-100">
              {isAuthenticated && currentUser ? (
                <div>
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider font-bold">Bienvenido(a)</p>
                  <p className="font-extrabold text-ink text-sm truncate">{currentUser.name}</p>
                  <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <RoleBadge role={activeRole} />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-gray-600 font-semibold">Inicia sesión para pedir y rastrear</p>
                  <div className="flex gap-2">
                    <Link
                      to="/login"
                      onClick={() => setShowMobileDrawer(false)}
                      className="flex-1 py-2 text-center text-xs font-black bg-primary text-white rounded-xl shadow-xs hover:bg-primary-hover transition-colors"
                    >
                      Ingresar
                    </Link>
                    <Link
                      to="/registro"
                      onClick={() => setShowMobileDrawer(false)}
                      className="flex-1 py-2 text-center text-xs font-bold border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Crear cuenta
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Lista de Enlaces de Navegación */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1 text-sm font-semibold">
              <Link
                to="/negocios"
                onClick={() => setShowMobileDrawer(false)}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-100 text-gray-800 transition-colors"
              >
                <Store className="w-4 h-4 text-primary" />
                <span>Comercios & Tiendas</span>
              </Link>

              <Link
                to="/negocios?q=oferta"
                onClick={() => setShowMobileDrawer(false)}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-100 text-gray-800 transition-colors"
              >
                <Tag className="w-4 h-4 text-amber-500" />
                <span>Ofertas del Día</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setShowMobileDrawer(false);
                  setShowCouponsModal(true);
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-100 text-gray-800 text-left transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span>Cupones de Descuento</span>
              </button>

              <Link
                to="/negocios?categoria=ropa"
                onClick={() => setShowMobileDrawer(false)}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-100 text-gray-800 transition-colors"
              >
                <ShoppingBag className="w-4 h-4 text-primary" />
                <span>Moda & Confección</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setShowMobileDrawer(false);
                  setShowPlayModal(true);
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-100 text-gray-800 text-left transition-colors cursor-pointer"
              >
                <Film className="w-4 h-4 text-emerald-600" />
                <div className="flex items-center gap-2">
                  <span>Mercado Play</span>
                  <span className="bg-[#00a650] text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                    GRATIS
                  </span>
                </div>
              </button>

              <div className="pt-2 my-2 border-t border-gray-100" />

              {isAuthenticated && (
                <>
                  <Link
                    to="/cliente/pedidos"
                    onClick={() => setShowMobileDrawer(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-100 text-gray-800 transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4 text-gray-400" />
                    <span>Mis Pedidos</span>
                  </Link>
                  <Link
                    to="/cliente/direcciones"
                    onClick={() => setShowMobileDrawer(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-100 text-gray-800 transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>Mis Direcciones</span>
                  </Link>
                  <Link
                    to="/cliente/perfil"
                    onClick={() => setShowMobileDrawer(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-100 text-gray-800 transition-colors"
                  >
                    <User className="w-4 h-4 text-gray-400" />
                    <span>Mi Perfil</span>
                  </Link>
                </>
              )}

              {/* Acceso a Paneles según Rol */}
              {activeRole === 'comercio' && (
                <Link
                  to="/comercio/tienda"
                  onClick={() => setShowMobileDrawer(false)}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-emerald-50 text-primary font-bold"
                >
                  <Store className="w-4 h-4 text-primary" />
                  <span>Panel Proveedor</span>
                </Link>
              )}
              {activeRole === 'repartidor' && (
                <Link
                  to="/repartidor/solicitudes"
                  onClick={() => setShowMobileDrawer(false)}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-emerald-50 text-primary font-bold"
                >
                  <Bike className="w-4 h-4 text-primary" />
                  <span>Panel Repartidor</span>
                </Link>
              )}
              {activeRole === 'admin' && (
                <Link
                  to="/admin/resumen"
                  onClick={() => setShowMobileDrawer(false)}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-emerald-50 text-primary font-bold"
                >
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>Panel Admin</span>
                </Link>
              )}

              <div className="pt-2 my-2 border-t border-gray-100" />

              <Link
                to="/comercio/tienda"
                onClick={() => setShowMobileDrawer(false)}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-100 text-gray-700 transition-colors"
              >
                <Store className="w-4 h-4 text-gray-400" />
                <span>Vender en Quickly</span>
              </Link>
              <Link
                to="/cliente/ayuda"
                onClick={() => setShowMobileDrawer(false)}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-100 text-gray-700 transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-gray-400" />
                <span>Ayuda & Soporte</span>
              </Link>
            </div>

            {isAuthenticated && (
              <div className="p-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setShowMobileDrawer(false);
                    navigate('/login');
                  }}
                  className="flex items-center gap-2 w-full p-2.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Extracted Modals */}
      <CouponsModal isOpen={showCouponsModal} onClose={() => setShowCouponsModal(false)} />
      <PlayModal isOpen={showPlayModal} onClose={() => setShowPlayModal(false)} />
    </>
  );
};
