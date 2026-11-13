import React, { useState, useMemo } from 'react';
import { useMerchantOrders, useMerchantWorkspace, useMerchantActions, AcceptanceDeadline, type MerchantOrderView } from './merchantOrdersModel';
import { useRemote, RemoteState } from '../operations/shared';
import { orderingApi } from '../../services/api/orderingApi';
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
  Users,
  History,
  UserPlus,
  Trash2,
  RefreshCw,
} from 'lucide-react';

const QUICK_REJECTION_REASONS = [
  'Ingrediente o producto agotado',
  'Cocina con sobrecarga de pedidos',
  'Fuera de horario de despacho',
  'Problemas de abastecimiento o local',
  'Dirección no accesible',
];

type SuborderExtended = MerchantOrderView;

export const MerchantOrdersPage: React.FC = () => {
  const resource = useMerchantOrders(); const workspace = useMerchantWorkspace(); const actions = useMerchantActions(resource);
  const currentMerchant = workspace.data?.merchant;
  const subordersWithPurchase = resource.data || [];
  const [activeTab, setActiveTab] = useState<'pendientes' | 'cocina' | 'listos' | 'finalizados'>('pendientes');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal rechazo
  const [rejectOrderId, setRejectOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState(QUICK_REJECTION_REASONS[0]);

  // Modal detalle de entrega del repartidor
  const [deliveryDetailSelection, setDeliveryDetailOrder] = useState<SuborderExtended | null>(null);

  // Modal selección y asignación de repartidor a pedido
  const [assignCourierOrderId, setAssignCourierOrderId] = useState<string | null>(null);

  // Modales de Gestión de Repartidores de la Tienda e Historial de Delivery
  const [isCouriersModalOpen, setIsCouriersModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [couriersRefreshKey, setCouriersRefreshKey] = useState(0);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  // Formulario vinculación rápida de repartidor
  const [courierPhoneInput, setCourierPhoneInput] = useState('');
  const [courierNotesInput, setCourierNotesInput] = useState('');
  const [courierActionBusy, setCourierActionBusy] = useState(false);
  const [courierActionMsg, setCourierActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const deliveryDetailOrder = subordersWithPurchase.find(order => order.id === deliveryDetailSelection?.id) || null;
  const courierResource = useRemote('merchant-couriers:' + resource.storeId + ':' + assignCourierOrderId, signal => assignCourierOrderId ? orderingApi.merchantCouriers(signal) : Promise.resolve([]));
  const couriers = (courierResource.data || []).filter(c => c.isOnline).map(c => ({ ...c, id: c.courierUserId, name: c.fullName, vehicleType: c.vehicleType === 'motorcycle' ? 'moto' : c.vehicleType === 'bicycle' ? 'bicicleta' : 'mototaxi' }));

  // Resources remotos para gestión de repartidores e historial de reparto
  const storeCouriersResource = useRemote(
    'merchant-store-couriers:' + resource.storeId + ':' + couriersRefreshKey,
    signal => isCouriersModalOpen ? orderingApi.listStoreCouriers(signal) : Promise.resolve([])
  );

  const historyResource = useRemote(
    'merchant-store-history:' + resource.storeId + ':' + historyRefreshKey,
    signal => isHistoryModalOpen ? orderingApi.storeDeliveryHistory(signal) : Promise.resolve([])
  );

  React.useEffect(() => {
    setRejectOrderId(null);
    setAssignCourierOrderId(null);
    setDeliveryDetailOrder(null);
    setIsCouriersModalOpen(false);
    setIsHistoryModalOpen(false);
  }, [resource.storeId]);

  // Alerta feedback
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleAssignCourier = async (orderId: string, courierId: string) => {
    if (courierResource.loading || courierResource.error || !couriers.some(c => c.id === courierId)) return;
    if (await actions.assign(orderId, courierId)) setAssignCourierOrderId(null); else courierResource.reload();
  };

  const handleAssociateCourier = async (courierUserId?: string, phone?: string) => {
    setCourierActionBusy(true);
    setCourierActionMsg(null);
    try {
      await orderingApi.associateCourier({
        courierUserId,
        phone: phone || courierPhoneInput.trim(),
        notes: courierNotesInput.trim() || undefined,
      });
      setCourierPhoneInput('');
      setCourierNotesInput('');
      setCourierActionMsg({ type: 'success', text: 'Repartidor vinculado a tu tienda exitosamente.' });
      setCouriersRefreshKey(k => k + 1);
    } catch (err: unknown) {
      setCourierActionMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'No se pudo vincular al repartidor.',
      });
    } finally {
      setCourierActionBusy(false);
    }
  };

  const handleRemoveCourier = async (courierUserId: string) => {
    setCourierActionBusy(true);
    setCourierActionMsg(null);
    try {
      await orderingApi.removeStoreCourier(courierUserId);
      setCourierActionMsg({ type: 'success', text: 'Repartidor desvinculado de la tienda.' });
      setCouriersRefreshKey(k => k + 1);
    } catch (err: unknown) {
      setCourierActionMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'No se pudo desvincular al repartidor.',
      });
    } finally {
      setCourierActionBusy(false);
    }
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

  const handleAdvanceStatus = async (id: string, next: OrderStatus, reason?: string) => {
    const ok = await actions.transition(id, next, reason);
    if (ok && (next === 'confirmado' || next === 'en_preparacion')) setActiveTab('cocina');
    if (ok && next === 'listo_recoger') setActiveTab('listos');
    return ok;
  };
  const handleOpenReject = (orderId: string) => {
    setRejectOrderId(orderId);
    setRejectReason(QUICK_REJECTION_REASONS[0]);
  };

  const handleConfirmReject = async () => { if (!rejectOrderId || !rejectReason.trim()) return; if (await handleAdvanceStatus(rejectOrderId, 'rechazado', rejectReason)) setRejectOrderId(null); };
  if (!currentMerchant) return <div className="max-w-5xl mx-auto space-y-4"><RemoteState loading={workspace.loading} error={workspace.error} retry={workspace.reload} />{!workspace.loading && !workspace.error && <p>Selecciona una tienda autorizada.</p>}</div>;
  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-20 sm:pb-8">
      <RemoteState loading={resource.loading} error={resource.error} retry={resource.reload} />
      {actions.error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{actions.error}</p>}
      {actions.notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{actions.notice}</p>}
      {/* Cabecera Compacta con Acciones de Reparto */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
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

        {/* Acciones de Reparto y Buscador */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Botón Gestión de Repartidores */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => { setCourierActionMsg(null); setIsCouriersModalOpen(true); }}
            className="min-h-[38px] px-3 text-xs font-bold rounded-xl flex items-center gap-1.5 border-primary/40 text-primary hover:bg-primary-50 bg-surface shadow-xs transition-colors"
          >
            <Users className="w-4 h-4 text-primary" />
            <span>Repartidores</span>
          </Button>

          {/* Botón Historial Delivery */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsHistoryModalOpen(true)}
            className="min-h-[38px] px-3 text-xs font-bold rounded-xl flex items-center gap-1.5 border-border text-ink hover:bg-surface-subtle bg-surface shadow-xs transition-colors"
          >
            <History className="w-4 h-4 text-ink-light" />
            <span>Historial Delivery</span>
          </Button>

          {/* Buscador compacto */}
          <div className="relative w-full sm:w-56">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar código o cliente..."
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
        {!resource.data ? null : filteredOrders.length === 0 ? (
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
                    {order.status === "pendiente" && <span className="text-xs text-amber-800"><AcceptanceDeadline expiresAt={order.acceptanceExpiresAt} /></span>}
                    <PaymentStatusBadge status={order.paymentStatus} />
                    <button type="button" onClick={() => setDeliveryDetailOrder(order)} className="min-h-11 px-2 text-xs font-bold text-primary">Ver detalle</button>
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
                            Repartidor: <strong className="text-ink">{order.courierName || 'Contacto no informado'}</strong>
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
                            Repartidor asignado: <strong className="text-ink">{order.courierName || 'Contacto no informado'}</strong>
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
                            disabled={true}
                          type="button"
                          variant="selva"
                          size="sm"
                          onClick={() => undefined}
                          className="min-h-[30px] px-2.5 py-1 text-[11px] font-bold rounded-lg"
                          title="La entrega y el cobro se confirman desde la cuenta del repartidor"
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          <span>Entrega confirmada por repartidor</span>
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
                        {!order.hasAssignment ? (
                          <Button
                            disabled={actions.busy || resource.loading || !!resource.error}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setAssignCourierOrderId(order.id)}
                            className="min-h-[30px] px-2.5 py-1 text-[11px] font-semibold border-warning-border bg-white text-ink rounded-lg shadow-sm hover:border-primary hover:text-primary transition-colors"
                            title="Seleccionar y asignar repartidor de Tingo María"
                          >
                            <Bike className="w-3 h-3 mr-1 text-primary" />
                            <span>Asignar Repartidor</span>
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="selva"
                            size="sm"
                            disabled={true}
                            onClick={() => undefined}
                            className="min-h-[30px] px-2.5 py-1 text-[11px] font-bold rounded-lg"
                          >
                            <Bike className="w-3 h-3 mr-1" />
                            <span>Recojo confirmado por repartidor</span>
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
                          disabled={actions.busy || resource.loading || !!resource.error || order.status === "en_preparacion"}
                          onClick={() => handleOpenReject(order.id)}
                          className="min-h-[32px] px-3 py-1 text-xs font-semibold text-destructive border-destructive-border hover:bg-destructive-soft rounded-lg"
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                          <span>Rechazar</span>
                        </Button>
                        <Button
                            disabled={actions.busy || resource.loading || !!resource.error}
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
                            disabled={actions.busy || resource.loading || !!resource.error}
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
                            disabled={actions.busy || resource.loading || !!resource.error}
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
        onClose={() => { if (!actions.busy) setRejectOrderId(null); }}
        title="Rechazar Pedido"
        description="Indica el motivo. El cliente será notificado."
        maxWidth="sm"
      >
        <div className="space-y-3 pt-1">
          {actions.error && <p role="alert" className="text-sm text-destructive">{actions.error}</p>}
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
            maxLength={500}
              value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Especifica el motivo..."
            required
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
                            disabled={actions.busy || resource.loading || !!resource.error}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRejectOrderId(null)}
              className="min-h-[34px] px-3 text-xs"
            >
              Cancelar
            </Button>
            <Button
                            disabled={actions.busy || resource.loading || !!resource.error}
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
        title="Detalle del pedido y reparto"
        description={`Pedido ${deliveryDetailOrder?.purchaseCode} en Tingo María`}
        maxWidth="md"
      >
        {deliveryDetailOrder && (
          <div className="space-y-3.5 pt-1 text-xs">
            <div className="p-3 bg-selva-soft border border-selva-border rounded-xl flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-selva flex-shrink-0" />
              <div>
                <p className="font-extrabold text-selva-strong text-xs">
                  <OrderStatusBadge status={deliveryDetailOrder.status} />
                </p>
                <p className="text-[11px] text-ink-muted">
                  Estado registrado en el servidor. Consulta el historial y las incidencias disponibles.
                </p>
              </div>
            </div>

            <div className="bg-surface-subtle p-3 rounded-xl border border-border space-y-2">
              <div className="flex justify-between pb-1.5 border-b border-border">
                <span className="text-ink-muted">Repartidor Asignado:</span>
                <span className="font-bold text-ink">{deliveryDetailOrder.hasAssignment ? 'Asignado; contacto no informado' : 'Sin asignación'}</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-border">
                <span className="text-ink-muted">Teléfono de Contacto:</span>
                <span className="font-bold text-primary">{deliveryDetailOrder.courierPhone || 'No informado'}</span>
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
                <span className="text-ink-muted">Total del pedido:</span>
                <span className="font-extrabold text-ink tabular-nums">{formatCents(deliveryDetailOrder.totalCents)}</span>
              </div>
            </div>

            <PaymentStatusBadge status={deliveryDetailOrder.paymentStatus} method={deliveryDetailOrder.paymentMethod} />
            {deliveryDetailOrder.source.incidents?.map(incident => <p key={incident.id} className="rounded-xl border border-amber-200 bg-amber-50 p-3">Incidencia: {incident.description} · {formatDateTime(incident.createdAt)}</p>)}
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
                            disabled={actions.busy || resource.loading || !!resource.error}
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

      {/* Modal Asignar Repartidor a Pedido */}
      <Dialog
        isOpen={Boolean(assignCourierOrderId)}
        onClose={() => { if (!actions.busy) setAssignCourierOrderId(null); }}
        title="Asignar Repartidor a la Orden"
      >
        <div className="space-y-4">
          <p className="text-xs text-ink-muted">
            Selecciona un repartidor activo en Tingo María para retirar y despachar el pedido:
          </p>

          <RemoteState loading={courierResource.loading} error={courierResource.error} retry={courierResource.reload} />
          {actions.error && <p role="alert" className="text-sm text-destructive">{actions.error}</p>}
          {!courierResource.loading && !courierResource.error && !couriers.length && <p className="text-sm text-ink-light">No hay repartidores disponibles.</p>}
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {couriers.map((c) => (
              <div
                key={c.id}
                className="p-3 border border-border rounded-xl flex items-center justify-between gap-3 hover:border-primary transition-all bg-surface-subtle shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-50 text-primary border border-primary-100 flex items-center justify-center font-bold text-sm flex-shrink-0">
                    <Bike className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-ink flex items-center gap-1.5">
                      <span>{c.name}</span>
                      <span className="text-[10px] text-selva bg-selva-soft px-1.5 py-0.2 rounded font-semibold border border-selva-border">
                        Disponible
                      </span>
                    </h4>
                    <p className="text-[11px] text-ink-muted mt-0.5">
                      {c.vehicleType === 'moto' ? 'Moto lineal' : c.vehicleType === 'bicicleta' ? 'Bicicleta' : 'Mototaxi'} • Placa: <strong className="text-ink">{c.plate || 'No informada'}</strong>
                    </p>
                    <p className="text-[10px] text-ink-light">
                      Zona: {c.zoneName || "No informada"} • Cel: {c.phone}
                    </p>
                  </div>
                </div>

                <Button
                            disabled={actions.busy || resource.loading || !!resource.error || courierResource.loading || !!courierResource.error}
                  type="button"
                  size="sm"
                  variant="primary"
                  onClick={() => assignCourierOrderId && handleAssignCourier(assignCourierOrderId, c.id)}
                  className="min-h-[32px] px-3.5 text-xs font-bold rounded-lg flex-shrink-0"
                >
                  Asignar
                </Button>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-3 border-t border-border">
            <Button
              disabled={actions.busy || resource.loading || !!resource.error}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAssignCourierOrderId(null)}
              className="text-xs font-semibold px-4 rounded-xl"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Modal Gestión de Repartidores de la Tienda */}
      <Dialog
        isOpen={isCouriersModalOpen}
        onClose={() => { if (!courierActionBusy) setIsCouriersModalOpen(false); }}
        title="Gestión de Repartidores de la Tienda"
        maxWidth="3xl"
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border">
            <p className="text-xs text-ink-muted leading-relaxed">
              Administra tus repartidores de confianza asociados a tu tienda en Tingo María y vincula nuevos motorizados para asignarles pedidos directamente.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => { setCourierActionMsg(null); setCouriersRefreshKey(k => k + 1); }}
              disabled={courierActionBusy || storeCouriersResource.loading}
              className="text-[11px] h-7 px-2.5 flex items-center gap-1 text-ink-muted hover:text-ink flex-shrink-0"
            >
              <RefreshCw className={`w-3 h-3 ${storeCouriersResource.loading ? 'animate-spin' : ''}`} />
              <span>Actualizar lista</span>
            </Button>
          </div>

          {/* Formulario para agregar / asociar un repartidor */}
          <div className="bg-surface-subtle border border-border rounded-xl p-3.5 space-y-3">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold text-ink">Vincular nuevo repartidor a tu comercio</h3>
            </div>
            <p className="text-[11px] text-ink-light">
              Ingresa el número de celular del repartidor registrado en Quickly para asociarlo a tu tienda de manera permanente:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-1">
                <input
                  type="tel"
                  value={courierPhoneInput}
                  onChange={(e) => setCourierPhoneInput(e.target.value)}
                  placeholder="Celular (ej. 987654321)"
                  disabled={courierActionBusy}
                  className="w-full bg-surface border border-field rounded-lg px-3 py-1.5 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary min-h-[36px]"
                />
              </div>
              <div className="sm:col-span-1">
                <input
                  type="text"
                  value={courierNotesInput}
                  onChange={(e) => setCourierNotesInput(e.target.value)}
                  placeholder="Nota (ej. Turno tarde / Fijo)"
                  disabled={courierActionBusy}
                  className="w-full bg-surface border border-field rounded-lg px-3 py-1.5 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary min-h-[36px]"
                />
              </div>
              <div className="sm:col-span-1 flex items-center">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => handleAssociateCourier(undefined, courierPhoneInput)}
                  disabled={courierActionBusy || !courierPhoneInput.trim()}
                  className="w-full min-h-[36px] text-xs font-bold rounded-lg flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Vincular Repartidor</span>
                </Button>
              </div>
            </div>

            {courierActionMsg && (
              <div className={`p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
                courierActionMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {courierActionMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />}
                <span>{courierActionMsg.text}</span>
              </div>
            )}
          </div>

          {/* Estado de carga / error */}
          <RemoteState loading={storeCouriersResource.loading} error={storeCouriersResource.error} retry={storeCouriersResource.reload} />

          {/* Lista de repartidores */}
          {!storeCouriersResource.loading && !storeCouriersResource.error && (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {(!storeCouriersResource.data || storeCouriersResource.data.length === 0) ? (
                <div className="text-center py-8 bg-surface-subtle rounded-xl border border-dashed border-border p-6">
                  <Bike className="w-8 h-8 text-ink-muted mx-auto mb-2" />
                  <p className="text-xs font-bold text-ink">No hay repartidores registrados en este momento</p>
                  <p className="text-[11px] text-ink-muted mt-1">
                    Cuando los repartidores se registren en Tingo María aparecerán en esta lista para que los puedas vincular.
                  </p>
                </div>
              ) : (
                storeCouriersResource.data.map((c) => (
                  <div
                    key={c.courierUserId}
                    className={`p-3.5 rounded-xl border transition-all ${
                      c.isAssociated
                        ? 'border-emerald-200 bg-emerald-50/20 shadow-xs'
                        : 'border-border bg-surface hover:border-field'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                          c.isAssociated
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-primary-50 text-primary border border-primary-100'
                        }`}>
                          <Bike className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs font-bold text-ink">{c.fullName}</h4>
                            {c.isAssociated && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                                <ShieldCheck className="w-3 h-3" />
                                Vinculado a tu tienda
                              </span>
                            )}
                            {c.hasActiveOrder ? (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                                En reparto ahora
                              </span>
                            ) : c.isOnline ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                En línea
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-ink-muted bg-surface-subtle px-2 py-0.5 rounded-full border border-border">
                                Desconectado
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-ink-muted flex items-center gap-3 flex-wrap">
                            <span>Vehículo: <strong className="text-ink font-semibold">{c.vehicleType === 'motorcycle' ? 'Moto lineal' : c.vehicleType === 'mototaxi' ? 'Mototaxi' : 'Bicicleta'}</strong></span>
                            <span>Placa: <strong className="text-ink font-semibold">{c.plate || 'Sin placa'}</strong></span>
                            <span>Zona: <strong className="text-ink font-semibold">{c.zoneName || 'Tingo María'}</strong></span>
                          </div>
                          <div className="text-[11px] text-ink-light flex items-center gap-3 flex-wrap pt-0.5">
                            <a
                              href={`tel:${c.phone}`}
                              className="inline-flex items-center gap-1 text-primary hover:underline font-bold"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{c.phone}</span>
                            </a>
                            <span className="text-ink-muted">·</span>
                            <span>Entregas a tu tienda: <strong className="text-ink font-bold">{c.deliveredOrdersCount || 0}</strong> pedidos</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                        {c.isAssociated ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={courierActionBusy}
                            onClick={() => handleRemoveCourier(c.courierUserId)}
                            className="min-h-[32px] px-3 text-xs font-bold rounded-lg border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Desvincular</span>
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            disabled={courierActionBusy}
                            onClick={() => handleAssociateCourier(c.courierUserId)}
                            className="min-h-[32px] px-3 text-xs font-bold rounded-lg flex items-center gap-1.5"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Vincular</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCouriersModalOpen(false)}
              className="text-xs font-semibold px-4 rounded-xl min-h-[36px]"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Modal Historial de Delivery */}
      <Dialog
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Historial de Delivery y Despachos"
        maxWidth="3xl"
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border">
            <p className="text-xs text-ink-muted leading-relaxed">
              Consulta todos los pedidos despachados con repartidor asignado, detalle de productos, tiempos y confirmación de entrega en Tingo María.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setHistoryRefreshKey(k => k + 1)}
              disabled={historyResource.loading}
              className="text-[11px] h-7 px-2.5 flex items-center gap-1 text-ink-muted hover:text-ink flex-shrink-0"
            >
              <RefreshCw className={`w-3 h-3 ${historyResource.loading ? 'animate-spin' : ''}`} />
              <span>Actualizar historial</span>
            </Button>
          </div>

          <RemoteState loading={historyResource.loading} error={historyResource.error} retry={historyResource.reload} />

          {!historyResource.loading && !historyResource.error && (
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {(!historyResource.data || historyResource.data.length === 0) ? (
                <div className="text-center py-10 bg-surface-subtle rounded-xl border border-dashed border-border p-6">
                  <History className="w-8 h-8 text-ink-muted mx-auto mb-2" />
                  <p className="text-xs font-bold text-ink">No hay historial de repartos registrado aún</p>
                  <p className="text-[11px] text-ink-muted mt-1">
                    Cuando asignes repartidores a tus órdenes y se despachen los productos, verás aquí el registro completo de tiempos y entregas.
                  </p>
                </div>
              ) : (
                historyResource.data.map((record) => (
                  <div
                    key={record.assignmentId}
                    className="p-3.5 rounded-xl border border-border bg-surface hover:border-field transition-all space-y-3 shadow-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/60">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-extrabold text-ink tracking-tight font-mono bg-surface-subtle px-2 py-0.5 rounded border border-border">
                          {record.orderCode}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          record.assignmentStatus === 'delivered'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : record.assignmentStatus === 'picked_up'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : record.assignmentStatus === 'accepted'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {record.assignmentStatus === 'delivered' ? '✓ Entregado al cliente' :
                           record.assignmentStatus === 'picked_up' ? ' En camino al destino' :
                           record.assignmentStatus === 'accepted' ? '⏳ Esperando recojo en tienda' :
                           ' Cancelado'}
                        </span>
                      </div>
                      <span className="text-[11px] text-ink-muted">
                        Asignado: {formatDateTime(record.acceptedAt)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* Motorizado */}
                      <div className="bg-surface-subtle p-2.5 rounded-lg border border-border/80 space-y-1">
                        <div className="flex items-center gap-1.5 text-ink font-bold text-xs">
                          <Bike className="w-3.5 h-3.5 text-primary" />
                          <span>Repartidor: {record.courier.fullName}</span>
                        </div>
                        <p className="text-[11px] text-ink-muted">
                          {record.courier.vehicleType === 'motorcycle' ? 'Moto lineal' : record.courier.vehicleType === 'mototaxi' ? 'Mototaxi' : 'Bicicleta'} · Placa: <strong>{record.courier.plate || 'S/P'}</strong>
                        </p>
                        <p className="text-[11px] text-primary font-medium">
                          Cel: {record.courier.phone}
                        </p>
                      </div>

                      {/* Cliente / Destino */}
                      <div className="bg-surface-subtle p-2.5 rounded-lg border border-border/80 space-y-1">
                        <div className="flex items-center gap-1.5 text-ink font-bold text-xs">
                          <MapPin className="w-3.5 h-3.5 text-primary" />
                          <span>Cliente: {record.customer.recipientName}</span>
                        </div>
                        <p className="text-[11px] text-ink-muted">
                          {record.customer.street} #{record.customer.streetNumber} {record.customer.reference ? `(${record.customer.reference})` : ''}
                        </p>
                        <p className="text-[11px] text-ink-light">
                          Zona: <strong>{record.customer.zoneName || 'Tingo María'}</strong> · Cel: {record.customer.phone}
                        </p>
                      </div>
                    </div>

                    {/* Productos del pedido */}
                    <div className="space-y-1 bg-surface-subtle/50 p-2.5 rounded-lg border border-border/60">
                      <p className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">Productos Asignados:</p>
                      <div className="space-y-1">
                        {record.items.map((it, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs text-ink">
                            <span className="font-medium">
                              {it.quantity}x {it.productName} {it.variantName && it.variantName !== 'Estándar' ? `(${it.variantName})` : ''}
                            </span>
                            <span className="font-semibold text-ink-light tabular-nums">
                              {formatCents(it.unitPriceCents * it.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tiempos y Cobros */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[11px] text-ink-muted">
                      <div className="flex items-center gap-3 flex-wrap">
                        {record.pickedUpAt && (
                          <span>Retiro: <strong className="text-ink font-medium">{formatDateTime(record.pickedUpAt)}</strong></span>
                        )}
                        {record.deliveredAt && (
                          <span>Entrega: <strong className="text-emerald-700 font-bold">{formatDateTime(record.deliveredAt)}</strong></span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <span>Envío repartidor: <strong className="text-ink font-bold">{formatCents(record.agreedFeeCents)}</strong></span>
                        <span>Total cobrado: <strong className="text-primary font-extrabold text-xs">{formatCents(record.totalCents)}</strong></span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsHistoryModalOpen(false)}
              className="text-xs font-semibold px-4 rounded-xl min-h-[36px]"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
