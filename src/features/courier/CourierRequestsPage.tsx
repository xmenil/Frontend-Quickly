import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { formatCents } from '../../lib/currency';
import { Button } from '../../components/ui/Button';
import { Store, MapPin, Bike, Package, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export const CourierRequestsPage: React.FC = () => {
  const { purchases, couriers, courierAcceptOrder } = useDataStore();
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

  return (
    <div className="space-y-4">
      {/* Availability Notice */}
      {!currentCourier.isAvailable && (
        <div className="p-3.5 bg-amber-950/60 border border-amber-800 rounded-2xl text-xs text-amber-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>
            Estás <strong>En Pausa</strong>. Activa tu disponibilidad arriba para aceptar entregas.
          </span>
        </div>
      )}

      <div>
        <h1 className="text-xl font-extrabold text-white">Solicitudes de Entrega</h1>
        <p className="text-xs text-slate-400">
          Subpedidos listos para retirar en Tingo María ({availableDeliveries.length} disponibles)
        </p>
      </div>

      {availableDeliveries.length === 0 ? (
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 space-y-2">
          <Clock className="w-10 h-10 mx-auto text-slate-600 mb-2" />
          <p className="font-bold text-white text-sm">No hay pedidos esperando recojo</p>
          <p className="text-xs">
            Cuando un comercio marque un pedido como "Listo para recojo", aparecerá aquí al instante.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {availableDeliveries.map((delivery) => (
            <div
              key={delivery.id}
              className="bg-slate-950 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-lg"
            >
              {/* Header: Store & Fee */}
              <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                    <Store className="w-3.5 h-3.5" />
                    <span>{delivery.merchantName}</span>
                  </div>
                  <h3 className="font-bold text-white text-sm mt-0.5">{delivery.purchaseCode}</h3>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Ganancia Reparto
                  </span>
                  <span className="text-base font-black text-emerald-400">
                    {formatCents(delivery.deliveryFeeCents)}
                  </span>
                </div>
              </div>

              {/* Route: Origin & Destination */}
              <div className="space-y-2 text-xs">
                {/* Store Pickup */}
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px] mt-0.5 flex-shrink-0">
                    1
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">
                      Retirar en local:
                    </span>
                    <span className="font-bold text-slate-200">{delivery.merchantAddress}</span>
                  </div>
                </div>

                {/* Customer Dropoff */}
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] mt-0.5 flex-shrink-0">
                    2
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">
                      Entregar a cliente ({delivery.customerName}):
                    </span>
                    <span className="font-bold text-slate-200">
                      {delivery.addressSnapshot.street} #{delivery.addressSnapshot.number}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Ref: {delivery.addressSnapshot.reference}
                    </p>
                  </div>
                </div>
              </div>

              {/* Packages & Payment Type */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-slate-500" />
                  {delivery.items.reduce((a, b) => a + b.quantity, 0)} bultos
                </span>

                <span className="font-semibold text-slate-300">
                  {delivery.paymentMethod === 'efectivo'
                    ? `Cobrar ${formatCents(delivery.totalCents)} en efectivo`
                    : 'Prepagado • No cobrar'}
                </span>
              </div>

              {/* Accept Button */}
              <Button
                type="button"
                variant="primary"
                size="lg"
                disabled={!currentCourier.isAvailable}
                onClick={() => handleAccept(delivery.id)}
                className="w-full text-sm font-bold shadow-md"
              >
                <Bike className="w-4 h-4 mr-2" />
                <span>Aceptar y Asignar Entrega</span>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
