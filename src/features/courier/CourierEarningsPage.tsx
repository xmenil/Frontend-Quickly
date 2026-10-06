import React from 'react';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { formatCents } from '../../lib/currency';
import { DollarSign, TrendingUp, Bike, Calendar } from 'lucide-react';

export const CourierEarningsPage: React.FC = () => {
  const { purchases, couriers } = useDataStore();
  const { currentUser } = useAuthStore();

  const currentCourier =
    couriers.find((c) => c.ownerUserId === currentUser?.id || c.id === currentUser?.courierId) ||
    couriers[0];

  const deliveredOrders = purchases.flatMap((p) =>
    p.merchantOrders.filter((mo) => mo.courierId === currentCourier.id && mo.status === 'entregado')
  );

  const totalEarningsCents = deliveredOrders.reduce((acc, mo) => acc + mo.deliveryFeeCents, 0);
  const averagePerTripCents =
    deliveredOrders.length > 0 ? Math.round(totalEarningsCents / deliveredOrders.length) : 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold text-ink">Ganancias de Reparto</h1>
        <p className="text-xs text-gray-500">
          Ingresos generados por entregas de Quickly en Tingo María
        </p>
      </div>

      {/* Main Earnings Card */}
      <div className="bg-gradient-to-br from-primary via-primary-700 to-primary-800 text-white p-6 rounded-3xl space-y-2 shadow-sm">
        <span className="text-xs font-bold text-white/80 uppercase tracking-wider">
          Total Acumulado
        </span>
        <p className="text-3xl font-black text-white">{formatCents(totalEarningsCents)}</p>
        <p className="text-xs text-white/90 font-semibold">
          ✓ {deliveredOrders.length} entregas finalizadas
        </p>
      </div>

      {/* Breakdown Metrics */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-white border border-gray-100 p-4 rounded-2xl space-y-1 shadow-subtle">
          <span className="text-gray-500 font-medium">Promedio por Carrera</span>
          <p className="text-lg font-black text-ink">{formatCents(averagePerTripCents)}</p>
          <span className="text-[10px] text-gray-400">Tarifa neta</span>
        </div>

        <div className="bg-white border border-gray-100 p-4 rounded-2xl space-y-1 shadow-subtle">
          <span className="text-gray-500 font-medium">Vehículo Asignado</span>
          <p className="text-lg font-black text-ink capitalize">{currentCourier.vehicleType}</p>
          <span className="text-[10px] text-gray-400">{currentCourier.plate || 'Sin placa'}</span>
        </div>
      </div>

      {/* Trip Log List */}
      <div className="bg-white border border-gray-100 rounded-3xl p-4 space-y-3 shadow-subtle">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
          Desglose por Entrega
        </h3>
        {deliveredOrders.length === 0 ? (
          <p className="text-xs text-gray-400 py-3 text-center">
            Aún no has completado entregas para mostrar desglose.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {deliveredOrders.map((mo, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-ink">{mo.merchantName}</span>
                  <span className="text-[11px] text-gray-400 block">
                    ID: {mo.id.substring(0, 10)}
                  </span>
                </div>
                <span className="text-emerald-600 font-bold">
                  +{formatCents(mo.deliveryFeeCents)}
                </span>
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
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold text-ink">Perfil del Repartidor</h1>
        <p className="text-xs text-gray-500">Datos operativos y estado de servicio</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl p-5 space-y-4 text-xs shadow-subtle">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
          <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-base shadow-sm">
            {currentCourier.name.substring(0, 2)}
          </div>
          <div>
            <h2 className="text-base font-extrabold text-ink">{currentCourier.name}</h2>
            <p className="text-gray-500">{currentCourier.phone}</p>
            <p className="text-amber-500 font-semibold mt-0.5">
              ★ {currentCourier.rating.toFixed(1)} ({currentCourier.ratingCount} entregas calificadas)
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between py-1 border-b border-gray-50">
            <span className="text-gray-500">Vehículo:</span>
            <span className="font-bold text-ink capitalize">{currentCourier.vehicleType}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-50">
            <span className="text-gray-500">Placa de rodaje:</span>
            <span className="font-bold text-ink">{currentCourier.plate || 'No requerida'}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-50">
            <span className="text-gray-500">Zona operativa:</span>
            <span className="font-bold text-ink">{currentCourier.currentZone}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-500">Estado de cuenta:</span>
            <span className="font-bold text-emerald-600 capitalize">{currentCourier.status}</span>
          </div>
        </div>

        {/* Toggle Availability Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => toggleCourierAvailability(currentCourier.id)}
            className={`w-full py-3 rounded-2xl text-xs font-bold transition-all shadow-sm ${
              currentCourier.isAvailable
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-primary hover:bg-primary-hover text-white'
            }`}
          >
            {currentCourier.isAvailable
              ? 'Pausar disponibilidad (Poner en descanso)'
              : 'Activar disponibilidad para recibir solicitudes'}
          </button>
        </div>
      </div>
    </div>
  );
};
