import React, { useState } from 'react';
import { useDataStore } from '../../store/dataStore';
import { OrderStatusBadge, PurchaseStatusBadge, PaymentStatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { formatDateTime } from '../../lib/date';
import { formatCents } from '../../lib/currency';
import { Store, Bike, MapPin, Search } from 'lucide-react';

export const AdminOrdersPage: React.FC = () => {
  const { purchases, couriers, adminAssignCourier } = useDataStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [assignModal, setAssignModal] = useState<{ suborderId: string; merchantName: string } | null>(
    null
  );
  const [selectedCourierId, setSelectedCourierId] = useState(couriers[0]?.id || '');

  // Flatten all suborders with purchase details
  const allSuborders = purchases.flatMap((p) =>
    p.merchantOrders.map((mo) => ({
      ...mo,
      parentCode: p.code,
      customerName: p.customerName,
      customerPhone: p.customerPhone,
      addressSnapshot: p.addressSnapshot,
      paymentMethod: p.paymentMethod,
    }))
  );

  const filteredSuborders = allSuborders.filter((o) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (
        !o.parentCode.toLowerCase().includes(q) &&
        !o.merchantName.toLowerCase().includes(q) &&
        !o.customerName.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  const handleConfirmAssign = () => {
    if (!assignModal || !selectedCourierId) return;
    adminAssignCourier(assignModal.suborderId, selectedCourierId);
    setAssignModal(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">Monitor Global de Pedidos</h1>
        <p className="text-xs sm:text-sm text-gray-500">
          Supervisa el flujo completo de compras, cocinas y repartidores en Tingo María
        </p>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por código (ej: QK-782410), tienda o cliente..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-9 pr-4 text-xs text-ink placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredSuborders.map((order) => (
          <div
            key={order.id}
            className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3 text-xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-ink">{order.parentCode}</span>
                <span className="text-gray-400">•</span>
                <span className="font-bold text-primary flex items-center gap-1">
                  <Store className="w-3.5 h-3.5" />
                  {order.merchantName}
                </span>
                <OrderStatusBadge status={order.status} />
              </div>
              <span className="text-gray-400">{formatDateTime(order.createdAt)}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-gray-400 block text-[11px]">Cliente</span>
                <span className="font-bold text-ink">{order.customerName}</span>
                <span className="text-gray-500 block">{order.customerPhone}</span>
              </div>

              <div>
                <span className="text-gray-400 block text-[11px]">Destino</span>
                <span className="font-bold text-ink">
                  {order.addressSnapshot.street} #{order.addressSnapshot.number}
                </span>
                <span className="text-gray-500 block truncate">
                  Ref: {order.addressSnapshot.reference}
                </span>
              </div>

              <div>
                <span className="text-gray-400 block text-[11px]">Repartidor</span>
                <span className="font-bold text-ink">
                  {order.courierName || 'Sin repartidor asignado'}
                </span>
                {order.courierPhone && (
                  <span className="text-gray-500 block">{order.courierPhone}</span>
                )}
              </div>
            </div>

            {/* Total and manual assignment */}
            <div className="pt-2 flex items-center justify-between border-t border-gray-100">
              <span className="font-extrabold text-sm text-ink">
                Total: {formatCents(order.totalCents)}
              </span>

              {order.status === 'listo_recoger' && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    setAssignModal({ suborderId: order.id, merchantName: order.merchantName })
                  }
                >
                  <Bike className="w-4 h-4 mr-1" />
                  <span>Asignar Repartidor</span>
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Manual Assignment Dialog */}
      <Dialog
        isOpen={Boolean(assignModal)}
        onClose={() => setAssignModal(null)}
        title="Asignación Manual de Repartidor"
        description={`Asigna un repartidor de la flota para recoger en ${assignModal?.merchantName}`}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-ink block mb-1">
              Seleccionar repartidor disponible:
            </label>
            <select
              value={selectedCourierId}
              onChange={(e) => setSelectedCourierId(e.target.value)}
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {couriers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.vehicleType}) {c.isAvailable ? '• Disponible' : '• Ocupado'}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAssignModal(null)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleConfirmAssign}>
              Confirmar Asignación
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export const AdminZonesPage: React.FC = () => {
  const { zones } = useDataStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">Zonas de Cobertura y Tarifas</h1>
        <p className="text-xs sm:text-sm text-gray-500">
          Configuración geográfica y costos base de reparto en Tingo María y distritos
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {zones.map((zone) => (
          <div
            key={zone.id}
            className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3 text-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="font-extrabold text-base text-ink">{zone.name}</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  zone.isAvailable ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}
              >
                {zone.isAvailable ? 'Habilitada' : 'Fuera de Cobertura'}
              </span>
            </div>

            <p className="text-gray-500 leading-relaxed">{zone.description}</p>

            <div className="pt-2 flex justify-between items-center text-xs">
              <span className="text-gray-500">Tarifa base de envío:</span>
              <span className="font-extrabold text-base text-primary">
                {formatCents(zone.baseFeeCents)}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Tiempo estimado promedio:</span>
              <span className="font-bold text-ink">{zone.estimatedMinutes} minutos</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
