import React, { useState } from 'react';
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
} from 'lucide-react';

export const MerchantOrdersPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { merchants, purchases, updateMerchantOrderStatus } = useDataStore();

  const currentMerchant =
    merchants.find((m) => m.ownerUserId === currentUser?.id || m.id === currentUser?.merchantId) ||
    merchants[0];

  // Filter only suborders belonging to this merchant
  const subordersWithPurchase = purchases.flatMap((p) =>
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

  const [activeTab, setActiveTab] = useState<'pendientes' | 'cocina' | 'listos' | 'finalizados'>('pendientes');

  // Rejection modal state
  const [rejectOrderId, setRejectOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('Ingrediente agotado');

  const filteredOrders = subordersWithPurchase.filter((order) => {
    if (activeTab === 'pendientes') return order.status === 'pendiente';
    if (activeTab === 'cocina') return order.status === 'confirmado' || order.status === 'en_preparacion';
    if (activeTab === 'listos') return order.status === 'listo_recoger' || order.status === 'en_camino';
    if (activeTab === 'finalizados') return order.status === 'entregado' || order.status === 'cancelado' || order.status === 'rechazado';
    return true;
  });

  const handleAdvanceStatus = (orderId: string, nextStatus: OrderStatus, reason?: string) => {
    updateMerchantOrderStatus(
      orderId,
      nextStatus,
      currentMerchant.name,
      'comercio',
      reason
    );
  };

  const handleConfirmReject = () => {
    if (!rejectOrderId) return;
    handleAdvanceStatus(rejectOrderId, 'rechazado', rejectReason);
    setRejectOrderId(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">Gestión de Pedidos</h1>
        <p className="text-xs sm:text-sm text-gray-500">
          Control de comandas, cocina y solicitud de repartidores para {currentMerchant.name}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 p-1.5 bg-gray-100 rounded-2xl w-full sm:w-fit text-xs font-bold overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('pendientes')}
          className={`touch-target px-4 py-2 rounded-xl transition-all ${
            activeTab === 'pendientes' ? 'bg-white text-primary shadow-sm' : 'text-gray-600'
          }`}
        >
          Nuevos Pendientes ({subordersWithPurchase.filter((o) => o.status === 'pendiente').length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('cocina')}
          className={`touch-target px-4 py-2 rounded-xl transition-all ${
            activeTab === 'cocina' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600'
          }`}
        >
          En Cocina ({subordersWithPurchase.filter((o) => ['confirmado', 'en_preparacion'].includes(o.status)).length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('listos')}
          className={`touch-target px-4 py-2 rounded-xl transition-all ${
            activeTab === 'listos' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600'
          }`}
        >
          Listos / En Camino ({subordersWithPurchase.filter((o) => ['listo_recoger', 'en_camino'].includes(o.status)).length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('finalizados')}
          className={`touch-target px-4 py-2 rounded-xl transition-all ${
            activeTab === 'finalizados' ? 'bg-white text-ink shadow-sm' : 'text-gray-600'
          }`}
        >
          Historial Finalizado
        </button>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-gray-100 text-gray-400">
            <Clock className="w-10 h-10 mx-auto text-gray-300 mb-2" />
            <p className="font-bold text-sm text-ink">No hay pedidos en este estado</p>
            <p className="text-xs">Los nuevos pedidos de clientes aparecerán automáticamente.</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-4"
            >
              {/* Order Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <span className="font-extrabold text-base text-ink">{order.purchaseCode}</span>
                  <OrderStatusBadge status={order.status} />
                  <PaymentStatusBadge status={order.paymentStatus} />
                </div>
                <span className="text-xs text-gray-400">{formatDateTime(order.createdAt)}</span>
              </div>

              {/* Customer and Delivery info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-gray-50 p-3.5 rounded-2xl">
                <div className="space-y-1">
                  <span className="font-bold text-ink flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-primary" />
                    Cliente: {order.customerName}
                  </span>
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    {order.customerPhone}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-ink flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    {order.addressSnapshot.street} #{order.addressSnapshot.number}
                  </span>
                  <span className="text-gray-500">Ref: {order.addressSnapshot.reference}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="divide-y divide-gray-100">
                {order.items.map((it, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs sm:text-sm">
                    <div>
                      <span className="font-bold text-ink">
                        {it.quantity}x {it.productName}
                      </span>
                      {it.variantName && (
                        <span className="text-primary font-medium ml-2">({it.variantName})</span>
                      )}
                      {it.note && (
                        <p className="text-xs text-amber-800 bg-amber-50 px-2 py-0.5 rounded mt-0.5 inline-block">
                          Nota: "{it.note}"
                        </p>
                      )}
                    </div>
                    <span className="font-bold text-ink">{formatCents(it.subtotalCents)}</span>
                  </div>
                ))}
              </div>

              {/* Subtotal and Total */}
              <div className="pt-2 flex justify-between items-center text-xs border-t border-gray-100">
                <span className="text-gray-500">
                  Total de este subpedido (incluye envío):
                </span>
                <span className="text-base font-black text-ink">{formatCents(order.totalCents)}</span>
              </div>

              {/* Courier Assignment Status */}
              {order.courierName ? (
                <div className="p-3 bg-blue-50 text-blue-900 rounded-xl text-xs flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Bike className="w-4 h-4 text-blue-600" />
                    Repartidor asignado: <strong>{order.courierName}</strong> ({order.courierPhone})
                  </span>
                  <span className="text-[11px] font-semibold text-blue-700 bg-white px-2 py-0.5 rounded-full">
                    {order.status === 'en_camino' ? 'En ruta' : 'Por recoger'}
                  </span>
                </div>
              ) : order.status === 'listo_recoger' ? (
                <div className="p-3 bg-amber-50 text-amber-900 rounded-xl text-xs flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    Esperando que un repartidor disponible acepte la entrega...
                  </span>
                  <span className="text-[11px] font-bold text-amber-800">En lista pública</span>
                </div>
              ) : null}

              {/* Action Buttons for Merchant */}
              <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-end gap-2">
                {/* Step 1: Pending -> Accept or Reject */}
                {order.status === 'pendiente' && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => setRejectOrderId(order.id)}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Rechazar Pedido
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => handleAdvanceStatus(order.id, 'confirmado')}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Aceptar Pedido
                    </Button>
                  </>
                )}

                {/* Step 2: Confirmed -> In Prep */}
                {order.status === 'confirmado' && (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => handleAdvanceStatus(order.id, 'en_preparacion')}
                  >
                    <ChefHat className="w-4 h-4 mr-1" />
                    Iniciar Preparación en Cocina
                  </Button>
                )}

                {/* Step 3: In Prep -> Mark Ready */}
                {order.status === 'en_preparacion' && (
                  <Button
                    type="button"
                    variant="selva"
                    size="sm"
                    onClick={() => handleAdvanceStatus(order.id, 'listo_recoger')}
                  >
                    <PackageCheck className="w-4 h-4 mr-1" />
                    Marcar Listo para Recojo de Repartidor
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reject Order Confirmation Dialog */}
      <Dialog
        isOpen={Boolean(rejectOrderId)}
        onClose={() => setRejectOrderId(null)}
        title="Rechazar Subpedido"
        description="Indica el motivo. El cliente será notificado y se restaurará el inventario."
        maxWidth="sm"
      >
        <div className="space-y-4">
          <Input
            label="Motivo del rechazo"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Ej: Insumos agotados, fuera de horario..."
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setRejectOrderId(null)}>
              Volver
            </Button>
            <Button variant="danger" onClick={handleConfirmReject}>
              Confirmar Rechazo
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
