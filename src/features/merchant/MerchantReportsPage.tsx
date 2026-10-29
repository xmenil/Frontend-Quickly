import React, { useState, useMemo } from 'react';
import { useMerchantOrders, useMerchantWorkspace, useMerchantReport } from './merchantOrdersModel';
import { RemoteState } from '../operations/shared';
import { useAuthStore } from '../../store/authStore';
import { formatCents } from '../../lib/currency';
import { formatDateTime } from '../../lib/date';
import { Button } from '../../components/ui/Button';
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/ui/Badge';
import {
  Download,
  TrendingUp,
  ShoppingBag,
  BarChart2,
  Calendar,
  Clock,
  Award,
  CheckCircle2,
  Banknote,
  Smartphone,
  CreditCard,
  Search,
  Receipt,
  XCircle,
  HelpCircle,
} from 'lucide-react';

type PeriodFilter = 'semana' | 'mes' | 'historico';

export const MerchantReportsPage: React.FC = () => {
  const workspace = useMerchantWorkspace(); const resource = useMerchantOrders();
  const currentMerchant = workspace.data?.merchant;
  const [period, setPeriod] = useState<PeriodFilter>('semana'); const [historySearch, setHistorySearch] = useState('');
  const report = useMerchantReport(period); const mySuborders = resource.data || [];
  const filteredSuborders = mySuborders.filter(order => Date.parse(order.createdAt) >= Date.parse(report.range.from) && Date.parse(order.createdAt) < Date.parse(report.range.to));
  const completedOrders = filteredSuborders.filter(order => order.status === 'entregado');
  const cancelledOrders = filteredSuborders.filter(order => ['cancelado', 'rechazado'].includes(order.status));
  const totalRevenueCents = report.data?.deliveredSalesCents ?? 0;
  const averageTicketCents = report.data?.delivered ? Math.round(report.data.deliveredSalesCents / report.data.delivered) : 0;
  const deliverySuccessRate = report.data?.orders ? Math.round(report.data.delivered * 100 / report.data.orders) : null;
  const cashOrders = filteredSuborders.filter(order => order.source.paymentStatus === 'succeeded');
  const paymentBreakdown = { yape: { count: 0, cents: 0, pct: 0 }, card: { count: 0, cents: 0, pct: 0 },
    cash: { count: cashOrders.length, cents: report.data?.cashCollectedCents ?? 0, pct: cashOrders.length ? 100 : 0 } };
  const topProducts: { name: string; quantity: number; revenueCents: number }[] = [];
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const weeklyData: { day: string; label: string; amountCents: number; orders: number }[] = [];
  const maxWeeklyAmount = 1;

  // Historial de transacciones con buscador
  const transactionHistory = useMemo(() => {
    return filteredSuborders.filter((order) => {
      if (!historySearch.trim()) return true;
      const q = historySearch.toLowerCase().trim();
      return (
        order.purchaseCode.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.customerPhone.includes(q)
      );
    });
  }, [filteredSuborders, historySearch]);

  // Exportación oficial a CSV con UTF-8 BOM
  const handleExportCSV = () => {
    if (resource.loading || resource.error || !currentMerchant) return;
    const headers = [
      'Codigo_Comanda',
      'Fecha_Registro',
      'Cliente',
      'Telefono',
      'Estado_Comanda',
      'Metodo_Pago',
      'Detalle_Platos',
      'Subtotal_Soles',
      'Envio_Soles',
      'Total_Soles',
    ];

    const rows = transactionHistory.map((o) => {
      const itemsList = o.items.map((i) => `${i.quantity}x ${i.productName}`).join('; ');
      return [
        o.purchaseCode,
        formatDateTime(o.createdAt),
        o.customerName,
        o.customerPhone,
        o.status,
        o.paymentMethod,
        itemsList,
        (o.subtotalCents / 100).toFixed(2),
        (o.deliveryFeeCents / 100).toFixed(2),
        (o.totalCents / 100).toFixed(2),
      ];
    });

    const csvString =
      '\uFEFF' + [headers.join(','), ...rows.map(row => row.map(value => {
        const text = String(value);
        const literal = /^[\s]*[=+@-]/.test(text) ? "'" + text : text;
        return '"' + literal.split('"').join('""') + '"';
      }).join(','))].join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte_ventas_${currentMerchant.id}_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Cálculo de totales y promedio semanal para la línea de referencia Power BI
  const weeklyTotalAmount = useMemo(
    () => weeklyData.reduce((acc, d) => acc + d.amountCents, 0),
    [weeklyData]
  );
  const weeklyAvgAmount = useMemo(
    () => weeklyData.length ? Math.round(weeklyTotalAmount / weeklyData.length) : 0,
    [weeklyTotalAmount, weeklyData]
  );

  if (!currentMerchant) return <div className="space-y-4"><RemoteState loading={workspace.loading} error={workspace.error} retry={workspace.reload} />{!workspace.loading && !workspace.error && <p>Selecciona una tienda autorizada.</p>}</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-20 sm:pb-8">
      <RemoteState loading={workspace.loading} error={workspace.error} retry={workspace.reload} />
      <RemoteState loading={resource.loading} error={resource.error} retry={resource.reload} />
      <RemoteState loading={report.loading} error={report.error} retry={report.reload} />
      {report.data && <p className="rounded-xl border border-border bg-surface-subtle p-3 text-xs text-ink-light">{report.data.definition}<br />Efectivo confirmado: {formatCents(report.data.cashCollectedCents)} · Tarifas de reparto: {formatCents(report.data.courierFeesCents)}</p>}
      {/* BLOQUE 1: Cabecera Estilo Power BI, Segmentador de Período y Botón Exportar */}
      <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-ink tracking-tight font-sans">
              Ventas y Reportes
            </h1>
            <span className="text-[11px] font-bold text-primary bg-primary-50 px-2.5 py-0.5 rounded-md border border-primary-200 uppercase tracking-wider">
              {currentMerchant.name}
            </span>
            <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-300 uppercase tracking-widest hidden sm:inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 inline-block rounded-full"></span>
              Power BI Dashboard
            </span>
          </div>
          <p className="text-xs sm:text-sm text-ink-light mt-1">
            Análisis financiero corporativo, métodos de pago e historial de comanda en Tingo María
          </p>
        </div>

        {/* Filtro de Período Tipo Segmentador (Slicer) Compacto con Estilo de la Plataforma */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          {/* Segmentador con estilo uniforme Quickly */}
          <div className="bg-surface p-1 rounded-lg border border-border shadow-xs flex items-center gap-1 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setPeriod('semana')}
              className={`h-7.5 sm:h-8 px-3 rounded-md text-xs font-bold transition-all flex-1 sm:flex-initial text-center select-none flex items-center justify-center ${
                period === 'semana'
                  ? 'bg-primary text-white shadow-xs font-extrabold'
                  : 'text-ink-light hover:bg-surface-subtle hover:text-ink'
              }`}
            >
              7 Días
            </button>
            <button
              type="button"
              onClick={() => setPeriod('mes')}
              className={`h-7.5 sm:h-8 px-3 rounded-md text-xs font-bold transition-all flex-1 sm:flex-initial text-center select-none flex items-center justify-center ${
                period === 'mes'
                  ? 'bg-primary text-white shadow-xs font-extrabold'
                  : 'text-ink-light hover:bg-surface-subtle hover:text-ink'
              }`}
            >
              Este Mes
            </button>
            <button
              type="button"
              onClick={() => setPeriod('historico')}
              className={`h-7.5 sm:h-8 px-3 rounded-md text-xs font-bold transition-all flex-1 sm:flex-initial text-center select-none flex items-center justify-center ${
                period === 'historico'
                  ? 'bg-primary text-white shadow-xs font-extrabold'
                  : 'text-ink-light hover:bg-surface-subtle hover:text-ink'
              }`}
            >
              Últimos 366 días
            </button>
          </div>

          <button
            type="button"
            disabled={resource.loading || !!resource.error}
            onClick={handleExportCSV}
            className="w-full sm:w-auto h-7.5 sm:h-8 px-3.5 rounded-lg font-bold text-xs bg-primary text-white hover:bg-primary-hover border border-primary transition-all flex items-center justify-center gap-1.5 shadow-subtle select-none active:scale-[0.99]"
          >
            <Download className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* BLOQUE 2: 4 Tarjetas KPI Básicas, Simples y Compactas (Sin muchos colores) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Ventas Entregadas */}
        <div className="bg-surface p-3 sm:p-3.5 rounded-xl border border-border shadow-subtle space-y-1">
          <div className="flex items-center justify-between text-ink-light">
            <span className="text-xs font-semibold text-ink-light">
              Ingresos Entregados
            </span>
            <Receipt className="w-4 h-4 text-ink-muted" />
          </div>
          <p className="text-lg sm:text-xl md:text-2xl font-black text-ink tabular-nums tracking-tight">
            {report.loading || report.error ? "—" : formatCents(totalRevenueCents)}
          </p>
          <div className="text-[11px] text-ink-muted pt-0.5">
            <span>Ventas entregadas, incluido envío</span>
          </div>
        </div>

        {/* KPI 2: Ticket Promedio */}
        <div className="bg-surface p-3 sm:p-3.5 rounded-xl border border-border shadow-subtle space-y-1">
          <div className="flex items-center justify-between text-ink-light">
            <span className="text-xs font-semibold text-ink-light">
              Ticket Promedio
            </span>
            <ShoppingBag className="w-4 h-4 text-ink-muted" />
          </div>
          <p className="text-lg sm:text-xl md:text-2xl font-black text-ink tabular-nums tracking-tight">
            {report.loading || report.error ? "—" : formatCents(averageTicketCents)}
          </p>
          <div className="text-[11px] text-ink-muted pt-0.5">
            <span>Promedio de pedidos entregados</span>
          </div>
        </div>

        {/* KPI 3: Tasa de Despacho */}
        <div className="bg-surface p-3 sm:p-3.5 rounded-xl border border-border shadow-subtle space-y-1">
          <div className="flex items-center justify-between text-ink-light">
            <span className="text-xs font-semibold text-ink-light">
              Tasa de Despacho
            </span>
            <TrendingUp className="w-4 h-4 text-ink-muted" />
          </div>
          <p className="text-lg sm:text-xl md:text-2xl font-black text-ink tabular-nums tracking-tight">
            {report.loading || report.error || deliverySuccessRate == null ? "—" : deliverySuccessRate + "%"}
          </p>
          <div className="text-[11px] text-ink-muted pt-0.5">
            <span>{report.loading || report.error ? "—" : report.data?.delivered ?? 0} entregas finalizadas</span>
          </div>
        </div>

        {/* KPI 4: Hora Pico Tingalesa */}
        <div className="bg-surface p-3 sm:p-3.5 rounded-xl border border-border shadow-subtle space-y-1">
          <div className="flex items-center justify-between text-ink-light">
            <span className="text-xs font-semibold text-ink-light">
              Hora Pico Tingalesa
            </span>
            <Clock className="w-4 h-4 text-ink-muted" />
          </div>
          <p className="text-lg sm:text-xl md:text-2xl font-black text-ink tabular-nums tracking-tight">
            No disponible
          </p>
          <div className="text-[11px] text-ink-muted pt-0.5">
            <span>Sin agregado de hora pico en la API</span>
          </div>
        </div>
      </div>

      {/* BLOQUE 3: Gráfico de Columnas Agrupadas Estilo Power BI (Bordes Cohesivos, Cuadrícula Precisa y Etiquetas) */}
      <div className="bg-surface border border-border rounded-xl shadow-subtle p-4 sm:p-6 space-y-4">
        {/* Visual Header Power BI */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-primary flex-shrink-0" />
              <h2 className="text-base sm:text-lg font-black text-ink tracking-wide font-sans">
                Volumen de Ventas Semanales
              </h2>
            </div>
            <p className="text-xs text-ink-light mt-0.5">
              Distribución por día de facturación con etiquetas de datos reales y línea de promedio
            </p>
          </div>

          {/* Tarjeta de Drill-down / Selección Power BI con Bordes Suaves */}
          {selectedDayIndex !== null && weeklyData[selectedDayIndex] && (
            <div className="bg-slate-50 border border-border rounded-lg px-2.5 sm:px-3 py-1.5 text-xs self-start sm:self-auto flex flex-wrap items-center gap-1.5 sm:gap-2 shadow-xs max-w-full">
              <span className="font-extrabold text-primary uppercase text-[10px] sm:text-[11px]">
                {weeklyData[selectedDayIndex].label}:
              </span>
              <strong className="text-ink font-mono font-black text-xs sm:text-sm">
                {formatCents(weeklyData[selectedDayIndex].amountCents)}
              </strong>
              <span className="text-slate-400">|</span>
              <span className="text-slate-600 font-mono text-[10px] sm:text-[11px]">
                {weeklyData[selectedDayIndex].orders} pedidos
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-emerald-700 font-mono font-bold text-[10px] sm:text-[11px]">
                {((weeklyData[selectedDayIndex].amountCents / weeklyTotalAmount) * 100).toFixed(1)}% total
              </span>
            </div>
          )}
        </div>

        {/* Leyenda y Referencias Power BI */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 pb-1">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 bg-primary inline-block rounded-xs"></span>
              <span className="font-semibold">Ventas del Día (S/)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-amber-500 border-t border-dashed border-amber-600 inline-block"></span>
              <span className="font-semibold text-amber-700">Línea Promedio: —</span>
            </span>
          </div>
          <span className="text-[10px] text-ink-muted">
            * Toca una columna para inspeccionar el día
          </span>
        </div>

        {/* Contenedor SVG Interactivo Power BI adaptado a pantallas móviles */}
        <div className="w-full pt-1 overflow-x-auto no-scrollbar">
          <svg
            viewBox="0 0 720 250"
            className="w-full min-w-[540px] sm:min-w-0 h-60 sm:h-72 overflow-visible"
            role="img"
            aria-label="Gráfico de columnas de ventas semanales estilo Power BI"
          >
            {/* Fondo de área de trazado con sutil radio */}
            <rect x="50" y="30" width="640" height="165" rx="4" fill="#FAFAFA" />

            {/* Líneas guía de fondo horizontales (Gridlines de Power BI) */}
            <line x1="50" y1="45" x2="690" y2="45" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="50" y1="95" x2="690" y2="95" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="50" y1="145" x2="690" y2="145" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />

            {/* Línea de Promedio Power BI (Reference Line) */}
            <line x1="50" y1="108.3" x2="690" y2="108.3" stroke="#D97706" strokeWidth="1.5" strokeDasharray="5 3" />
            {/* Etiqueta de la línea de promedio con bordes suaves sin tapar ninguna columna */}
            <rect x="52" y="100" width="94" height="15" rx="3" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1" />
            <text x="99" y="111" textAnchor="middle" fontSize="8.5" fill="#92400E" fontWeight="bold" fontFamily="monospace">
              PROM: —
            </text>

            {/* Eje X Línea Base (Baseline) */}
            <line x1="50" y1="195" x2="690" y2="195" stroke="#94A3B8" strokeWidth="1.5" />

            {/* Etiquetas del eje Y (Power BI Axis Labels) */}
            <text x="44" y="49" textAnchor="end" fontSize="10" fill="#64748B" fontWeight="bold" fontFamily="monospace">—</text>
            <text x="44" y="99" textAnchor="end" fontSize="10" fill="#64748B" fontWeight="bold" fontFamily="monospace">—</text>
            <text x="44" y="149" textAnchor="end" fontSize="10" fill="#64748B" fontWeight="bold" fontFamily="monospace">—</text>
            <text x="44" y="199" textAnchor="end" fontSize="10" fill="#64748B" fontWeight="bold" fontFamily="monospace">—</text>

            {/* Columnas Power BI con bordes rectos sutiles (rx="2" bordes no exagerados) y Data Labels superiores */}
            {!weeklyData.length && <text x="370" y="145" textAnchor="middle" fontSize="12" fill="#64748b">Serie semanal no disponible en la API</text>}
            {weeklyData.map((item, idx) => {
              const barWidth = 52;
              const x = 65 + idx * 88;
              const barHeight = Math.max(14, (item.amountCents / 45000) * 150);
              const y = 195 - barHeight;
              const isSelected = selectedDayIndex === idx;

              return (
                <g
                  key={item.day}
                  className="cursor-pointer group"
                  onClick={() => setSelectedDayIndex(idx)}
                >
                  {/* Zona sensible rectangular de fondo para selección cómoda */}
                  <rect
                    x={x - 8}
                    y={30}
                    width={barWidth + 16}
                    height={165}
                    rx="4"
                    fill={isSelected ? 'rgba(198, 0, 80, 0.08)' : 'transparent'}
                    className="transition-colors group-hover:fill-slate-100"
                  />

                  {/* Power BI Data Label sobre cada barra con halo protector */}
                  <text
                    x={x + barWidth / 2}
                    y={y - 6}
                    textAnchor="middle"
                    fontSize={isSelected ? '11' : '10'}
                    fontFamily="monospace"
                    fontWeight={isSelected ? '900' : '700'}
                    fill={isSelected ? '#9D174D' : '#1E293B'}
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                    paintOrder="stroke fill"
                  >
                    S/ {(item.amountCents / 100).toFixed(0)}
                  </text>

                  {/* Indicador de selección superior estilo Power BI */}
                  {isSelected && (
                    <polygon
                      points={`${x + barWidth / 2 - 4},${y - 1} ${x + barWidth / 2 + 4},${y - 1} ${x + barWidth / 2},${y + 4}`}
                      fill="#9D174D"
                    />
                  )}

                  {/* Columna Principal Power BI con bordes moderados no exagerados (rx="2") */}
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx="2"
                    fill={isSelected ? 'rgb(var(--color-primary))' : 'rgb(var(--color-primary))'}
                    fillOpacity={isSelected ? 1 : 0.62}
                    stroke={isSelected ? '#881337' : '#9F1239'}
                    strokeWidth={isSelected ? 1.5 : 1}
                    className="transition-all duration-150 group-hover:fill-opacity-95"
                  />

                  {/* Etiqueta del Eje X: Día y Conteo de Pedidos */}
                  <text
                    x={x + barWidth / 2}
                    y="214"
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight={isSelected ? '900' : '700'}
                    fill={isSelected ? 'rgb(var(--color-primary))' : '#334155'}
                    letterSpacing="0.05em"
                  >
                    {item.day.toUpperCase()}
                  </text>
                  <text
                    x={x + barWidth / 2}
                    y="228"
                    textAnchor="middle"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="600"
                    fill={isSelected ? '#881337' : '#94A3B8'}
                  >
                    {item.orders} ped.
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* BLOQUE 4: Dos Columnas - Gráficos de Barras Horizontales (Platos y Métodos de Cobro con Bordes Suaves) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Columna A: Platos Más Vendidos */}
        <div className="bg-surface border border-border rounded-xl shadow-subtle p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-warning flex-shrink-0" />
                <h2 className="text-sm sm:text-base font-black text-ink tracking-wide font-sans">
                  Ranking: Platos Más Solicitados
                </h2>
              </div>
              <p className="text-xs text-ink-light">Volumen de comandas entregadas en Tingo María</p>
            </div>
            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-300 uppercase tracking-widest hidden sm:inline">
              Carta Activa
            </span>
          </div>

          <div className="space-y-3">
            {!topProducts.length && <p className="text-sm text-ink-light">El ranking de productos no está disponible en el contrato actual.</p>}
            {topProducts.slice(0, 4).map((p, idx) => {
              const maxQty = topProducts[0].quantity || 1;
              const pct = Math.round((p.quantity / maxQty) * 100);

              return (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-border bg-surface hover:bg-slate-50 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-md flex items-center justify-center font-mono text-xs font-black bg-slate-100 text-slate-800 border border-slate-300 flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-ink truncate text-xs sm:text-sm">{p.name}</span>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="font-black text-ink tabular-nums font-mono text-xs sm:text-sm">
                        {p.quantity} ped.
                      </span>
                      <span className="text-[11px] text-ink-muted block tabular-nums font-mono">
                        {formatCents(p.revenueCents)}
                      </span>
                    </div>
                  </div>

                  {/* Barra de Progreso con bordes sutiles */}
                  <div className="w-full bg-slate-100 border border-slate-200 h-3 rounded-md relative overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-md transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-mono font-bold text-slate-700">
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Columna B: Desglose por Método de Pago */}
        <div className="bg-surface border border-border rounded-xl shadow-subtle p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-selva flex-shrink-0" />
                <h2 className="text-sm sm:text-base font-black text-ink tracking-wide font-sans">
                  Canales de Cobro y Arqueo
                </h2>
              </div>
              <p className="text-xs text-ink-light">Control y liquidación de caja en Tingo María</p>
            </div>
            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-300 uppercase tracking-widest hidden sm:inline">
              Tingo María
            </span>
          </div>

          <div className="space-y-3">
            {/* Método 1: Yape / Plin */}
            <div className="p-3 rounded-lg border border-border bg-surface space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2 font-bold text-ink">
                  <span className="p-1 rounded-md bg-primary-50 text-primary border border-primary-200">
                    <Smartphone className="w-3.5 h-3.5" />
                  </span>
                  <span>Billeteras Móviles (Yape / Plin)</span>
                </div>
                <div className="text-right">
                  <span className="font-black text-ink tabular-nums font-mono text-xs sm:text-sm">
                    {paymentBreakdown.yape.pct}%
                  </span>
                  <span className="text-[11px] text-ink-muted block tabular-nums font-mono">
                    {paymentBreakdown.yape.count} tx ({formatCents(paymentBreakdown.yape.cents)})
                  </span>
                </div>
              </div>
              {/* Barra suave */}
              <div className="w-full bg-slate-100 border border-slate-200 h-3 rounded-md relative overflow-hidden">
                <div
                  className="bg-primary h-full rounded-md transition-all duration-300"
                  style={{ width: `${paymentBreakdown.yape.pct}%` }}
                />
              </div>
            </div>

            {/* Método 2: Efectivo */}
            <div className="p-3 rounded-lg border border-border bg-surface space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2 font-bold text-ink">
                  <span className="p-1 rounded-md bg-selva-soft text-selva border border-selva-border">
                    <Banknote className="w-3.5 h-3.5" />
                  </span>
                  <span>Efectivo contra Entrega</span>
                </div>
                <div className="text-right">
                  <span className="font-black text-ink tabular-nums font-mono text-xs sm:text-sm">
                    {report.loading || report.error || resource.loading || resource.error ? "—" : paymentBreakdown.cash.pct + "%"}
                  </span>
                  <span className="text-[11px] text-ink-muted block tabular-nums font-mono">
                    {report.loading || report.error || resource.loading || resource.error ? "Sin datos confirmados" : paymentBreakdown.cash.count + " tx (" + formatCents(paymentBreakdown.cash.cents) + ")"}
                  </span>
                </div>
              </div>
              {/* Barra suave */}
              <div className="w-full bg-slate-100 border border-slate-200 h-3 rounded-md relative overflow-hidden">
                <div
                  className="bg-selva h-full rounded-md transition-all duration-300"
                  style={{ width: `${paymentBreakdown.cash.pct}%` }}
                />
              </div>
            </div>

            {/* Método 3: Tarjeta Débito / Crédito */}
            <div className="p-3 rounded-lg border border-border bg-surface space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2 font-bold text-ink">
                  <span className="p-1 rounded-md bg-info-soft text-info border border-info-border">
                    <CreditCard className="w-3.5 h-3.5" />
                  </span>
                  <span>Tarjeta Débito / Crédito (no habilitada)</span>
                </div>
                <div className="text-right">
                  <span className="font-black text-ink tabular-nums font-mono text-xs sm:text-sm">
                    {paymentBreakdown.card.pct}%
                  </span>
                  <span className="text-[11px] text-ink-muted block tabular-nums font-mono">
                    {paymentBreakdown.card.count} tx ({formatCents(paymentBreakdown.card.cents)})
                  </span>
                </div>
              </div>
              {/* Barra suave */}
              <div className="w-full bg-slate-100 border border-slate-200 h-3 rounded-md relative overflow-hidden">
                <div
                  className="bg-info h-full rounded-md transition-all duration-300"
                  style={{ width: `${paymentBreakdown.card.pct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BLOQUE 5: Historial Detallado de Comandas y Boletas (Matrix / Table Visual con Bordes Suaves) */}
      <div className="bg-surface border border-border rounded-xl shadow-subtle p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary flex-shrink-0" />
              <h2 className="text-sm sm:text-base font-black text-ink tracking-wide font-sans">
                Registro Detallado de Comandas
              </h2>
            </div>
            <p className="text-xs text-ink-light">Historial de tickets facturados y despachados</p>
          </div>

          {/* Buscador de pedidos compacto con bordes suaves */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="Filtrar por código o cliente..."
              className="w-full bg-surface border border-field rounded-lg py-1.5 pl-9 pr-8 text-xs sm:text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary h-8 transition-colors"
            />
            <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            {historySearch && (
              <button
                type="button"
                onClick={() => setHistorySearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-muted hover:text-ink p-1 flex items-center justify-center"
                aria-label="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {transactionHistory.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <Receipt className="w-8 h-8 text-ink-muted mx-auto" />
            <p className="text-sm font-bold text-ink">No se encontraron comandas con ese término</p>
            <p className="text-xs text-ink-muted">
              {historySearch
                ? 'Prueba ingresando otro código de orden (#QK-...) o nombre de cliente.'
                : 'Las nuevas comandas despachadas se listarán aquí automáticamente.'}
            </p>
          </div>
        ) : (
          <>
            {/* Vista en Tabla para Escritorio */}
            <div className="hidden md:block overflow-x-auto no-scrollbar border border-border rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-100 border-b border-border text-slate-700 font-black uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Fecha y Hora</th>
                    <th className="py-2.5 px-3">Cliente</th>
                    <th className="py-2.5 px-3">Método de Pago</th>
                    <th className="py-2.5 px-3">Estado</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactionHistory.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-black text-ink">
                        {order.purchaseCode}
                      </td>
                      <td className="py-2.5 px-3 text-ink-light tabular-nums font-mono text-[11px]">
                        {formatDateTime(order.createdAt)}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-ink">
                        {order.customerName}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1 font-semibold text-ink-light capitalize text-[11px]">
                          {order.paymentMethod === 'yape_plin' && <Smartphone className="w-3.5 h-3.5 text-primary" />}
                          {order.paymentMethod === 'efectivo' && <Banknote className="w-3.5 h-3.5 text-selva" />}
                          {order.paymentMethod === 'tarjeta' && <CreditCard className="w-3.5 h-3.5 text-info" />}
                          <span>{order.paymentMethod === 'yape_plin' ? 'Yape / Plin' : order.paymentMethod}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-ink tabular-nums font-mono text-sm">
                        {formatCents(order.subtotalCents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vista en Tarjetas para Móviles */}
            <div className="md:hidden space-y-2.5">
              {transactionHistory.map((order) => (
                <div
                  key={order.id}
                  className="p-3 rounded-lg border border-border bg-surface space-y-2 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-sm text-ink">
                      {order.purchaseCode}
                    </span>
                    <OrderStatusBadge status={order.status} />
                  </div>

                  <div className="text-xs space-y-0.5 text-ink-light">
                    <p className="font-bold text-ink">{order.customerName}</p>
                    <p className="text-[11px] text-ink-muted tabular-nums font-mono">
                      {formatDateTime(order.createdAt)}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1 text-ink-muted text-[11px]">
                      {order.paymentMethod === 'yape_plin' && <Smartphone className="w-3.5 h-3.5 text-primary" />}
                      {order.paymentMethod === 'efectivo' && <Banknote className="w-3.5 h-3.5 text-selva" />}
                      {order.paymentMethod === 'tarjeta' && <CreditCard className="w-3.5 h-3.5 text-info" />}
                      <span className="capitalize">{order.paymentMethod === 'yape_plin' ? 'Yape / Plin' : order.paymentMethod}</span>
                    </span>
                    <span className="font-black text-ink tabular-nums font-mono text-sm">
                      {formatCents(order.subtotalCents)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

