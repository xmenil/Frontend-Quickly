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
        <h1 className="text-xl font-extrabold text-white">Ganancias de Reparto</h1>
        <p className="text-xs text-slate-400">
          Ingresos generados por entregas de Quickly en Tingo María
        </p>
      </div>

      {/* Main Earnings Card */}
      <div className="bg-gradient-to-br from-primary-900 via-slate-950 to-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2 shadow-xl">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Total Acumulado
        </span>
        <p className="text-3xl font-black text-white">{formatCents(totalEarningsCents)}</p>
        <p className="text-xs text-emerald-400 font-semibold">
          ✓ {deliveredOrders.length} entregas finalizadas
        </p>
      </div>

      {/* Breakdown Metrics */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-1">
          <span className="text-slate-400 font-medium">Promedio por Carrera</span>
          <p className="text-lg font-black text-white">{formatCents(averagePerTripCents)}</p>
          <span className="text-[10px] text-slate-500">Tarifa neta</span>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-1">
          <span className="text-slate-400 font-medium">Vehículo Asignado</span>
          <p className="text-lg font-black text-white capitalize">{currentCourier.vehicleType}</p>
          <span className="text-[10px] text-slate-500">{currentCourier.plate || 'Sin placa'}</span>
        </div>
      </div>

      {/* Trip Log List */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Desglose por Entrega
        </h3>
        {deliveredOrders.length === 0 ? (
          <p className="text-xs text-slate-500 py-3 text-center">
            Aún no has completado entregas para mostrar desglose.
          </p>
        ) : (
          <div className="divide-y divide-slate-900">
            {deliveredOrders.map((mo, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-200">{mo.merchantName}</span>
                  <span className="text-[11px] text-slate-500 block">
                    ID: {mo.id.substring(0, 10)}
                  </span>
                </div>
                <span className="text-emerald-400 font-bold">
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
        <h1 className="text-xl font-extrabold text-white">Perfil del Repartidor</h1>
        <p className="text-xs text-slate-400">Datos operativos y estado de servicio</p>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-4 text-xs">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-base shadow-md">
            {currentCourier.name.substring(0, 2)}
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white">{currentCourier.name}</h2>
            <p className="text-slate-400">{currentCourier.phone}</p>
            <p className="text-amber-400 font-semibold mt-0.5">
              ★ {currentCourier.rating.toFixed(1)} ({currentCourier.ratingCount} entregas calificadas)
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between py-1 border-b border-slate-900">
            <span className="text-slate-400">Vehículo:</span>
            <span className="font-bold text-slate-200 capitalize">{currentCourier.vehicleType}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-900">
            <span className="text-slate-400">Placa de rodaje:</span>
            <span className="font-bold text-slate-200">{currentCourier.plate || 'No requerida'}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-900">
            <span className="text-slate-400">Zona operativa:</span>
            <span className="font-bold text-slate-200">{currentCourier.currentZone}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-400">Estado de cuenta:</span>
            <span className="font-bold text-emerald-400 capitalize">{currentCourier.status}</span>
          </div>
        </div>

        {/* Toggle Availability Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => toggleCourierAvailability(currentCourier.id)}
            className={`w-full py-3 rounded-2xl text-xs font-bold transition-all ${
              currentCourier.isAvailable
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
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
