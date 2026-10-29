import React, { useMemo, useState } from 'react';
import { useCourierOrders } from './courierModel';
import { useRemote, RemoteState } from '../operations/shared';
import { engagementApi } from '../../services/api/engagementApi';
import { reportRange } from '../merchant/merchantOrdersModel';
import { Select } from '../../components/ui/Select';
import { formatCents } from '../../lib/currency';
import { formatDateTime } from '../../lib/date';
import { EmptyState } from '../../components/ui/EmptyState';
import { DollarSign } from 'lucide-react';

export const CourierEarningsPage: React.FC = () => {
  const [period, setPeriod] = useState<'semana' | 'mes' | 'historico'>('mes');
  const range = useMemo(() => reportRange(period), [period]);
  const report = useRemote('courier-earnings:' + JSON.stringify(range), signal => engagementApi.report('/courier/earnings', range, signal));
  const history = useCourierOrders('history');
  const deliveredOrders = (history.data || []).filter(order => order.source.assignment?.status === 'delivered' && order.source.status === 'delivered' && order.source.createdAt >= range.from && order.source.createdAt < range.to);
  const totalEarningsCents = report.data?.courierFeesCents || 0;
  const count = report.data?.delivered || 0;
  const averagePerTripCents = count ? Math.round(totalEarningsCents / count) : 0;
  const indicators = [
    { label: 'Tarifas acumuladas', value: formatCents(totalEarningsCents), detail: 'Tarifas registradas en el período.' },
    { label: 'Entregas completadas', value: count, detail: 'Pedidos registrados como entregados.' },
    { label: 'Promedio por entrega', value: formatCents(averagePerTripCents), detail: 'Tarifa media de las entregas registradas.' },
  ];

  if (report.loading || report.error || history.loading || history.error) return <RemoteState loading={report.loading || history.loading} error={report.error || history.error} retry={() => { report.reload(); history.reload(); }} />;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-bold text-ink sm:text-2xl">Mis ganancias</h1>
        <p className="text-sm text-ink-light">Consulta las tarifas registradas de tus entregas completadas.</p>
      </header>
      <Select id="courier-earnings-period" label="Período" value={period} onChange={event => setPeriod(event.target.value as typeof period)}><option value="semana">Últimos 7 días</option><option value="mes">Últimos 30 días</option><option value="historico">Últimos 366 días</option></Select>
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
        <p className="text-xs text-ink-muted">Incluye el período seleccionado. Las tarifas registradas no confirman una liquidación ni un pago recibido.</p>
      </section>

      <p className="text-xs text-ink-muted">Pedidos creados durante el período, según su estado actual. Efectivo confirmado: {formatCents(report.data?.cashCollectedCents || 0)}.</p>
      <section aria-labelledby="courier-earnings-detail" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="courier-earnings-detail" className="text-base font-semibold text-ink">Desglose por entrega</h2>
          <p className="text-sm tabular-nums text-ink-muted">{deliveredOrders.length} {deliveredOrders.length === 1 ? 'registro' : 'registros'}</p>
        </div>
        {deliveredOrders.length === 0 ? (
          <EmptyState icon={<DollarSign className="h-8 w-8" aria-hidden="true" />} title="No hay entregas detalladas para este período"
            description="El desglose usa las asignaciones disponibles en tu historial y el período seleccionado." />
        ) : (
          <div className="rounded-2xl border border-border bg-surface shadow-subtle">
            <table className="block w-full text-left text-sm lg:table lg:table-fixed">
              <caption className="sr-only">Tarifas de entregas completadas, en el período seleccionado.</caption>
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
