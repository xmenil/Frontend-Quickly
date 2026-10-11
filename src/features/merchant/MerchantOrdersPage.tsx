import React, { useState, useMemo } from 'react';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { formatDateTime } from '../../lib/date';
import { formatCents } from '../../lib/currency';
import { OrderStatus, MerchantOrder } from '../../domain/types';
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
  ShieldCheck,
  Check,
  ExternalLink,
} from 'lucide-react';

const QUICK_REJECTION_REASONS = [
  'Ingrediente o producto agotado',
  'Cocina con sobrecarga de pedidos',
  'Fuera de horario de despacho',
  'Problemas de abastecimiento o local',
  'Dirección no accesible',
];

interface SuborderExtended extends MerchantOrder {
  purchaseId: string;
  purchaseCode: string;
  customerName: string;
  customerPhone: string;
  addressSnapshot: {
    street: string;
    number: string;
    reference: string;
    zoneId: string;
  };
  paymentMethod: 'efectivo' | 'yape_plin' | 'tarjeta';
  cashPaid?: number;
  changeDue?: number;
}

export const MerchantOrdersPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { merchants, purchases, couriers, updateMerchantOrderStatus, adminAssignCourier } = useDataStore();

  const currentMerchant = useMemo(() => {
    return (
      (currentUser?.merchantId ? merchants.find((m) => m.id === currentUser.merchantId) : null) ||
      merchants.find((m) => m.ownerUserId === currentUser?.id) ||
      merchants[0]
    );
  }, [merchants, currentUser]);

  // Filtrar los pedidos del comercio
  const subordersWithPurchase: SuborderExtended[] = useMemo(() => {
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

  // Modal rechazo
  const [rejectOrderId, setRejectOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState(QUICK_REJECTION_REASONS[0]);

  // Modal detalle de entrega del repartidor
  const [deliveryDetailOrder, setDeliveryDetailOrder] = useState<SuborderExtended | null>(null);

  // Alerta feedback
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

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

  // Filtrado
  const filteredOrders = useMemo(() => {
    return subordersWithPurchase.filter((order) => {
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

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesCode = order.purchaseCode.toLowerCase().includes(query);
        const matchesName = order.customerName.toLowerCase().includes(query);
        const matchesPhone = order.customerPhone.includes(query);
        const matchesCourier = (order.courierName || '').toLowerCase().includes(query);
        if (!matchesCode && !matchesName && !matchesPhone && !matchesCourier) return false;
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
        showNotice(`Pedido ${targetOrder.purchaseCode} aceptado. Pasó a "En Preparación".`);
        setActiveTab('cocina');
      } else if (nextStatus === 'en_preparacion') {
        showNotice(`Pedido ${targetOrder.purchaseCode} en preparación activa.`);
      } else if (nextStatus === 'listo_recoger') {
        showNotice(`Pedido ${targetOrder.purchaseCode} marcado como Listo para Repartidor.`);
        setActiveTab('listos');
      } else if (nextStatus === 'en_camino') {
        showNotice(`Entrega confirmada a ${targetOrder.courierName || 'repartidor'}. En ruta.`);
      } else if (nextStatus === 'entregado') {
        showNotice(`Pedido ${targetOrder.purchaseCode} confirmado como entregado exitosamente.`);
        setActiveTab('finalizados');
      } else if (nextStatus === 'rechazado') {
        showNotice(`Pedido ${targetOrder.purchaseCode} rechazado.`);
      }
    }
  };

  const handleAssignSampleCourier = (orderId: string) => {
    const availableCourier = couriers.find((c) => c.isAvailable) || couriers[0];
    if (availableCourier) {
      adminAssignCourier(orderId, availableCourier.id);
      showNotice(`Repartidor ${availableCourier.name} asignado al pedido.`);
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
    <div className="max-w-5xl mx-auto space-y-4 pb-20 sm:pb-8">
      {/* Cabecera Compacta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">Pedidos y Reparto</h1>
            <span className="text-[11px] font-bold text-primary bg-primary-50 px-2 py-0.5 rounded-full border border-primary-100">
              {currentMerchant.name}
            </span>
          </div>
          <p className="text-xs text-ink-light mt-0.5">
            Supervisa la preparación, estado del repartidor y confirmación de entregas
          </p>
        </div>

        {/* Buscador compacto */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar código, cliente o repartidor..."
            className="w-full bg-surface border border-field rounded-xl py-1.5 pl-8 pr-7 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary min-h-[38px] transition-colors"
          />
          <Search className="w-3.5 h-3.5 text-ink-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-ink-muted hover:text-ink p-1"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Banner de feedback */}
      {actionNotice && (
        <div className="p-3 bg-selva-soft border border-selva-border rounded-xl text-xs text-selva-strong font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-selva flex-shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Pestañas de Estado Compactas y Responsivas */}
      <div className="bg-surface p-1 sm:p-1.5 rounded-xl border border-border shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('pendientes')}
          className={`min-h-[36px] px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between gap-1 select-none ${
            activeTab === 'pendientes'
              ? 'bg-ink text-white shadow-xs'
              : 'text-ink-light hover:bg-surface-subtle hover:text-ink'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            <Clock className={`w-3.5 h-3.5 flex-shrink-0 ${activeTab === 'pendientes' ? 'text-white' : 'text-primary'}`} />
            <span className="truncate">Nuevos</span>
          </div>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold tabular-nums ${
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
          className={`min-h-[36px] px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between gap-1 select-none ${
            activeTab === 'cocina'
              ? 'bg-ink text-white shadow-xs'
              : 'text-ink-light hover:bg-surface-subtle hover:text-ink'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            <ChefHat className={`w-3.5 h-3.5 flex-shrink-0 ${activeTab === 'cocina' ? 'text-white' : 'text-warning-strong'}`} />
            <span className="truncate">En Preparación</span>
          </div>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold tabular-nums ${
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
          className={`min-h-[36px] px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between gap-1 select-none ${
            activeTab === 'listos'
              ? 'bg-ink text-white shadow-xs'
              : 'text-ink-light hover:bg-surface-subtle hover:text-ink'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            <Bike className={`w-3.5 h-3.5 flex-shrink-0 ${activeTab === 'listos' ? 'text-white' : 'text-selva'}`} />
            <span className="truncate">En Reparto</span>
          </div>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold tabular-nums ${
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
          className={`min-h-[36px] px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between gap-1 select-none ${
            activeTab === 'finalizados'
              ? 'bg-ink text-white shadow-xs'
              : 'text-ink-light hover:bg-surface-subtle hover:text-ink'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 ${activeTab === 'finalizados' ? 'text-white' : 'text-ink-muted'}`} />
            <span className="truncate">Entregados / Historial</span>
          </div>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold tabular-nums ${
              activeTab === 'finalizados' ? 'bg-white/20 text-white' : 'bg-surface-subtle text-ink-muted'
            }`}
          >
            {counts.finalizados}
          </span>
        </button>
      </div>

      {/* Lista de Pedidos Compactos */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center bg-surface rounded-2xl border border-border shadow-xs flex flex-col items-center justify-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-surface-subtle flex items-center justify-center text-ink-muted">
              {activeTab === 'pendientes' && <Clock className="w-5 h-5 text-primary" />}
              {activeTab === 'cocina' && <ChefHat className="w-5 h-5 text-warning-strong" />}
              {activeTab === 'listos' && <Bike className="w-5 h-5 text-selva" />}
              {activeTab === 'finalizados' && <CheckCircle2 className="w-5 h-5 text-ink-muted" />}
            </div>
            <h3 className="font-bold text-sm text-ink">
              {searchQuery
                ? 'No se encontraron pedidos con ese término'
                : activeTab === 'pendientes'
                ? 'No hay pedidos nuevos por aceptar'
                : activeTab === 'cocina'
                ? 'No hay pedidos en preparación activa'
                : activeTab === 'listos'
                ? 'No hay pedidos en espera de recojo o en ruta'
                : 'No hay pedidos finalizados'}
            </h3>
            <p className="text-xs text-ink-muted max-w-sm">
              {searchQuery
                ? 'Intenta buscar con otro término o código.'
                : 'Los pedidos se actualizarán en tiempo real cuando ingresen compras de clientes.'}
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isPending = order.status === 'pendiente';
            const isDelivered = order.status === 'entregado';
            const isOnWay = order.status === 'en_camino';
            const isReady = order.status === 'listo_recoger';

            return (
              <div
                key={order.id}
                className={`bg-surface rounded-2xl border p-3.5 sm:p-4 transition-all shadow-xs space-y-2.5 ${
                  isPending
                    ? 'border-primary/40 ring-1 ring-primary/20 bg-gradient-to-r from-primary-50/20 to-surface'
                    : isDelivered
                    ? 'border-selva-border/60 bg-selva-soft/10'
                    : 'border-border'
                }`}
              >
                {/* 1. Cabecera Fina del Pedido */}
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-border flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-sm text-ink font-mono tracking-tight">
                      {order.purchaseCode}
                    </span>
                    <OrderStatusBadge status={order.status} />
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-[11px] text-ink-muted flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDateTime(order.createdAt)}</span>
                    </span>
                    <span className="font-extrabold text-sm text-ink tabular-nums">
                      {formatCents(order.totalCents)}
                    </span>
                  </div>
                </div>

                {/* 2. Cliente y Destino Compacto */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-surface-subtle p-2.5 rounded-xl border border-border">
                  <div className="flex items-center justify-between sm:justify-start gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <User className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      <span className="font-bold text-ink truncate">{order.customerName}</span>
                    </div>
                    <a
                      href={`tel:${order.customerPhone}`}
                      className="text-primary font-bold hover:underline flex items-center gap-1 text-[11px] flex-shrink-0"
                      title="Llamar al cliente"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{order.customerPhone}</span>
                    </a>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-ink-light truncate">
                    <MapPin className="w-3.5 h-3.5 text-selva flex-shrink-0" />
                    <span className="truncate">
                      {order.addressSnapshot.street} #{order.addressSnapshot.number}
                      {order.addressSnapshot.reference ? ` (${order.addressSnapshot.reference})` : ''}
                    </span>
                  </div>
                </div>

                {/* 3. Lista de Artículos (Condensada) */}
                <div className="divide-y divide-border/60 text-xs">
                  {order.items.map((it, idx) => (
                    <div key={idx} className="py-1.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="px-1.5 py-0.2 rounded bg-surface-subtle text-ink font-bold text-[11px] border border-border tabular-nums flex-shrink-0">
                          {it.quantity}x
                        </span>
                        <span className="font-semibold text-ink truncate text-xs">{it.productName}</span>
                        {it.variantName && (
                          <span className="text-[10px] text-primary font-medium">({it.variantName})</span>
                        )}
                        {it.note && (
                          <span className="text-[10px] text-warning-strong italic truncate">"{it.note}"</span>
                        )}
                      </div>
                      <span className="font-bold text-ink tabular-nums text-xs flex-shrink-0">
                        {formatCents(it.subtotalCents)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* 4. SECCIÓN REPARTIDOR Y ESTADO DE ENTREGA (Exclusivo para la tienda) */}
                <div className="pt-2 border-t border-border">
                  {isDelivered ? (
                    // ESTADO: ENTREGADO CON ÉXITO
                    <div className="p-2.5 bg-selva-soft border border-selva-border rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-selva text-white flex items-center justify-center flex-shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                        <div>
                          <p className="font-bold text-selva-strong flex items-center gap-1">
                            <span>¡Producto entregado con éxito al cliente!</span>
                            <ShieldCheck className="w-3.5 h-3.5 text-selva" />
                          </p>
                          <p className="text-[11px] text-ink-muted">
                            Repartidor: <strong className="text-ink">{order.courierName || 'Repartidor Quickly'}</strong>
                            {order.courierPhone ? ` (${order.courierPhone})` : ''}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setDeliveryDetailOrder(order)}
                        className="text-[11px] font-bold text-selva-strong hover:underline flex items-center gap-1 self-start sm:self-auto bg-white px-2 py-1 rounded-lg border border-selva-border"
                      >
                        <span>Ver confirmación</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  ) : isOnWay ? (
                    // ESTADO: EN RUTA CON EL REPARTIDOR
                    <div className="p-2.5 bg-info-soft border border-info-border rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Bike className="w-4 h-4 text-info flex-shrink-0 animate-bounce" />
                        <div className="min-w-0">
                          <p className="font-bold text-info-strong">
                            En camino a entregar al comensal
                          </p>
                          <p className="text-[11px] text-ink-muted truncate">
                            Repartidor asignado: <strong className="text-ink">{order.courierName || 'Motorizado'}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                        {order.courierPhone && (
                          <a
                            href={`tel:${order.courierPhone}`}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-info bg-white px-2.5 py-1 rounded-lg border border-info-border hover:bg-info-soft"
                            title="Llamar al repartidor"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Llamar repartidor</span>
                          </a>
                        )}
                        <Button
                          type="button"
                          variant="selva"
                          size="sm"
                          onClick={() => handleAdvanceStatus(order.id, 'entregado')}
                          className="min-h-[30px] px-2.5 py-1 text-[11px] font-bold rounded-lg"
                          title="Confirmar que el pedido ya fue entregado al comensal"
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          <span>Confirmar Entregado</span>
                        </Button>
                      </div>
                    </div>
                  ) : isReady ? (
                    // ESTADO: LISTO EN TIENDA / ESPERANDO REPARTIDOR
                    <div className="p-2.5 bg-warning-soft border border-warning-border rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <PackageCheck className="w-4 h-4 text-warning flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-bold text-warning-strong">
                            {order.courierName
                              ? `Esperando que ${order.courierName} recoja el pedido en tu local`
                              : 'Empaquetado. Esperando motorizado en Tingo María...'}
                          </p>
                          {order.courierPhone && (
                            <p className="text-[11px] text-ink-muted">
                              Teléfono motorizado: <a href={`tel:${order.courierPhone}`} className="text-primary font-bold underline">{order.courierPhone}</a>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-auto flex-shrink-0">
                        {!order.courierName ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAssignSampleCourier(order.id)}
                            className="min-h-[30px] px-2.5 py-1 text-[11px] font-semibold border-warning-border bg-white text-ink rounded-lg"
                            title="Asignar repartidor disponible de prueba"
                          >
                            <Bike className="w-3 h-3 mr-1 text-primary" />
                            <span>Asignar Repartidor</span>
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="selva"
                            size="sm"
                            onClick={() => handleAdvanceStatus(order.id, 'en_camino')}
                            className="min-h-[30px] px-2.5 py-1 text-[11px] font-bold rounded-lg"
                          >
                            <Bike className="w-3 h-3 mr-1" />
                            <span>Entregar a Repartidor</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* 5. Acciones Operativas de la Tienda (Pendiente o Cocina) */}
                {(isPending || order.status === 'confirmado' || order.status === 'en_preparacion') && (
                  <div className="pt-2 border-t border-border flex items-center justify-end gap-2 flex-wrap">
                    {isPending && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenReject(order.id)}
                          className="min-h-[32px] px-3 py-1 text-xs font-semibold text-destructive border-destructive-border hover:bg-destructive-soft rounded-lg"
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                          <span>Rechazar</span>
                        </Button>
                        <Button
                          type="button"
                          variant="selva"
                          size="sm"
                          onClick={() => handleAdvanceStatus(order.id, 'confirmado')}
                          className="min-h-[32px] px-3.5 py-1 text-xs font-bold shadow-subtle rounded-lg"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          <span>Aceptar Pedido</span>
                        </Button>
                      </>
                    )}

                    {order.status === 'confirmado' && (
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => handleAdvanceStatus(order.id, 'en_preparacion')}
                        className="min-h-[32px] px-3.5 py-1 text-xs font-bold shadow-subtle rounded-lg"
                      >
                        <ChefHat className="w-3.5 h-3.5 mr-1" />
                        <span>Iniciar Preparación</span>
                      </Button>
                    )}

                    {order.status === 'en_preparacion' && (
                      <Button
                        type="button"
                        variant="selva"
                        size="sm"
                        onClick={() => handleAdvanceStatus(order.id, 'listo_recoger')}
                        className="min-h-[32px] px-3.5 py-1 text-xs font-bold shadow-subtle rounded-lg"
                      >
                        <PackageCheck className="w-3.5 h-3.5 mr-1" />
                        <span>Marcar Listo para Reparto</span>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal Rechazo de Pedido */}
      <Dialog
        isOpen={Boolean(rejectOrderId)}
        onClose={() => setRejectOrderId(null)}
        title="Rechazar Pedido"
        description="Indica el motivo. El cliente será notificado."
        maxWidth="sm"
      >
        <div className="space-y-3 pt-1">
          <div className="flex flex-wrap gap-1.5">
            {QUICK_REJECTION_REASONS.map((reason) => (
              <button
                key={reason}
                type="button"
                onClick={() => setRejectReason(reason)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border text-left transition-all ${
                  rejectReason === reason
                    ? 'border-destructive bg-destructive-soft text-destructive-strong font-bold'
                    : 'border-border bg-surface text-ink-light hover:bg-surface-subtle'
                }`}
              >
                {reason}
              </button>
            ))}
          </div>

          <Input
            label="Detalle del motivo"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Especifica el motivo..."
            required
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRejectOrderId(null)}
              className="min-h-[34px] px-3 text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleConfirmReject}
              className="min-h-[34px] px-4 font-bold text-xs"
            >
              Confirmar Rechazo
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Modal Detalle de Entrega del Repartidor */}
      <Dialog
        isOpen={Boolean(deliveryDetailOrder)}
        onClose={() => setDeliveryDetailOrder(null)}
        title="Comprobante de Entrega del Repartidor"
        description={`Pedido ${deliveryDetailOrder?.purchaseCode} en Tingo María`}
        maxWidth="md"
      >
        {deliveryDetailOrder && (
          <div className="space-y-3.5 pt-1 text-xs">
            <div className="p-3 bg-selva-soft border border-selva-border rounded-xl flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-selva flex-shrink-0" />
              <div>
                <p className="font-extrabold text-selva-strong text-xs">
                  Entrega Confirmada Exitosamente
                </p>
                <p className="text-[11px] text-ink-muted">
                  El pedido fue entregado en el domicilio del cliente sin incidencias reportadas.
                </p>
              </div>
            </div>

            <div className="bg-surface-subtle p-3 rounded-xl border border-border space-y-2">
              <div className="flex justify-between pb-1.5 border-b border-border">
                <span className="text-ink-muted">Repartidor Asignado:</span>
                <span className="font-bold text-ink">{deliveryDetailOrder.courierName || 'Repartidor Autorizado'}</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-border">
                <span className="text-ink-muted">Teléfono de Contacto:</span>
                <span className="font-bold text-primary">{deliveryDetailOrder.courierPhone || '962 123 456'}</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-border">
                <span className="text-ink-muted">Cliente:</span>
                <span className="font-bold text-ink">{deliveryDetailOrder.customerName}</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-border">
                <span className="text-ink-muted">Dirección de Entrega:</span>
                <span className="font-bold text-ink text-right">
                  {deliveryDetailOrder.addressSnapshot.street} #{deliveryDetailOrder.addressSnapshot.number}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Monto Pagado:</span>
                <span className="font-extrabold text-ink tabular-nums">{formatCents(deliveryDetailOrder.totalCents)}</span>
              </div>
            </div>

            {/* Timeline del pedido */}
            {deliveryDetailOrder.timeline && deliveryDetailOrder.timeline.length > 0 && (
              <div className="space-y-1.5">
                <p className="font-bold text-ink text-xs">Historial de Estados:</p>
                <div className="space-y-1 pl-2 border-l-2 border-border text-[11px]">
                  {deliveryDetailOrder.timeline.map((ev, i) => (
                    <div key={i} className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-ink">{ev.title}</span>
                        <span className="text-ink-muted text-[10px]">({ev.actor})</span>
                      </div>
                      <p className="text-ink-light text-[10px]">{ev.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeliveryDetailOrder(null)}
                className="min-h-[34px] px-4 text-xs font-semibold rounded-xl"
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};
