import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';
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
  ChevronRight,
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
  ExternalLink,
  Eye,
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
  const categories = categoryResource.error ? [] : categoryResource.data || [];
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
      
      {/* Header oficial estilo Ripley (Imagen 2): barra superior blanca integrada y barra secundaria verde */}
      <header className="sticky top-0 z-30 shadow-subtle select-none">
        {/* 1. Barra Principal Superior en Blanco Integrado */}
        <div className="bg-white border-b border-gray-150 text-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between min-h-[64px] sm:min-h-[70px] gap-2 sm:gap-4 py-2 sm:py-2.5">
              
              {/* Botón Menú hamburguesa & Brand Logo en verde oficial sobre blanco */}
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowMobileDrawer(true)}
                  className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 text-gray-700 hover:text-primary hover:bg-gray-100 rounded-xl transition-colors cursor-pointer border border-gray-200 shadow-2xs"
                  aria-label="Abrir menú de departamentos y categorías"
                >
                  <Menu className="w-5 h-5 stroke-[2.5]" />
                  <span className="hidden sm:inline font-bold text-xs">Menú</span>
                </button>

                <BrandLogo size="md" variant="default" showSubtitle={true} />
              </div>

              {/* Barra de Búsqueda Centrada - Manteniendo el ancho integrado */}
              <div className="hidden sm:flex flex-1 max-w-xl lg:max-w-2xl mx-2 lg:mx-4">
                <SearchBar variant="navbar-desktop" />
              </div>

              {/* Acciones Rápidas Derecha: Enviar a (Ubicación) + Favoritos + Notificaciones + Carrito + Iniciar Sesión */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Selector de Ubicación estilo Ripley ("Enviar a Castillo Grande ▾") */}
                <div className="hidden lg:flex items-center pr-2 border-r border-gray-200">
                  <ZoneSelector variant="header-light" />
                </div>

                {/* Badges de Panel Administrativo / Comercial */}
                {(activeRole === 'admin' || roles?.includes('admin')) && (
                  <Link
                    to="/admin/resumen"
                    className="hidden xl:inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-full hover:bg-purple-100 transition-colors"
                  >
                    <ShieldCheck className="w-3 h-3 text-purple-700" />
                    Panel Admin
                  </Link>
                )}
                {(activeRole === 'comercio' || roles?.includes('comercio')) && (
                  <Link
                    to="/comercio/tienda"
                    className="hidden xl:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full hover:bg-emerald-100 transition-colors"
                  >
                    <Store className="w-3 h-3 text-emerald-800" />
                    Panel Tienda
                  </Link>
                )}

                {/* Wishlist / Favoritos (Solo clientes) */}
                {activeRole !== 'comercio' && (
                  <Link
                    to="/cliente/favoritos"
                    className="p-2 rounded-xl text-gray-700 hover:text-primary hover:bg-gray-100 transition-colors cursor-pointer"
                    aria-label="Mis favoritos"
                    title="Mis favoritos"
                  >
                    <Heart className="w-5 h-5 stroke-[2]" />
                  </Link>
                )}

                {/* Notifications Bell */}
                <div className="relative" ref={notificationsRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotificationsMenu((prev) => !prev);
                      setShowProfileMenu(false);
                    }}
                    className="relative p-2 rounded-xl text-gray-700 hover:text-primary hover:bg-gray-100 transition-colors cursor-pointer"
                    aria-label={`Notificaciones (${unreadNotifications.length} sin leer)`}
                  >
                    <Bell className="w-5 h-5 stroke-[2]" />
                    {unreadNotifications.length > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-white" />
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

                {/* Cart Button with Count Badge (Solo clientes) */}
                {activeRole !== 'comercio' && (
                  <Link
                    to="/carrito"
                    className="relative p-2 rounded-xl text-gray-700 hover:text-primary hover:bg-gray-100 transition-colors cursor-pointer"
                    aria-label={`Ver carrito con ${cartCount} productos`}
                  >
                    <ShoppingCart className="w-5 h-5 stroke-[2]" />
                    {cartCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                )}

                {/* User Account Button ("Hola, Inicia sesión ⌵" o "Hola, [Nombre] ⌵") */}
                {isAuthenticated && currentUser ? (
                  <div className="relative pl-1 sm:pl-2 border-l border-gray-200" ref={profileRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu((prev) => !prev);
                        setShowNotificationsMenu(false);
                      }}
                      className="flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer text-left text-gray-900"
                    >
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-primary flex items-center justify-center font-bold text-xs uppercase shadow-2xs border border-emerald-200">
                        {currentUser.name ? currentUser.name.slice(0, 2).toUpperCase() : 'U'}
                      </div>
                      <div className="hidden md:flex flex-col leading-tight">
                        <span className="text-[10px] text-gray-500 font-normal">Hola,</span>
                        <span className="font-bold text-xs text-gray-900 truncate max-w-[110px] flex items-center gap-0.5">
                          {currentUser.name.split(' ')[0]} <ChevronDown className="w-3 h-3 text-gray-400" />
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

                        {/* Si la cuenta activa es de comercio, solo dar acceso a su panel y ver perfil como cliente */}
                        {activeRole === 'comercio' ? (
                          <div className="space-y-1 text-xs text-gray-700">
                            <Link
                              to="/comercio/tienda"
                              onClick={() => setShowProfileMenu(false)}
                              className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50 text-primary hover:bg-emerald-100 font-bold border border-emerald-200"
                            >
                              <Store className="w-4 h-4 text-primary" />
                              Panel Mi Tienda
                            </Link>
                            <Link
                              to="/comercio/pedidos"
                              onClick={() => setShowProfileMenu(false)}
                              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 font-medium"
                            >
                              <ShoppingBag className="w-4 h-4 text-gray-400" />
                              Pedidos de clientes
                            </Link>
                            {currentUser?.merchantId ? (
                              <Link
                                to={`/comercio/${currentUser.merchantId}`}
                                onClick={() => setShowProfileMenu(false)}
                                className="flex items-center gap-2 p-2 rounded-lg hover:bg-emerald-50 font-medium text-emerald-800"
                              >
                                <Eye className="w-4 h-4 text-emerald-600" />
                                Ver mi tienda como cliente
                              </Link>
                            ) : null}
                            <Link
                              to="/comercio/tienda"
                              onClick={() => setShowProfileMenu(false)}
                              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 font-medium"
                            >
                              <User className="w-4 h-4 text-gray-400" />
                              Perfil del comercio
                            </Link>
                          </div>
                        ) : (
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
                        )}

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
                  <div className="pl-1 sm:pl-2 border-l border-gray-200 flex items-center">
                    <Link
                      to="/login"
                      className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-colors text-left text-gray-900"
                      aria-label="Ingresar a tu cuenta"
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center border border-gray-200">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="hidden md:flex flex-col leading-tight">
                        <span className="text-[10px] text-gray-500 font-normal">Hola,</span>
                        <span className="font-bold text-xs text-gray-900 flex items-center gap-0.5">
                          Inicia sesión <ChevronDown className="w-3 h-3 text-gray-400" />
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
              <div className="flex items-center justify-between text-xs pt-1 px-0.5 text-gray-700">
                <ZoneSelector variant="compact" />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Barra Inferior Verde Estilo Ripley (Imagen 2 Adaptada a Verde Oficial Quickly) */}
        <div className="bg-[#00a859] text-white border-b border-[#00914d] text-xs font-semibold shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between min-h-[38px] py-1 gap-4 overflow-x-auto scrollbar-none">
            {/* Enlaces de Categoría / Utilidad con iconos */}
            <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
              <Link
                to="/negocios?q=oferta"
                className="flex items-center gap-1.5 text-white hover:text-emerald-100 transition-colors whitespace-nowrap py-1 cursor-pointer"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Ofertas</span>
              </Link>

              <button
                type="button"
                onClick={() => setShowCouponsModal(true)}
                className="flex items-center gap-1.5 text-white hover:text-emerald-100 transition-colors whitespace-nowrap py-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Cupones</span>
              </button>

              <Link
                to={fashionLink}
                aria-disabled={!fashionCategory}
                onClick={(event) => { if (!fashionCategory) event.preventDefault(); }}
                className="flex items-center gap-1.5 text-white hover:text-emerald-100 transition-colors whitespace-nowrap py-1 cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Moda</span>
              </Link>

              {activeRole !== 'comercio' && (
                <Link
                  to="/cliente/pedidos"
                  className="flex items-center gap-1.5 text-white hover:text-emerald-100 transition-colors whitespace-nowrap py-1 cursor-pointer"
                >
                  <Bike className="w-3.5 h-3.5" />
                  <span>Sigue tu compra</span>
                </Link>
              )}

              <Link
                to="/cliente/ayuda"
                className="flex items-center gap-1.5 text-white hover:text-emerald-100 transition-colors whitespace-nowrap py-1 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>¿Necesitas ayuda?</span>
              </Link>
            </div>

            {/* Badges Derecha estilo Ripley: Vender en Quickly + Garantía Oficial */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <Link
                to={venderDestination}
                className="bg-white text-emerald-950 font-extrabold text-[11px] px-3.5 py-1 rounded-full shadow-2xs hover:bg-emerald-50 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Store className="w-3.5 h-3.5 text-[#00a859]" />
                <span>{hasMerchantRole ? 'Mi Tienda' : 'Vender en Quickly'}</span>
              </Link>

              <span className="hidden xl:inline-flex items-center gap-1 text-[11px] font-bold text-white bg-black/15 px-2.5 py-0.5 rounded-full border border-white/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Garantía oficial</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Drawer de Navegación Estilo Amazon (Imagen 1) - Departamentos y Funcionalidades */}
      {showMobileDrawer && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop oscurecedor */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setShowMobileDrawer(false)}
          />

          {/* Drawer panel */}
          <div className="fixed inset-y-0 left-0 max-w-[85vw] w-80 sm:w-88 bg-white text-ink shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-200">
            {/* Drawer Header estilo Amazon / Verde Oficial Quickly */}
            <div className="bg-emerald-950 text-white p-4 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] text-emerald-200 font-normal leading-tight">
                    {isAuthenticated && currentUser ? 'Bienvenido(a),' : 'Hola,'}
                  </p>
                  <p className="font-extrabold text-white text-sm truncate max-w-[170px]">
                    {isAuthenticated && currentUser ? currentUser.name : 'Hola, Identifícate'}
                  </p>
                </div>
              </div>
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
            {!isAuthenticated && (
              <div className="p-3 bg-emerald-50/70 border-b border-emerald-100 flex gap-2">
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
            )}

            {/* Navegación Principal con Departamentos (Estilo Imagen 1 de Amazon) */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-150 text-xs">
              {/* Sección 1: Buscar por departamento */}
              <div className="p-3 space-y-1">
                <h3 className="px-2 py-1 text-[11px] font-black text-gray-900 uppercase tracking-wider">
                  Buscar por departamento
                </h3>
                <Link
                  to="/negocios"
                  onClick={() => setShowMobileDrawer(false)}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-100 text-gray-700 font-medium transition-colors"
                >
                  <span>Todos los comercios</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/negocios?categoriaProducto=${encodeURIComponent(cat.id)}`}
                    onClick={() => setShowMobileDrawer(false)}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-100 text-gray-700 font-medium transition-colors"
                  >
                    <span className="truncate">{cat.name}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </Link>
                ))}
              </div>

              {/* Sección 2: Programas y funcionalidades */}
              <div className="p-3 space-y-1">
                <h3 className="px-2 py-1 text-[11px] font-black text-gray-900 uppercase tracking-wider">
                  Programas y servicios
                </h3>
                {activeRole === 'comercio' ? (
                  <>
                    <Link
                      to="/comercio/tienda"
                      onClick={() => setShowMobileDrawer(false)}
                      className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 text-primary font-bold transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-primary" />
                        <span>Panel Mi Tienda</span>
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                    <Link
                      to="/comercio/pedidos"
                      onClick={() => setShowMobileDrawer(false)}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-100 text-gray-700 font-medium transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-gray-400" />
                        <span>Pedidos de clientes</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </Link>
                    {currentUser?.merchantId ? (
                      <Link
                        to={`/comercio/${currentUser.merchantId}`}
                        onClick={() => setShowMobileDrawer(false)}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-emerald-50 text-emerald-800 font-medium transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-emerald-600" />
                          <span>Ver mi tienda como cliente</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </Link>
                    ) : null}
                  </>
                ) : (
                  <>
                    <Link
                      to="/cliente/favoritos"
                      onClick={() => setShowMobileDrawer(false)}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-100 text-gray-700 font-medium transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-gray-400" />
                        <span>Mis Favoritos</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </Link>
                    {isAuthenticated && (
                      <>
                        <Link
                          to="/cliente/pedidos"
                          onClick={() => setShowMobileDrawer(false)}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-100 text-gray-700 font-medium transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4 text-gray-400" />
                            <span>Mis Compras</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </Link>
                        <Link
                          to="/cliente/direcciones"
                          onClick={() => setShowMobileDrawer(false)}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-100 text-gray-700 font-medium transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span>Direcciones guardadas</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </Link>
                        <Link
                          to="/cliente/perfil"
                          onClick={() => setShowMobileDrawer(false)}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-100 text-gray-700 font-medium transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span>Mi Perfil</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </Link>
                      </>
                    )}
                  </>
                )}
                <Link
                  to={venderDestination}
                  onClick={() => setShowMobileDrawer(false)}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-100 text-gray-700 font-medium transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-gray-400" />
                    <span>{hasMerchantRole ? 'Mi Tienda' : 'Vender en Quickly'}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
                <Link
                  to="/registro/repartidor"
                  onClick={() => setShowMobileDrawer(false)}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-100 text-gray-700 font-medium transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Bike className="w-4 h-4 text-gray-400" />
                    <span>Ser Repartidor</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
                <Link
                  to="/cliente/ayuda"
                  onClick={() => setShowMobileDrawer(false)}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-100 text-gray-700 font-medium transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-gray-400" />
                    <span>Centro de Ayuda</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
              </div>

              {/* Paneles de gestión si aplica */}
              {(roles?.includes('comercio') || roles?.includes('admin') || roles?.includes('repartidor')) && (
                <div className="p-3 space-y-1">
                  <h3 className="px-2 py-1 text-[11px] font-black text-gray-900 uppercase tracking-wider">
                    Paneles de gestión
                  </h3>
                  {roles.includes('comercio') && (
                    <Link
                      to="/comercio/tienda"
                      onClick={() => setShowMobileDrawer(false)}
                      className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 text-primary font-bold"
                    >
                      <span>Panel Tienda</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  )}
                  {roles.includes('repartidor') && (
                    <Link
                      to="/repartidor/solicitudes"
                      onClick={() => setShowMobileDrawer(false)}
                      className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 text-primary font-bold"
                    >
                      <span>Panel Repartidor</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  )}
                  {roles.includes('admin') && (
                    <Link
                      to="/admin/resumen"
                      onClick={() => setShowMobileDrawer(false)}
                      className="flex items-center justify-between p-2 rounded-xl bg-purple-50 text-purple-700 font-bold"
                    >
                      <span>Panel Administrador</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Logout button si está autenticado */}
            {isAuthenticated && (
              <div className="p-3 border-t border-gray-100 bg-gray-50">
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
                  className="flex items-center gap-2 w-full p-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
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
