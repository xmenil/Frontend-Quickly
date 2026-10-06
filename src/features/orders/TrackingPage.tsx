import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore';
import { SchematicMap } from '../../components/shared/SchematicMap';
import { OrderTimeline } from '../../components/shared/OrderTimeline';
import { OrderStatusBadge } from '../../components/ui/Badge';
import { ChevronLeft, Store, Bike, MapPin } from 'lucide-react';

export const TrackingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { purchases, zones } = useDataStore();

  const purchase = purchases.find((p) => p.id === id);

  const [selectedSuborderIndex, setSelectedSuborderIndex] = useState(0);

  if (!purchase) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <h1 className="text-2xl font-bold text-ink mb-2">Pedido no encontrado</h1>
        <Link to="/cliente/pedidos" className="text-primary font-bold hover:underline">
          Volver a Mis Pedidos
        </Link>
      </div>
    );
  }

  const activeSuborder = purchase.merchantOrders[selectedSuborderIndex] || purchase.merchantOrders[0];
  const targetZone = zones.find((z) => z.id === purchase.addressSnapshot.zoneId);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div>
        <Link
          to={`/cliente/pedidos/${purchase.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-primary mb-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Volver al detalle del pedido</span>
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">
              Seguimiento en Vivo • {purchase.code}
            </h1>
            <p className="text-xs text-gray-500">
              Ruta esquemática y estado del reparto en Tingo María
            </p>
          </div>
          <OrderStatusBadge status={activeSuborder.status} />
        </div>
      </div>

      {/* Multi-merchant selector pills if more than 1 store */}
      {purchase.merchantOrders.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar p-1.5 bg-gray-100 rounded-2xl">
          {purchase.merchantOrders.map((mo, idx) => {
            const isSelected = selectedSuborderIndex === idx;
            return (
              <button
                key={mo.id}
                type="button"
                onClick={() => setSelectedSuborderIndex(idx)}
                className={`touch-target px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-white text-primary shadow-sm ring-2 ring-primary/20'
                    : 'text-gray-600 hover:text-ink'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>{mo.merchantName}</span>
                <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-normal">
                  {mo.status}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Grid: Schematic Map & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Schematic Map (2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          <SchematicMap
            orderStatus={activeSuborder.status}
            merchantName={activeSuborder.merchantName}
            merchantAddress={activeSuborder.merchantAddress}
            customerAddress={`${purchase.addressSnapshot.street} #${purchase.addressSnapshot.number}`}
            zoneName={targetZone?.name}
            courierName={activeSuborder.courierName}
          />

          {/* Quick status card */}
          <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center text-primary font-bold">
                <Bike className="w-5 h-5" />
              </div>
              <div>
                <p className="font-extrabold text-sm text-ink">{activeSuborder.merchantName}</p>
                <p className="text-gray-500">
                  {activeSuborder.courierName
                    ? `Repartidor: ${activeSuborder.courierName}`
                    : 'Esperando asignación de repartidor'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 font-semibold text-gray-600">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Destino: {purchase.addressSnapshot.reference}</span>
            </div>
          </div>
        </div>

        {/* Timeline Column (1 Column) */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <h2 className="font-extrabold text-sm text-ink pb-2 border-b border-gray-100">
            Progreso del Subpedido
          </h2>
          <OrderTimeline events={activeSuborder.timeline} />
        </div>
      </div>
    </div>
  );
};
