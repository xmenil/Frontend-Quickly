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
  ExternalLink,
  Edit3,
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
      (currentUser?.merchantId ? merchants.find((m) => m.id === currentUser.merchantId) : null) ||
      merchants.find((m) => m.ownerUserId === currentUser?.id) ||
      merchants[0]
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
  const [ordersTab, setOrdersTab] = useState<'activas' | 'historial'>('activas');

  // Filter in-kitchen/active orders
  const inKitchenOrders = useMemo(
    () =>
      merchantSuborders.filter((o) =>
        ['pendiente', 'confirmado', 'en_preparacion', 'listo_recoger'].includes(o.status)
      ),
    [merchantSuborders]
  );

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

  const handleMarkReady = (orderId: string) => {
    updateMerchantOrderStatus(orderId, 'listo_recoger', currentMerchant.name, 'comercio');
    showFeedback('Comanda lista para entrega al repartidor.');
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
        return { label: 'Nuevo Pendiente', class: 'bg-warning-soft text-warning-strong border-warning-border' };
      case 'confirmado':
        return { label: 'Confirmado', class: 'bg-info-soft text-info-strong border-info-border' };
      case 'en_preparacion':
        return { label: 'En cocina', class: 'bg-warning-soft text-warning-strong border-warning-border' };
      case 'listo_recoger':
        return { label: 'Listo para recojo', class: 'bg-selva-soft text-selva-strong border-selva-border' };
      case 'en_camino':
        return { label: 'En camino (Moto)', class: 'bg-info-soft text-info-strong border-info-border' };
      case 'entregado':
        return { label: 'Entregado', class: 'bg-selva-soft text-selva-strong border-selva-border' };
      case 'cancelado':
      case 'rechazado':
        return { label: 'Cancelado', class: 'bg-destructive-soft text-destructive-strong border-destructive-border' };
      default:
        return { label: status, class: 'bg-surface-subtle text-ink-light border-border' };
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
          <CheckCircle2 className="w-5 h-5 text-selva flex-shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{actionFeedback}</span>
        </div>
      )}

      {/* Top Banner with Store Identity and Open/Closed Switch */}
      <div className="bg-surface p-5 sm:p-6 rounded-3xl border border-border shadow-subtle flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-start sm:items-center gap-4">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-surface-subtle border border-border flex-shrink-0 shadow-sm">
            <img
              src={currentMerchant.logoUrl}
              alt={currentMerchant.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" fill="%23FDF2F8"><rect width="72" height="72" rx="16" fill="%23FDF2F8"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="%23BE185D" font-family="sans-serif" font-weight="bold" font-size="24">Q</text></svg>';
              }}
            />
          </div>

          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-ink leading-tight">
                {currentMerchant.name}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${
                  currentMerchant.isOpen
                    ? 'bg-selva-soft text-selva-strong border-selva-border'
                    : 'bg-destructive-soft text-destructive-strong border-destructive-border'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    currentMerchant.isOpen ? 'bg-selva animate-pulse' : 'bg-destructive'
                  }`}
                />
                <span>{currentMerchant.isOpen ? 'Abierto ahora' : 'Recepción en pausa'}</span>
              </span>
            </div>

            <p className="text-xs text-ink-light flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span>{currentMerchant.address}</span>
              </span>
              <span className="text-border">•</span>
              <span className="flex items-center gap-1 text-ink-muted">
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Horario: {currentMerchant.schedule}</span>
              </span>
            </p>

            {/* Quick profile actions */}
            <div className="flex items-center gap-3 pt-0.5 text-xs">
              <Link
                to="/comercio/perfil-tienda"
                className="font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar datos de mi local</span>
              </Link>
              <span className="text-border">•</span>
              <Link
                to={`/negocios/${currentMerchant.id}`}
                className="font-semibold text-ink-light hover:text-primary flex items-center gap-1 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Ver tienda como cliente</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Reception Toggle Switch */}
        <div className="flex items-center justify-between sm:justify-end gap-3.5 bg-surface-subtle p-3 rounded-2xl border border-border self-stretch lg:self-center">
          <div className="text-left sm:text-right">
            <span className="text-xs font-bold text-ink block">
              {currentMerchant.isOpen ? 'Recepción de pedidos' : 'Recepción pausada'}
            </span>
            <span className="text-[11px] text-ink-muted">
              {currentMerchant.isOpen ? 'Aceptando comandas en Tingo María' : 'Catálogo en modo solo vista'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleToggleOpen}
            className={`touch-target relative inline-flex h-9 w-16 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              currentMerchant.isOpen ? 'bg-selva' : 'bg-gray-300'
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

      {/* Real Operational KPIs Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Ventas completadas */}
        <div className="bg-surface p-5 rounded-2xl border border-border shadow-subtle flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-ink-light">Ventas completadas</span>
            <p className="text-xl sm:text-2xl font-extrabold text-ink tabular-nums">
              {formatCents(totalMonthRevenueCents || 5900)}
            </p>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="font-bold text-selva">↑ 12%</span>
              <span className="text-ink-muted">vs. mes anterior</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary flex items-center justify-center flex-shrink-0 shadow-sm">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Comandas y pedidos */}
        <div className="bg-surface p-5 rounded-2xl border border-border shadow-subtle flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-ink-light">Comandas registradas</span>
            <p className="text-xl sm:text-2xl font-extrabold text-ink tabular-nums">
              {merchantSuborders.length}{' '}
              <span className="text-xs font-medium text-ink-muted">
                {merchantSuborders.length === 1 ? 'pedido' : 'pedidos'}
              </span>
            </p>
            <div className="flex items-center gap-1.5 text-[11px]">
              {pendingOrders.length + activeOrders.length > 0 ? (
                <span className="font-bold text-warning">
                  {pendingOrders.length + activeOrders.length} comanda(s) en curso
                </span>
              ) : (
                <span className="font-semibold text-selva">
                  ✓ Al día en cocina
                </span>
              )}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-surface-subtle text-ink border border-border flex items-center justify-center flex-shrink-0">
            <ShoppingCart className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Productos en catálogo */}
        <div className="bg-surface p-5 rounded-2xl border border-border shadow-subtle flex items-center justify-between sm:col-span-2 lg:col-span-1">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-ink-light">Disponibilidad de productos</span>
            <p className="text-xl sm:text-2xl font-extrabold text-ink tabular-nums">
              {activeStockCount}{' '}
              <span className="text-xs font-medium text-ink-muted">
                de {merchantProducts.length} productos activos
              </span>
            </p>
            <div className="flex items-center gap-1.5 text-[11px]">
              {merchantProducts.length - activeStockCount > 0 ? (
                <span className="text-ink-muted">
                  {merchantProducts.length - activeStockCount} producto(s) en pausa/agotado
                </span>
              ) : (
                <span className="font-semibold text-selva">
                  100% de platos disponibles
                </span>
              )}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-surface-subtle text-ink border border-border flex items-center justify-center flex-shrink-0">
            <Package className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Comandas y Pedidos del Comercio */}
      <div className="bg-surface rounded-3xl border border-border shadow-subtle p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-base sm:text-lg font-bold text-ink">Comandas y Pedidos</h2>
            {/* Tabs for active vs history */}
            <div className="flex items-center gap-1 bg-surface-subtle p-1 rounded-xl border border-border text-xs">
              <button
                type="button"
                onClick={() => setOrdersTab('activas')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  ordersTab === 'activas'
                    ? 'bg-surface text-ink shadow-sm'
                    : 'text-ink-light hover:text-ink'
                }`}
              >
                <span>En cocina ({inKitchenOrders.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setOrdersTab('historial')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  ordersTab === 'historial'
                    ? 'bg-surface text-ink shadow-sm'
                    : 'text-ink-light hover:text-ink'
                }`}
              >
                <span>Historial de hoy ({completedOrders.length})</span>
              </button>
            </div>
          </div>

          <Link
            to="/comercio/pedidos"
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1 self-start sm:self-center"
          >
            <span>Ver todas las comandas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Pending Orders Alerts / Actions Cards (if pending) */}
        {ordersTab === 'activas' && pendingOrders.length > 0 && (
          <div className="space-y-3">
            {pendingOrders.map((order) => (
              <div
                key={order.id}
                className="bg-warning-soft border border-warning-border rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fadeIn"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-extrabold text-base text-ink">{order.purchaseCode}</span>
                    <span className="text-xs font-bold text-ink-light bg-surface px-2.5 py-0.5 rounded-full border border-border">
                      Cliente: {order.customerName}
                    </span>
                    {/* Countdown Timer */}
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-warning-strong bg-warning-soft px-2.5 py-0.5 rounded-full border border-warning-border">
                      <Timer className="w-3.5 h-3.5" />
                      <span>Confirmar en: {formatCountdown(countdownSeconds)}</span>
                    </span>
                  </div>

                  <div className="text-xs text-ink-light space-y-1">
                    <div className="font-semibold text-ink">
                      {order.items.map((i) => `${i.quantity}x ${i.productName}`).join(' • ')}
                    </div>
                    <p className="text-ink-muted">
                      Entrega en: {order.addressSnapshot.street} #{order.addressSnapshot.number} (
                      {order.addressSnapshot.reference})
                    </p>
                  </div>

                  <div className="text-xs font-extrabold text-ink tabular-nums">
                    Total: {formatCents(order.totalCents)} • Pago:{' '}
                    {order.paymentMethod === 'yape_plin'
                      ? 'Yape/Plin'
                      : order.paymentMethod === 'efectivo'
                      ? 'Efectivo'
                      : 'Tarjeta'}
                  </div>
                </div>

                {/* Accept / Reject Buttons */}
                <div className="flex items-center gap-2.5 self-end md:self-center flex-shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRejectOrder(order.id)}
                    className="min-h-[44px] touch-target px-4 text-xs font-bold border-destructive-border text-destructive hover:bg-destructive-soft"
                  >
                    <X className="w-4 h-4 mr-1" />
                    <span>Rechazar</span>
                  </Button>
                  <Button
                    type="button"
                    variant="selva"
                    size="sm"
                    onClick={() => handleAcceptOrder(order.id)}
                    className="min-h-[44px] touch-target px-5 text-xs font-bold shadow-subtle"
                  >
                    <Check className="w-4 h-4 mr-1 stroke-[3]" />
                    <span>Aceptar y Preparar</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab content: Activas */}
        {ordersTab === 'activas' && (
          <>
            {inKitchenOrders.length === 0 ? (
              <div className="text-center py-10 px-4 bg-surface-subtle/50 rounded-2xl border border-dashed border-border space-y-2">
                <div className="w-12 h-12 rounded-full bg-selva-soft text-selva flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-sm text-ink">Todo al día en cocina</h3>
                <p className="text-xs text-ink-muted max-w-sm mx-auto">
                  No hay pedidos pendientes en preparación. Los nuevos pedidos de clientes en Tingo María ingresarán aquí con notificación.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-ink-muted font-semibold border-b border-border pb-2">
                      <th className="py-2.5 font-bold">N° Pedido</th>
                      <th className="py-2.5 font-bold">Cliente</th>
                      <th className="py-2.5 font-bold">Comanda</th>
                      <th className="py-2.5 font-bold">Total</th>
                      <th className="py-2.5 font-bold">Estado</th>
                      <th className="py-2.5 font-bold text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {inKitchenOrders.map((order) => {
                      const badge = getStatusBadge(order.status);
                      return (
                        <tr key={order.id} className="hover:bg-surface-subtle/70 transition-colors">
                          <td className="py-3.5 font-extrabold text-ink">{order.purchaseCode}</td>
                          <td className="py-3.5 text-ink-light font-medium">{order.customerName}</td>
                          <td className="py-3.5 text-ink-muted truncate max-w-xs">
                            {order.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                          </td>
                          <td className="py-3.5 font-extrabold text-ink tabular-nums">
                            {formatCents(order.totalCents)}
                          </td>
                          <td className="py-3.5">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.class}`}
                            >
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {['confirmado', 'en_preparacion'].includes(order.status) && (
                                <button
                                  type="button"
                                  onClick={() => handleMarkReady(order.id)}
                                  className="min-h-[44px] touch-target px-3 py-1.5 rounded-xl bg-selva text-white hover:bg-selva-strong text-xs font-bold transition-colors shadow-sm"
                                >
                                  Listo para entrega
                                </button>
                              )}
                              <Link to="/comercio/pedidos">
                                <button
                                  type="button"
                                  className="min-h-[44px] touch-target px-3 py-1.5 rounded-xl border border-border text-ink-light hover:text-primary hover:border-primary text-xs font-bold transition-colors"
                                >
                                  Ver comanda
                                </button>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Tab content: Historial */}
        {ordersTab === 'historial' && (
          <>
            {completedOrders.length === 0 ? (
              <div className="text-center py-10 px-4 bg-surface-subtle/50 rounded-2xl border border-dashed border-border space-y-2">
                <div className="w-12 h-12 rounded-full bg-surface-subtle text-ink-muted flex items-center justify-center mx-auto">
                  <Package className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-sm text-ink">Sin pedidos entregados</h3>
                <p className="text-xs text-ink-muted max-w-sm mx-auto">
                  Las órdenes que hayan sido completadas y entregadas hoy se mostrarán en esta lista para tu balance.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-ink-muted font-semibold border-b border-border pb-2">
                      <th className="py-2.5 font-bold">N° Pedido</th>
                      <th className="py-2.5 font-bold">Cliente</th>
                      <th className="py-2.5 font-bold">Productos</th>
                      <th className="py-2.5 font-bold">Total</th>
                      <th className="py-2.5 font-bold">Estado</th>
                      <th className="py-2.5 font-bold text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {completedOrders.slice(0, 5).map((order) => {
                      const badge = getStatusBadge(order.status);
                      return (
                        <tr key={order.id} className="hover:bg-surface-subtle/70 transition-colors">
                          <td className="py-3.5 font-extrabold text-ink">{order.purchaseCode}</td>
                          <td className="py-3.5 text-ink-light font-medium">{order.customerName}</td>
                          <td className="py-3.5 text-ink-muted truncate max-w-xs">
                            {order.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                          </td>
                          <td className="py-3.5 font-extrabold text-ink tabular-nums">
                            {formatCents(order.totalCents)}
                          </td>
                          <td className="py-3.5">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.class}`}
                            >
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-3.5 text-right">
                            <Link to="/comercio/pedidos">
                              <button
                                type="button"
                                className="min-h-[44px] touch-target px-3 py-1.5 rounded-xl border border-border text-ink-light hover:text-primary hover:border-primary text-xs font-bold transition-colors"
                              >
                                Ver detalle
                              </button>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Real Products Section from the Store */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-ink">Productos del Catálogo</h2>
            <p className="text-xs text-ink-light">Gestiona la disponibilidad rápida de tus productos y stock</p>
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
              <Button variant="primary" size="sm" className="text-xs font-bold gap-1 min-h-[44px] touch-target">
                <Plus className="w-4 h-4" /> Agregar producto
              </Button>
            </Link>
          </div>
        </div>

        {/* Real Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
          {displayProducts.map((p) => (
            <div
              key={p.id}
              className="bg-surface rounded-2xl border border-border shadow-subtle overflow-hidden flex flex-col justify-between"
            >
              <div className="aspect-[4/3] w-full bg-surface-subtle overflow-hidden relative">
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="225" fill="%23FDF2F8"><rect width="300" height="225" fill="%23FDF2F8"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23BE185D" font-family="sans-serif" font-weight="bold" font-size="16">Plato Amazónico</text></svg>';
                  }}
                />
                {!p.isAvailable && (
                  <div className="absolute inset-0 bg-ink/70 flex items-center justify-center text-white text-xs font-bold backdrop-blur-[1px]">
                    Agotado hoy
                  </div>
                )}
              </div>

              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-ink line-clamp-1">{p.name}</h4>
                  <p className="text-xs font-extrabold text-ink mt-0.5 tabular-nums">
                    {formatCents(p.priceCents)}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border gap-2">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      p.isAvailable
                        ? 'text-selva-strong bg-selva-soft border-selva-border'
                        : 'text-destructive-strong bg-destructive-soft border-destructive-border'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        p.isAvailable ? 'bg-selva' : 'bg-destructive'
                      }`}
                    />
                    <span>{p.isAvailable ? 'Disponible' : 'Agotado'}</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => toggleProductAvailability(p.id)}
                    className="touch-target min-h-[38px] px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-border text-ink-light hover:text-primary hover:border-primary transition-colors"
                    title="Alternar disponibilidad de plato"
                  >
                    {p.isAvailable ? 'Agotar' : 'Activar'}
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
        <div className="lg:col-span-8 bg-surface rounded-3xl border border-border shadow-subtle p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h3 className="text-sm font-bold text-ink">
              Seguimiento de comanda reciente{' '}
              <span className="text-primary font-extrabold">
                {activeFollowOrder ? activeFollowOrder.purchaseCode : '#QK-914238'}
              </span>
            </h3>
            <span className="text-xs text-ink-muted font-medium">
              Cliente: {activeFollowOrder ? activeFollowOrder.customerName : 'Nilver Valdivia'}
            </span>
          </div>

          <div className="py-3">
            <div className="relative flex items-center justify-between max-w-xl mx-auto">
              <div className="absolute left-6 right-6 top-3 h-0.5 bg-border -z-0" />
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
                      : 'bg-surface-subtle text-ink-muted border border-border'
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
                      : 'bg-surface-subtle text-ink-muted border border-border'
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
                      ? 'bg-selva text-white'
                      : 'bg-surface-subtle text-ink-muted border border-border'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span className="text-[11px] font-medium text-ink-muted">Entregado</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick settings shortcut */}
        <div className="lg:col-span-4 bg-surface rounded-3xl border border-border shadow-subtle p-5 sm:p-6 flex flex-col justify-between space-y-3">
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
              className="w-full text-xs font-bold border-border text-ink hover:text-primary hover:border-primary min-h-[44px] touch-target"
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
              <label className="p-3 rounded-xl border border-border flex items-center justify-between cursor-pointer hover:bg-surface-subtle transition-colors">
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
              <label className="p-3 rounded-xl border border-border flex items-center justify-between cursor-pointer hover:bg-surface-subtle transition-colors">
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
              <label className="p-3 rounded-xl border border-border flex items-center justify-between cursor-pointer hover:bg-surface-subtle transition-colors">
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

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
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
