import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { formatDateTime } from '../../lib/date';
import { formatCents } from '../../lib/currency';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { CheckCircle2, ChevronDown } from 'lucide-react';

export const CourierHistoryPage: React.FC = () => {
  const { purchases, couriers } = useDataStore();
  const { currentUser } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const currentCourier = useMemo(() =>
    couriers.find((courier) => courier.ownerUserId === currentUser?.id || courier.id === currentUser?.courierId) || couriers[0],
    [couriers, currentUser]);
  const deliveredOrders = useMemo(() => {
    if (!currentCourier) return [];
    return purchases.flatMap((purchase) =>
      purchase.merchantOrders
        .filter((order) => order.courierId === currentCourier.id && order.status === 'entregado')
        .map((order) => ({ ...order, purchaseCode: purchase.code, customerName: purchase.customerName, customerAddress: purchase.addressSnapshot }))
    ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [purchases, currentCourier]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const completionNotice = typeof location.state?.deliveryNotice === 'string' ? location.state.deliveryNotice : '';

  if (!currentCourier) return <EmptyState title="No hay un perfil de repartidor disponible" description="Revisa que exista una cuenta de repartidor registrada para continuar." />;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-bold text-ink sm:text-2xl">Historial de entregas</h1>
        <p className="text-sm text-ink-light">Consulta tus entregas completadas y la tarifa registrada de cada pedido.</p>
      </header>
      {completionNotice && <p role="status" className="flex items-start gap-2 rounded-xl border border-selva-border bg-selva-soft p-4 text-sm text-selva-strong"><CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />{completionNotice}</p>}
      <section aria-labelledby="courier-history-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="courier-history-heading" className="text-base font-semibold text-ink">Entregas completadas</h2>
          <p className="text-sm tabular-nums text-ink-muted">{deliveredOrders.length} {deliveredOrders.length === 1 ? 'entrega' : 'entregas'}</p>
        </div>
        {deliveredOrders.length === 0 ? (
          <EmptyState icon={<CheckCircle2 className="h-8 w-8" aria-hidden="true" />} title="Aún no has completado entregas"
            description="Tus entregas aparecerán aquí cuando las confirmes como completadas." actionText="Ver solicitudes" onAction={() => navigate('/repartidor/solicitudes')} />
        ) : (
          <div className="rounded-2xl border border-border bg-surface shadow-subtle">
            <table className="block w-full text-left text-sm lg:table lg:table-fixed">
              <caption className="sr-only">Entregas completadas: pedido, cliente, fecha, tarifa y detalle.</caption>
              <thead className="sr-only bg-surface-subtle text-xs text-ink-light lg:not-sr-only lg:table-header-group">
                <tr>
                  <th scope="col" className="w-1/4 rounded-tl-2xl px-4 py-3 font-semibold">Pedido y comercio</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Cliente</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Fecha registrada</th>
                  <th scope="col" className="px-3 py-3 text-right font-semibold">Tarifa registrada</th>
                  <th scope="col" className="rounded-tr-2xl px-4 py-3 text-right font-semibold">Detalle</th>
                </tr>
              </thead>
              <tbody className="block lg:table-row-group">
                {deliveredOrders.map((order) => {
                  const expanded = expandedOrderId === order.id;
                  return (
                    <React.Fragment key={order.id}>
                      <tr className="block border-t border-border p-4 lg:table-row lg:p-0">
                        <th scope="row" className="block pb-3 font-normal lg:table-cell lg:px-4 lg:py-3 lg:align-middle">
                          <h3 className="break-words text-sm font-bold text-ink">{order.purchaseCode}</h3>
                          <p className="my-2 break-words text-xs text-ink-light">{order.merchantName}</p>
                          <Badge variant="success">Entregado</Badge>
                        </th>
                        <td className="block py-2 lg:table-cell lg:px-3 lg:py-3 lg:align-middle"><p className="mb-1 text-xs text-ink-muted lg:hidden">Cliente</p><p className="break-words text-sm text-ink-light">{order.customerName}</p></td>
                        <td className="flex items-start justify-between gap-3 py-2 text-xs text-ink-muted lg:table-cell lg:px-3 lg:py-3 lg:align-middle"><span className="lg:hidden">Fecha registrada</span><time dateTime={order.updatedAt} className="text-right tabular-nums lg:text-left">{formatDateTime(order.updatedAt)}</time></td>
                        <td className="flex items-center justify-between gap-3 py-2 lg:table-cell lg:px-3 lg:py-3 lg:text-right lg:align-middle"><span className="text-xs text-ink-muted lg:hidden">Tarifa registrada</span><span className="font-semibold tabular-nums text-ink">{formatCents(order.deliveryFeeCents)}</span></td>
                        <td className="block pt-3 lg:table-cell lg:px-4 lg:py-3 lg:text-right lg:align-middle">
                          <Button type="button" variant="outline" size="sm" className="w-full gap-2 lg:w-auto"
                            aria-expanded={expanded} aria-controls={`courier-history-detail-${order.id}`}
                            aria-label={`${expanded ? 'Ocultar' : 'Ver'} detalle de ${order.purchaseCode} de ${order.merchantName}`}
                            onClick={() => setExpandedOrderId(expanded ? null : order.id)}>
                            {expanded ? 'Ocultar' : 'Ver detalle'}<ChevronDown className={`h-4 w-4 shrink-0 ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
                          </Button>
                        </td>
                      </tr>
                      <tr id={`courier-history-detail-${order.id}`} hidden={!expanded} className={expanded ? 'block bg-surface-subtle lg:table-row' : 'hidden'}>
                        <td colSpan={5} className="block p-4 lg:table-cell">
                          <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                            <div className="space-y-1"><dt className="font-semibold text-ink">Recojo en el comercio</dt><dd className="break-words text-ink-light">{order.merchantAddress}</dd></div>
                            <div className="space-y-1"><dt className="font-semibold text-ink">Entrega al cliente</dt><dd className="break-words text-ink-light">{order.customerAddress.street} #{order.customerAddress.number}</dd><dd className="break-words text-xs text-ink-muted">Referencia: {order.customerAddress.reference || 'Sin referencia registrada'}</dd></div>
                            <div className="space-y-1 sm:col-span-2"><dt className="font-semibold text-ink">Contenido del pedido</dt><dd className="break-words text-ink-light">{order.items.map((item) => `${item.quantity} × ${item.productName}`).join(' · ')}</dd></div>
                          </dl>
                          <p className="mt-4 text-xs text-ink-muted">La tarifa corresponde al registro de la entrega; no confirma una liquidación.</p>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
