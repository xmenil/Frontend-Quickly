import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCustomerOrders } from '../orders/customerOrderModel';
import { useCustomerAddresses } from './customerAddressModel';
import { useFavoriteRecords, useCustomerNotifications } from './customerAccountModel';
import { useRemote, RemoteState } from '../operations/shared';
import { mediaApi, mediaUrl } from '../../services/api/mediaApi';
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
  const { currentUser, updateProfile, logout, roles } = useAuthStore();
  const orders = useCustomerOrders(); const addressResource = useCustomerAddresses();
  const favorites = useFavoriteRecords(); const notificationResource = useCustomerNotifications();
  const purchases = orders.data || []; const addresses = addressResource.data?.addresses || []; const zones = addressResource.data?.zones || [];
  const notifications = notificationResource.data || [];
  const avatar = useRemote('profile-avatar', signal => mediaApi.avatar(signal));
  const [actionError, setActionError] = useState(''); const [busy, setBusy] = useState(false); const actionRef = useRef(false);
  const avatarUrl = avatar.data?.url ? mediaUrl(avatar.data.url) : '';
  async function avatarAction(file?: File) {
    if (actionRef.current) return; actionRef.current = true; setBusy(true); setActionError(''); const owner = currentUser?.id;
    try { let content: string | undefined;
      if (file) { if (file.type !== 'image/png' || file.size > 2097152) throw new Error('Elige una imagen PNG de hasta 2 MB.');
        content = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.onerror = () => reject(new Error('No se pudo leer la imagen.')); reader.readAsDataURL(file); }); }
      if (useAuthStore.getState().currentUser?.id !== owner) return;
      const result = content ? await mediaApi.saveAvatar(content) : await mediaApi.removeAvatar();
      if (useAuthStore.getState().currentUser?.id !== owner) return;
      const user = useAuthStore.getState().currentUser; if (user) useAuthStore.setState({ currentUser: { ...user, avatarUrl: result.url ? mediaUrl(result.url) : undefined } }); avatar.reload();
    } catch (e) { setActionError(e instanceof Error ? e.message : 'No se pudo actualizar el avatar.'); }
    finally { actionRef.current = false; setBusy(false); }
  }
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
    .flatMap(p => p.merchantOrders).filter(order => order.status === 'entregado' && order.paymentStatus === 'pagado')
    .reduce((sum, order) => sum + order.totalCents, 0);

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
    (n) => !n.isRead
  ).length;

  // Favorites count
  const totalFavoritesCount = favorites.data?.length || 0;

  // Initials generator
  const getInitials = (fullName: string) => {
    if (!fullName) return 'CL';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  useEffect(() => { setName(currentUser?.name || ''); setPhone(currentUser?.phone || ''); setEmail(currentUser?.email || ''); setSaved(false); }, [currentUser?.id]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (actionRef.current) return; actionRef.current = true; setBusy(true); setSaved(false); setActionError(''); const owner = currentUser?.id;
    try { const result = await updateProfile({ name: name.trim(), phone: phone.trim(), email: email.trim() });
      if (useAuthStore.getState().currentUser?.id !== owner) return;
      if (!result.success) throw new Error(result.message); setSaved(true);
    } catch (e) { setActionError(e instanceof Error ? e.message : 'No se pudo guardar el perfil.'); } finally { actionRef.current = false; setBusy(false); }
  };
  const handleLogout = async () => { const result = await logout(); if (result.success) navigate('/login'); else setActionError(result.message || 'No se pudo cerrar sesión.'); };
  return (
    <div className="max-w-4xl mx-auto space-y-7 pb-20 sm:pb-8">
      {actionError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{actionError}</p>}
      {[orders, addressResource, favorites, notificationResource, avatar].map((resource, index) => <RemoteState key={index} loading={resource.loading} error={resource.error} retry={resource.reload} />)}
      {/* Header Profile Banner Integrado con Fondo Plomo y Tipografía Oechsle */}
      <div className="bg-[#eaeff2] rounded-3xl p-6 sm:p-7 border-0 relative overflow-hidden select-none">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Circular Avatar with Fallback Initials */}
            <div className="relative flex-shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={currentUser?.name || "Avatar"}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gray-950 text-white flex items-center justify-center font-black text-xl sm:text-2xl tracking-wider shadow-xs">
                  {getInitials(currentUser?.name || '')}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-4 h-4 rounded-full border-2 border-white" title="Usuario activo" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-gray-950 tracking-tight leading-tight">
                  {currentUser?.name || 'Cliente Quickly'}
                </h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded-full border border-gray-200">
                  <ShieldCheck className="w-3 h-3 text-gray-900" />
                  Cliente
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 font-medium flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-gray-500" />
                <span>{currentUser?.email || 'cliente@quickly.pe'}</span>
              </p>
              {defaultZone && (
                <p className="text-xs text-gray-600 font-medium flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-900" />
                  <span>Zona: {defaultZone.name}</span>
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="touch-target inline-flex items-center gap-2 text-xs font-bold text-gray-700 hover:text-gray-950 bg-white hover:bg-gray-100 border border-gray-300 px-4 py-2.5 rounded-full shadow-2xs transition-all self-start sm:self-center cursor-pointer"
          >
            <LogOut className="w-4 h-4 stroke-[2.2]" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>

      {/* Personal Statistics Strip con Líneas Simples y Agrupaciones */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Pedidos</span>
            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-900">
              <ShoppingBag className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-gray-950 tabular-nums">
              {orders.loading || orders.error ? "—" : totalOrdersCount}
            </div>
            <p className="text-[11px] text-gray-500 font-medium mt-0.5">
              {activeOrdersCount > 0 ? (
                <span className="text-emerald-700 font-bold">{activeOrdersCount} en curso</span>
              ) : (
                'Realizados'
              )}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Total pagado</span>
            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-900">
              <Sparkles className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-gray-950 tabular-nums">
              {orders.loading || orders.error ? "—" : formatCents(totalSpentCents)}
            </div>
            <p className="text-[11px] text-gray-500 font-medium mt-0.5">En pedidos entregados</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Comercios</span>
            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-900">
              <Store className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-gray-950 tabular-nums">
              {orders.loading || orders.error ? "—" : distinctMerchantsCount}
            </div>
            <p className="text-[11px] text-gray-500 font-medium mt-0.5">Negocios probados</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Dirección activa</span>
            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-900">
              <MapPin className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div>
            <div className="text-sm sm:text-base font-black text-gray-950 truncate">
              {defaultAddress ? defaultAddress.label : 'Sin dirección'}
            </div>
            <p className="text-[11px] text-gray-500 font-medium mt-0.5 truncate">
              {defaultAddress ? `${defaultAddress.street} #${defaultAddress.number}` : 'Añadir dirección'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Navigation Hub con Líneas Simples */}
      <div>
        <h2 className="text-base sm:text-lg font-black text-gray-950 tracking-tight mb-3.5">Accesos Rápidos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Link
            to={roles?.includes('comercio') ? '/comercio/tienda' : '/registro/comercio'}
            className="group bg-white p-4 rounded-xl border border-gray-200/90 hover:border-gray-950 shadow-2xs transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-900 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Store className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="font-black text-sm text-gray-950 group-hover:text-black transition-colors flex items-center gap-2">
                  <span>{roles?.includes('comercio') ? 'Mi Tienda' : 'Afiliar mi Negocio'}</span>
                  <span className="text-[10px] bg-gray-950 text-white font-bold px-1.5 py-0.5 rounded-full">
                    {roles?.includes('comercio') ? 'Panel Tienda' : 'Vender'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  {roles?.includes('comercio') ? 'Gestionar productos y comandas' : 'Envía tu solicitud para vender como tienda'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-950 group-hover:translate-x-0.5 transition-all" />
          </Link>
          <Link
            to="/cliente/pedidos"
            className="group bg-white p-4 rounded-xl border border-gray-200/90 hover:border-gray-950 shadow-2xs transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-900 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="font-black text-sm text-gray-950 group-hover:text-black transition-colors flex items-center gap-2">
                  <span>Mis Pedidos</span>
                  {activeOrdersCount > 0 && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full">
                      {activeOrdersCount} activo
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Historial y seguimiento en vivo</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-950 group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            to="/cliente/direcciones"
            className="group bg-white p-4 rounded-xl border border-gray-200/90 hover:border-gray-950 shadow-2xs transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-900 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <MapPin className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="font-black text-sm text-gray-950 group-hover:text-black transition-colors flex items-center gap-2">
                  <span>Mis Direcciones</span>
                  <span className="text-[10px] bg-gray-100 text-gray-700 font-bold px-1.5 py-0.5 rounded-full">
                    {userAddresses.length}
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Puntos de entrega en Tingo María</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-950 group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            to="/cliente/favoritos"
            className="group bg-white p-4 rounded-xl border border-gray-200/90 hover:border-gray-950 shadow-2xs transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-900 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Heart className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="font-black text-sm text-gray-950 group-hover:text-black transition-colors flex items-center gap-2">
                  <span>Mis Favoritos</span>
                  {totalFavoritesCount > 0 && (
                    <span className="text-[10px] bg-gray-100 text-gray-900 font-bold px-1.5 py-0.5 rounded-full">
                      {totalFavoritesCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Comercios y productos guardados</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-950 group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            to="/cliente/notificaciones"
            className="group bg-white p-4 rounded-xl border border-gray-200/90 hover:border-gray-950 shadow-2xs transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-900 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Bell className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="font-black text-sm text-gray-950 group-hover:text-black transition-colors flex items-center gap-2">
                  <span>Notificaciones</span>
                  {unreadNotificationsCount > 0 && (
                    <span className="text-[10px] bg-gray-950 text-white font-bold px-1.5 py-0.5 rounded-full">
                      {unreadNotificationsCount} nueva{unreadNotificationsCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Avisos de estado y promociones</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-950 group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            to="/cliente/ayuda"
            className="group bg-white p-4 rounded-xl border border-gray-200/90 hover:border-gray-950 shadow-2xs transition-colors flex items-center justify-between sm:col-span-2 lg:col-span-2"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-900 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <HelpCircle className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="font-black text-sm text-gray-950 group-hover:text-black transition-colors flex items-center gap-2">
                  <span>Centro de Ayuda & Soporte</span>
                  <span className="text-[10px] bg-gray-100 text-gray-800 font-bold px-2 py-0.5 rounded-full">
                    Consultar soporte
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Preguntas frecuentes y seguimiento de consultas</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-950 group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs"><label className="font-bold text-primary">Cambiar avatar (PNG, hasta 2 MB)<input aria-label="Cambiar avatar" type="file" accept="image/png" disabled={busy} className="block min-h-11 pt-2" onChange={e => { const file = e.target.files?.[0]; if (file) void avatarAction(file); e.target.value = ""; }} /></label>{avatarUrl && <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => void avatarAction()}>Quitar avatar</Button>}</div>
      {/* Edit Profile Form */}
      <div className="bg-white p-5 sm:p-7 rounded-2xl border border-gray-200/90 shadow-2xs space-y-5">
        <div>
          <h2 className="text-base sm:text-lg font-black text-gray-950 tracking-tight">Datos Personales</h2>
          <p className="text-xs sm:text-sm text-gray-500 font-medium">
            Información usada para la confirmación de tus compras y contacto telefónico del repartidor
          </p>
        </div>

        {saved && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs sm:text-sm text-emerald-800 font-bold flex items-center gap-2.5">
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
              <label className="text-xs font-bold text-gray-950 block">Zona Habitual en Tingo María</label>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-900 flex items-center justify-between">
                <span className="font-semibold">{defaultZone?.name || 'Centro de Tingo María'}</span>
                <Link to="/cliente/direcciones" className="text-gray-950 font-black hover:underline">
                  Cambiar
                </Link>
              </div>
              <p className="text-[11px] text-gray-500">Configurable desde tus direcciones guardadas.</p>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500 hidden sm:inline flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-gray-900" />
              Tus datos están protegidos en Quickly Tingo María
            </span>
            <Button type="submit" isLoading={busy} disabled={busy} variant="primary" size="md" className="min-h-[44px] px-8 rounded-full bg-gray-950 hover:bg-black text-white font-black text-xs sm:text-sm shadow-sm transition-all active:scale-95 cursor-pointer">
              Guardar Cambios
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
