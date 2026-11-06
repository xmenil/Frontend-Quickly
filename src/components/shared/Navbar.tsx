import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';
import { CategoriesDropdown } from './CategoriesDropdown';
import { ZoneSelector } from './ZoneSelector';
import { SearchBar } from './SearchBar';
import { CouponsModal } from './CouponsModal';
import { PlayModal } from './PlayModal';
import { useAuthStore } from '../../store/authStore';
import { useRealCartStore } from '../../store/realCartStore';
import { RemoteState } from '../../features/operations/shared';
import { useCustomerNotifications } from '../../features/customer/customerAccountModel';
import { catalogApi } from '../../services/api/catalogApi';
import { useRemote } from '../../features/operations/shared';
import { RoleBadge } from '../ui/Badge';
import {
  ShoppingCart,
  Heart,
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
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentUser, activeRole, logout, isAuthenticated, roles } = useAuthStore();
  const hasMerchantRole = roles?.includes('comercio');
  const venderDestination = hasMerchantRole ? '/comercio/tienda' : '/registro/comercio';
  const cartCount = useRealCartStore((s) => s.items.reduce((acc, item) => acc + item.quantity, 0));
  const [logoutError, setLogoutError] = useState("");
  const notificationResource = useCustomerNotifications();
  const notifications = isAuthenticated && !notificationResource.error ? notificationResource.data || [] : [];
  const categoryResource = useRemote('navbar-category-links', signal => catalogApi.categories(signal));
  const fashionCategory = categoryResource.error ? undefined : categoryResource.data?.find(category => ['ropa','moda','textiles'].includes(category.code));
  const fashionLink = fashionCategory ? '/negocios?categoriaProducto=' + encodeURIComponent(fashionCategory.id) : '/negocios';
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

  // Active section detection
  const isHome = location.pathname === '/';
  const isOfertasActive =
    location.pathname === '/negocios' &&
    (location.search.includes('q=oferta') || location.search.includes('descuento'));
  const isCuponesActive = showCouponsModal || location.pathname === '/cupones';
  const isModaActive =
    location.pathname === '/negocios' &&
    !!fashionCategory && new URLSearchParams(location.search).get('categoriaProducto') === fashionCategory.id;
  const isPlayActive = showPlayModal || location.pathname === '/play';
  const isVenderActive = location.pathname.startsWith('/comercio') || location.pathname === '/registro/comercio';
  const isAyudaActive = location.pathname === '/cliente/ayuda';

  const isRegistroActive = location.pathname === '/registro';
  const isLoginActive = location.pathname === '/login';
  const isPedidosActive = location.pathname === '/cliente/pedidos';
  const isPerfilActive = location.pathname === '/cliente/perfil';

  const unreadNotifications = notifications.filter((n) => !n.readAt);

  return (
    <>
      {logoutError && <p role="alert" className="bg-red-50 p-3 text-sm text-red-800">{logoutError}</p>}
      
      {/* Header oficial con verde característico de Quickly y diseño limpio */}
      <header className="sticky top-0 z-30 bg-primary border-b border-primary-dark/20 shadow-md select-none text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Top Row */}
          <div className="flex items-center justify-between min-h-[72px] sm:min-h-[78px] gap-2 sm:gap-4 py-3 sm:py-3.5">
            {/* Hamburger Button (Mobile) & Brand Logo & Categories Menu */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowMobileDrawer(true)}
                className="md:hidden p-2 text-white hover:bg-white/15 rounded-xl transition-colors cursor-pointer"
                aria-label="Abrir menú de navegación"
              >
                <Menu className="w-5 h-5" />
              </button>

              <BrandLogo size="md" variant="white" />

              {/* Botón Menú / Categorías con contraste blanco sobre fondo verde */}
              <div className="hidden md:block">
                <CategoriesDropdown variant="menu-green" />
              </div>
            </div>

            {/* Desktop Search Bar */}
            <div className="hidden sm:flex flex-1 max-w-xl mx-2 lg:mx-4">
              <SearchBar variant="navbar-desktop" />
            </div>

            {/* Right Quick Actions & Account */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Badges de Panel Administrativo / Comercial */}
              {(activeRole === 'admin' || roles?.includes('admin')) && (
                <Link
                  to="/admin/resumen"
                  className="hidden xl:inline-flex items-center gap-1 text-[11px] font-bold text-white bg-white/20 border border-white/30 px-2.5 py-1 rounded-full hover:bg-white/30 transition-colors"
                >
                  <ShieldCheck className="w-3 h-3 text-white" />
                  Panel Admin
                </Link>
              )}
              {(activeRole === 'comercio' || roles?.includes('comercio')) && (
                <Link
                  to="/comercio/tienda"
                  className="hidden xl:inline-flex items-center gap-1 text-[11px] font-bold text-white bg-white/20 border border-white/30 px-2.5 py-1 rounded-full hover:bg-white/30 transition-colors"
                >
                  <Store className="w-3 h-3 text-white" />
                  Panel Tienda
                </Link>
              )}

              {/* Wishlist / Favoritos (Ícono corazón) */}
              <Link
                to="/cliente/favoritos"
                className="p-2 rounded-xl text-white hover:bg-white/15 transition-colors cursor-pointer"
                aria-label="Mis favoritos"
                title="Mis favoritos"
              >
                <Heart className="w-5 h-5 stroke-[2]" />
              </Link>

              {/* Notifications Bell */}
              <div className="relative" ref={notificationsRef}>
                <button
                  type="button"
                  onClick={() => {
                    setShowNotificationsMenu((prev) => !prev);
                    setShowProfileMenu(false);
                  }}
                  className="relative p-2 rounded-xl text-white hover:bg-white/15 transition-colors cursor-pointer"
                  aria-label={`Notificaciones (${unreadNotifications.length} sin leer)`}
                >
                  <Bell className="w-5 h-5 stroke-[2]" />
                  {unreadNotifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-300 rounded-full ring-2 ring-primary-dark" />
                  )}
                </button>

                {/* Notifications Popover */}
                {showNotificationsMenu && (
                  <div className="absolute right-0 mt-2 w-80 bg-white text-ink rounded-2xl shadow-floating border border-gray-150 p-3 z-50 animate-in fade-in slide-in-from-top-2">
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
                      <RemoteState loading={notificationResource.loading} error={notificationResource.error} retry={notificationResource.reload} />
                      {notificationResource.loading || notificationResource.error ? null : unreadNotifications.length === 0 ? (
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

              {/* Cart Button with Count Badge */}
              <Link
                to="/carrito"
                className="relative p-2 rounded-xl text-white hover:bg-white/15 transition-colors cursor-pointer"
                aria-label={`Ver carrito con ${cartCount} productos`}
              >
                <ShoppingCart className="w-5 h-5 stroke-[2]" />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-white text-primary text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* User Account Button ("Hola, Inicia sesión ⌵" o "Hola, [Nombre] ⌵") */}
              {isAuthenticated && currentUser ? (
                <div className="relative pl-1 sm:pl-2 border-l border-white/20" ref={profileRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu((prev) => !prev);
                      setShowNotificationsMenu(false);
                    }}
                    className="flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded-xl hover:bg-white/15 transition-colors cursor-pointer text-left text-white"
                  >
                    <div className="w-8 h-8 rounded-full bg-white text-primary flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                      {currentUser.name ? currentUser.name.slice(0, 2).toUpperCase() : 'U'}
                    </div>
                    <div className="hidden md:flex flex-col leading-tight">
                      <span className="text-[10px] text-emerald-100 font-normal">Hola,</span>
                      <span className="font-bold text-xs text-white truncate max-w-[110px] flex items-center gap-0.5">
                        {currentUser.name.split(' ')[0]} <ChevronDown className="w-3 h-3 text-emerald-200" />
                      </span>
                    </div>
                  </button>

                  {/* Profile Menu Popover */}
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white text-ink rounded-2xl shadow-floating border border-gray-150 p-2 z-50 animate-in fade-in slide-in-from-top-2">
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
                          Mis Compras
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
                          to="/cliente/favoritos"
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 font-medium"
                        >
                          <Heart className="w-4 h-4 text-gray-400" />
                          Mis Favoritos
                        </Link>
                        <Link
                          to="/cliente/perfil"
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 font-medium"
                        >
                          <User className="w-4 h-4 text-gray-400" />
                          Mi Perfil
                        </Link>

                        {roles?.includes('admin') && (
                          <Link
                            to="/admin/resumen"
                            onClick={() => setShowProfileMenu(false)}
                            className="flex items-center gap-2 p-2 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold"
                          >
                            <ShieldCheck className="w-4 h-4 text-purple-700" />
                            Panel Administrador
                          </Link>
                        )}
                        {roles?.includes('comercio') && (
                          <Link
                            to="/comercio/tienda"
                            onClick={() => setShowProfileMenu(false)}
                            className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 text-primary hover:bg-emerald-100 font-bold"
                          >
                            <Store className="w-4 h-4 text-primary" />
                            Panel Mi Tienda
                          </Link>
                        )}
                        {!roles?.includes('comercio') && (
                          <Link
                            to="/registro/comercio"
                            onClick={() => setShowProfileMenu(false)}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 font-medium text-primary"
                          >
                            <Store className="w-4 h-4 text-primary" />
                            Afiliar mi Tienda (Vender)
                          </Link>
                        )}
                      </div>

                      <div className="pt-1 mt-1 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={async () => {
                            const result = await logout();
                            if (result.success) {
                              setShowProfileMenu(false);
                              navigate('/login');
                            } else {
                              setLogoutError(result.message || 'No se pudo cerrar sesión.');
                            }
                          }}
                          className="flex items-center gap-2 w-full p-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          Cerrar Sesión
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="pl-1 sm:pl-2 border-l border-white/20 flex items-center">
                  <Link
                    to="/login"
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/15 transition-colors text-left text-white"
                    aria-label="Ingresar a tu cuenta"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center border border-white/30">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="hidden md:flex flex-col leading-tight">
                      <span className="text-[10px] text-emerald-100 font-normal">Hola,</span>
                      <span className="font-bold text-xs text-white flex items-center gap-0.5">
                        Inicia sesión <ChevronDown className="w-3 h-3 text-emerald-200" />
                      </span>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Search Bar & Zone Selector */}
          <div className="sm:hidden pb-3 pt-1 space-y-2">
            <SearchBar variant="navbar-mobile" />
            <div className="flex items-center justify-between text-xs pt-1 px-0.5 text-white">
              <ZoneSelector variant="compact" />
              <CategoriesDropdown variant="compact" />
            </div>
          </div>
        </div>

        {/* Sub-bar: Ubicación + Enlaces directos */}
        {/* En HomePage flota transparente sobre el Hero (estilo Trip.com); en otras páginas es verde sólido */}
        <div
          className={`hidden md:block select-none transition-colors ${
            isHome
              ? 'absolute top-full left-0 right-0 z-20 bg-gradient-to-b from-black/60 via-black/25 to-transparent text-white border-b border-white/10 backdrop-blur-[1px]'
              : 'relative bg-primary border-t border-white/15 text-white'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-2 text-xs">
            {/* Left: Ubicación */}
            <div className="flex items-center gap-2 drop-shadow-sm">
              <ZoneSelector variant="navbar" />
            </div>

            {/* Right: Enlaces directos sin saturación (Quickly Play eliminado) */}
            <div className="flex items-center gap-4 lg:gap-6 font-medium text-white drop-shadow-sm">
              <Link
                to="/negocios"
                className="hover:text-emerald-300 transition-colors cursor-pointer"
              >
                Ofertas
              </Link>

              <button
                type="button"
                onClick={() => setShowCouponsModal(true)}
                className="hover:text-emerald-300 transition-colors cursor-pointer"
              >
                Cupones
              </button>

              <Link
                to={fashionLink}
                aria-disabled={!fashionCategory}
                onClick={(event) => { if (!fashionCategory) event.preventDefault(); }}
                className="hover:text-emerald-300 transition-colors cursor-pointer"
              >
                Moda
              </Link>

              <Link
                to={venderDestination}
                className="font-bold text-white bg-white/20 hover:bg-white/30 border border-white/30 px-3 py-1 rounded-full transition-colors cursor-pointer backdrop-blur-xs shadow-2xs"
              >
                {hasMerchantRole ? 'Mi Tienda' : 'Vender en Quickly'}
              </Link>

              <Link
                to="/cliente/pedidos"
                className="hover:text-emerald-300 transition-colors cursor-pointer"
              >
                Mis compras
              </Link>

              <Link
                to="/cliente/ayuda"
                className="hover:text-emerald-300 transition-colors cursor-pointer"
              >
                Ayuda
              </Link>
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
            <div className="bg-primary text-white p-4 flex items-center justify-between shadow-2xs">
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

            {/* Navegación Principal Móvil */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1 text-sm font-medium">
              <Link
                to="/"
                onClick={() => setShowMobileDrawer(false)}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-100 text-gray-700 transition-colors"
              >
                <Store className="w-4 h-4 text-gray-400" />
                <span>Inicio & Categorías</span>
              </Link>
              <Link
                to="/negocios"
                onClick={() => setShowMobileDrawer(false)}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-100 text-gray-700 transition-colors"
              >
                <Tag className="w-4 h-4 text-gray-400" />
                <span>Comercios & Catálogo</span>
              </Link>
              <Link
                to="/cliente/favoritos"
                onClick={() => setShowMobileDrawer(false)}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-100 text-gray-700 transition-colors"
              >
                <Heart className="w-4 h-4 text-gray-400" />
                <span>Mis Favoritos</span>
              </Link>

              {isAuthenticated && (
                <>
                  <Link
                    to="/cliente/pedidos"
                    onClick={() => setShowMobileDrawer(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-100 text-gray-700 transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4 text-gray-400" />
                    <span>Mis Compras</span>
                  </Link>
                  <Link
                    to="/cliente/perfil"
                    onClick={() => setShowMobileDrawer(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-100 text-gray-700 transition-colors"
                  >
                    <User className="w-4 h-4 text-gray-400" />
                    <span>Mi Perfil</span>
                  </Link>
                </>
              )}

              {/* Acceso a Paneles según Rol */}
              {(activeRole === 'comercio' || roles?.includes('comercio')) && (
                <Link
                  to="/comercio/tienda"
                  onClick={() => setShowMobileDrawer(false)}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-emerald-50 text-primary font-bold"
                >
                  <Store className="w-4 h-4 text-primary" />
                  <span>Panel Proveedor</span>
                </Link>
              )}
              {(activeRole === 'repartidor' || roles?.includes('repartidor')) && (
                <Link
                  to="/repartidor/solicitudes"
                  onClick={() => setShowMobileDrawer(false)}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-emerald-50 text-primary font-bold"
                >
                  <Bike className="w-4 h-4 text-primary" />
                  <span>Panel Repartidor</span>
                </Link>
              )}
              {(activeRole === 'admin' || roles?.includes('admin')) && (
                <Link
                  to="/admin/resumen"
                  onClick={() => setShowMobileDrawer(false)}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-purple-50 text-purple-700 font-bold"
                >
                  <ShieldCheck className="w-4 h-4 text-purple-700" />
                  <span>Panel Admin</span>
                </Link>
              )}

              <div className="pt-2 my-2 border-t border-gray-100" />

              <Link
                to={venderDestination}
                onClick={() => setShowMobileDrawer(false)}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-100 text-gray-700 transition-colors"
              >
                <Store className="w-4 h-4 text-gray-400" />
                <span>{hasMerchantRole ? 'Mi Tienda' : 'Vender en Quickly'}</span>
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
                  onClick={async () => {
                    const result = await logout();
                    if (result.success) {
                      setShowMobileDrawer(false);
                      navigate('/login');
                    } else {
                      setLogoutError(result.message || 'No se pudo cerrar sesión.');
                    }
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

      {/* Modales extraídos */}
      <CouponsModal isOpen={showCouponsModal} onClose={() => setShowCouponsModal(false)} />
      <PlayModal isOpen={showPlayModal} onClose={() => setShowPlayModal(false)} />
    </>
  );
};
