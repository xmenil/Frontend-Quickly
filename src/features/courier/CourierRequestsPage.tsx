import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { formatCents } from '../../lib/currency';
import { Button } from '../../components/ui/Button';
import {
  Store,
  MapPin,
  Clock,
  AlertCircle,
  Bike,
  Navigation,
  Check,
  X,
  Sparkles,
  Phone,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const CourierRequestsPage: React.FC = () => {
  const { purchases, couriers, courierAcceptOrder, toggleCourierAvailability } = useDataStore();
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();

  const currentCourier =
    couriers.find((c) => c.ownerUserId === currentUser?.id || c.id === currentUser?.courierId) ||
    couriers[0];

  // Available suborders: status === 'listo_recoger' and no courier assigned yet
  const availableDeliveries = purchases.flatMap((p) =>
    p.merchantOrders
      .filter((mo) => mo.status === 'listo_recoger' && !mo.courierId)
      .map((mo) => ({
        ...mo,
        purchaseCode: p.code,
        customerName: p.customerName,
        customerPhone: p.customerPhone,
        addressSnapshot: p.addressSnapshot,
        paymentMethod: p.paymentMethod,
      }))
  );

  const handleAccept = (suborderId: string) => {
    const result = courierAcceptOrder(suborderId, currentCourier.id);
    if (result.success) {
      navigate('/repartidor/entrega-activa');
    }
  };

  const handleReject = () => {
    // In demo mode, simply notify or dismiss visually
  };

  return (
    <div className="space-y-4">
      {/* G-1: Prominent Availability Card with Zone Display */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-subtle flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                currentCourier.isAvailable
                  ? 'bg-emerald-600 animate-pulse ring-4 ring-emerald-100'
                  : 'bg-gray-400'
              }`}
            />
            <span className="text-xs sm:text-sm font-extrabold text-ink">
              {currentCourier.isAvailable ? 'Disponible para pedidos' : 'No disponible (En pausa)'}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 flex items-center gap-1 pl-4.5">
            <MapPin className="w-3 h-3 text-primary flex-shrink-0" />
            <span>Zona asignada: <strong>{currentCourier.currentZone || 'Centro de Tingo María'}</strong></span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => toggleCourierAvailability(currentCourier.id)}
          className={`touch-target px-3.5 py-2 rounded-2xl text-xs font-extrabold border transition-all min-h-[44px] ${
            currentCourier.isAvailable
              ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
          }`}
        >
          {currentCourier.isAvailable ? 'Pausar' : 'Activar'}
        </button>
      </div>

      {/* Header Title */}
      <div>
        <h1 className="text-xl font-extrabold text-ink">Solicitudes de Entrega</h1>
        <p className="text-xs text-ink-light">
          Pedidos listos en cocina para recojo y despacho inmediato en Tingo María ({availableDeliveries.length})
        </p>
      </div>

      {/* Empty State */}
      {availableDeliveries.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-8 text-center text-gray-400 space-y-3 shadow-subtle">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto text-gray-500">
            <Bike className="w-7 h-7" />
          </div>
          <h2 className="font-extrabold text-ink text-sm sm:text-base">
            No hay solicitudes pendientes en este momento
          </h2>
          <p className="text-xs text-ink-light max-w-xs mx-auto leading-relaxed">
            Cuando un comercio afiliado de Tingo María marque un pedido como "Listo para recojo",
            aparecerá aquí con su tarifa garantizada.
          </p>
        </div>
      ) : (
        /* G-3: Quick Request Cards */
        <div className="space-y-4">
          {availableDeliveries.map((delivery) => (
            <div
              key={delivery.id}
              className="bg-white border border-gray-100 rounded-3xl p-4 sm:p-5 space-y-4 shadow-subtle hover:shadow-md transition-shadow"
            >
              {/* Top Row: Merchant Name & Fee */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-primary">
                    <Store className="w-3.5 h-3.5" />
                    <span>{delivery.merchantName}</span>
                  </div>
                  <h3 className="font-extrabold text-ink text-base mt-0.5">
                    {delivery.purchaseCode}
                  </h3>
                  <span className="text-[11px] text-gray-500">
                    {delivery.items.reduce((acc, i) => acc + i.quantity, 0)} bultos •{' '}
                    {delivery.paymentMethod === 'efectivo' ? 'Cobro en Efectivo' : 'Prepagado'}
                  </span>
                </div>

                {/* Big Delivery Earnings Badge (G-3) */}
                <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-2xl text-right">
                  <span className="text-[10px] text-emerald-800 font-bold block uppercase tracking-wider">
                    Ganancia
                  </span>
                  <span className="text-lg font-black text-emerald-700 tabular-nums">
                    +{formatCents(delivery.deliveryFeeCents)}
                  </span>
                </div>
              </div>

              {/* G-3: Origin & Destination Route Details */}
              <div className="space-y-2.5 text-xs">
                {/* 1. Recojo */}
                <div className="flex items-start gap-2.5 bg-gray-50/70 p-2.5 rounded-2xl border border-gray-100">
                  <div className="w-6 h-6 rounded-full bg-primary-50 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-extrabold text-ink block">Retiro en comercio:</span>
                    <p className="text-ink-light truncate">{delivery.merchantAddress}</p>
                  </div>
                </div>

                {/* 2. Destino */}
                <div className="flex items-start gap-2.5 bg-gray-50/70 p-2.5 rounded-2xl border border-gray-100">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-ink">Entrega al cliente:</span>
                      <span className="text-[10px] bg-primary-50 text-primary font-bold px-2 py-0.5 rounded-full">
                        {delivery.addressSnapshot.label}
                      </span>
                    </div>
                    <p className="text-ink font-semibold truncate">
                      {delivery.addressSnapshot.street} #{delivery.addressSnapshot.number}
                    </p>
                    <p className="text-[11px] text-gray-500 italic truncate">
                      Ref: {delivery.addressSnapshot.reference}
                    </p>
                  </div>
                </div>
              </div>

              {/* Trip stats info */}
              <div className="flex items-center justify-between text-[11px] text-gray-600 px-1">
                <span className="flex items-center gap-1">
                  <Navigation className="w-3.5 h-3.5 text-sky-600" />
                  <span>Distancia: <strong>~2.1 km</strong></span>
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Tiempo en moto: <strong>~12 min</strong></span>
                </span>
              </div>

              {/* G-3: Big Action Buttons (Touch Targets >= 48px) */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={handleReject}
                  className="min-h-[48px] font-bold text-gray-700 hover:text-red-700 hover:bg-red-50 border-gray-200"
                >
                  <X className="w-4 h-4 mr-1 text-gray-400" />
                  <span>Descartar</span>
                </Button>

                <Button
                  type="button"
                  variant="selva"
                  size="md"
                  onClick={() => handleAccept(delivery.id)}
                  disabled={!currentCourier.isAvailable}
                  className="min-h-[48px] font-extrabold shadow-subtle"
                >
                  <Check className="w-4 h-4 mr-1 stroke-[3]" />
                  <span>Aceptar Carrera</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
