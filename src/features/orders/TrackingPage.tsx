import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore';
import { SchematicMap } from '../../components/shared/SchematicMap';
import { OrderTimeline } from '../../components/shared/OrderTimeline';
import { OrderStatusBadge } from '../../components/ui/Badge';
import { ChevronLeft, Store, Bike, MapPin, Phone, Clock, ArrowRight } from 'lucide-react';

export const TrackingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { purchases, zones } = useDataStore();

  const purchase = purchases.find((p) => p.id === id);

  const [selectedSuborderIndex, setSelectedSuborderIndex] = useState(0);

  if (!purchase) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center space-y-4">
        <h1 className="text-2xl font-extrabold text-ink">Pedido no encontrado</h1>
        <p className="text-gray-600 text-sm">No pudimos encontrar la información de rastreo de este pedido.</p>
        <Link
          to="/cliente/pedidos"
          className="min-h-[44px] inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-2xl font-bold text-sm shadow-md"
        >
          Volver a Mis Pedidos
        </Link>
      </div>
    );
  }

  const activeSuborder =
    purchase.merchantOrders[selectedSuborderIndex] || purchase.merchantOrders[0];
  const targetZone = zones.find((z) => z.id === purchase.addressSnapshot.zoneId);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24 sm:pb-12">
      {/* Top Header */}
      <div>
        <Link
          to={`/cliente/pedidos/${purchase.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-primary mb-1 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Volver al detalle del pedido</span>
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">
                Seguimiento en Vivo
              </h1>
              <span className="text-sm font-black text-primary bg-primary-soft px-3 py-1 rounded-full border border-primary/20 tabular-nums">
                {purchase.code}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
              Ruta esquemática y despacho en tiempo real en Tingo María
            </p>
          </div>
          <OrderStatusBadge status={activeSuborder.status} />
        </div>
      </div>

      {/* Multi-merchant selector tabs if more than 1 store */}
      {purchase.merchantOrders.length > 1 && (
        <div className="p-2 bg-gray-100 rounded-3xl space-y-1.5">
          <p className="text-[11px] font-bold text-gray-500 uppercase px-3 tracking-wider">
            Comercios de tu pedido ({purchase.merchantOrders.length}):
          </p>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {purchase.merchantOrders.map((mo, idx) => {
              const isSelected = selectedSuborderIndex === idx;
              return (
                <button
                  key={mo.id}
                  type="button"
                  onClick={() => setSelectedSuborderIndex(idx)}
                  className={`min-h-[44px] px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2.5 whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-white text-primary shadow-sm ring-2 ring-primary/20'
                      : 'text-gray-700 hover:text-ink hover:bg-white/60'
                  }`}
                >
                  <Store className="w-4 h-4" />
                  <span>{mo.merchantName}</span>
                  <OrderStatusBadge status={mo.status} />
                </button>
              );
            })}
          </div>
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
            courierPhone={activeSuborder.courierPhone}
          />

          {/* Detailed status banner */}
          <div className="p-5 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-primary-soft flex items-center justify-center text-primary flex-shrink-0">
                <Bike className="w-6 h-6" />
              </div>
              <div>
                <p className="font-extrabold text-sm sm:text-base text-ink">
                  {activeSuborder.merchantName}
                </p>
                <p className="text-gray-600 font-medium text-xs">
                  {activeSuborder.courierName ? (
                    <>
                      Repartidor asignado:{' '}
                      <strong className="text-ink">{activeSuborder.courierName}</strong>
                    </>
                  ) : (
                    'Esperando asignación de repartidor'
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 self-end sm:self-auto">
              {activeSuborder.courierPhone && (
                <a
                  href={`tel:${activeSuborder.courierPhone.replace(/\s+/g, '')}`}
                  className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Llamar al repartidor</span>
                </a>
              )}

              <Link
                to={`/cliente/pedidos/${purchase.id}`}
                className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-ink font-bold text-xs transition-colors"
              >
                <span>Ver Comanda</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Timeline Column (1 Column) */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h2 className="font-extrabold text-sm text-ink flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>Progreso de Entrega</span>
            </h2>
            <span className="text-[11px] font-bold text-primary bg-primary-soft px-2 py-0.5 rounded-full">
              En tiempo real
            </span>
          </div>
          <OrderTimeline events={activeSuborder.timeline} />
        </div>
      </div>
    </div>
  );
};
