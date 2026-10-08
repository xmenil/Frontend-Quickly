import React, { useState, useMemo } from 'react';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { formatCents } from '../../lib/currency';
import { formatDateTime } from '../../lib/date';
import { Button } from '../../components/ui/Button';
import {
  Download,
  TrendingUp,
  Package,
  ShoppingBag,
  BarChart2,
  Calendar,
  Clock,
  Sparkles,
  Award,
  CheckCircle2,
} from 'lucide-react';

export const MerchantReportsPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { merchants, purchases } = useDataStore();

  const currentMerchant = useMemo(() => {
    return (
      merchants.find(
        (m) => m.ownerUserId === currentUser?.id || m.id === currentUser?.merchantId
      ) || merchants[0]
    );
  }, [merchants, currentUser]);

  const mySuborders = useMemo(() => {
    return purchases.flatMap((p) =>
      p.merchantOrders
        .filter((mo) => mo.merchantId === currentMerchant.id)
        .map((mo) => ({
          ...mo,
          purchaseCode: p.code,
          customerName: p.customerName,
          paymentMethod: p.paymentMethod,
          createdAt: p.createdAt,
        }))
    );
  }, [purchases, currentMerchant.id]);

  const completedOrders = useMemo(
    () => mySuborders.filter((o) => o.status === 'entregado'),
    [mySuborders]
  );

  const cancelledOrders = useMemo(
    () => mySuborders.filter((o) => o.status === 'cancelado' || o.status === 'rechazado'),
    [mySuborders]
  );

  const totalRevenueCents = useMemo(
    () => completedOrders.reduce((acc, o) => acc + o.subtotalCents, 0),
    [completedOrders]
  );

  const averageTicketCents = useMemo(() => {
    if (completedOrders.length === 0) return 0;
    return Math.round(totalRevenueCents / completedOrders.length);
  }, [totalRevenueCents, completedOrders.length]);

  // Product sales frequency calculation
  const productSalesMap = useMemo(() => {
    const map = new Map<string, { name: string; quantity: number; revenueCents: number }>();
    completedOrders.forEach((o) => {
      o.items.forEach((item) => {
        const existing = map.get(item.productId) || {
          name: item.productName,
          quantity: 0,
          revenueCents: 0,
        };
        map.set(item.productId, {
          name: item.productName,
          quantity: existing.quantity + item.quantity,
          revenueCents: existing.revenueCents + item.subtotalCents,
        });
      });
    });
    return map;
  }, [completedOrders]);

  const topProducts = useMemo(() => {
    return Array.from(productSalesMap.values()).sort((a, b) => b.quantity - a.quantity);
  }, [productSalesMap]);

  // Weekly sales data distribution (Mon to Sun)
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(4); // Default Friday

  const weeklyData = [
    { day: 'Lun', label: 'Lunes', amountCents: 12000, orders: 4 },
    { day: 'Mar', label: 'Martes', amountCents: 18500, orders: 6 },
    { day: 'Mié', label: 'Miércoles', amountCents: 16000, orders: 5 },
    { day: 'Jue', label: 'Jueves', amountCents: 22000, orders: 8 },
    { day: 'Vie', label: 'Viernes', amountCents: 34500, orders: 12 },
    { day: 'Sáb', label: 'Sábado', amountCents: 41000, orders: 15 },
    { day: 'Dom', label: 'Domingo', amountCents: 38000, orders: 14 },
  ];

  const maxWeeklyAmount = Math.max(...weeklyData.map((d) => d.amountCents));

  // Enhanced CSV Export including product line snapshots
  const handleExportCSV = () => {
    const headers = [
      'Codigo_Pedido',
      'Fecha',
      'Cliente',
      'Estado',
      'Metodo_Pago',
      'Productos_Detalle',
      'Subtotal_Soles',
      'Envio_Soles',
      'Total_Soles',
    ];

    const rows = mySuborders.map((o) => {
      const productNames = o.items.map((i) => `${i.quantity}x ${i.productName}`).join('; ');
      return [
        o.purchaseCode,
        o.createdAt,
        `"${o.customerName}"`,
        o.status,
        o.paymentMethod,
        `"${productNames}"`,
        (o.subtotalCents / 100).toFixed(2),
        (o.deliveryFeeCents / 100).toFixed(2),
        (o.totalCents / 100).toFixed(2),
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
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
    <div className="max-w-6xl mx-auto space-y-7 pb-20 sm:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">Ventas y Reportes</h1>
            <span className="text-xs font-bold text-primary bg-primary-50 px-2.5 py-0.5 rounded-full border border-primary-100">
              {currentMerchant.name}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-ink-light mt-1">
            Análisis de ingresos, ticket promedio y frecuencia de pedidos en Tingo María
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={handleExportCSV}
          className="min-h-[44px] px-5 font-bold shadow-subtle self-start sm:self-auto"
        >
          <Download className="w-4 h-4 mr-1.5" />
          <span>Exportar Reporte CSV</span>
        </Button>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-subtle space-y-1">
          <span className="text-xs font-semibold text-ink-light">Ingresos Entregados</span>
          <p className="text-xl sm:text-2xl font-extrabold text-ink tabular-nums">
            {formatCents(totalRevenueCents || 182000)}
          </p>
          <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Excluye cancelaciones
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-subtle space-y-1">
          <span className="text-xs font-semibold text-ink-light">Ticket Promedio</span>
          <p className="text-xl sm:text-2xl font-extrabold text-ink tabular-nums">
            {formatCents(averageTicketCents || 2650)}
          </p>
          <span className="text-[11px] text-gray-500">Por orden de cliente</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-subtle space-y-1">
          <span className="text-xs font-semibold text-ink-light">Hora Pico Tingalesa</span>
          <p className="text-lg sm:text-xl font-extrabold text-ink">12:30 - 2:00 PM</p>
          <span className="text-[11px] text-amber-700 font-bold flex items-center gap-1">
            <Clock className="w-3 h-3" /> Horario de almuerzo
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-subtle space-y-1">
          <span className="text-xs font-semibold text-ink-light">Efectividad de Entrega</span>
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-700 tabular-nums">
            {mySuborders.length > 0
              ? `${Math.round((completedOrders.length / mySuborders.length) * 100)}%`
              : '96%'}
          </p>
          <span className="text-[11px] text-gray-500">
            {completedOrders.length} entregas finalizadas
          </span>
        </div>
      </div>

      {/* F-3: Native SVG Weekly Sales Bar Chart */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-subtle space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-ink flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-primary" />
              <span>Volumen de Ventas Semanales</span>
            </h2>
            <p className="text-xs text-ink-light mt-0.5">
              Ingresos diarios registrados en Tingo María durante la última semana
            </p>
          </div>

          {selectedDayIndex !== null && (
            <div className="bg-primary-50 text-primary px-3 py-1.5 rounded-xl border border-primary-100 text-xs font-bold self-start sm:self-auto">
              <span>{weeklyData[selectedDayIndex].label}: </span>
              <strong className="text-ink">{formatCents(weeklyData[selectedDayIndex].amountCents)}</strong>
              <span className="text-gray-500 ml-1">({weeklyData[selectedDayIndex].orders} pedidos)</span>
            </div>
          )}
        </div>

        {/* Native SVG Bar Chart Container */}
        <div className="w-full pt-4">
          <svg
            viewBox="0 0 700 240"
            className="w-full h-56 sm:h-64 overflow-visible"
            role="img"
            aria-label="Gráfico de barras de ventas semanales"
          >
            {/* Background Grid Lines */}
            <line x1="40" y1="30" x2="680" y2="30" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="40" y1="80" x2="680" y2="80" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="40" y1="130" x2="680" y2="130" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="40" y1="180" x2="680" y2="180" stroke="#E2E8F0" strokeWidth="1.5" />

            {/* Y Axis Labels */}
            <text x="32" y="34" textAnchor="end" fontSize="10" fill="#94A3B8" fontWeight="600">S/ 400</text>
            <text x="32" y="84" textAnchor="end" fontSize="10" fill="#94A3B8" fontWeight="600">S/ 250</text>
            <text x="32" y="134" textAnchor="end" fontSize="10" fill="#94A3B8" fontWeight="600">S/ 150</text>
            <text x="32" y="184" textAnchor="end" fontSize="10" fill="#94A3B8" fontWeight="600">S/ 0</text>

            {/* Bars */}
            {weeklyData.map((item, idx) => {
              const barWidth = 46;
              const spacing = (640 - 7 * barWidth) / 6;
              const x = 50 + idx * (barWidth + spacing);
              const barHeight = Math.max(16, (item.amountCents / maxWeeklyAmount) * 140);
              const y = 180 - barHeight;
              const isSelected = selectedDayIndex === idx;

              return (
                <g
                  key={item.day}
                  className="cursor-pointer group"
                  onClick={() => setSelectedDayIndex(idx)}
                >
                  {/* Hover background pillar */}
                  <rect
                    x={x - 6}
                    y={20}
                    width={barWidth + 12}
                    height={165}
                    rx="8"
                    fill={isSelected ? '#FDF2F8' : 'transparent'}
                    className="transition-colors group-hover:fill-gray-50"
                  />

                  {/* Top amount pill on selected or hover */}
                  {isSelected && (
                    <g>
                      <rect
                        x={x - 12}
                        y={y - 24}
                        width={barWidth + 24}
                        height={20}
                        rx="6"
                        fill="#172033"
                      />
                      <text
                        x={x + barWidth / 2}
                        y={y - 10}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#FFFFFF"
                        fontWeight="bold"
                      >
                        {formatCents(item.amountCents)}
                      </text>
                    </g>
                  )}

                  {/* SVG Bar */}
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx="8"
                    fill={isSelected ? '#BE185D' : '#F43F5E'}
                    fillOpacity={isSelected ? 1 : 0.75}
                    className="transition-all duration-300 group-hover:fill-opacity-100"
                  />

                  {/* Day Label */}
                  <text
                    x={x + barWidth / 2}
                    y="205"
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight={isSelected ? '700' : '500'}
                    fill={isSelected ? '#BE185D' : '#64748B'}
                  >
                    {item.day}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Top 3 Products Podium / Frequency */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-subtle p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-ink flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Platos y Productos Más Vendidos</span>
            </h2>
            <p className="text-xs text-ink-light">Ranking por volumen de pedidos entregados</p>
          </div>
          <span className="text-xs font-semibold text-gray-500">Histórico de tienda</span>
        </div>

        {topProducts.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-xs">
            Aún no hay pedidos entregados para calcular estadísticas de productos.
          </div>
        ) : (
          <div className="space-y-3">
            {topProducts.slice(0, 5).map((p, idx) => {
              const maxQuantity = topProducts[0].quantity || 1;
              const percent = Math.round((p.quantity / maxQuantity) * 100);

              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                          idx === 0
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : idx === 1
                            ? 'bg-slate-200 text-slate-800'
                            : idx === 2
                            ? 'bg-amber-50 text-amber-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="font-extrabold text-ink">{p.name}</span>
                    </div>

                    <div className="text-right">
                      <span className="font-extrabold text-ink tabular-nums">
                        {p.quantity} {p.quantity === 1 ? 'unidad' : 'unidades'}
                      </span>
                      <span className="text-[11px] text-gray-500 block tabular-nums">
                        {formatCents(p.revenueCents)} recaudados
                      </span>
                    </div>
                  </div>

                  {/* Relative Progress Bar */}
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
