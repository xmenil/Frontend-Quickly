import React from 'react';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { formatCents } from '../../lib/currency';
import { Button } from '../../components/ui/Button';
import { Download, TrendingUp, Package, ShoppingBag, BarChart2 } from 'lucide-react';

export const MerchantReportsPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { merchants, purchases } = useDataStore();

  const currentMerchant =
    merchants.find((m) => m.ownerUserId === currentUser?.id || m.id === currentUser?.merchantId) ||
    merchants[0];

  const mySuborders = purchases.flatMap((p) =>
    p.merchantOrders
      .filter((mo) => mo.merchantId === currentMerchant.id)
      .map((mo) => ({
        ...mo,
        purchaseCode: p.code,
        createdAt: p.createdAt,
      }))
  );

  const completedOrders = mySuborders.filter((o) => o.status === 'entregado');
  const cancelledOrders = mySuborders.filter((o) => o.status === 'cancelado' || o.status === 'rechazado');

  const totalRevenueCents = completedOrders.reduce((acc, o) => acc + o.subtotalCents, 0);

  // Calculate product sales frequency
  const productSalesMap = new Map<string, { name: string; quantity: number; revenueCents: number }>();

  completedOrders.forEach((o) => {
    o.items.forEach((item) => {
      const existing = productSalesMap.get(item.productId) || {
        name: item.productName,
        quantity: 0,
        revenueCents: 0,
      };
      productSalesMap.set(item.productId, {
        name: item.productName,
        quantity: existing.quantity + item.quantity,
        revenueCents: existing.revenueCents + item.subtotalCents,
      });
    });
  });

  const topProducts = Array.from(productSalesMap.values()).sort((a, b) => b.quantity - a.quantity);

  // Local CSV Export function
  const handleExportCSV = () => {
    const headers = ['Codigo_Pedido', 'Fecha', 'Estado', 'Subtotal_Soles', 'Envio_Soles', 'Total_Soles'];
    const rows = mySuborders.map((o) => [
      o.purchaseCode,
      o.createdAt,
      o.status,
      (o.subtotalCents / 100).toFixed(2),
      (o.deliveryFeeCents / 100).toFixed(2),
      (o.totalCents / 100).toFixed(2),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_ventas_${currentMerchant.id}_tingo_maria.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">Ventas y Reportes</h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Métricas de rendimiento de {currentMerchant.name} en Tingo María
          </p>
        </div>

        <Button type="button" variant="primary" size="md" onClick={handleExportCSV}>
          <Download className="w-4 h-4 mr-1.5" />
          <span>Exportar Reporte CSV</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Ingresos Entregados
          </span>
          <p className="text-2xl font-black text-ink">{formatCents(totalRevenueCents)}</p>
          <span className="text-xs text-emerald-600 font-medium">Excluye pedidos cancelados</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Pedidos Completados
          </span>
          <p className="text-2xl font-black text-ink">{completedOrders.length}</p>
          <span className="text-xs text-gray-500">Entregas exitosas</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Tasa de Cancelación
          </span>
          <p className="text-2xl font-black text-ink">
            {mySuborders.length > 0
              ? `${Math.round((cancelledOrders.length / mySuborders.length) * 100)}%`
              : '0%'}
          </p>
          <span className="text-xs text-amber-600 font-medium">
            {cancelledOrders.length} cancelados o rechazados
          </span>
        </div>
      </div>

      {/* Top Selling Products */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-lg text-ink">Productos Más Vendidos</h2>
        {topProducts.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">
            Aún no hay pedidos entregados para calcular estadísticas de productos.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {topProducts.map((p, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary-light text-primary flex items-center justify-center font-bold text-xs">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-ink">{p.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-ink">{p.quantity} unidades</span>
                  <span className="text-gray-400 text-xs block">
                    {formatCents(p.revenueCents)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
