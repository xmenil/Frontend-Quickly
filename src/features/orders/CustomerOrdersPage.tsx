import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { PurchaseStatusBadge, PaymentStatusBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatDateTime } from '../../lib/date';
import { formatCents } from '../../lib/currency';
import { ShoppingBag, ChevronRight, Store, Navigation } from 'lucide-react';

export const CustomerOrdersPage: React.FC = () => {
  const { purchases } = useDataStore();
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();

  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');

  const userPurchases = purchases.filter((p) => p.customerId === currentUser?.id);

  const filteredPurchases = userPurchases.filter((p) => {
    if (filter === 'active') return p.status === 'pendiente' || p.status === 'en_proceso' || p.status === 'entrega_parcial';
    if (filter === 'completed') return p.status === 'completado';
    if (filter === 'cancelled') return p.status === 'cancelado' || p.status === 'finalizado_con_cancelaciones';
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">Mis Pedidos</h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Historial de compras y seguimiento en tiempo real en Tingo María
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-1.5 p-1 bg-gray-100 rounded-xl text-xs font-bold overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`touch-target px-3 py-1.5 rounded-lg transition-all ${
              filter === 'all' ? 'bg-white text-ink shadow-sm' : 'text-gray-500 hover:text-ink'
            }`}
          >
            Todos ({userPurchases.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('active')}
            className={`touch-target px-3 py-1.5 rounded-lg transition-all ${
              filter === 'active' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-ink'
            }`}
          >
            En Curso
          </button>
          <button
            type="button"
            onClick={() => setFilter('completed')}
            className={`touch-target px-3 py-1.5 rounded-lg transition-all ${
              filter === 'completed' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-ink'
            }`}
          >
            Completados
          </button>
          <button
            type="button"
            onClick={() => setFilter('cancelled')}
            className={`touch-target px-3 py-1.5 rounded-lg transition-all ${
              filter === 'cancelled' ? 'bg-white text-red-700 shadow-sm' : 'text-gray-500 hover:text-ink'
            }`}
          >
            Cancelados
          </button>
        </div>
      </div>

      {filteredPurchases.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="w-10 h-10" />}
          title="No se encontraron pedidos"
          description="Aún no has realizado pedidos en esta categoría o filtro."
          actionText="Explorar Tiendas"
          onAction={() => navigate('/negocios')}
        />
      ) : (
        <div className="space-y-4">
          {filteredPurchases.map((purchase) => {
            const isActive = ['pendiente', 'en_proceso', 'entrega_parcial'].includes(purchase.status);

            return (
              <div
                key={purchase.id}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 p-5 space-y-4"
              >
                {/* Header: Code & Status */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <span className="font-extrabold text-base text-ink">{purchase.code}</span>
                    <PurchaseStatusBadge status={purchase.status} />
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatDateTime(purchase.createdAt)}
                  </span>
                </div>

                {/* Suborders preview */}
                <div className="space-y-2">
                  {purchase.merchantOrders.map((mo) => (
                    <div
                      key={mo.id}
                      className="p-3 bg-gray-50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="font-bold text-ink">{mo.merchantName}</span>
                        <span className="text-gray-400">
                          ({mo.items.reduce((a, b) => a + b.quantity, 0)} productos)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <span className="font-bold text-ink">{formatCents(mo.totalCents)}</span>
                        <span className="text-[11px] font-semibold text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                          {mo.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer: Grand Total & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div>
                    <span className="text-xs text-gray-500 block">Total pagado:</span>
                    <span className="text-lg font-black text-ink">
                      {formatCents(purchase.grandTotalCents)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isActive && (
                      <Link
                        to={`/cliente/seguimiento/${purchase.id}`}
                        className="touch-target bg-primary-light text-primary hover:bg-primary-100 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Seguimiento en Mapa</span>
                      </Link>
                    )}

                    <Link
                      to={`/cliente/pedidos/${purchase.id}`}
                      className="touch-target bg-gray-100 hover:bg-gray-200 text-ink px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <span>Ver Detalle</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
