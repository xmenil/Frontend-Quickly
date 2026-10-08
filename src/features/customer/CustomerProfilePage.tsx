import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useDataStore } from '../../store/dataStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { formatCents } from '../../lib/currency';
import {
  User,
  Mail,
  Phone,
  CheckCircle2,
  ShoppingBag,
  MapPin,
  Heart,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Store,
  Sparkles,
} from 'lucide-react';

export const CustomerProfilePage: React.FC = () => {
  const { currentUser, updateProfile, logout } = useAuthStore();
  const { purchases, addresses, favoriteMerchantIds, favoriteProductIds, notifications, zones } = useDataStore();
  const navigate = useNavigate();

  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [saved, setSaved] = useState(false);

  // User orders calculation
  const userPurchases = purchases.filter((p) => p.customerId === currentUser?.id);
  const totalOrdersCount = userPurchases.length;
  const activeOrdersCount = userPurchases.filter(
    (p) => p.status === 'pendiente' || p.status === 'en_proceso' || p.status === 'entrega_parcial'
  ).length;

  // Total spent in cents (only completed or active orders)
  const totalSpentCents = userPurchases
    .filter((p) => p.status !== 'cancelado')
    .reduce((sum, p) => sum + p.grandTotalCents, 0);

  // Distinct merchants ordered from
  const distinctMerchants = new Set<string>();
  userPurchases.forEach((p) => {
    p.merchantOrders?.forEach((mo) => distinctMerchants.add(mo.merchantId));
  });
  const distinctMerchantsCount = distinctMerchants.size;

  // Addresses & Defaults
  const userAddresses = addresses.filter((a) => a.userId === currentUser?.id);
  const defaultAddress = userAddresses.find((a) => a.isDefault) || userAddresses[0];
  const defaultZone = zones.find((z) => z.id === defaultAddress?.zoneId);

  // Unread notifications
  const unreadNotificationsCount = notifications.filter(
    (n) => n.userId === currentUser?.id && !n.isRead
  ).length;

  // Favorites count
  const totalFavoritesCount = favoriteMerchantIds.length + favoriteProductIds.length;

  // Initials generator
  const getInitials = (fullName: string) => {
    if (!fullName) return 'CL';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name: name.trim(), phone: phone.trim(), email: email.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-7 pb-20 sm:pb-8">
      {/* Header Profile Banner */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-subtle p-5 sm:p-7 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50/50 rounded-full blur-3xl -z-0 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Circular Avatar with Fallback Initials */}
            <div className="relative flex-shrink-0">
              {currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-primary-100 shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-primary to-primary-hover text-white flex items-center justify-center font-extrabold text-xl sm:text-2xl tracking-wider shadow-subtle">
                  {getInitials(currentUser?.name || '')}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-4 h-4 rounded-full border-2 border-white" title="Usuario activo" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-ink leading-tight">
                  {currentUser?.name || 'Cliente Quickly'}
                </h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-primary-50 px-2.5 py-0.5 rounded-full border border-primary-100">
                  <Sparkles className="w-3 h-3 text-primary" />
                  Cliente
                </span>
              </div>
              <p className="text-xs sm:text-sm text-ink-light flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-gray-500" />
                <span>{currentUser?.email || 'cliente@quickly.pe'}</span>
              </p>
              {defaultZone && (
                <p className="text-xs text-ink-light flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span>Zona: {defaultZone.name}</span>
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="touch-target inline-flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-red-700 bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-200 px-4 py-2.5 rounded-xl transition-all self-start sm:self-center"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>

      {/* Personal Statistics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold text-ink-light">Pedidos</span>
            <div className="w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center text-primary">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold text-ink tabular-nums">
              {totalOrdersCount}
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {activeOrdersCount > 0 ? (
                <span className="text-emerald-700 font-bold">{activeOrdersCount} en curso</span>
              ) : (
                'Realizados'
              )}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold text-ink-light">Total invertido</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold text-ink tabular-nums">
              {formatCents(totalSpentCents)}
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">En comercios locales</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold text-ink-light">Comercios</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold text-ink tabular-nums">
              {distinctMerchantsCount}
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">Negocios probados</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold text-ink-light">Dirección activa</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center text-sky-700">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-sm sm:text-base font-bold text-ink truncate">
              {defaultAddress ? defaultAddress.label : 'Sin dirección'}
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5 truncate">
              {defaultAddress ? `${defaultAddress.street} #${defaultAddress.number}` : 'Añadir dirección'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Navigation Hub */}
      <div>
        <h2 className="text-base sm:text-lg font-bold text-ink mb-3.5">Accesos Rápidos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Link
            to="/cliente/pedidos"
            className="group bg-white p-4 rounded-2xl border border-gray-100 hover:border-primary-200 shadow-subtle hover:shadow-md transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-ink group-hover:text-primary transition-colors flex items-center gap-2">
                  <span>Mis Pedidos</span>
                  {activeOrdersCount > 0 && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full">
                      {activeOrdersCount} activo
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-light mt-0.5">Historial y seguimiento en vivo</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            to="/cliente/direcciones"
            className="group bg-white p-4 rounded-2xl border border-gray-100 hover:border-primary-200 shadow-subtle hover:shadow-md transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-ink group-hover:text-primary transition-colors flex items-center gap-2">
                  <span>Mis Direcciones</span>
                  <span className="text-[10px] bg-gray-100 text-gray-700 font-bold px-1.5 py-0.5 rounded-full">
                    {userAddresses.length}
                  </span>
                </div>
                <p className="text-xs text-ink-light mt-0.5">Puntos de entrega en Tingo María</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            to="/cliente/favoritos"
            className="group bg-white p-4 rounded-2xl border border-gray-100 hover:border-primary-200 shadow-subtle hover:shadow-md transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-50 text-primary flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-ink group-hover:text-primary transition-colors flex items-center gap-2">
                  <span>Mis Favoritos</span>
                  {totalFavoritesCount > 0 && (
                    <span className="text-[10px] bg-pink-100 text-primary font-bold px-1.5 py-0.5 rounded-full">
                      {totalFavoritesCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-light mt-0.5">Comercios y platos preferidos</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            to="/cliente/notificaciones"
            className="group bg-white p-4 rounded-2xl border border-gray-100 hover:border-primary-200 shadow-subtle hover:shadow-md transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-ink group-hover:text-primary transition-colors flex items-center gap-2">
                  <span>Notificaciones</span>
                  {unreadNotificationsCount > 0 && (
                    <span className="text-[10px] bg-primary text-white font-bold px-1.5 py-0.5 rounded-full">
                      {unreadNotificationsCount} nueva{unreadNotificationsCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-light mt-0.5">Avisos de estado y promociones</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            to="/cliente/ayuda"
            className="group bg-white p-4 rounded-2xl border border-gray-100 hover:border-primary-200 shadow-subtle hover:shadow-md transition-all flex items-center justify-between sm:col-span-2 lg:col-span-2"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-ink group-hover:text-primary transition-colors flex items-center gap-2">
                  <span>Centro de Ayuda & Soporte</span>
                  <span className="text-[10px] bg-sky-100 text-sky-800 font-semibold px-2 py-0.5 rounded-full">
                    Responde &lt; 2h
                  </span>
                </div>
                <p className="text-xs text-ink-light mt-0.5">Preguntas frecuentes, contacto por WhatsApp y reclamos</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>
      </div>

      {/* Edit Profile Form */}
      <div className="bg-white p-5 sm:p-7 rounded-3xl border border-gray-100 shadow-subtle space-y-5">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-ink">Datos Personales</h2>
          <p className="text-xs sm:text-sm text-ink-light">
            Información usada para la confirmación de tus compras y contacto telefónico del repartidor
          </p>
        </div>

        {saved && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs sm:text-sm text-emerald-800 font-bold flex items-center gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Tus datos han sido actualizados con éxito.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nombres y Apellidos"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              leftIcon={<User className="w-4 h-4" />}
              placeholder="Ej. Nilver Valdivia"
            />
            <Input
              label="Correo Electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              leftIcon={<Mail className="w-4 h-4" />}
              placeholder="cliente@quickly.pe"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Teléfono / WhatsApp de contacto"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              leftIcon={<Phone className="w-4 h-4" />}
              placeholder="Ej. 962 123 456"
              helperText="El repartidor se comunicará a este número al llegar con tu pedido."
            />

            <div className="space-y-1">
              <label className="text-xs font-bold text-ink block">Zona Habitual en Tingo María</label>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-ink flex items-center justify-between">
                <span className="font-semibold">{defaultZone?.name || 'Centro de Tingo María'}</span>
                <Link to="/cliente/direcciones" className="text-primary font-bold hover:underline">
                  Cambiar
                </Link>
              </div>
              <p className="text-[11px] text-gray-500">Configurable desde tus direcciones guardadas.</p>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500 hidden sm:inline flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Tus datos están protegidos en Quickly Tingo María
            </span>
            <Button type="submit" variant="primary" size="md" className="min-h-[44px] px-6 font-bold shadow-sm">
              Guardar Cambios
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
