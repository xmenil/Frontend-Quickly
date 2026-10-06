import React from 'react';
import { useDataStore } from '../../store/dataStore';
import { formatCents } from '../../lib/currency';
import { Button } from '../../components/ui/Button';
import { Download, BarChart3, TrendingUp, ShoppingBag, Store } from 'lucide-react';

export const AdminReportsPage: React.FC = () => {
  const { purchases, merchants, couriers } = useDataStore();

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
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">Métricas de Plataforma</h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Analítica general y exportación global de datos de Quickly
          </p>
        </div>

        <Button type="button" variant="primary" size="md" onClick={handleExportPlatformCSV}>
          <Download className="w-4 h-4 mr-1.5" />
          <span>Exportar Todo a CSV</span>
        </Button>
      </div>

      {/* Global Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            GMV Bruto Total
          </span>
          <p className="text-2xl font-black text-ink">{formatCents(totalGMVCents)}</p>
          <span className="text-xs text-emerald-600 font-medium">Volumen procesado</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Total Envíos Cobrados
          </span>
          <p className="text-2xl font-black text-ink">{formatCents(totalDeliveryFeesCents)}</p>
          <span className="text-xs text-purple-600 font-medium">Tarifas a repartidores</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Total Pedidos Registrados
          </span>
          <p className="text-2xl font-black text-ink">{purchases.length}</p>
          <span className="text-xs text-blue-600 font-medium">En base de datos demo</span>
        </div>
      </div>
    </div>
  );
};
