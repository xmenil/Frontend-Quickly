import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';
import { CategoriesDropdown } from './CategoriesDropdown';
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
  Ticket,
  Play,
  Copy,
  Check,
  X,
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
  const [showCouponsModal, setShowCouponsModal] = useState(false);
  const [showPlayModal, setShowPlayModal] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  const cartCount = getItemCount();
  const unreadNotifications = notifications.filter(
    (n) => (currentUser ? n.userId === currentUser.id : false) && !n.isRead
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/negocios?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(null), 2000);
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#BE185D] border-b border-[#9D174D] shadow-md select-none text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Row: Logo, Location, Search, Actions */}
          <div className="flex items-center justify-between h-14 sm:h-16 gap-3 sm:gap-6 pt-1">
            {/* Brand Logo & Location */}
            <div className="flex items-center gap-3 sm:gap-5 flex-shrink-0">
              <BrandLogo size="md" variant="white" />

              {/* Zone / Delivery Address ("Enviar a...") */}
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-white hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-white/20">
                <MapPin className="w-4 h-4 text-white flex-shrink-0" />
                <div className="flex flex-col leading-tight">
                  <span className="text-[10px] text-pink-100/80">Enviar a</span>
                  <select
                    value={selectedZoneId}
                    onChange={(e) => setSelectedZoneId(e.target.value)}
                    className="bg-transparent font-semibold text-xs text-white focus:outline-none cursor-pointer pr-1 [&>option]:text-ink"
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
            </div>

            {/* Search Bar - Crisp White Box with search icon */}
            <form
              onSubmit={handleSearchSubmit}
              className="hidden sm:flex flex-1 max-w-xl relative items-center"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar productos, marcas y más..."
                className="w-full bg-white rounded-lg py-2 pl-3.5 pr-12 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300 shadow-sm border border-transparent transition-all"
              />
              <button
                type="submit"
                aria-label="Buscar productos"
                className="absolute right-0 top-0 bottom-0 px-3 text-primary hover:text-primary-hover flex items-center justify-center transition-colors border-l border-gray-200"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>

            {/* Top Right Quick Actions & Role Switches */}
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

              {/* Promo Banner / Fast delivery pill */}
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

              {/* Profile Dropdown if logged in */}
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

          {/* Sub-bar matching Mercado Libre Reference:
              Categorías ⌵ | Ofertas | Cupones | Moda | Mercado Play [GRATIS] | Vender | Ayuda
              Right Side: Crea tu cuenta | Ingresa | Mis compras | 🛒 */}
          <div className="hidden md:flex items-center justify-between py-2 border-t border-white/10 text-xs text-white">
            {/* Left Nav Buttons */}
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Interactive Categorías Dropdown with caret & dark menu */}
              <CategoriesDropdown />

              {/* Ofertas */}
              <Link
                to="/negocios?q=oferta"
                className="text-white hover:text-pink-100 font-normal transition-colors flex items-center gap-1"
              >
                <span>Ofertas</span>
              </Link>

              {/* Cupones */}
              <button
                type="button"
                onClick={() => setShowCouponsModal(true)}
                className="text-white hover:text-pink-100 font-normal transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Cupones</span>
              </button>

              {/* Moda */}
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
                className="text-white hover:text-pink-100 font-normal transition-colors flex items-center gap-1.5 cursor-pointer group"
              >
                <span className="relative flex items-center">
                  <span className="bg-[#00a650] text-white text-[9px] font-black px-1 rounded uppercase tracking-wider leading-none py-0.5 shadow-sm">
                    GRATIS
                  </span>
                </span>
                <span className="font-medium">Mercado Play</span>
              </button>

              {/* Vender */}
              <Link
                to="/comercio/tienda"
                className="text-white hover:text-pink-100 font-normal transition-colors"
              >
                Vender
              </Link>

              {/* Ayuda */}
              <Link
                to="/cliente/ayuda"
                className="text-white hover:text-pink-100 font-normal transition-colors"
              >
                Ayuda
              </Link>
            </div>

            {/* Right Side User / Auth Links */}
            <div className="flex items-center gap-4 text-xs font-normal">
              {!isAuthenticated || !currentUser ? (
                <>
                  <Link
                    to="/registro"
                    className="text-white hover:text-pink-100 transition-colors"
                  >
                    Crea tu cuenta
                  </Link>
                  <Link
                    to="/login"
                    className="text-white hover:text-pink-100 transition-colors font-medium"
                  >
                    Ingresa
                  </Link>
                  <Link
                    to="/cliente/pedidos"
                    className="text-white hover:text-pink-100 transition-colors"
                  >
                    Mis compras
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/cliente/pedidos"
                    className="text-white hover:text-pink-100 transition-colors font-medium flex items-center gap-1"
                  >
                    Mis compras
                  </Link>
                  <Link
                    to="/cliente/perfil"
                    className="text-white hover:text-pink-100 transition-colors"
                  >
                    Hola {currentUser.name.split(' ')[0]}
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile Search Bar & Quick Categories */}
          <div className="sm:hidden pb-2.5 pt-1 space-y-2">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar en Tingo María..."
                className="w-full bg-white rounded-lg py-2 pl-9 pr-4 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300 shadow-sm"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 pointer-events-none" />
            </form>

            {/* Mobile Categories Quick Bar */}
            <div className="flex items-center justify-between text-xs text-white font-medium px-1">
              <CategoriesDropdown />
              <div className="flex items-center gap-3 text-[11px]">
                <Link to="/negocios?q=oferta" className="hover:underline text-white">
                  Ofertas
                </Link>
                <button type="button" onClick={() => setShowCouponsModal(true)} className="hover:underline text-white">
                  Cupones
                </button>
                <Link to="/cliente/pedidos" className="hover:underline text-white">
                  Mis compras
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Coupons Modal */}
      {showCouponsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-floating border border-gray-100 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-primary" />
                <h3 className="font-extrabold text-base text-ink">Cupones de Descuento</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCouponsModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              Aprovecha estos cupones exclusivos válidos para comercios y productos de Tingo María:
            </p>

            <div className="space-y-3">
              {[
                {
                  code: 'TINGO20',
                  discount: '20% OFF',
                  desc: 'Válido para tu primer pedido en Quickly',
                  min: 'Compra mínima S/ 25',
                },
                {
                  code: 'ENVIOSELVA',
                  discount: 'ENVÍO GRATIS',
                  desc: 'Envío sin costo en Rupa Rupa y Caseríos',
                  min: 'Sin mínimo de compra',
                },
                {
                  code: 'CACAO10',
                  discount: 'S/ 10 DCTO',
                  desc: 'En chocolates nativos, café y derivados',
                  min: 'Compra mínima S/ 40',
                },
              ].map((coupon) => (
                <div
                  key={coupon.code}
                  className="p-3.5 rounded-xl border border-dashed border-primary/40 bg-pink-50/50 flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-primary tracking-wider">
                        {coupon.code}
                      </span>
                      <span className="text-[10px] font-bold bg-primary text-white px-1.5 py-0.5 rounded">
                        {coupon.discount}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-gray-700">{coupon.desc}</p>
                    <p className="text-[10px] text-gray-400">{coupon.min}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => copyCouponCode(coupon.code)}
                    className="flex items-center gap-1 text-xs font-bold text-primary bg-white border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-primary hover:text-white transition-all shadow-sm flex-shrink-0"
                  >
                    {copiedCoupon === coupon.code ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowCouponsModal(false);
                  navigate('/negocios');
                }}
                className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors shadow-sm"
              >
                Explorar productos con descuento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mercado Play / Quickly Play Modal */}
      {showPlayModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-floating border border-gray-100 space-y-4 animate-in zoom-in-95 text-ink">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="bg-[#00a650] text-white text-[10px] font-black px-1.5 py-0.5 rounded uppercase">
                  GRATIS
                </span>
                <h3 className="font-extrabold text-base text-ink">Mercado Play en Quickly</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPlayModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Preview Card */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-neutral-900 flex items-center justify-center shadow-inner group">
              <img
                src="https://images.unsplash.com/photo-1518457607834-6e8d80c183c5?w=800&auto=format&fit=crop&q=80"
                alt="Quickly Play Selva"
                className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
              <div className="absolute flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full bg-primary/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 ml-1 fill-white" />
                </div>
                <span className="text-white text-xs font-bold drop-shadow">
                  Documental: La Bella Durmiente y el Cacao Nativo
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Disfruta de películas, series, tutoriales de gastronomía regional y documentales de la selva central sin pagar ninguna suscripción.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPlayModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition-colors"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => setShowPlayModal(false)}
                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors shadow-sm"
              >
                Ver ahora gratis
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
