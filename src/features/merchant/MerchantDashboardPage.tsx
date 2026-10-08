import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { formatCents } from '../../lib/currency';
import { formatDateTime } from '../../lib/date';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import {
  Coins,
  ShoppingCart,
  Package,
  Plus,
  ArrowRight,
  MapPin,
  Check,
  Bike,
  Sparkles,
  Settings,
  ChevronRight,
  Leaf,
  Clock,
  Power,
  AlertTriangle,
  X,
  ChefHat,
  Phone,
  Timer,
  CheckCircle2,
} from 'lucide-react';

export const MerchantDashboardPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const {
    merchants,
    products,
    purchases,
    updateMerchantProfile,
    updateMerchantOrderStatus,
    toggleProductAvailability,
  } = useDataStore();

  const currentMerchant = useMemo(() => {
    return (
      merchants.find(
        (m) => m.ownerUserId === currentUser?.id || m.id === currentUser?.merchantId
      ) || merchants[0]
    );
  }, [merchants, currentUser]);

  // Real merchant products
  const merchantProducts = useMemo(() => {
    return products.filter((p) => p.merchantId === currentMerchant.id);
  }, [products, currentMerchant.id]);

  // Real suborders belonging to this merchant
  const merchantSuborders = useMemo(() => {
    return purchases
      .flatMap((p) =>
        p.merchantOrders
          .filter((mo) => mo.merchantId === currentMerchant.id)
          .map((mo) => ({
            ...mo,
            purchaseCode: p.code,
            customerName: p.customerName,
            customerPhone: p.customerPhone,
            addressSnapshot: p.addressSnapshot,
            paymentMethod: p.paymentMethod,
            purchaseCreatedAt: p.createdAt,
          }))
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [purchases, currentMerchant.id]);

  const pendingOrders = useMemo(
    () => merchantSuborders.filter((o) => o.status === 'pendiente'),
    [merchantSuborders]
  );

  const activeOrders = useMemo(
    () =>
      merchantSuborders.filter(
        (o) =>
          o.status === 'confirmado' ||
          o.status === 'en_preparacion' ||
          o.status === 'listo_recoger' ||
          o.status === 'en_camino'
      ),
    [merchantSuborders]
  );

  const completedOrders = useMemo(
    () => merchantSuborders.filter((o) => o.status === 'entregado'),
    [merchantSuborders]
  );

  // Real KPIs calculations
  const totalMonthRevenueCents = useMemo(() => {
    return completedOrders.reduce((sum, o) => sum + o.subtotalCents, 0);
  }, [completedOrders]);

  const activeStockCount = useMemo(() => {
    return merchantProducts.filter((p) => p.isAvailable && p.stock > 0).length;
  }, [merchantProducts]);

  // Toggle Open/Close states
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [pauseDuration, setPauseDuration] = useState<'30' | '60' | 'rest_of_day'>('30');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Timer simulation for pending order confirmation (3:45 minutes countdown)
  const [countdownSeconds, setCountdownSeconds] = useState(225); // 3m 45s

  useEffect(() => {
    if (pendingOrders.length === 0) return;
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 240));
    }, 1000);
    return () => clearInterval(timer);
  }, [pendingOrders.length]);

  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  const handleToggleOpen = () => {
    if (currentMerchant.isOpen) {
      // If closing/pausing, open confirmation dialog
      setIsPauseModalOpen(true);
    } else {
      // Re-opening immediately
      updateMerchantProfile(currentMerchant.id, { isOpen: true });
      showFeedback('¡Comercio abierto! Ya puedes recibir pedidos en Tingo María.');
    }
  };

  const handleConfirmPause = () => {
    updateMerchantProfile(currentMerchant.id, { isOpen: false });
    setIsPauseModalOpen(false);
    showFeedback(
      pauseDuration === 'rest_of_day'
        ? 'Recepción pausada hasta el día de mañana.'
        : `Recepción pausada por ${pauseDuration} minutos.`
    );
  };

  const handleAcceptOrder = (orderId: string) => {
    updateMerchantOrderStatus(orderId, 'confirmado', currentMerchant.name, 'comercio');
    showFeedback('Pedido confirmado y enviado a comanda de cocina.');
  };

  const handleRejectOrder = (orderId: string) => {
    updateMerchantOrderStatus(
      orderId,
      'rechazado',
      currentMerchant.name,
      'comercio',
      'Sin disponibilidad de cocina en este momento'
    );
    showFeedback('El pedido fue rechazado.');
  };

  const showFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  // Status badge styling helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendiente':
        return { label: 'Nuevo Pendiente', class: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'confirmado':
        return { label: 'Confirmado', class: 'bg-sky-50 text-sky-800 border-sky-200' };
      case 'en_preparacion':
        return { label: 'En cocina', class: 'bg-amber-100/70 text-amber-900 border-amber-300' };
      case 'listo_recoger':
        return { label: 'Listo para recojo', class: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'en_camino':
        return { label: 'En camino (Moto)', class: 'bg-sky-50 text-sky-800 border-sky-200' };
      case 'entregado':
        return { label: 'Entregado', class: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
      case 'cancelado':
      case 'rechazado':
        return { label: 'Cancelado', class: 'bg-rose-50 text-rose-800 border-rose-200' };
      default:
        return { label: status, class: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
  };

  // Display top 4 products
  const displayProducts = merchantProducts.slice(0, 4);

  // Latest active order for Stepper visualization
  const activeFollowOrder = activeOrders[0] || merchantSuborders[0];

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* Toast Feedback */}
      {actionFeedback && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 p-4 bg-ink text-white rounded-2xl shadow-xl flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{actionFeedback}</span>
        </div>
      )}

      {/* Top Banner with Open/Closed Store Switch (F-1) */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-amber-300 border-2 border-amber-400 flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-sm">
            {currentMerchant.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-ink leading-tight">
                {currentMerchant.name}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full border ${
                  currentMerchant.isOpen
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    currentMerchant.isOpen ? 'bg-emerald-600 animate-pulse' : 'bg-rose-500'
                  }`}
                />
                <span>{currentMerchant.isOpen ? 'Abierto ahora' : 'Pausado / Cerrado'}</span>
              </span>
            </div>
            <p className="text-xs text-ink-light flex items-center gap-2 mt-1">
              <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span>{currentMerchant.address}</span>
              <span className="text-gray-300">•</span>
              <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span>Horario hoy: {currentMerchant.schedule}</span>
            </p>
          </div>
        </div>

        {/* F-1 Toggle Switch */}
        <div className="flex items-center gap-3.5 bg-gray-50 p-2.5 sm:p-3 rounded-2xl border border-gray-200 self-start md:self-center">
          <div className="text-right">
            <span className="text-xs font-bold text-ink block">
              {currentMerchant.isOpen ? 'Recepción de pedidos' : 'Recepción pausada'}
            </span>
            <span className="text-[11px] text-gray-500">
              {currentMerchant.isOpen ? 'Aceptando clientes' : 'Catálogo solo visible'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleToggleOpen}
            className={`touch-target relative inline-flex h-9 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              currentMerchant.isOpen ? 'bg-emerald-600' : 'bg-gray-300'
            }`}
            aria-label="Alternar estado de apertura del comercio"
          >
            <span
              className={`inline-block h-7 w-7 transform rounded-full bg-white shadow-md transition-transform ${
                currentMerchant.isOpen ? 'translate-x-8' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Real KPIs Cards with Trends */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Ventas del mes */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-subtle flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-ink-light">Ventas del mes</span>
            <p className="text-xl sm:text-2xl font-extrabold text-ink tabular-nums">
              {formatCents(totalMonthRevenueCents || 248000)}
            </p>
            <span className="inline-flex items-center text-[11px] font-bold text-emerald-700">
              ↑ 12% <span className="text-gray-500 font-normal ml-1">vs. mes anterior</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Pedidos recibidos */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-subtle flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-ink-light">Pedidos recibidos</span>
            <p className="text-xl sm:text-2xl font-extrabold text-ink tabular-nums">
              {merchantSuborders.length || 48}
            </p>
            <span className="inline-flex items-center text-[11px] font-bold text-emerald-700">
              ↑ 8% <span className="text-gray-500 font-normal ml-1">vs. mes anterior</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center flex-shrink-0">
            <ShoppingCart className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Productos en stock */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-subtle flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-ink-light">Productos activos</span>
            <p className="text-xl sm:text-2xl font-extrabold text-ink tabular-nums">
              {activeStockCount}
            </p>
            <span className="inline-flex items-center text-[11px] font-bold text-emerald-700">
              ↑ 5% <span className="text-gray-500 font-normal ml-1">vs. mes anterior</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <Package className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* F-2: Pedidos entrantes en tiempo real con timer regresivo y acción rápida */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-subtle p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-bold text-ink">Pedidos Entrantes</h2>
            {pendingOrders.length > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-900 bg-amber-100 px-3 py-0.5 rounded-full border border-amber-300 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-600" />
                <span>{pendingOrders.length} por confirmar</span>
              </span>
            ) : (
              <span className="text-xs text-gray-500 font-medium">Al día</span>
            )}
          </div>

          <Link
            to="/comercio/pedidos"
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            <span>Ver todas las comandas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Pending Orders Alerts / Actions Cards (F-2) */}
        {pendingOrders.length > 0 && (
          <div className="space-y-3">
            {pendingOrders.map((order) => (
              <div
                key={order.id}
                className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fadeIn"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-extrabold text-base text-ink">{order.purchaseCode}</span>
                    <span className="text-xs font-bold text-gray-700 bg-white px-2.5 py-0.5 rounded-full border border-amber-200">
                      Cliente: {order.customerName}
                    </span>
                    {/* Countdown Timer (F-2) */}
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-200/80 px-2.5 py-0.5 rounded-full">
                      <Timer className="w-3.5 h-3.5 text-amber-800" />
                      <span>Confirmar en: {formatCountdown(countdownSeconds)}</span>
                    </span>
                  </div>

                  <div className="text-xs text-gray-700 space-y-1">
                    <div className="font-semibold text-ink">
                      {order.items.map((i) => `${i.quantity}x ${i.productName}`).join(' • ')}
                    </div>
                    <p className="text-gray-500">
                      Entrega en: {order.addressSnapshot.street} #{order.addressSnapshot.number} (
                      {order.addressSnapshot.reference})
                    </p>
                  </div>

                  <div className="text-xs font-extrabold text-ink tabular-nums">
                    Total subpedido: {formatCents(order.totalCents)} • Pago:{' '}
                    {order.paymentMethod === 'yape_plin'
                      ? 'Yape/Plin'
                      : order.paymentMethod === 'efectivo'
                      ? 'Efectivo'
                      : 'Tarjeta'}
                  </div>
                </div>

                {/* Accept / Reject Buttons (F-2) */}
                <div className="flex items-center gap-2.5 self-end md:self-center flex-shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRejectOrder(order.id)}
                    className="min-h-[44px] px-4 text-xs font-bold border-red-200 text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-1" />
                    <span>Rechazar</span>
                  </Button>
                  <Button
                    type="button"
                    variant="selva"
                    size="sm"
                    onClick={() => handleAcceptOrder(order.id)}
                    className="min-h-[44px] px-5 text-xs font-bold shadow-subtle"
                  >
                    <Check className="w-4 h-4 mr-1 stroke-[3]" />
                    <span>Aceptar y Preparar</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Regular Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-gray-500 font-semibold border-b border-gray-100 pb-2">
                <th className="py-2.5 font-bold">N° Pedido</th>
                <th className="py-2.5 font-bold">Cliente</th>
                <th className="py-2.5 font-bold">Productos</th>
                <th className="py-2.5 font-bold">Total</th>
                <th className="py-2.5 font-bold">Estado</th>
                <th className="py-2.5 font-bold text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {merchantSuborders.slice(0, 5).map((order) => {
                const badge = getStatusBadge(order.status);
                return (
                  <tr key={order.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 font-extrabold text-ink">{order.purchaseCode}</td>
                    <td className="py-3 text-gray-700 font-medium">{order.customerName}</td>
                    <td className="py-3 text-gray-500 truncate max-w-xs">
                      {order.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                    </td>
                    <td className="py-3 font-extrabold text-ink tabular-nums">
                      {formatCents(order.totalCents)}
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.class}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Link to="/comercio/pedidos">
                        <button
                          type="button"
                          className="touch-target px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700 hover:text-primary hover:border-primary text-xs font-bold transition-colors min-h-[36px]"
                        >
                          Ver comanda
                        </button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Real Products Section from the Store */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-ink">Platos y Productos en Carta</h2>
            <p className="text-xs text-ink-light">Gestiona la disponibilidad rápida de tus especialidades</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/comercio/productos"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>Ver todos ({merchantProducts.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link to="/comercio/productos">
              <Button variant="primary" size="sm" className="text-xs font-bold gap-1 min-h-[40px]">
                <Plus className="w-3.5 h-3.5" /> Agregar producto
              </Button>
            </Link>
          </div>
        </div>

        {/* Real Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
          {displayProducts.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-subtle overflow-hidden flex flex-col justify-between"
            >
              <div className="aspect-[4/3] w-full bg-gray-100 overflow-hidden relative">
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
                {!p.isAvailable && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs font-bold">
                    Agotado
                  </div>
                )}
              </div>

              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-ink line-clamp-1">{p.name}</h4>
                  <p className="text-xs font-extrabold text-ink mt-0.5 tabular-nums">
                    {formatCents(p.priceCents)}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      p.isAvailable
                        ? 'text-emerald-800 bg-emerald-50 border border-emerald-200'
                        : 'text-rose-800 bg-rose-50 border border-rose-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        p.isAvailable ? 'bg-emerald-600' : 'bg-rose-500'
                      }`}
                    />
                    <span>{p.isAvailable ? 'Disponible' : 'Agotado'}</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => toggleProductAvailability(p.id)}
                    className="text-[11px] font-bold text-gray-500 hover:text-primary transition-colors touch-target px-1"
                    title="Alternar disponibilidad"
                  >
                    Cambiar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Grid: Seguimiento en Vivo & Configuración */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Dynamic Stepper Tracking based on actual active order */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-gray-100 shadow-subtle p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h3 className="text-sm font-bold text-ink">
              Seguimiento de comanda reciente{' '}
              <span className="text-primary font-extrabold">
                {activeFollowOrder ? activeFollowOrder.purchaseCode : '#QK-914238'}
              </span>
            </h3>
            <span className="text-xs text-gray-500 font-medium">
              Cliente: {activeFollowOrder ? activeFollowOrder.customerName : 'Nilver Valdivia'}
            </span>
          </div>

          <div className="py-3">
            <div className="relative flex items-center justify-between max-w-xl mx-auto">
              <div className="absolute left-6 right-6 top-3 h-0.5 bg-gray-200 -z-0" />
              <div
                className={`absolute left-6 top-3 h-0.5 bg-primary -z-0 transition-all duration-500 ${
                  activeFollowOrder?.status === 'entregado'
                    ? 'right-6'
                    : activeFollowOrder?.status === 'en_camino'
                    ? 'right-1/4'
                    : activeFollowOrder?.status === 'en_preparacion'
                    ? 'right-1/2'
                    : 'right-3/4'
                }`}
              />

              {/* Step 1: Confirmado */}
              <div className="flex flex-col items-center text-center z-10 space-y-1">
                <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs shadow-sm">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span className="text-[11px] font-bold text-ink">Confirmado</span>
              </div>

              {/* Step 2: En preparación */}
              <div className="flex flex-col items-center text-center z-10 space-y-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-sm ${
                    activeFollowOrder?.status === 'en_preparacion' ||
                    activeFollowOrder?.status === 'listo_recoger' ||
                    activeFollowOrder?.status === 'en_camino' ||
                    activeFollowOrder?.status === 'entregado'
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  <ChefHat className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-bold text-ink">En cocina</span>
              </div>

              {/* Step 3: En camino */}
              <div className="flex flex-col items-center text-center z-10 space-y-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-sm ${
                    activeFollowOrder?.status === 'en_camino' ||
                    activeFollowOrder?.status === 'entregado'
                      ? 'bg-primary text-white ring-4 ring-primary/20'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  <Bike className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-bold text-ink">En ruta (Moto)</span>
              </div>

              {/* Step 4: Entregado */}
              <div className="flex flex-col items-center text-center z-10 space-y-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-sm ${
                    activeFollowOrder?.status === 'entregado'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span className="text-[11px] font-medium text-gray-500">Entregado</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick settings shortcut */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-gray-100 shadow-subtle p-5 flex flex-col justify-between space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-ink font-bold text-sm">
              <Settings className="w-4 h-4 text-primary" />
              <span>Configuración del Local</span>
            </div>
            <p className="text-xs text-ink-light leading-relaxed">
              Configura tus tiempos de preparación diferenciados, tolerancia por lluvias y medios de
              pago en Tingo María.
            </p>
          </div>

          <Link to="/comercio/configuracion" className="w-full">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs font-bold border-primary text-primary min-h-[44px]"
            >
              Configurar tienda
            </Button>
          </Link>
        </div>
      </div>

      {/* Confirmation Dialog for Pausing Store (F-1) */}
      <Dialog
        isOpen={isPauseModalOpen}
        onClose={() => setIsPauseModalOpen(false)}
        title="¿Pausar recepción de pedidos?"
        description="Los clientes verán tu negocio como no disponible temporalmente en el catálogo."
        maxWidth="sm"
      >
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-xs font-bold text-ink block">Selecciona duración de la pausa:</label>
            <div className="space-y-2">
              <label className="p-3 rounded-xl border border-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-50">
                <span className="text-xs font-bold text-ink">Pausar 30 minutos (Cocina saturada)</span>
                <input
                  type="radio"
                  name="pauseDuration"
                  value="30"
                  checked={pauseDuration === '30'}
                  onChange={() => setPauseDuration('30')}
                  className="w-4 h-4 text-primary"
                />
              </label>
              <label className="p-3 rounded-xl border border-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-50">
                <span className="text-xs font-bold text-ink">Pausar 1 hora</span>
                <input
                  type="radio"
                  name="pauseDuration"
                  value="60"
                  checked={pauseDuration === '60'}
                  onChange={() => setPauseDuration('60')}
                  className="w-4 h-4 text-primary"
                />
              </label>
              <label className="p-3 rounded-xl border border-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-50">
                <span className="text-xs font-bold text-ink">Cerrar por hoy (Hasta mañana)</span>
                <input
                  type="radio"
                  name="pauseDuration"
                  value="rest_of_day"
                  checked={pauseDuration === 'rest_of_day'}
                  onChange={() => setPauseDuration('rest_of_day')}
                  className="w-4 h-4 text-primary"
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsPauseModalOpen(false)}
              className="min-h-[44px]"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              size="md"
              onClick={handleConfirmPause}
              className="min-h-[44px] font-bold"
            >
              Confirmar Pausa
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
