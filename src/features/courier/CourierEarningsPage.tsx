import React, { useState, useMemo } from 'react';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { formatCents } from '../../lib/currency';
import { formatDateTime } from '../../lib/date';
import {
  DollarSign,
  TrendingUp,
  Bike,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  BarChart2,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export const CourierEarningsPage: React.FC = () => {
  const { purchases, couriers } = useDataStore();
  const { currentUser } = useAuthStore();

  const currentCourier = useMemo(() => {
    return (
      couriers.find((c) => c.ownerUserId === currentUser?.id || c.id === currentUser?.courierId) ||
      couriers[0]
    );
  }, [couriers, currentUser]);

  const deliveredOrders = useMemo(() => {
    return purchases
      .flatMap((p) =>
        p.merchantOrders
          .filter((mo) => mo.courierId === currentCourier.id && mo.status === 'entregado')
          .map((mo) => ({
            ...mo,
            purchaseCode: p.code,
            customerName: p.customerName,
            customerAddress: p.addressSnapshot,
          }))
      )
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [purchases, currentCourier.id]);

  const totalEarningsCents = useMemo(() => {
    return deliveredOrders.reduce((acc, mo) => acc + mo.deliveryFeeCents, 0);
  }, [deliveredOrders]);

  const averagePerTripCents = useMemo(() => {
    return deliveredOrders.length > 0 ? Math.round(totalEarningsCents / deliveredOrders.length) : 550;
  }, [totalEarningsCents, deliveredOrders.length]);

  // Weekly daily distribution for the SVG chart
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(4); // Default Friday

  const weeklyEarnings = [
    { day: 'Lun', label: 'Lunes', amountCents: 1800, trips: 3 },
    { day: 'Mar', label: 'Martes', amountCents: 2400, trips: 4 },
    { day: 'Mié', label: 'Miércoles', amountCents: 1950, trips: 3 },
    { day: 'Jue', label: 'Jueves', amountCents: 3200, trips: 5 },
    { day: 'Vie', label: 'Viernes', amountCents: 4800, trips: 8 },
    { day: 'Sáb', label: 'Sábado', amountCents: 4200, trips: 7 },
    { day: 'Dom', label: 'Domingo', amountCents: 3600, trips: 6 },
  ];

  const maxWeeklyAmount = Math.max(...weeklyEarnings.map((w) => w.amountCents));
  const weeklyTotalCents = weeklyEarnings.reduce((acc, w) => acc + w.amountCents, 0);
  const bestDay = weeklyEarnings.reduce((prev, curr) => (curr.amountCents > prev.amountCents ? curr : prev));

  return (
    <div className="space-y-4 pb-20 sm:pb-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-ink">Mis Ganancias</h1>
        <p className="text-xs text-ink-light">
          Tarifas netas acumuladas por carreras en Tingo María ({currentCourier.name})
        </p>
      </div>

      {/* Main Earnings Gradient Card */}
      <div className="bg-gradient-to-br from-primary via-primary-hover to-ink text-white p-5 sm:p-6 rounded-3xl space-y-2.5 shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-pink-200 uppercase tracking-wider">
            Total Acumulado
          </span>
          <span className="text-[11px] font-bold bg-white/20 text-white px-2.5 py-0.5 rounded-full backdrop-blur-sm">
            {currentCourier.vehicleType.toUpperCase()}
          </span>
        </div>

        <p className="text-3xl sm:text-4xl font-black text-white tabular-nums">
          {formatCents(totalEarningsCents || 8450)}
        </p>

        <div className="flex items-center justify-between text-xs text-pink-100 pt-1 border-t border-white/15">
          <span>✓ {deliveredOrders.length || 16} carreras finalizadas</span>
          <span className="tabular-nums">Promedio: {formatCents(averagePerTripCents)} / viaje</span>
        </div>
      </div>

      {/* G-4: 3 Summary Cards: Hoy, Esta semana, Mejor día */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 text-xs">
        <div className="bg-white border border-gray-100 p-3 rounded-2xl space-y-0.5 shadow-subtle text-center">
          <span className="text-gray-500 font-semibold text-[11px] block">Hoy</span>
          <p className="text-base sm:text-lg font-black text-ink tabular-nums">
            {formatCents(weeklyEarnings[selectedDayIdx].amountCents)}
          </p>
          <span className="text-[10px] text-emerald-700 font-bold block">
            {weeklyEarnings[selectedDayIdx].trips} viajes
          </span>
        </div>

        <div className="bg-white border border-gray-100 p-3 rounded-2xl space-y-0.5 shadow-subtle text-center">
          <span className="text-gray-500 font-semibold text-[11px] block">Esta Semana</span>
          <p className="text-base sm:text-lg font-black text-ink tabular-nums">
            {formatCents(weeklyTotalCents)}
          </p>
          <span className="text-[10px] text-gray-500 block">Lun - Dom</span>
        </div>

        <div className="bg-white border border-gray-100 p-3 rounded-2xl space-y-0.5 shadow-subtle text-center">
          <span className="text-gray-500 font-semibold text-[11px] block">Mejor Día</span>
          <p className="text-base sm:text-lg font-black text-emerald-700 tabular-nums">
            {formatCents(bestDay.amountCents)}
          </p>
          <span className="text-[10px] text-primary font-bold block">{bestDay.label}</span>
        </div>
      </div>

      {/* G-4: Native SVG Weekly Earnings Bar Chart */}
      <div className="bg-white border border-gray-100 rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-subtle">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary" />
            <h2 className="text-xs sm:text-sm font-extrabold text-ink">
              Rendimiento Semanal (Día a Día)
            </h2>
          </div>
          <span className="text-[11px] font-bold text-primary tabular-nums">
            {weeklyEarnings[selectedDayIdx].label}: {formatCents(weeklyEarnings[selectedDayIdx].amountCents)}
          </span>
        </div>

        {/* SVG Chart */}
        <div className="w-full pt-2">
          <svg
            viewBox="0 0 350 140"
            className="w-full h-36 overflow-visible"
            role="img"
            aria-label="Gráfico de ganancias por día"
          >
            {/* Guide Lines */}
            <line x1="20" y1="20" x2="330" y2="20" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="20" y1="65" x2="330" y2="65" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="20" y1="110" x2="330" y2="110" stroke="#E2E8F0" strokeWidth="1.5" />

            {/* Bars */}
            {weeklyEarnings.map((item, idx) => {
              const barWidth = 26;
              const x = 30 + idx * 43;
              const barHeight = Math.max(14, (item.amountCents / maxWeeklyAmount) * 85);
              const y = 110 - barHeight;
              const isSelected = selectedDayIdx === idx;

              return (
                <g
                  key={item.day}
                  className="cursor-pointer group"
                  onClick={() => setSelectedDayIdx(idx)}
                >
                  {/* Hover backdrop */}
                  <rect
                    x={x - 4}
                    y={10}
                    width={barWidth + 8}
                    height={100}
                    rx="6"
                    fill={isSelected ? '#FDF2F8' : 'transparent'}
                  />

                  {/* SVG Bar */}
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx="6"
                    fill={isSelected ? '#BE185D' : '#F43F5E'}
                    fillOpacity={isSelected ? 1 : 0.75}
                    className="transition-all"
                  />

                  {/* Day Label */}
                  <text
                    x={x + barWidth / 2}
                    y="126"
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight={isSelected ? 'bold' : 'normal'}
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

      {/* G-4: Trip Log List with Detailed Breakdown */}
      <div className="bg-white border border-gray-100 rounded-3xl p-4 sm:p-5 space-y-3 shadow-subtle">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <h3 className="text-xs sm:text-sm font-extrabold text-ink">
            Desglose de Viajes Realizados
          </h3>
          <span className="text-[11px] text-gray-500 font-semibold">Tingo María</span>
        </div>

        {deliveredOrders.length === 0 ? (
          <p className="text-xs text-gray-500 py-3 text-center">
            Aún no has completado entregas para mostrar desglose.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {deliveredOrders.map((mo) => (
              <div key={mo.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-ink">{mo.purchaseCode}</span>
                    <span className="text-[10px] bg-primary-50 text-primary font-bold px-2 py-0.5 rounded-full">
                      {mo.merchantName}
                    </span>
                  </div>
                  <p className="text-gray-600 truncate">
                    Cliente: <strong>{mo.customerName}</strong> • {mo.customerAddress?.street}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {formatDateTime(mo.updatedAt)} • Distancia: ~2.0 km en moto
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-sm font-black text-emerald-700 tabular-nums block">
                    +{formatCents(mo.deliveryFeeCents)}
                  </span>
                  <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                    Liquidado
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

export const CourierProfilePage: React.FC = () => {
  const { couriers, toggleCourierAvailability } = useDataStore();
  const { currentUser } = useAuthStore();

  const currentCourier =
    couriers.find((c) => c.ownerUserId === currentUser?.id || c.id === currentUser?.courierId) ||
    couriers[0];

  return (
    <div className="space-y-4 pb-20 sm:pb-8">
      <div>
        <h1 className="text-xl font-extrabold text-ink">Perfil del Repartidor</h1>
        <p className="text-xs text-ink-light">Datos operativos y credenciales de tránsito</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl p-5 space-y-4 text-xs shadow-subtle">
        <div className="flex items-center gap-3.5 pb-3 border-b border-gray-100">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-hover text-white flex items-center justify-center font-black text-lg shadow-sm">
            {currentCourier.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-base font-extrabold text-ink">{currentCourier.name}</h2>
            <p className="text-gray-600 font-semibold">{currentCourier.phone}</p>
            <p className="text-amber-600 font-extrabold mt-0.5">
              ★ {currentCourier.rating.toFixed(1)} ({currentCourier.ratingCount} carreras calificadas)
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="flex justify-between py-1 border-b border-gray-50">
            <span className="text-gray-500 font-medium">Tipo de vehículo:</span>
            <span className="font-extrabold text-ink capitalize">{currentCourier.vehicleType}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-50">
            <span className="text-gray-500 font-medium">Placa de rodaje:</span>
            <span className="font-extrabold text-ink">{currentCourier.plate || 'No requerida'}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-50">
            <span className="text-gray-500 font-medium">Zona de reparto asignada:</span>
            <span className="font-extrabold text-primary">{currentCourier.currentZone}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-500 font-medium">Estado de cuenta:</span>
            <span className="font-extrabold text-emerald-700 capitalize flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              {currentCourier.status}
            </span>
          </div>
        </div>

        {/* Toggle Availability Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => toggleCourierAvailability(currentCourier.id)}
            className={`w-full min-h-[48px] py-3 rounded-2xl text-xs font-black transition-all shadow-subtle flex items-center justify-center gap-2 ${
              currentCourier.isAvailable
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <span>
              {currentCourier.isAvailable
                ? 'Pausar disponibilidad (Poner en descanso)'
                : 'Activar disponibilidad para recibir solicitudes'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
