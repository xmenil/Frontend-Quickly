import React, { useState } from 'react';
import { useDataStore } from '../../store/dataStore';
import { formatCents } from '../../lib/currency';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Download, BarChart3, CheckCircle2, AlertCircle } from 'lucide-react';

export const AdminReportsPage: React.FC = () => {
  const { purchases } = useDataStore();

  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const totalGMVCents = purchases.reduce((acc, p) => acc + p.grandTotalCents, 0);
  const totalDeliveryFeesCents = purchases.reduce((acc, p) => acc + p.totalDeliveryFeeCents, 0);

  const handleExportPlatformCSV = () => {
    const headers = ['ID_Compra', 'Codigo', 'Cliente', 'Fecha', 'Metodo_Pago', 'Total_Soles', 'Estado'];
    const rows = purchases.map((p) => [
      p.id,
      p.code,
      p.customerName,
      p.createdAt,
      p.paymentMethod,
      (p.grandTotalCents / 100).toFixed(2),
      p.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_global_quickly_tingo_maria.csv`);
    document.body.appendChild(link);
    try {
      link.click();
    } finally {
      link.remove();
    }
  };

  const exportReport = () => {
    setNotice('');
    setError('');
    if (purchases.length === 0) return;
    try {
      handleExportPlatformCSV();
      setNotice('Se inició la descarga del reporte.');
    } catch {
      setError('No pudimos generar el archivo. Inténtalo nuevamente.');
    }
  };

  const indicators = [
    { label: 'Monto total registrado', value: formatCents(totalGMVCents), detail: 'Suma de todas las compras, incluidas las canceladas.' },
    { label: 'Tarifas de envío registradas', value: formatCents(totalDeliveryFeesCents), detail: 'Suma de tarifas de todas las compras. No confirma su cobro ni el pago a repartidores.' },
    { label: 'Compras registradas', value: purchases.length, detail: 'Una compra puede incluir pedidos de varios comercios.' },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 space-y-2">
          <h1 className="text-xl font-bold text-ink sm:text-2xl">Reportes de la plataforma</h1>
          <p className="text-sm text-ink-light">Consulta los totales registrados y exporta las compras.</p>
        </div>
        <Button type="button" variant="primary" size="sm" className="w-full shrink-0 gap-2 xl:w-auto" disabled={purchases.length === 0} onClick={exportReport}>
          <Download className="h-4 w-4" aria-hidden="true" />Exportar CSV
        </Button>
      </header>

      {notice && <div role="status" className="flex items-start gap-3 rounded-xl border border-selva-border bg-selva-soft p-4 text-sm text-selva-strong"><CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" /><p>{notice}</p></div>}
      {error && <div role="alert" className="flex items-start gap-3 rounded-xl border border-destructive-border bg-destructive-soft p-4 text-sm text-destructive-strong"><AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" /><p>{error}</p></div>}

      <section aria-labelledby="admin-report-totals" className="space-y-4">
        <div className="space-y-1">
          <h2 id="admin-report-totals" className="text-base font-semibold text-ink">Totales registrados</h2>
          <p className="text-xs text-ink-light">Incluyen todos los estados, sin filtro de fecha.</p>
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
        <h2 id="admin-report-export" className="text-base font-semibold text-ink">Exportación de compras</h2>
        {purchases.length === 0 ? (
          <EmptyState icon={<BarChart3 className="h-8 w-8" aria-hidden="true" />} title="Aún no hay compras para generar el reporte"
            description="La exportación estará disponible cuando se registre la primera compra." />
        ) : (
          <div className="space-y-2 rounded-2xl border border-border bg-surface p-4">
            <p className="text-sm font-medium tabular-nums text-ink">{purchases.length} {purchases.length === 1 ? 'compra disponible' : 'compras disponibles'} para exportar</p>
            <p className="text-xs text-ink-light">El CSV incluye identificador, código, cliente, fecha, método de pago, total en soles y estado de cada compra.</p>
            <p className="text-xs text-ink-muted">Usa “Exportar CSV” para descargar todos los registros disponibles.</p>
          </div>
        )}
      </section>
    </div>
  );
};
