import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { PurchaseStatusBadge, OrderStatusBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatDateTime } from '../../lib/date';
import { formatCents } from '../../lib/currency';
import {
  ShoppingBag,
  ChevronRight,
  Store,
  Navigation,
  Clock,
  UtensilsCrossed,
  Pill,
  CheckCircle2,
} from 'lucide-react';

export const CustomerOrdersPage: React.FC = () => {
  const { purchases } = useDataStore();
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();

  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');

  const userPurchases = purchases.filter((p) => p.customerId === currentUser?.id);

  const activePurchasesCount = userPurchases.filter(
    (p) => p.status === 'pendiente' || p.status === 'en_proceso' || p.status === 'entrega_parcial'
  ).length;

  const filteredPurchases = userPurchases.filter((p) => {
    if (filter === 'active')
      return (
        p.status === 'pendiente' ||
        p.status === 'en_proceso' ||
        p.status === 'entrega_parcial'
      );
    if (filter === 'completed') return p.status === 'completado';
    if (filter === 'cancelled')
      return p.status === 'cancelado' || p.status === 'finalizado_con_cancelaciones';
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 sm:pb-12">
      {/* Title & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">Mis Pedidos</h1>
            {activePurchasesCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100/90 px-3 py-1 rounded-full border border-emerald-200 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>{activePurchasesCount} en curso</span>
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
            Historial de compras y seguimiento de entregas en Tingo María
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-1.5 p-1.5 bg-gray-100 rounded-2xl text-xs font-bold overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl transition-all ${
              filter === 'all'
                ? 'bg-white text-ink shadow-sm'
                : 'text-gray-600 hover:text-ink hover:bg-gray-50'
            }`}
          >
            Todos ({userPurchases.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('active')}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl transition-all ${
              filter === 'active'
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-600 hover:text-ink hover:bg-gray-50'
            }`}
          >
            En Curso ({activePurchasesCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('completed')}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl transition-all ${
              filter === 'completed'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-gray-600 hover:text-ink hover:bg-gray-50'
            }`}
          >
            Completados
          </button>
          <button
            type="button"
            onClick={() => setFilter('cancelled')}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl transition-all ${
              filter === 'cancelled'
                ? 'bg-white text-red-700 shadow-sm'
                : 'text-gray-600 hover:text-ink hover:bg-gray-50'
            }`}
          >
            Cancelados
          </button>
        </div>
      </div>

      {filteredPurchases.length === 0 ? (
        <div className="space-y-6">
          <EmptyState
            icon={<ShoppingBag className="w-12 h-12 text-primary" />}
            title="No se encontraron pedidos"
            description="Aún no tienes pedidos registrados con este filtro de búsqueda."
            actionText="Explorar Comercios en Tingo María"
            onAction={() => navigate('/negocios')}
          />

          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm text-center space-y-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              ¿Deseas pedir algo ahora?
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/negocios?categoria=restaurante')}
                className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs transition-colors border border-amber-200"
              >
                <UtensilsCrossed className="w-4 h-4 text-amber-600" />
                <span>Restaurantes Amazónicos</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/negocios?categoria=farmacia')}
                className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs transition-colors border border-emerald-200"
              >
                <Pill className="w-4 h-4 text-emerald-600" />
                <span>Boticas y Salud</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPurchases.map((purchase) => {
            const isActive = ['pendiente', 'en_proceso', 'entrega_parcial'].includes(
              purchase.status
            );

            return (
              <div
                key={purchase.id}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 p-5 space-y-4"
              >
                {/* Header: Code & Status */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-lg text-ink tabular-nums">
                      {purchase.code}
                    </span>
                    <PurchaseStatusBadge status={purchase.status} />
                  </div>
                  <span className="text-xs text-gray-600 font-medium tabular-nums">
                    {formatDateTime(purchase.createdAt)}
                  </span>
                </div>

                {/* Suborders preview */}
                <div className="space-y-2.5">
                  {purchase.merchantOrders.map((mo) => (
                    <div
                      key={mo.id}
                      className="p-3.5 bg-gray-50/80 rounded-2xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <Store className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="font-extrabold text-ink text-sm sm:text-xs">
                          {mo.merchantName}
                        </span>
                        <span className="text-gray-500 font-medium tabular-nums">
                          ({mo.items.reduce((a, b) => a + b.quantity, 0)}{' '}
                          {mo.items.length === 1 ? 'producto' : 'productos'})
                        </span>
                      </div>
                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <span className="font-black text-ink tabular-nums">
                          {formatCents(mo.totalCents)}
                        </span>
                        <OrderStatusBadge status={mo.status} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer: Grand Total & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div>
                    <span className="text-xs text-gray-500 block">Total de la orden:</span>
                    <span className="text-xl font-black text-primary tabular-nums">
                      {formatCents(purchase.grandTotalCents)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {isActive && (
                      <Link
                        to={`/cliente/seguimiento/${purchase.id}`}
                        className="min-h-[44px] bg-primary text-white hover:bg-primary-hover px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
                      >
                        <Navigation className="w-4 h-4" />
                        <span>Seguimiento en Vivo</span>
                      </Link>
                    )}

                    <Link
                      to={`/cliente/pedidos/${purchase.id}`}
                      className="min-h-[44px] bg-gray-100 hover:bg-gray-200 text-ink px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
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
