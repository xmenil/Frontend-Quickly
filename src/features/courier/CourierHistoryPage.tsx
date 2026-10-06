import React from 'react';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { formatDateTime } from '../../lib/date';
import { formatCents } from '../../lib/currency';
import { CheckCircle2, Store, MapPin } from 'lucide-react';

export const CourierHistoryPage: React.FC = () => {
  const { purchases, couriers } = useDataStore();
  const { currentUser } = useAuthStore();

  const currentCourier =
    couriers.find((c) => c.ownerUserId === currentUser?.id || c.id === currentUser?.courierId) ||
    couriers[0];

  const deliveredOrders = purchases.flatMap((p) =>
    p.merchantOrders
      .filter((mo) => mo.courierId === currentCourier.id && mo.status === 'entregado')
      .map((mo) => ({
        ...mo,
        purchaseCode: p.code,
        customerName: p.customerName,
        customerAddress: p.addressSnapshot,
      }))
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold text-ink">Historial de Entregas</h1>
        <p className="text-xs text-gray-500">
          Entregas completadas por {currentCourier.name} en Tingo María
        </p>
      </div>

      {deliveredOrders.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-8 text-center text-gray-400 space-y-2 shadow-subtle">
          <CheckCircle2 className="w-10 h-10 mx-auto text-gray-300 mb-2" />
          <p className="font-bold text-ink text-sm">Sin entregas finalizadas</p>
          <p className="text-xs">
            Cuando completes una entrega con éxito, quedará registrada en tu historial.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {deliveredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-gray-100 rounded-3xl p-4 space-y-2.5 text-xs shadow-subtle"
            >
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-ink text-sm">{order.purchaseCode}</span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                    Entregado
                  </span>
                </div>
                <span className="text-emerald-600 font-black text-sm">
                  +{formatCents(order.deliveryFeeCents)}
                </span>
              </div>

              <div className="space-y-1 text-gray-600">
                <p className="flex items-center gap-1.5 font-medium text-ink">
                  <Store className="w-3.5 h-3.5 text-primary" />
                  {order.merchantName}
                </p>
                <p className="flex items-center gap-1.5 text-gray-500">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  Cliente: {order.customerName} ({order.customerAddress.street})
                </p>
              </div>

              <div className="pt-2 border-t border-gray-50 flex justify-between text-[11px] text-gray-400">
                <span>{formatDateTime(order.updatedAt)}</span>
                <span>{order.items.reduce((a, b) => a + b.quantity, 0)} bultos</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
