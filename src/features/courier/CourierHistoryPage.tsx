import React, { useState, useMemo } from 'react';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { formatDateTime } from '../../lib/date';
import { formatCents } from '../../lib/currency';
import { SchematicMap } from '../../components/shared/SchematicMap';
import {
  CheckCircle2,
  Store,
  MapPin,
  ChevronDown,
  ChevronUp,
  Navigation,
  Clock,
  Bike,
} from 'lucide-react';

export const CourierHistoryPage: React.FC = () => {
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

  // Expandable schematic map for each delivery (G-5)
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(
    deliveredOrders[0]?.id || null
  );

  return (
    <div className="space-y-4 pb-20 sm:pb-8">
      <div>
        <h1 className="text-xl font-extrabold text-ink">Historial de Entregas</h1>
        <p className="text-xs text-ink-light">
          Carreras completadas con éxito en Tingo María ({deliveredOrders.length} viajes)
        </p>
      </div>

      {deliveredOrders.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-8 text-center text-gray-400 space-y-3 shadow-subtle my-4">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto text-gray-500">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h2 className="font-extrabold text-ink text-sm sm:text-base">Sin entregas finalizadas</h2>
          <p className="text-xs text-ink-light max-w-xs mx-auto">
            Cuando completes una carrera en moto por las calles de Tingo María, quedará registrada
            aquí con su mapa de ruta y ganancia.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {deliveredOrders.map((order) => {
            const isExpanded = expandedOrderId === order.id;

            return (
              <div
                key={order.id}
                className="bg-white border border-gray-100 rounded-3xl p-4 sm:p-5 space-y-3 shadow-subtle hover:border-gray-200 transition-all overflow-hidden"
              >
                {/* Header row */}
                <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-ink text-sm sm:text-base">
                      {order.purchaseCode}
                    </span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-extrabold">
                      Entregado
                    </span>
                  </div>

                  <span className="text-emerald-700 font-black text-sm sm:text-base tabular-nums">
                    +{formatCents(order.deliveryFeeCents)}
                  </span>
                </div>

                {/* Merchant & Customer Addresses */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2 text-ink">
                    <Store className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">{order.merchantName}</span>
                      <p className="text-gray-500 text-[11px] truncate">{order.merchantAddress}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-ink">
                    <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Cliente: {order.customerName}</span>
                      <p className="text-gray-500 text-[11px] truncate">
                        {order.customerAddress.street} #{order.customerAddress.number}
                      </p>
                    </div>
                  </div>
                </div>

                {/* G-5: Schematic Map of Completed Route */}
                {isExpanded && (
                  <div className="pt-2 border-t border-gray-100 space-y-2 animate-fadeIn">
                    <div className="flex items-center justify-between text-[11px] text-gray-500 font-semibold px-1">
                      <span className="flex items-center gap-1">
                        <Navigation className="w-3 h-3 text-sky-600" />
                        <span>Trayecto recorrido en Tingo María</span>
                      </span>
                      <span className="text-emerald-700 font-bold">100% completado</span>
                    </div>

                    <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-inner">
                      <SchematicMap
                        orderStatus="entregado"
                        merchantName={order.merchantName}
                        merchantAddress={order.merchantAddress}
                        customerAddress={`${order.customerAddress.street} #${order.customerAddress.number}`}
                        courierName={currentCourier.name}
                        courierPhone={currentCourier.phone}
                      />
                    </div>
                  </div>
                )}

                {/* Footer and Map Toggle Button */}
                <div className="pt-2 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDateTime(order.updatedAt)}</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                    className="touch-target inline-flex items-center gap-1 font-bold text-primary hover:underline px-2 py-1"
                  >
                    <span>{isExpanded ? 'Ocultar mapa de ruta' : 'Ver ruta completada'}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
