import React, { useState } from 'react';
import { assignAdminOrder, loadAdminOrders, releaseAdminAssignment, useAdminAction, useAdminResource } from './adminModel';
import { orderingApi } from '../../services/api/orderingApi';
import { RemoteState } from '../operations/shared';
import { OrderStatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { formatDateTime } from '../../lib/date';
import { formatCents } from '../../lib/currency';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { EmptyState } from '../../components/ui/EmptyState';
import { Bike, Search, ShoppingBag, AlertCircle, CheckCircle2 } from 'lucide-react';

export const AdminOrdersPage: React.FC = () => {
  const resource = useAdminResource('orders', loadAdminOrders);
  const actions = useAdminAction(resource.reload, resource.loading || !!resource.error);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [releaseId, setReleaseId] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [assignModal, setAssignModal] = useState<{ suborderId: string; merchantName: string } | null>(
    null
  );
  const [selectedCourierId, setSelectedCourierId] = useState('');


  const allSuborders = resource.data || [];
  const selectedOrder = allSuborders.find(order => order.id === assignModal?.suborderId);
  const options = useAdminResource('courier-options:' + (assignModal?.suborderId || ''), signal => selectedOrder ? orderingApi.couriers(selectedOrder.source.storeId, signal) : Promise.resolve([]));
  const couriers = (options.data || []).map(courier => ({ id: courier.userId, name: courier.fullName }));
  const detail = allSuborders.find(order => order.id === detailId);
  const releasing = allSuborders.find(order => order.id === releaseId);
  const filteredSuborders = allSuborders.filter((o) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (
        !o.parentCode.toLowerCase().includes(q) &&
        !o.merchantName.toLowerCase().includes(q) &&
        !o.customerName.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  const handleConfirmAssign = async () => {
    if (!selectedOrder || !selectedCourierId || !couriers.some(courier => courier.id === selectedCourierId) || reason.trim().length < 3 || options.loading || options.error) return;
    if (await actions.execute(() => assignAdminOrder(selectedOrder.source, selectedCourierId, reason.trim()), 'Asignación confirmada.')) setAssignModal(null);
  };
  const handleRelease = async () => {
    if (!releasing || reason.trim().length < 3) return;
    if (await actions.execute(() => releaseAdminAssignment(releasing.source, reason.trim()), 'Asignación liberada.')) setReleaseId(null);
  };
  if ((resource.loading || resource.error) && !resource.data) return <RemoteState loading={resource.loading} error={resource.error} retry={resource.reload} />;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-bold text-ink sm:text-2xl">Pedidos</h1>
        <p className="max-w-2xl text-sm text-ink-light">
          Revisa el estado de cada pedido y su repartidor asignado en Tingo María.
        </p>
      </header>

      <section aria-label="Búsqueda de pedidos" className="rounded-2xl border border-border bg-surface p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <Input
              id="admin-order-search"
              className="md:text-sm"
              type="search"
              label="Buscar pedidos"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Código, comercio o cliente"
              leftIcon={<Search className="h-5 w-5" aria-hidden="true" />}
              aria-describedby="admin-order-search-help"
            />
          </div>
          {searchQuery && (
            <Button type="button" variant="outline" onClick={() => setSearchQuery('')}>
              Limpiar búsqueda
            </Button>
          )}
        </div>
        <p id="admin-order-search-help" className="mt-3 text-xs text-ink-muted">
          Cada registro corresponde a un comercio. Una compra puede incluir varios comercios.
        </p>
      </section>

      <RemoteState loading={resource.loading} error={resource.error} retry={resource.reload} />
      {actions.notice && <p role="status" className="rounded-xl border border-selva-border bg-selva-soft p-4 text-sm text-selva-strong">{actions.notice}</p>}
      {actions.error && !assignModal && !releaseId && <p role="alert" className="text-sm text-destructive-strong">{actions.error}</p>}


      <section aria-labelledby="admin-orders-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="admin-orders-heading" className="text-base font-semibold text-ink">Pedidos por comercio</h2>
          <p role="status" className="text-sm tabular-nums text-ink-muted">
            {filteredSuborders.length} {filteredSuborders.length === 1 ? 'registro' : 'registros'}
          </p>
        </div>

        {filteredSuborders.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag className="h-8 w-8" aria-hidden="true" />}
            title={allSuborders.length === 0 ? 'Aún no hay pedidos registrados' : 'No encontramos pedidos con esta búsqueda'}
            description={allSuborders.length === 0
              ? 'Los pedidos aparecerán aquí cuando se registre una compra.'
              : 'Prueba con otro código, comercio o cliente, o limpia la búsqueda para ver todos los pedidos.'}
            actionText={allSuborders.length > 0 ? 'Limpiar búsqueda' : undefined}
            onAction={allSuborders.length > 0 ? () => setSearchQuery('') : undefined}
          />
        ) : (
          <div className="rounded-2xl border border-border bg-surface shadow-subtle">
            <table className="block w-full text-left text-sm xl:table xl:table-fixed">
              <caption className="sr-only">Pedidos por comercio: estado, cliente, entrega, repartidor y total.</caption>
              <thead className="sr-only bg-surface-subtle text-xs text-ink-light xl:not-sr-only xl:table-header-group">
                <tr>
                  <th scope="col" className="w-1/4 rounded-tl-2xl px-4 py-3 font-semibold">Pedido y estado</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Cliente</th>
                  <th scope="col" className="w-1/4 px-3 py-3 font-semibold">Entrega</th>
                  <th scope="col" className="w-1/5 px-3 py-3 font-semibold">Repartidor</th>
                  <th scope="col" className="rounded-tr-2xl px-4 py-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="block divide-y divide-border xl:table-row-group">
                {filteredSuborders.map((order) => (
                  <tr key={order.id} className="block p-4 xl:table-row xl:p-0">
                    <th scope="row" className="block pb-3 font-normal xl:table-cell xl:px-4 xl:py-3 xl:align-top">
                      <div className="space-y-2">
                        <h3 className="break-words text-sm font-bold text-ink">{order.parentCode}</h3>
                        <p className="break-words text-xs font-medium text-ink-light">{order.merchantName}</p>
                        <OrderStatusBadge status={order.status} />
                        <Button type="button" variant="outline" size="sm" onClick={() => setDetailId(order.id)}>Ver detalle</Button>
                        <time dateTime={order.createdAt} className="block text-xs tabular-nums text-ink-muted">{formatDateTime(order.createdAt)}</time>
                      </div>
                    </th>
                    <td className="block py-2 xl:table-cell xl:px-3 xl:py-3 xl:align-top">
                      <p className="mb-1 text-xs text-ink-muted xl:hidden">Cliente</p>
                      <p className="break-words text-sm font-medium text-ink">{order.customerName}</p>
                      <p className="mt-1 break-words text-xs tabular-nums text-ink-light">{order.customerPhone}</p>
                    </td>
                    <td className="block py-2 xl:table-cell xl:px-3 xl:py-3 xl:align-top">
                      <p className="mb-1 text-xs text-ink-muted xl:hidden">Dirección de entrega</p>
                      <p className="break-words text-sm text-ink">{order.addressSnapshot.street}{order.addressSnapshot.number ? ' #' + order.addressSnapshot.number : ''}</p>
                      {order.addressSnapshot.reference && <p className="mt-1 break-words text-xs text-ink-light">Referencia: {order.addressSnapshot.reference}</p>}
                    </td>
                    <td className="block py-2 xl:table-cell xl:px-3 xl:py-3 xl:align-top">
                      <p className="mb-1 text-xs text-ink-muted xl:hidden">Repartidor</p>
                      <p className="break-words text-sm text-ink">{order.courierName || 'Sin asignar'}</p>
                      {order.source.assignment?.status === 'accepted' && order.source.status === 'ready' && <Button type="button" variant="outline" size="sm" disabled={actions.busy || resource.loading || !!resource.error} onClick={() => { actions.clear(); setReason(''); setReleaseId(order.id); }}>Liberar asignación</Button>}
                      {order.courierPhone && <p className="mt-1 text-xs tabular-nums text-ink-light">{order.courierPhone}</p>}
                      {order.status === 'listo_recoger' && !order.hasAssignment && (
                        <Button type="button" variant="outline" size="sm" className="mt-2 w-full gap-2"
                          disabled={actions.busy || resource.loading || !!resource.error} onClick={() => {
                            actions.clear(); setSelectedCourierId(''); setReason('');

                            setAssignModal({ suborderId: order.id, merchantName: order.merchantName });
                          }}>
                          <Bike className="h-4 w-4 shrink-0" aria-hidden="true" />
                          Asignar repartidor
                        </Button>
                      )}
                    </td>
                    <td className="flex items-center justify-between gap-3 border-t border-border pt-3 xl:table-cell xl:border-t-0 xl:px-4 xl:py-3 xl:text-right xl:align-top">
                      <span className="text-xs text-ink-muted xl:hidden">Total del pedido</span>
                      <span className="text-sm font-bold tabular-nums text-ink">{formatCents(order.totalCents)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Dialog
        isOpen={Boolean(assignModal)}
        onClose={() => { if (!actions.busy) setAssignModal(null); }}
        title="Asignar repartidor"
        description={`Selecciona quién recogerá el pedido de ${assignModal?.merchantName || 'este comercio'}.`}
        maxWidth="md"
      >
        <div className="space-y-6">
          <RemoteState loading={options.loading} error={options.error} retry={options.reload} />
          <Input id="admin-assignment-reason" label="Motivo de la asignación" required minLength={3} maxLength={500} value={reason} onChange={event => setReason(event.target.value)} />
          {couriers.length > 0 ? (
            <>
              <Select
                id="admin-order-courier"
                className="md:text-sm"
                label="Repartidor"
                value={selectedCourierId}
                onChange={(event) => {
                  setSelectedCourierId(event.target.value);

                }}
                aria-describedby="admin-courier-help"
              >
                <option value="" disabled>Selecciona un repartidor</option>
                {couriers.map((courier) => (
                  <option key={courier.id} value={courier.id}>
                    {courier.name}
                  </option>
                ))}
              </Select>
              <p id="admin-courier-help" className="text-sm text-ink-light">
                La lista muestra repartidores elegibles para la zona y sin asignación activa.
              </p>
            </>
          ) : (
            <p className="rounded-xl bg-surface-subtle p-4 text-sm text-ink-light">
              No hay repartidores elegibles para este pedido en la consulta actual.
            </p>
          )}
          {actions.error && <p role="alert" className="text-sm text-destructive-strong">{actions.error}</p>}

          <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={actions.busy} onClick={() => setAssignModal(null)}>Cancelar</Button>
            <Button type="button" variant="primary" disabled={!selectedCourierId || couriers.length === 0 || reason.trim().length < 3 || actions.busy || resource.loading || !!resource.error || options.loading || !!options.error} onClick={handleConfirmAssign}>
              Confirmar asignación
            </Button>
          </div>
        </div>
      </Dialog>
      <Dialog isOpen={Boolean(releaseId)} onClose={() => { if (!actions.busy) setReleaseId(null); }} title="Liberar asignación" description={releasing?.parentCode} maxWidth="md"><div className="space-y-6"><Input id="admin-release-reason" label="Motivo de la liberación" required minLength={3} maxLength={500} value={reason} onChange={event => setReason(event.target.value)} />{actions.error && <p role="alert" className="text-sm text-destructive-strong">{actions.error}</p>}<Button disabled={actions.busy || resource.loading || !!resource.error || reason.trim().length < 3} onClick={handleRelease}>Confirmar liberación</Button></div></Dialog>
      <Dialog isOpen={Boolean(detailId)} onClose={() => setDetailId(null)} title="Detalle del pedido" description={detail?.parentCode} maxWidth="md">
        {detail && <div className="space-y-4 text-sm"><OrderStatusBadge status={detail.status} /><p className="font-semibold">{detail.merchantName} · {detail.customerName}</p><p>{detail.addressSnapshot.street} {detail.addressSnapshot.number}</p><p>Estado de pago: {detail.source.paymentStatus} · Total: {formatCents(detail.totalCents)}</p><p>Efectivo recibido: {detail.source.cashReceivedCents === null ? 'Sin confirmar' : formatCents(detail.source.cashReceivedCents)}</p><ul className="divide-y divide-border">{detail.items.map((item, index) => <li key={item.productId || index} className="py-2">{item.quantity} × {item.productName}</li>)}</ul><h3 className="font-semibold">Historial del pedido</h3>{detail.source.events.map((event, index) => <p key={index} className="break-words text-ink-light">{formatDateTime(event.occurredAt)} · {event.reason || event.status}</p>)}{detail.source.incidents?.map(incident => <p key={incident.id} className="break-words text-warning-strong">{incident.description}</p>)}</div>}
      </Dialog>
    </div>
  );
};
