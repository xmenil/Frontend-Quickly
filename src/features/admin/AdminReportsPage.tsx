import React, { useMemo, useState } from 'react';
import { engagementApi } from '../../services/api/engagementApi';
import { orderingApi } from '../../services/api/orderingApi';
import { allPages } from '../customer/customerAccountModel';
import { reportRange } from '../merchant/merchantOrdersModel';
import { downloadCsv, useAdminResource } from './adminModel';
import { RemoteState } from '../operations/shared';
import { Select } from '../../components/ui/Select';
import { formatCents } from '../../lib/currency';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Download, BarChart3, CheckCircle2, AlertCircle } from 'lucide-react';

export const AdminReportsPage: React.FC = () => {
  const [period, setPeriod] = useState<'semana' | 'mes' | 'historico'>('mes');
  const range = useMemo(() => reportRange(period), [period]);
  const resource = useAdminResource('reports:' + JSON.stringify(range), async signal => {
    const [report, orders] = await Promise.all([engagementApi.report('/admin/reports', range, signal), allPages(cursor => orderingApi.list('/admin/orders', { cursor, limit: '50' }, signal))]);
    return { report, orders: orders.filter(order => Date.parse(order.createdAt) >= Date.parse(range.from) && Date.parse(order.createdAt) < Date.parse(range.to)) };
  });
  const [notice, setNotice] = useState(''); const [error, setError] = useState('');
  const purchases = resource.data?.orders || [];
  const handleExportPlatformCSV = () => downloadCsv('reporte_global_quickly.csv', [
    ['ID_Pedido','ID_Compra','Código','Comercio','Fecha','Estado','Total_Soles','Estado_Pago','Desde_Inclusivo','Hasta_Exclusivo'],
    ...purchases.map(order => [order.id, order.purchaseId, order.code, order.storeName, order.createdAt, order.status, (order.totalCents / 100).toFixed(2), order.paymentStatus, range.from, range.to]),
  ]);
  const exportReport = () => {
    setNotice('');
    setError('');
    if (purchases.length === 0 || resource.loading || resource.error) return;
    try {
      handleExportPlatformCSV();
      setNotice('Se inició la descarga del reporte.');
    } catch {
      setError('No pudimos generar el archivo. Inténtalo nuevamente.');
    }
  };

  const indicators = [
    { label: 'Ventas entregadas', value: formatCents(resource.data?.report.deliveredSalesCents || 0), detail: 'Total de pedidos entregados, incluido envío, creados durante el período.' },
    { label: 'Tarifas de reparto', value: formatCents(resource.data?.report.courierFeesCents || 0), detail: 'Asignaciones entregadas de esa cohorte. No representa liquidación.' },
    { label: 'Pedidos registrados', value: resource.data?.report.orders || 0, detail: 'Pedidos por comercio creados durante el período, en todos los estados.' },
    { label: 'Efectivo confirmado', value: formatCents(resource.data?.report.cashCollectedCents || 0), detail: 'Importe neto confirmado; no es el total de billetes recibidos.' },
  ];
  if (!resource.data || resource.error) return <RemoteState loading={resource.loading} error={resource.error} retry={resource.reload} />;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 space-y-2">
          <h1 className="text-xl font-bold text-ink sm:text-2xl">Reportes de la plataforma</h1>
          <p className="text-sm text-ink-light">Consulta los agregados por período y exporta los pedidos consultados.</p>
        </div>
        <Button type="button" variant="primary" size="sm" className="w-full shrink-0 gap-2 xl:w-auto" disabled={purchases.length === 0 || resource.loading || !!resource.error} onClick={exportReport}>
          <Download className="h-4 w-4" aria-hidden="true" />Exportar CSV
        </Button>
      </header>

      <Select id="admin-report-period" label="Período" value={period} onChange={event => { setNotice(''); setPeriod(event.target.value as typeof period); }}><option value="semana">Últimos 7 días</option><option value="mes">Últimos 30 días</option><option value="historico">Últimos 366 días</option></Select>
      <RemoteState loading={resource.loading} error={resource.error} retry={resource.reload} />
      {notice && <div role="status" className="flex items-start gap-3 rounded-xl border border-selva-border bg-selva-soft p-4 text-sm text-selva-strong"><CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" /><p>{notice}</p></div>}
      {error && <div role="alert" className="flex items-start gap-3 rounded-xl border border-destructive-border bg-destructive-soft p-4 text-sm text-destructive-strong"><AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" /><p>{error}</p></div>}

      <section aria-labelledby="admin-report-totals" className="space-y-4">
        <div className="space-y-1">
          <h2 id="admin-report-totals" className="text-base font-semibold text-ink">Totales registrados</h2>
          <p className="text-xs text-ink-light">Período por creación del pedido [inicio, fin), según su estado actual.</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface shadow-subtle">
          <table className="w-full table-fixed text-left text-sm">
            <caption className="sr-only">Totales registrados de compras y tarifas de envío.</caption>
            <thead className="bg-surface-subtle text-xs text-ink-light">
              <tr>
                <th scope="col" className="rounded-tl-2xl px-4 py-3 font-semibold">Indicador</th>
                <th scope="col" className="rounded-tr-2xl px-4 py-3 text-right font-semibold lg:rounded-none">Total</th>
                <th scope="col" className="hidden w-1/2 rounded-tr-2xl px-4 py-3 font-semibold lg:table-cell">Alcance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {indicators.map((indicator) => (
                <tr key={indicator.label}>
                  <th scope="row" className="px-4 py-3 font-medium text-ink">{indicator.label}<p className="mt-1 text-xs font-normal text-ink-muted lg:hidden">{indicator.detail}</p></th>
                  <td className="break-words px-4 py-3 text-right font-semibold tabular-nums text-ink">{indicator.value}</td>
                  <td className="hidden px-4 py-3 text-xs text-ink-muted lg:table-cell">{indicator.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="admin-report-export" className="space-y-4">
        <h2 id="admin-report-export" className="text-base font-semibold text-ink">Exportación de pedidos</h2>
        {purchases.length === 0 ? (
          <EmptyState icon={<BarChart3 className="h-8 w-8" aria-hidden="true" />} title="No hay pedidos en el período seleccionado"
            description="Selecciona otro período para consultar sus pedidos." />
        ) : (
          <div className="space-y-2 rounded-2xl border border-border bg-surface p-4">
            <p className="text-sm font-medium tabular-nums text-ink">{purchases.length} {purchases.length === 1 ? 'pedido disponible' : 'pedidos disponibles'} para exportar</p>
            <p className="text-xs text-ink-light">El CSV incluye pedido, compra, comercio, fecha, total, estados de pedido/pago y período consultado.</p>
            <p className="text-xs text-ink-muted">Usa “Exportar CSV” para descargar los pedidos del período seleccionado.</p>
          </div>
        )}
      </section>
    </div>
  );
};
