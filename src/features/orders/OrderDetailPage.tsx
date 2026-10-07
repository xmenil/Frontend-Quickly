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
  Phone,
  Clock,
  Sparkles,
  Smartphone,
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
      <div className="max-w-4xl mx-auto py-16 px-4 text-center space-y-4">
        <h1 className="text-2xl font-extrabold text-ink">Pedido no encontrado</h1>
        <p className="text-gray-600 text-sm">No encontramos el registro de este pedido en Tingo María.</p>
        <Link
          to="/cliente/pedidos"
          className="min-h-[44px] inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-2xl font-bold text-sm shadow-md"
        >
          Volver a Mis Pedidos
        </Link>
      </div>
    );
  }

  const isOrderActive = ['pendiente', 'en_proceso', 'entrega_parcial'].includes(purchase.status);

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
    <div className="max-w-4xl mx-auto space-y-6 pb-24 sm:pb-12">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/cliente/pedidos"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-primary mb-1 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Volver a Mis Pedidos</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-ink tabular-nums">
              {purchase.code}
            </h1>
            <PurchaseStatusBadge status={purchase.status} />
          </div>
          <p className="text-xs text-gray-600 font-medium mt-1 tabular-nums">
            Realizado el {formatDateTime(purchase.createdAt)} en Tingo María
          </p>
        </div>

        {/* Global Action: Track in Map if active */}
        <div className="flex items-center gap-2.5">
          {isOrderActive && (
            <Link
              to={`/cliente/seguimiento/${purchase.id}`}
              className="min-h-[44px] bg-primary text-white hover:bg-primary-hover px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-md transition-all"
            >
              <Navigation className="w-4 h-4" />
              <span>Seguimiento en Mapa</span>
            </Link>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReorder}
            className="min-h-[44px] font-bold"
          >
            <RotateCcw className="w-4 h-4 mr-1.5" />
            <span>Volver a Pedir</span>
          </Button>
        </div>
      </div>

      {/* Dynamic Active Notification Banner */}
      {isOrderActive && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-3xl flex items-center justify-between gap-3 text-xs text-emerald-900 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping flex-shrink-0" />
            <div>
              <p className="font-extrabold text-sm text-emerald-950">
                Tu pedido se encuentra activo
              </p>
              <p className="text-emerald-800 mt-0.5">
                Destino: {purchase.addressSnapshot.street} #{purchase.addressSnapshot.number} ({purchase.addressSnapshot.reference})
              </p>
            </div>
          </div>
          <Link
            to={`/cliente/seguimiento/${purchase.id}`}
            className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs inline-flex items-center gap-1.5 flex-shrink-0 transition-colors shadow-sm"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Ver Ruta</span>
          </Link>
        </div>
      )}

      {/* Snapshot Cards (Address & Payment) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Address Card */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-2.5 text-xs">
          <div className="flex items-center gap-2 font-extrabold text-ink text-sm">
            <MapPin className="w-4 h-4 text-primary" />
            <span>Dirección de Entrega</span>
          </div>
          <p className="text-gray-800 font-bold text-sm">
            {purchase.addressSnapshot.street} #{purchase.addressSnapshot.number}
          </p>
          <p className="text-gray-600 font-medium">
            Referencia: <strong>{purchase.addressSnapshot.reference}</strong>
          </p>
          <p className="text-gray-500 pt-1 border-t border-gray-50">
            Recibe: <strong className="text-ink">{purchase.customerName}</strong> • Cel: {purchase.customerPhone}
          </p>
        </div>

        {/* Payment Card */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-extrabold text-ink text-sm">
              {purchase.paymentMethod === 'efectivo' ? (
                <Banknote className="w-4 h-4 text-emerald-600" />
              ) : purchase.paymentMethod === 'yape_plin' ? (
                <Smartphone className="w-4 h-4 text-purple-600" />
              ) : (
                <CreditCard className="w-4 h-4 text-blue-600" />
              )}
              <span>
                {purchase.paymentMethod === 'efectivo'
                  ? 'Efectivo contra entrega'
                  : purchase.paymentMethod === 'yape_plin'
                  ? 'Billetera Digital (Yape/Plin)'
                  : 'Tarjeta de Crédito / Débito'}
              </span>
            </div>
            <PaymentStatusBadge status={purchase.paymentStatus} />
          </div>

          <div className="flex justify-between items-baseline pt-1">
            <span className="text-gray-600">Total de la orden:</span>
            <span className="font-black text-lg text-primary tabular-nums">
              {formatCents(purchase.grandTotalCents)}
            </span>
          </div>

          {purchase.cashAmountPaidCents && (
            <p className="text-gray-600 font-medium pt-1 border-t border-gray-50 tabular-nums">
              Paga con: <strong>{formatCents(purchase.cashAmountPaidCents)}</strong> • Vuelto a entregar:{' '}
              <strong className="text-emerald-700">{formatCents(purchase.changeDueCents || 0)}</strong>
            </p>
          )}
        </div>
      </div>

      {/* Suborders Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-ink">
            Subpedidos por Tienda ({purchase.merchantOrders.length})
          </h2>
          <span className="text-xs text-gray-500">
            {purchase.merchantOrders.length === 1 ? '1 comercio' : 'Despachos independientes'}
          </span>
        </div>

        {purchase.merchantOrders.map((mo) => {
          const canCancel = canCustomerCancelOrder(mo.status);

          return (
            <div
              key={mo.id}
              className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden space-y-4"
            >
              {/* Store & Suborder Status Header */}
              <div className="p-4 sm:p-5 bg-gray-50/80 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center text-primary shadow-subtle border border-gray-200 flex-shrink-0">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-ink">{mo.merchantName}</h3>
                    <p className="text-xs text-gray-600 font-medium">{mo.merchantAddress}</p>
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
                      className="min-h-[40px] text-red-600 border-red-200 hover:bg-red-50 font-bold"
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
                      className="min-h-[40px] font-bold"
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

              {/* Courier info card with direct 1-touch phone call */}
              {mo.courierName && (
                <div className="mx-5 p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-950">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 flex-shrink-0">
                      <Bike className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-extrabold text-sm text-blue-950">
                        Repartidor: {mo.courierName}
                      </p>
                      <p className="text-blue-800 text-xs">
                        Asignado para la entrega de este local
                      </p>
                    </div>
                  </div>

                  {mo.courierPhone && (
                    <a
                      href={`tel:${mo.courierPhone.replace(/\s+/g, '')}`}
                      className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors self-start sm:self-auto"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Llamar al repartidor</span>
                    </a>
                  )}
                </div>
              )}

              {/* Rejection / Cancellation notices */}
              {mo.rejectionReason && (
                <div className="mx-5 p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-900 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Rechazado por el comercio:</strong> {mo.rejectionReason}
                    {mo.refundCents && mo.refundCents > 0 && (
                      <p className="mt-1.5 text-emerald-800 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Reembolso simulado de {formatCents(mo.refundCents)} registrado con éxito.</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {mo.cancellationReason && (
                <div className="mx-5 p-4 bg-gray-100 rounded-2xl text-xs text-gray-800 space-y-1">
                  <p>
                    <strong>Cancelado:</strong> {mo.cancellationReason}
                  </p>
                  {mo.refundCents && mo.refundCents > 0 && (
                    <p className="text-emerald-800 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Reembolso simulado de {formatCents(mo.refundCents)} registrado con éxito.</span>
                    </p>
                  )}
                </div>
              )}

              {/* Items List */}
              <div className="px-5 divide-y divide-gray-100">
                {mo.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="py-3.5 flex items-center justify-between text-xs sm:text-sm"
                  >
                    <div className="flex items-center gap-3.5">
                      {item.productImage && (
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-14 h-14 rounded-2xl object-cover bg-gray-100 border border-gray-100 flex-shrink-0"
                        />
                      )}
                      <div>
                        <p className="font-extrabold text-ink">{item.productName}</p>
                        {item.variantName && (
                          <p className="text-xs text-primary font-semibold mt-0.5">
                            Opción: {item.variantName}
                          </p>
                        )}
                        {item.note && (
                          <p className="text-xs text-gray-600 italic mt-0.5">
                            Nota: "{item.note}"
                          </p>
                        )}
                        <p className="text-xs text-gray-500 font-medium mt-1 tabular-nums">
                          {item.quantity} x {formatCents(item.unitPriceCents)}
                        </p>
                      </div>
                    </div>
                    <span className="font-black text-ink text-sm sm:text-base tabular-nums">
                      {formatCents(item.subtotalCents)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Subtotal & Delivery Fee breakdown for this suborder */}
              <div className="p-4 sm:p-5 bg-gray-50/70 border-t border-gray-100 flex flex-col gap-2 text-xs">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal productos:</span>
                  <span className="font-bold tabular-nums">{formatCents(mo.subtotalCents)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Delivery asignado:</span>
                  <span className="font-bold tabular-nums">{formatCents(mo.deliveryFeeCents)}</span>
                </div>
                <div className="flex justify-between text-ink font-extrabold text-sm pt-2 border-t border-gray-200">
                  <span>Total {mo.merchantName}:</span>
                  <span className="text-primary font-black tabular-nums">{formatCents(mo.totalCents)}</span>
                </div>
              </div>

              {/* Tracking Timeline */}
              <div className="p-5 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-4">
                  Progreso y seguimiento de entrega
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
        <div className="space-y-4 pt-2">
          <Input
            label="Motivo de la cancelación"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Ej: Me equivoqué de dirección o producto..."
          />
          <p className="text-xs text-gray-600 leading-relaxed">
            Se restaurará el inventario reservado en la tienda y se calculará el reembolso simulado
            automáticamente si pagaste con billetera digital o tarjeta.
          </p>
          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-[44px]"
              onClick={() => setCancelModalSuborderId(null)}
            >
              Volver
            </Button>
            <Button
              type="button"
              variant="danger"
              className="min-h-[44px]"
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
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <p className="font-extrabold text-ink text-base">¡Muchas gracias por tu valoración!</p>
            <p className="text-xs text-gray-500">Tu opinión fortalece el comercio local de Tingo María.</p>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-center gap-3 py-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center p-1 hover:scale-110 transition-transform"
                  aria-label={`Calificar con ${s} estrellas`}
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
              <label className="text-xs font-bold text-ink block mb-1.5">
                Comentario u opinión sobre el servicio
              </label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="La comida estuvo caliente, la cecina muy rica y el repartidor llegó rápido..."
                rows={3}
                className="w-full text-xs sm:text-sm p-3.5 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary text-ink"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                className="min-h-[44px]"
                onClick={() => setReviewModalSuborder(null)}
              >
                Omitir
              </Button>
              <Button
                type="button"
                variant="primary"
                className="min-h-[44px] font-bold"
                onClick={handleSubmitReview}
              >
                Publicar Valoración
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};
