import React, { useState, useMemo } from 'react';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { formatDateTime } from '../../lib/date';
import { formatCents } from '../../lib/currency';
import { OrderStatus } from '../../domain/types';
import {
  ChefHat,
  PackageCheck,
  CheckCircle2,
  XCircle,
  Bike,
  Clock,
  MapPin,
  Phone,
  AlertTriangle,
  User,
  AlertCircle,
  Search,
  Banknote,
  Smartphone,
  CreditCard,
  Sparkles,
} from 'lucide-react';

// Motivos frecuentes para rechazo rápido de comandas en cocina
const QUICK_REJECTION_REASONS = [
  'Ingrediente o plato agotado',
  'Cocina con sobrecarga de pedidos',
  'Fuera del horario de atención',
  'Problemas de abastecimiento o gas',
  'Dirección o zona no accesible',
];

export const MerchantOrdersPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { merchants, purchases, updateMerchantOrderStatus } = useDataStore();

  const currentMerchant = useMemo(() => {
    return (
      merchants.find((m) => m.ownerUserId === currentUser?.id || m.id === currentUser?.merchantId) ||
      merchants[0]
    );
  }, [merchants, currentUser]);

  // Filtrar solo los subpedidos que corresponden a este comercio
  const subordersWithPurchase = useMemo(() => {
    return purchases.flatMap((p) =>
      p.merchantOrders
        .filter((mo) => mo.merchantId === currentMerchant.id)
        .map((mo) => ({
          ...mo,
          purchaseId: p.id,
          purchaseCode: p.code,
          customerName: p.customerName,
          customerPhone: p.customerPhone,
          addressSnapshot: p.addressSnapshot,
          paymentMethod: p.paymentMethod,
          cashPaid: p.cashAmountPaidCents,
          changeDue: p.changeDueCents,
        }))
    );
  }, [purchases, currentMerchant.id]);

  const [activeTab, setActiveTab] = useState<'pendientes' | 'cocina' | 'listos' | 'finalizados'>('pendientes');
  const [searchQuery, setSearchQuery] = useState('');

  // Estado para el modal de rechazo
  const [rejectOrderId, setRejectOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState(QUICK_REJECTION_REASONS[0]);

  // Mensaje de feedback operativo al cambiar de estado
  const [actionNotice, setActionNotice] = useState<{
    text: string;
    orderCode: string;
    targetTab: 'pendientes' | 'cocina' | 'listos' | 'finalizados';
  } | null>(null);

  // Contadores reactivos
  const counts = useMemo(() => {
    const pendientes = subordersWithPurchase.filter((o) => o.status === 'pendiente').length;
    const cocina = subordersWithPurchase.filter((o) =>
      ['confirmado', 'en_preparacion'].includes(o.status)
    ).length;
    const listos = subordersWithPurchase.filter((o) =>
      ['listo_recoger', 'en_camino'].includes(o.status)
    ).length;
    const finalizados = subordersWithPurchase.filter((o) =>
      ['entregado', 'cancelado', 'rechazado'].includes(o.status)
    ).length;

    return { pendientes, cocina, listos, finalizados };
  }, [subordersWithPurchase]);

  // Filtrado por pestaña y buscador
  const filteredOrders = useMemo(() => {
    return subordersWithPurchase.filter((order) => {
      // Filtro por pestaña
      if (activeTab === 'pendientes' && order.status !== 'pendiente') return false;
      if (
        activeTab === 'cocina' &&
        order.status !== 'confirmado' &&
        order.status !== 'en_preparacion'
      )
        return false;
      if (
        activeTab === 'listos' &&
        order.status !== 'listo_recoger' &&
        order.status !== 'en_camino'
      )
        return false;
      if (
        activeTab === 'finalizados' &&
        order.status !== 'entregado' &&
        order.status !== 'cancelado' &&
        order.status !== 'rechazado'
      )
        return false;

      // Filtro por buscador (código o nombre del cliente)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesCode = order.purchaseCode.toLowerCase().includes(query);
        const matchesName = order.customerName.toLowerCase().includes(query);
        const matchesPhone = order.customerPhone.includes(query);
        if (!matchesCode && !matchesName && !matchesPhone) return false;
      }

      return true;
    });
  }, [subordersWithPurchase, activeTab, searchQuery]);

  const handleAdvanceStatus = (orderId: string, nextStatus: OrderStatus, reason?: string) => {
    const targetOrder = subordersWithPurchase.find((o) => o.id === orderId);
    updateMerchantOrderStatus(
      orderId,
      nextStatus,
      currentMerchant.name,
      'comercio',
      reason
    );

    if (targetOrder) {
      if (nextStatus === 'confirmado') {
        setActionNotice({
          orderCode: targetOrder.purchaseCode,
          text: 'Comanda aceptada. Enviada a la pestaña "En Cocina" para preparar.',
          targetTab: 'cocina',
        });
      } else if (nextStatus === 'en_preparacion') {
        setActionNotice({
          orderCode: targetOrder.purchaseCode,
          text: 'Preparación iniciada en cocina.',
          targetTab: 'cocina',
        });
      } else if (nextStatus === 'listo_recoger') {
        setActionNotice({
          orderCode: targetOrder.purchaseCode,
          text: 'Comanda marcada como Lista para Recojo. Ahora visible en "Listos y En Ruta".',
          targetTab: 'listos',
        });
      } else if (nextStatus === 'en_camino') {
        setActionNotice({
          orderCode: targetOrder.purchaseCode,
          text: 'Paquete entregado al motorizado. Ahora en ruta hacia el comensal.',
          targetTab: 'listos',
        });
      } else if (nextStatus === 'rechazado') {
        setActionNotice({
          orderCode: targetOrder.purchaseCode,
          text: 'Comanda rechazada y archivada en el Historial Finalizado.',
          targetTab: 'finalizados',
        });
      }
    }
  };

  const handleOpenReject = (orderId: string) => {
    setRejectOrderId(orderId);
    setRejectReason(QUICK_REJECTION_REASONS[0]);
  };

  const handleConfirmReject = () => {
    if (!rejectOrderId) return;
    handleAdvanceStatus(rejectOrderId, 'rechazado', rejectReason);
    setRejectOrderId(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 sm:pb-8">
      {/* BLOQUE 1: Cabecera, KPIs Operativos y Barra de Estados */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">Comandas y Pedidos</h1>
            <span className="text-xs font-bold text-primary bg-primary-50 px-2.5 py-0.5 rounded-full border border-primary-100">
              {currentMerchant.name}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-ink-light mt-1">
            Control de comanda en cocina, tiempos de despacho y solicitud de repartidores en Tingo María
          </p>
        </div>

        {/* Buscador de pedidos por código o cliente */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por código (#QK-...) o cliente..."
            className="w-full bg-surface border border-field rounded-xl py-2 pl-9 pr-3 text-xs sm:text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[44px] transition-colors"
          />
          <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-muted hover:text-ink p-1"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Pestañas de Filtrado Semántico con Contadores en Vivo: Grid 2x2 en móvil y 4 columnas en desktop */}
      <div className="bg-surface p-1.5 sm:p-2 rounded-2xl border border-border shadow-subtle grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('pendientes')}
          className={`min-h-[44px] touch-target px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between sm:justify-center gap-1.5 sm:gap-2 w-full select-none ${
            activeTab === 'pendientes'
              ? 'bg-ink text-white shadow-xs'
              : 'text-ink-light hover:bg-surface-subtle hover:text-ink'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <Clock className={`w-3.5 h-3.5 flex-shrink-0 ${activeTab === 'pendientes' ? 'text-white' : 'text-primary'}`} />
            <span className="truncate">
              <span className="inline md:hidden">Por Aceptar</span>
              <span className="hidden md:inline">Nuevos por Aceptar</span>
            </span>
          </div>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold tabular-nums flex-shrink-0 transition-colors ${
              activeTab === 'pendientes'
                ? 'bg-white/20 text-white'
                : counts.pendientes > 0
                ? 'bg-primary-50 text-primary border border-primary-100 animate-pulse'
                : 'bg-surface-subtle text-ink-muted'
            }`}
          >
            {counts.pendientes}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cocina')}
          className={`min-h-[44px] touch-target px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between sm:justify-center gap-1.5 sm:gap-2 w-full select-none ${
            activeTab === 'cocina'
              ? 'bg-ink text-white shadow-xs'
              : 'text-ink-light hover:bg-surface-subtle hover:text-ink'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <ChefHat className={`w-3.5 h-3.5 flex-shrink-0 ${activeTab === 'cocina' ? 'text-white' : 'text-warning-strong'}`} />
            <span className="truncate">En Cocina</span>
          </div>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold tabular-nums flex-shrink-0 transition-colors ${
              activeTab === 'cocina'
                ? 'bg-white/20 text-white'
                : counts.cocina > 0
                ? 'bg-warning-soft text-warning-strong border border-warning-border'
                : 'bg-surface-subtle text-ink-muted'
            }`}
          >
            {counts.cocina}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('listos')}
          className={`min-h-[44px] touch-target px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between sm:justify-center gap-1.5 sm:gap-2 w-full select-none ${
            activeTab === 'listos'
              ? 'bg-ink text-white shadow-xs'
              : 'text-ink-light hover:bg-surface-subtle hover:text-ink'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <Bike className={`w-3.5 h-3.5 flex-shrink-0 ${activeTab === 'listos' ? 'text-white' : 'text-selva'}`} />
            <span className="truncate">
              <span className="inline md:hidden">Listos / En Ruta</span>
              <span className="hidden md:inline">Listos y En Ruta</span>
            </span>
          </div>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold tabular-nums flex-shrink-0 transition-colors ${
              activeTab === 'listos'
                ? 'bg-white/20 text-white'
                : counts.listos > 0
                ? 'bg-selva-soft text-selva-strong border border-selva-border'
                : 'bg-surface-subtle text-ink-muted'
            }`}
          >
            {counts.listos}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('finalizados')}
          className={`min-h-[44px] touch-target px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between sm:justify-center gap-1.5 sm:gap-2 w-full select-none ${
            activeTab === 'finalizados'
              ? 'bg-ink text-white shadow-xs'
              : 'text-ink-light hover:bg-surface-subtle hover:text-ink'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 ${activeTab === 'finalizados' ? 'text-white' : 'text-ink-muted'}`} />
            <span className="truncate">
              <span className="inline md:hidden">Historial</span>
              <span className="hidden md:inline">Historial Finalizado</span>
            </span>
          </div>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold tabular-nums flex-shrink-0 transition-colors ${
              activeTab === 'finalizados'
                ? 'bg-white/20 text-white'
                : 'bg-surface-subtle text-ink-muted'
            }`}
          >
            {counts.finalizados}
          </span>
        </button>
      </div>

      {/* BLOQUE 2 & 3: Lista de Comandas Operativas y Botonera */}
      <div className="space-y-4">
        {/* Banner de confirmación y feedback para orientar al comerciante */}
        {actionNotice && (
          <div className="bg-surface p-3 sm:p-3.5 rounded-2xl border border-selva-border bg-selva-soft/60 text-ink shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 text-xs">
            <div className="flex items-start sm:items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-selva flex-shrink-0 mt-0.5 sm:mt-0" />
              <span>
                <strong className="text-ink font-mono mr-1.5">{actionNotice.orderCode}:</strong>
                <span className="text-ink-light">{actionNotice.text}</span>
              </span>
            </div>
            <div className="flex items-center justify-between w-full sm:w-auto gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-selva-border/50 sm:ml-auto flex-shrink-0">
              {activeTab !== actionNotice.targetTab && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab(actionNotice.targetTab);
                    setActionNotice(null);
                  }}
                  className="font-bold text-selva-strong hover:text-ink underline text-xs touch-target sm:min-h-0 flex items-center"
                >
                  Ver en {actionNotice.targetTab === 'cocina' ? 'En Cocina' : actionNotice.targetTab === 'listos' ? 'Listos y En Ruta' : actionNotice.targetTab === 'finalizados' ? 'Historial' : 'Pendientes'} →
                </button>
              )}
              <button
                type="button"
                onClick={() => setActionNotice(null)}
                className="text-ink-muted hover:text-ink text-xs p-1 ml-auto touch-target sm:min-h-0 flex items-center justify-center"
                aria-label="Cerrar notificación"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {filteredOrders.length === 0 ? (
          <div className="p-8 sm:p-12 text-center bg-surface rounded-3xl border border-border shadow-subtle flex flex-col items-center justify-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-surface-subtle flex items-center justify-center text-ink-muted">
              {activeTab === 'pendientes' && <Clock className="w-7 h-7 text-primary" />}
              {activeTab === 'cocina' && <ChefHat className="w-7 h-7 text-warning-strong" />}
              {activeTab === 'listos' && <Bike className="w-7 h-7 text-selva" />}
              {activeTab === 'finalizados' && <CheckCircle2 className="w-7 h-7 text-ink" />}
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h3 className="font-bold text-base sm:text-lg text-ink">
                {searchQuery
                  ? 'No se encontraron pedidos con ese término'
                  : activeTab === 'pendientes'
                  ? 'No hay nuevos pedidos pendientes por aceptar'
                  : activeTab === 'cocina'
                  ? 'La cocina está despejada en este momento'
                  : activeTab === 'listos'
                  ? 'No hay pedidos en espera de recojo o en ruta'
                  : 'Aún no hay comandas finalizadas en el historial'}
              </h3>
              <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                {searchQuery
                  ? 'Intenta buscar con otro código de comanda (#QK-...) o nombre de cliente.'
                  : activeTab === 'pendientes'
                  ? 'Los nuevos pedidos de comensales en Tingo María ingresarán aquí automáticamente en tiempo real con alerta visual.'
                  : activeTab === 'cocina'
                  ? 'No tienes comandas en preparación activa. Al aceptar un pedido pendiente, pasará aquí para control de despacho en cocina.'
                  : activeTab === 'listos'
                  ? 'Cuando termines de preparar un pedido en cocina y pulses "Marcar Listo para Recojo", se trasladará aquí a la espera de que el repartidor lo recoja y lo entregue.'
                  : 'Los pedidos entregados satisfactoriamente, así como las órdenes canceladas o rechazadas, quedarán archivadas aquí para control.'}
              </p>
            </div>
            {searchQuery ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="mt-2 min-h-[44px] touch-target text-xs"
              >
                Limpiar búsqueda
              </Button>
            ) : activeTab === 'listos' && counts.cocina > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('cocina')}
                className="mt-1 min-h-[44px] touch-target text-xs font-semibold"
              >
                <ChefHat className="w-3.5 h-3.5 mr-1.5" />
                Ver {counts.cocina} comanda(s) en Cocina
              </Button>
            ) : activeTab === 'cocina' && counts.pendientes > 0 ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setActiveTab('pendientes')}
                className="mt-1 min-h-[44px] touch-target text-xs font-bold shadow-subtle"
              >
                <Clock className="w-3.5 h-3.5 mr-1.5" />
                Ver {counts.pendientes} comanda(s) por Aceptar
              </Button>
            ) : null}
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isPending = order.status === 'pendiente';
            const isInKitchen = order.status === 'confirmado' || order.status === 'en_preparacion';

            return (
              <div
                key={order.id}
                className={`bg-surface rounded-3xl border transition-all shadow-subtle p-5 sm:p-6 space-y-4 ${
                  isPending
                    ? 'border-primary/40 ring-1 ring-primary/20 bg-gradient-to-r from-primary-50/20 to-surface'
                    : 'border-border hover:border-ink-muted/30'
                }`}
              >
                {/* Cabecera del Ticket */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-extrabold text-base sm:text-lg text-ink font-mono tracking-tight">
                      {order.purchaseCode}
                    </span>
                    <OrderStatusBadge status={order.status} />
                    <PaymentStatusBadge status={order.paymentStatus} />
                    {isPending && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary-50 border border-primary-100 px-2 py-0.5 rounded-full animate-pulse">
                        <Sparkles className="w-3 h-3" />
                        <span>¡Nuevo pedido por confirmar!</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatDateTime(order.createdAt)}</span>
                  </div>
                </div>

                {/* Cliente, Teléfono y Dirección en Tingo María */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-surface-subtle p-3.5 rounded-2xl border border-border">
                  <div className="space-y-1.5">
                    <div className="font-bold text-ink flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      <span>Comensal: {order.customerName}</span>
                    </div>
                    <div>
                      <a
                        href={`tel:${order.customerPhone}`}
                        className="inline-flex items-center gap-1.5 text-primary font-bold hover:underline touch-target py-1"
                        title="Llamar al cliente"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{order.customerPhone}</span>
                        <span className="text-[10px] font-normal text-ink-muted">(Llamar)</span>
                      </a>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="font-bold text-ink flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-selva flex-shrink-0" />
                      <span>
                        {order.addressSnapshot.street} #{order.addressSnapshot.number}
                      </span>
                    </div>
                    {order.addressSnapshot.reference && (
                      <p className="text-ink-light pl-5 text-[11px] leading-relaxed">
                        <span className="font-semibold text-ink">Ref:</span> {order.addressSnapshot.reference}
                      </p>
                    )}
                  </div>
                </div>

                {/* Lista de Platos y Preparación */}
                <div className="divide-y divide-border">
                  {order.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="py-2.5 flex items-start justify-between gap-3 text-xs sm:text-sm"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-lg bg-surface-subtle text-ink font-black text-xs border border-border tabular-nums flex-shrink-0">
                            {it.quantity}x
                          </span>
                          <span className="font-bold text-ink">{it.productName}</span>
                          {it.variantName && (
                            <span className="text-primary font-semibold text-xs">
                              ({it.variantName})
                            </span>
                          )}
                        </div>
                        {it.note && (
                          <div className="inline-flex items-center gap-1 text-[11px] font-medium text-warning-strong bg-warning-soft border border-warning-border px-2 py-0.5 rounded-lg">
                            <AlertCircle className="w-3 h-3 flex-shrink-0" />
                            <span>Nota del cliente: "{it.note}"</span>
                          </div>
                        )}
                      </div>
                      <span className="font-bold text-ink tabular-nums flex-shrink-0">
                        {formatCents(it.subtotalCents)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Detalle Financiero del Subpedido y Método de Pago */}
                <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap text-ink-light">
                    <span className="font-medium">Forma de pago:</span>
                    <span className="font-bold text-ink inline-flex items-center gap-1 bg-surface-subtle px-2 py-0.5 rounded-md border border-border">
                      {order.paymentMethod === 'efectivo' && <Banknote className="w-3.5 h-3.5 text-selva" />}
                      {order.paymentMethod === 'yape_plin' && <Smartphone className="w-3.5 h-3.5 text-primary" />}
                      {order.paymentMethod === 'tarjeta' && <CreditCard className="w-3.5 h-3.5 text-info" />}
                      <span>
                        {order.paymentMethod === 'yape_plin'
                          ? 'Yape / Plin'
                          : order.paymentMethod === 'tarjeta'
                          ? 'Tarjeta'
                          : 'Efectivo'}
                      </span>
                    </span>

                    {order.paymentMethod === 'efectivo' && order.cashPaid && order.cashPaid > 0 && (
                      <span className="text-[11px] text-ink-muted">
                        (Paga con: <strong className="text-ink">{formatCents(order.cashPaid)}</strong>
                        {order.changeDue && order.changeDue > 0
                          ? `, Vuelto a enviar: ${formatCents(order.changeDue)}`
                          : ''}
                        )
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                    <span className="text-ink-muted">Total del subpedido:</span>
                    <span className="text-base sm:text-lg font-black text-ink tabular-nums">
                      {formatCents(order.totalCents)}
                    </span>
                  </div>
                </div>

                {/* Asignación del Motorizado / Courier */}
                {order.courierName ? (
                  <div className="p-3 bg-info-soft text-info-strong border border-info-border rounded-2xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Bike className="w-4 h-4 text-info flex-shrink-0" />
                      <span>
                        Motorizado asignado:{' '}
                        <strong className="text-ink">{order.courierName}</strong>
                      </span>
                      {order.courierPhone && (
                        <a
                          href={`tel:${order.courierPhone}`}
                          className="inline-flex items-center gap-1 font-bold text-info hover:underline ml-1"
                          title="Llamar al motorizado"
                        >
                          <Phone className="w-3 h-3" />
                          <span>({order.courierPhone})</span>
                        </a>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-info-strong bg-white px-2.5 py-1 rounded-full border border-info-border self-start sm:self-auto">
                      {order.status === 'en_camino' ? 'En ruta al comensal' : 'Por recoger en tu local'}
                    </span>
                  </div>
                ) : order.status === 'listo_recoger' ? (
                  <div className="p-3 bg-warning-soft text-warning-strong border border-warning-border rounded-2xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-warning flex-shrink-0 animate-spin" />
                      <span>Esperando que un motorizado disponible en Tingo María acepte la entrega...</span>
                    </div>
                    <span className="text-[11px] font-bold text-warning-strong bg-white px-2.5 py-1 rounded-full border border-warning-border self-start sm:self-auto">
                      En lista pública de repartidores
                    </span>
                  </div>
                ) : null}

                {/* BLOQUE 3: Botones de Acción Operativa */}
                <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-end gap-2.5">
                  {/* Estado 1: Pendiente -> Aceptar o Rechazar */}
                  {order.status === 'pendiente' && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto min-h-[44px] touch-target px-4 font-bold text-destructive border-destructive-border hover:bg-destructive-soft text-xs justify-center"
                        onClick={() => handleOpenReject(order.id)}
                      >
                        <XCircle className="w-4 h-4 mr-1.5" />
                        Rechazar Pedido
                      </Button>
                      <Button
                        type="button"
                        variant="selva"
                        size="sm"
                        className="w-full sm:w-auto min-h-[44px] touch-target px-5 font-bold text-xs shadow-subtle justify-center"
                        onClick={() => handleAdvanceStatus(order.id, 'confirmado')}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1.5 stroke-[2.5]" />
                        Aceptar Comanda
                      </Button>
                    </>
                  )}

                  {/* Estado 2: Confirmado -> Iniciar Preparación en Cocina */}
                  {order.status === 'confirmado' && (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      className="w-full sm:w-auto min-h-[44px] touch-target px-5 font-bold text-xs shadow-subtle justify-center"
                      onClick={() => handleAdvanceStatus(order.id, 'en_preparacion')}
                    >
                      <ChefHat className="w-4 h-4 mr-1.5" />
                      Iniciar Preparación en Cocina
                    </Button>
                  )}

                  {/* Estado 3: En Preparación -> Marcar Listo para Recojo */}
                  {order.status === 'en_preparacion' && (
                    <Button
                      type="button"
                      variant="selva"
                      size="sm"
                      className="w-full sm:w-auto min-h-[44px] touch-target px-5 font-bold text-xs shadow-subtle justify-center"
                      onClick={() => handleAdvanceStatus(order.id, 'listo_recoger')}
                    >
                      <PackageCheck className="w-4 h-4 mr-1.5 stroke-[2.5]" />
                      Marcar Listo para Recojo de Motorizado
                    </Button>
                  )}

                  {/* Estado 4: Listo para recoger o en camino */}
                  {order.status === 'listo_recoger' && order.courierName && (
                    <Button
                      type="button"
                      variant="selva"
                      size="sm"
                      className="w-full sm:w-auto min-h-[44px] touch-target px-5 font-bold text-xs shadow-subtle justify-center"
                      onClick={() => handleAdvanceStatus(order.id, 'en_camino')}
                    >
                      <Bike className="w-4 h-4 mr-1.5 stroke-[2.5]" />
                      Confirmar Entrega a Repartidor
                    </Button>
                  )}

                  {order.status === 'listo_recoger' && !order.courierName && (
                    <span className="text-xs text-ink-muted italic flex items-center justify-center sm:justify-start gap-1.5 py-1">
                      <Clock className="w-3.5 h-3.5 text-warning flex-shrink-0" />
                      Comanda empaquetada. Esperando asignación de repartidor en Tingo María.
                    </span>
                  )}

                  {order.status === 'en_camino' && (
                    <span className="text-xs font-semibold text-info flex items-center justify-center sm:justify-start gap-1.5 bg-info-soft px-3 py-2 rounded-xl border border-info-border w-full sm:w-auto">
                      <Bike className="w-3.5 h-3.5 flex-shrink-0" />
                      En camino a entrega {order.courierName ? `con ${order.courierName}` : ''}
                    </span>
                  )}

                  {order.status === 'entregado' && (
                    <span className="text-xs font-semibold text-selva flex items-center justify-center sm:justify-start gap-1.5 bg-selva-soft px-3 py-2 rounded-xl border border-selva-border w-full sm:w-auto">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                      Comanda entregada exitosamente
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Rechazo de Pedido con Motivos Rápidos */}
      <Dialog
        isOpen={Boolean(rejectOrderId)}
        onClose={() => setRejectOrderId(null)}
        title="Rechazar Comanda de Cocina"
        description="Selecciona el motivo del rechazo. El comensal será notificado en Tingo María y se liberará su inventario."
        maxWidth="md"
      >
        <div className="space-y-4 pt-1">
          {/* Motivos rápidos tipo Chip */}
          <div>
            <label className="text-xs font-bold text-ink block mb-2">
              Motivos frecuentes (pulsar para elegir):
            </label>
            <div className="flex flex-wrap gap-2">
              {QUICK_REJECTION_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setRejectReason(reason)}
                  className={`touch-target px-3 py-1.5 rounded-xl text-xs font-medium border text-left transition-all ${
                    rejectReason === reason
                      ? 'border-destructive bg-destructive-soft text-destructive-strong font-bold ring-1 ring-destructive'
                      : 'border-border bg-surface text-ink-light hover:bg-surface-subtle'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Detalle del motivo"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Especifica el motivo..."
            required
            helperText="Este texto será visible para el cliente en el detalle de su pedido."
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setRejectOrderId(null)}
              className="min-h-[44px] touch-target px-4 text-xs font-semibold"
            >
              Volver a la Comanda
            </Button>
            <Button
              type="button"
              variant="danger"
              size="md"
              onClick={handleConfirmReject}
              className="min-h-[44px] touch-target px-5 font-bold shadow-subtle text-xs"
            >
              Confirmar Rechazo
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
