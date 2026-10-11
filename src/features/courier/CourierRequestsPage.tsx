import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { formatCents } from '../../lib/currency';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { Store, MapPin, AlertCircle, Bike, Check } from 'lucide-react';

export const CourierRequestsPage: React.FC = () => {
  const { purchases, couriers, courierAcceptOrder } = useDataStore();
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();
  const [acceptError, setAcceptError] = useState<{ orderId: string; message: string } | null>(null);

  const currentCourier =
    couriers.find((c) => c.ownerUserId === currentUser?.id || c.id === currentUser?.courierId) ||
    couriers[0];
  const hasActiveDelivery = purchases.some((purchase) => purchase.merchantOrders.some((order) =>
    order.courierId === currentCourier?.id && Boolean(currentCourier) && ['listo_recoger', 'en_camino'].includes(order.status)));

  const availableDeliveries = purchases.flatMap((p) =>
    p.merchantOrders
      .filter((mo) => mo.status === 'listo_recoger' && !mo.courierId)
      .map((mo) => ({
        ...mo,
        purchaseCode: p.code,
        customerName: p.customerName,
        customerPhone: p.customerPhone,
        addressSnapshot: p.addressSnapshot,
        paymentMethod: p.paymentMethod,
      }))
  );

  const handleAccept = (suborderId: string) => {
    if (!currentCourier || !currentCourier.isAvailable || hasActiveDelivery) return;
    setAcceptError(null);
    try {
      const result = courierAcceptOrder(suborderId, currentCourier.id);
      if (result.success) navigate('/repartidor/entrega-activa');
      else setAcceptError({ orderId: suborderId, message: result.message || 'No se pudo aceptar la entrega. Revisa la solicitud e inténtalo nuevamente.' });
    } catch {
      setAcceptError({ orderId: suborderId, message: 'No se pudo completar la acción. Revisa si la entrega quedó asignada antes de volver a intentarlo.' });
    }
  };

  if (!currentCourier) {
    return <EmptyState title="No hay un perfil de repartidor disponible" description="Revisa que exista una cuenta de repartidor registrada para continuar." />;
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-bold text-ink sm:text-2xl">Solicitudes de entrega</h1>
        <p className="text-sm text-ink-light">Revisa el recojo, destino y tarifa antes de aceptar una entrega.</p>
      </header>

      {hasActiveDelivery && (
        <div className="flex flex-col gap-3 rounded-xl border border-info-border bg-info-soft p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-info-strong">Tienes una entrega en curso. Complétala antes de aceptar otra solicitud.</p>
          <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => navigate('/repartidor/entrega-activa')}>Continuar entrega</Button>
        </div>
      )}

      {!currentCourier.isAvailable && (
        <div className="flex items-start gap-3 rounded-xl border border-warning-border bg-warning-soft p-4 text-sm text-warning-strong">
          <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
          <p>Estás en pausa. Activa tu disponibilidad desde la cabecera para aceptar pedidos.</p>
        </div>
      )}

      <section aria-labelledby="courier-requests-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="courier-requests-heading" className="text-base font-semibold text-ink">Entregas disponibles</h2>
          <p role="status" className="text-sm tabular-nums text-ink-muted">{availableDeliveries.length} {availableDeliveries.length === 1 ? 'solicitud' : 'solicitudes'}</p>
        </div>
        {availableDeliveries.length === 0 ? (
          <EmptyState icon={<Bike className="h-8 w-8" aria-hidden="true" />}
            title="No hay entregas disponibles por ahora"
            description="Los pedidos aparecerán aquí cuando un comercio los marque como listos para recojo y aún no tengan repartidor asignado." />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {availableDeliveries.map((delivery) => (
              <article key={delivery.id} aria-label={`Entrega ${delivery.purchaseCode} de ${delivery.merchantName}`}
                className="flex min-w-0 flex-col gap-4 rounded-2xl border border-border bg-surface p-4 shadow-subtle sm:p-6">
                <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
                  <div className="min-w-0 space-y-2">
                    <h3 className="break-words text-sm font-bold text-ink">{delivery.purchaseCode}</h3>
                    <p className="flex items-start gap-2 text-sm font-semibold text-ink-light"><Store className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="min-w-0 break-words">{delivery.merchantName}</span></p>
                    <Badge variant="success">Listo para recojo</Badge>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-xs text-ink-muted">Tarifa de entrega</p>
                    <p className="text-lg font-bold tabular-nums text-ink">{formatCents(delivery.deliveryFeeCents)}</p>
                  </div>
                </header>

                <dl className="flex-1 space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-subtle text-xs font-semibold text-ink-light">1</span>
                    <div className="min-w-0 space-y-1">
                      <dt className="font-semibold text-ink">Recojo en el comercio</dt>
                      <dd className="break-words text-ink-light">{delivery.merchantAddress}</dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-subtle text-xs font-semibold text-ink-light">2</span>
                    <div className="min-w-0 space-y-1">
                      <dt className="font-semibold text-ink">Entrega al cliente</dt>
                      <dd className="break-words text-ink-light">{delivery.addressSnapshot.street} #{delivery.addressSnapshot.number}</dd>
                      <dd className="flex items-start gap-2 break-words text-xs text-ink-muted"><MapPin className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="min-w-0 break-words">Referencia: {delivery.addressSnapshot.reference || 'Sin referencia registrada'}</span></dd>
                    </div>
                  </div>
                </dl>

                <div className="space-y-2 border-t border-border pt-4 text-xs">
                  <p className="tabular-nums text-ink-light">{delivery.items.reduce((acc, item) => acc + item.quantity, 0)} productos · Cliente: {delivery.customerName}</p>
                  <p className={delivery.paymentMethod === 'efectivo' ? 'font-medium text-warning' : 'text-ink-light'}>
                    {delivery.paymentMethod === 'efectivo' ? 'Método de pago: efectivo. Revisa el cobro en la entrega activa.' : `Método de pago: ${delivery.paymentMethod}. Revisa el estado de pago antes de entregar.`}
                  </p>
                </div>

                {acceptError?.orderId === delivery.id && (
                  <div role="alert" className="flex items-start gap-2 rounded-xl border border-destructive-border bg-destructive-soft p-3 text-sm text-destructive-strong">
                    <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" /><p>{acceptError.message}</p>
                  </div>
                )}
                <Button type="button" variant="primary" className="min-h-12 w-full gap-2 text-sm" onClick={() => handleAccept(delivery.id)} disabled={!currentCourier.isAvailable || hasActiveDelivery}
                  aria-label={`Aceptar entrega ${delivery.purchaseCode} de ${delivery.merchantName}`}>
                  <Check className="h-5 w-5" aria-hidden="true" />Aceptar entrega
                </Button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
