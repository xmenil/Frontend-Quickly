import React, { useMemo } from 'react';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { formatCents } from '../../lib/currency';
import { formatDateTime } from '../../lib/date';
import { EmptyState } from '../../components/ui/EmptyState';
import { DollarSign } from 'lucide-react';

export const CourierEarningsPage: React.FC = () => {
  const { purchases, couriers } = useDataStore();
  const { currentUser } = useAuthStore();
  const currentCourier = couriers.find((courier) => courier.ownerUserId === currentUser?.id || courier.id === currentUser?.courierId) || couriers[0];
  const deliveredOrders = useMemo(() => {
    if (!currentCourier) return [];
    return purchases.flatMap((purchase) =>
      purchase.merchantOrders
        .filter((order) => order.courierId === currentCourier.id && order.status === 'entregado')
        .map((order) => ({ ...order, purchaseCode: purchase.code, customerName: purchase.customerName }))
    ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [purchases, currentCourier]);
  const totalEarningsCents = deliveredOrders.reduce((total, order) => total + order.deliveryFeeCents, 0);
  const averagePerTripCents = deliveredOrders.length > 0 ? Math.round(totalEarningsCents / deliveredOrders.length) : 0;
  const indicators = [
    { label: 'Tarifas acumuladas', value: formatCents(totalEarningsCents), detail: 'Suma de tarifas de tus entregas completadas.' },
    { label: 'Entregas completadas', value: deliveredOrders.length, detail: 'Pedidos registrados como entregados.' },
    { label: 'Promedio por entrega', value: formatCents(averagePerTripCents), detail: 'Tarifa media de las entregas registradas.' },
  ];

  if (!currentCourier) return <EmptyState title="No hay un perfil de repartidor disponible" description="Revisa que exista una cuenta de repartidor registrada para continuar." />;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-bold text-ink sm:text-2xl">Mis ganancias</h1>
        <p className="text-sm text-ink-light">Consulta las tarifas registradas de tus entregas completadas.</p>
      </header>
      <section aria-labelledby="courier-earnings-totals" className="space-y-4">
        <h2 id="courier-earnings-totals" className="text-base font-semibold text-ink">Resumen de tarifas</h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {indicators.map((indicator) => (
            <div key={indicator.label} className="min-w-0 space-y-2 rounded-2xl border border-border bg-surface p-4">
              <dt className="text-sm font-medium text-ink-light">{indicator.label}</dt>
              <dd className="break-words text-xl font-bold tabular-nums text-ink">{indicator.value}</dd>
              <dd className="text-xs text-ink-muted">{indicator.detail}</dd>
            </div>
          ))}
        </dl>
        <p className="text-xs text-ink-muted">Incluye todo el historial disponible. Las tarifas registradas no confirman una liquidación ni un pago recibido.</p>
      </section>

      <section aria-labelledby="courier-earnings-detail" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="courier-earnings-detail" className="text-base font-semibold text-ink">Desglose por entrega</h2>
          <p className="text-sm tabular-nums text-ink-muted">{deliveredOrders.length} {deliveredOrders.length === 1 ? 'registro' : 'registros'}</p>
        </div>
        {deliveredOrders.length === 0 ? (
          <EmptyState icon={<DollarSign className="h-8 w-8" aria-hidden="true" />} title="Aún no hay tarifas de entregas completadas"
            description={`Tus tarifas aparecerán aquí al completar entregas. Por ahora, el total registrado es ${formatCents(0)}.`} />
        ) : (
          <div className="rounded-2xl border border-border bg-surface shadow-subtle">
            <table className="block w-full text-left text-sm lg:table lg:table-fixed">
              <caption className="sr-only">Tarifas de entregas completadas, sin filtro de fecha.</caption>
              <thead className="sr-only bg-surface-subtle text-xs text-ink-light lg:not-sr-only lg:table-header-group">
                <tr>
                  <th scope="col" className="w-1/3 rounded-tl-2xl px-4 py-3 font-semibold">Pedido y comercio</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Cliente</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Fecha registrada</th>
                  <th scope="col" className="rounded-tr-2xl px-4 py-3 text-right font-semibold">Tarifa registrada</th>
                </tr>
              </thead>
              <tbody className="block divide-y divide-border lg:table-row-group">
                {deliveredOrders.map((order) => (
                  <tr key={order.id} className="block p-4 lg:table-row lg:p-0">
                    <th scope="row" className="block pb-3 font-normal lg:table-cell lg:px-4 lg:py-3 lg:align-middle"><h3 className="break-words text-sm font-bold text-ink">{order.purchaseCode}</h3><p className="mt-1 break-words text-xs text-ink-light">{order.merchantName}</p></th>
                    <td className="block py-2 lg:table-cell lg:px-3 lg:py-3 lg:align-middle"><p className="mb-1 text-xs text-ink-muted lg:hidden">Cliente</p><p className="break-words text-sm text-ink-light">{order.customerName}</p></td>
                    <td className="flex items-start justify-between gap-3 py-2 text-xs text-ink-muted lg:table-cell lg:px-3 lg:py-3 lg:align-middle"><span className="lg:hidden">Fecha registrada</span><time dateTime={order.updatedAt} className="text-right tabular-nums lg:text-left">{formatDateTime(order.updatedAt)}</time></td>
                    <td className="flex items-center justify-between gap-3 py-2 lg:table-cell lg:px-4 lg:py-3 lg:text-right lg:align-middle"><span className="text-xs text-ink-muted lg:hidden">Tarifa registrada</span><span className="font-semibold tabular-nums text-ink">{formatCents(order.deliveryFeeCents)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
