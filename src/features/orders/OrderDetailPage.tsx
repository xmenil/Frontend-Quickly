import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { OrderStatusBadge, PurchaseStatusBadge, PaymentStatusBadge } from '../../components/ui/Badge';
import { OrderTimeline } from '../../components/shared/OrderTimeline';
import { Dialog } from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { formatDateTime } from '../../lib/date';
import { formatCents } from '../../lib/currency';
import { canCustomerCancelOrder } from '../../domain/orderRules';
import {
  ChevronLeft,
  Navigation,
  RotateCcw,
  Star,
  AlertTriangle,
  Store,
  MapPin,
  CreditCard,
  Banknote,
  Bike,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { purchases, cancelMerchantOrderAsCustomer, addReview, products } = useDataStore();
  const { addItem } = useCartStore();
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();

  const purchase = purchases.find((p) => p.id === id);

  // Modal states
  const [cancelModalSuborderId, setCancelModalSuborderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('Cambié de opinión');
  const [isCancelling, setIsCancelling] = useState(false);

  // Review modal states
  const [reviewModalSuborder, setReviewModalSuborder] = useState<{
    merchantId: string;
    suborderId: string;
    merchantName: string;
  } | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  if (!purchase) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <h1 className="text-2xl font-bold text-ink mb-2">Pedido no encontrado</h1>
        <p className="text-gray-500 text-sm mb-6">No encontramos el registro de este pedido.</p>
        <Link
          to="/cliente/pedidos"
          className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm"
        >
          Volver a Mis Pedidos
        </Link>
      </div>
    );
  }

  const handleCancelSuborder = () => {
    if (!cancelModalSuborderId) return;
    setIsCancelling(true);
    setTimeout(() => {
      cancelMerchantOrderAsCustomer(cancelModalSuborderId, cancelReason);
      setIsCancelling(false);
      setCancelModalSuborderId(null);
    }, 400);
  };

  const handleSubmitReview = () => {
    if (!reviewModalSuborder) return;
    addReview({
      merchantId: reviewModalSuborder.merchantId,
      merchantOrderId: reviewModalSuborder.suborderId,
      customerId: currentUser?.id || 'u_cliente_demo',
      customerName: currentUser?.name || 'Cliente Demo',
      rating,
      comment: reviewComment,
    });
    setReviewSuccess(true);
    setTimeout(() => {
      setReviewSuccess(false);
      setReviewModalSuborder(null);
    }, 1200);
  };

  const handleReorder = () => {
    // Re-check items and add to cart
    let addedCount = 0;
    purchase.merchantOrders.forEach((mo) => {
      mo.items.forEach((it) => {
        const prod = products.find((p) => p.id === it.productId);
        if (prod && prod.isAvailable && prod.stock > 0) {
          addItem({
            productId: it.productId,
            merchantId: mo.merchantId,
            quantity: it.quantity,
            selectedVariantName: it.variantName,
            note: it.note,
            unitPriceCents: prod.priceCents,
          });
          addedCount++;
        }
      });
    });

    if (addedCount > 0) {
      navigate('/carrito');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Link
            to="/cliente/pedidos"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-primary mb-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Volver a mis pedidos</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-ink">{purchase.code}</h1>
            <PurchaseStatusBadge status={purchase.status} />
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Realizado el {formatDateTime(purchase.createdAt)}
          </p>
        </div>

        {/* Global Action: Track in Map if active */}
        <div className="flex items-center gap-2">
          {['pendiente', 'en_proceso', 'entrega_parcial'].includes(purchase.status) && (
            <Link
              to={`/cliente/seguimiento/${purchase.id}`}
              className="touch-target bg-primary text-white hover:bg-primary-hover px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Navigation className="w-4 h-4" />
              <span>Ver Seguimiento en Mapa</span>
            </Link>
          )}

          <Button type="button" variant="outline" size="sm" onClick={handleReorder}>
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            <span>Volver a Pedir</span>
          </Button>
        </div>
      </div>

      {/* Snapshot Cards (Address & Payment) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Address Card */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-ink text-sm">
            <MapPin className="w-4 h-4 text-primary" />
            <span>Dirección de Entrega</span>
          </div>
          <p className="text-gray-700 font-semibold">
            {purchase.addressSnapshot.street} #{purchase.addressSnapshot.number}
          </p>
          <p className="text-gray-500">Ref: {purchase.addressSnapshot.reference}</p>
          <p className="text-gray-400">
            {purchase.customerName} • {purchase.customerPhone}
          </p>
        </div>

        {/* Payment Card */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-ink text-sm">
              {purchase.paymentMethod === 'efectivo' ? (
                <Banknote className="w-4 h-4 text-emerald-600" />
              ) : (
                <CreditCard className="w-4 h-4 text-blue-600" />
              )}
              <span className="capitalize">Método: {purchase.paymentMethod}</span>
            </div>
            <PaymentStatusBadge status={purchase.paymentStatus} />
          </div>

          <p className="text-gray-700 font-semibold">
            Total pagado: {formatCents(purchase.grandTotalCents)}
          </p>
          {purchase.cashAmountPaidCents && (
            <p className="text-gray-500">
              Pagó con {formatCents(purchase.cashAmountPaidCents)} • Vuelto:{' '}
              {formatCents(purchase.changeDueCents || 0)}
            </p>
          )}
        </div>
      </div>

      {/* Suborders Section */}
      <div className="space-y-6">
        <h2 className="text-lg font-extrabold text-ink">
          Subpedidos por Tienda ({purchase.merchantOrders.length})
        </h2>

        {purchase.merchantOrders.map((mo) => {
          const canCancel = canCustomerCancelOrder(mo.status);

          return (
            <div
              key={mo.id}
              className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden space-y-4"
            >
              {/* Store & Suborder Status Header */}
              <div className="p-4 sm:p-5 bg-gray-50 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-subtle border border-gray-200">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-ink">{mo.merchantName}</h3>
                    <p className="text-xs text-gray-500">{mo.merchantAddress}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <OrderStatusBadge status={mo.status} />

                  {/* Cancel button if pending / confirmed */}
                  {canCancel && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => setCancelModalSuborderId(mo.id)}
                    >
                      Cancelar
                    </Button>
                  )}

                  {/* Rate / Review button if delivered */}
                  {mo.status === 'entregado' && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setReviewModalSuborder({
                          merchantId: mo.merchantId,
                          suborderId: mo.id,
                          merchantName: mo.merchantName,
                        })
                      }
                    >
                      <Star className="w-3.5 h-3.5 mr-1 fill-amber-400 text-amber-400" />
                      Valorar
                    </Button>
                  )}
                </div>
              </div>

              {/* Courier info if assigned */}
              {mo.courierName && (
                <div className="mx-5 p-3 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-center justify-between text-xs text-blue-900">
                  <div className="flex items-center gap-2">
                    <Bike className="w-4 h-4 text-blue-600" />
                    <span>
                      Repartidor asignado: <strong>{mo.courierName}</strong>
                    </span>
                  </div>
                  <span className="text-[11px] text-blue-600">Tel: {mo.courierPhone}</span>
                </div>
              )}

              {/* Rejection / Cancellation notices */}
              {mo.rejectionReason && (
                <div className="mx-5 p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Rechazado por el comercio:</strong> {mo.rejectionReason}
                    {mo.refundCents && mo.refundCents > 0 && (
                      <p className="mt-1 text-emerald-700 font-semibold">
                        ✓ Reembolso simulado de {formatCents(mo.refundCents)} registrado.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {mo.cancellationReason && (
                <div className="mx-5 p-3 bg-gray-100 rounded-2xl text-xs text-gray-700">
                  <strong>Cancelado:</strong> {mo.cancellationReason}
                  {mo.refundCents && mo.refundCents > 0 && (
                    <p className="mt-1 text-emerald-700 font-semibold">
                      ✓ Reembolso simulado de {formatCents(mo.refundCents)} registrado.
                    </p>
                  )}
                </div>
              )}

              {/* Items List */}
              <div className="px-5 divide-y divide-gray-100">
                {mo.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="py-3 flex items-center justify-between text-xs sm:text-sm"
                  >
                    <div className="flex items-center gap-3">
                      {item.productImage && (
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-12 h-12 rounded-xl object-cover bg-gray-100"
                        />
                      )}
                      <div>
                        <p className="font-bold text-ink">{item.productName}</p>
                        {item.variantName && (
                          <p className="text-xs text-primary font-medium">{item.variantName}</p>
                        )}
                        {item.note && (
                          <p className="text-xs text-gray-500 italic">"{item.note}"</p>
                        )}
                        <p className="text-xs text-gray-400">
                          {item.quantity} x {formatCents(item.unitPriceCents)}
                        </p>
                      </div>
                    </div>
                    <span className="font-extrabold text-ink">{formatCents(item.subtotalCents)}</span>
                  </div>
                ))}
              </div>

              {/* Subtotal & Delivery Fee breakdown for this suborder */}
              <div className="p-4 sm:p-5 bg-gray-50/70 border-t border-gray-100 flex flex-col gap-1.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal productos:</span>
                  <span>{formatCents(mo.subtotalCents)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Costo de envío:</span>
                  <span>{formatCents(mo.deliveryFeeCents)}</span>
                </div>
                <div className="flex justify-between text-ink font-extrabold text-sm pt-1 border-t border-gray-200">
                  <span>Total {mo.merchantName}:</span>
                  <span className="text-primary">{formatCents(mo.totalCents)}</span>
                </div>
              </div>

              {/* Tracking Timeline */}
              <div className="p-5 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                  Línea de tiempo de entrega
                </h4>
                <OrderTimeline events={mo.timeline} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Cancel Confirmation Dialog */}
      <Dialog
        isOpen={Boolean(cancelModalSuborderId)}
        onClose={() => setCancelModalSuborderId(null)}
        title="¿Deseas cancelar este pedido?"
        description="Esta regla solo se permite antes de que la cocina inicie la preparación."
        maxWidth="sm"
      >
        <div className="space-y-4">
          <Input
            label="Motivo de la cancelación"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Ej: Me equivoqué de dirección..."
          />
          <p className="text-xs text-gray-500 leading-relaxed">
            Se restaurará el inventario reservado en la tienda y se calculará el reembolso simulado
            automáticamente si pagaste con Yape/Plin o Tarjeta.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCancelModalSuborderId(null)}
            >
              Volver
            </Button>
            <Button
              type="button"
              variant="danger"
              isLoading={isCancelling}
              onClick={handleCancelSuborder}
            >
              Sí, cancelar pedido
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Review Dialog */}
      <Dialog
        isOpen={Boolean(reviewModalSuborder)}
        onClose={() => setReviewModalSuborder(null)}
        title={`Valorar a ${reviewModalSuborder?.merchantName}`}
        description="Comparte tu experiencia tras la entrega para ayudar a otros clientes de Tingo María"
        maxWidth="sm"
      >
        {reviewSuccess ? (
          <div className="p-6 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <p className="font-bold text-ink">¡Muchas gracias por tu valoración!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className="touch-target p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-8 h-8 ${
                      s <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            <div>
              <label className="text-xs font-bold text-ink block mb-1">
                Comentario u opinión (opcional)
              </label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="La cecina estuvo muy buena y el envío llegó rápido..."
                rows={3}
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setReviewModalSuborder(null)}>
                Omitir
              </Button>
              <Button type="button" variant="primary" onClick={handleSubmitReview}>
                Publicar Valoración
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};
