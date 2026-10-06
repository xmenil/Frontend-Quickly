import React from 'react';
import { Link } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { formatCents } from '../../lib/currency';
import { OrderStatusBadge } from '../../components/ui/Badge';
import { formatDateTime } from '../../lib/date';
import { Button } from '../../components/ui/Button';
import {
  ShoppingBag,
  TrendingUp,
  Package,
  Clock,
  ArrowRight,
  Store,
  Plus,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export const MerchantDashboardPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { merchants, products, purchases } = useDataStore();

  const currentMerchant =
    merchants.find((m) => m.ownerUserId === currentUser?.id || m.id === currentUser?.merchantId) ||
    merchants[0];

  const merchantProducts = products.filter((p) => p.merchantId === currentMerchant.id);
  const availableProductsCount = merchantProducts.filter((p) => p.isAvailable && p.stock > 0).length;

  // Filter suborders belonging only to this merchant!
  const mySuborders = purchases.flatMap((p) =>
    p.merchantOrders
      .filter((mo) => mo.merchantId === currentMerchant.id)
      .map((mo) => ({
        ...mo,
        parentCode: p.code,
        customerName: p.customerName,
        customerPhone: p.customerPhone,
        addressSnapshot: p.addressSnapshot,
      }))
  );

  const pendingOrders = mySuborders.filter((o) =>
    ['pendiente', 'confirmado', 'en_preparacion'].includes(o.status)
  );

  const totalSalesCents = mySuborders
    .filter((o) => ['entregado', 'en_camino', 'listo_recoger', 'en_preparacion'].includes(o.status))
    .reduce((acc, o) => acc + o.subtotalCents, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">
            Panel de {currentMerchant.name}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Resumen operativo y control de pedidos en Tingo María
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/comercio/productos">
            <Button variant="primary" size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Nuevo Producto
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Ventas Netas</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-ink">{formatCents(totalSalesCents)}</p>
          <span className="text-[11px] text-emerald-600 font-medium">Calculado desde subpedidos</span>
        </div>

        {/* Pending Orders */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Por Atender</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-ink">{pendingOrders.length}</p>
          <span className="text-[11px] text-amber-600 font-medium">Requieren acción en cocina</span>
        </div>

        {/* Available Products */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Productos Activos</span>
            <div className="w-8 h-8 rounded-xl bg-primary-light text-primary flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-ink">
            {availableProductsCount} / {merchantProducts.length}
          </p>
          <span className="text-[11px] text-gray-500">Con stock en catálogo</span>
        </div>

        {/* Store Status */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Estado Actual</span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                currentMerchant.isOpen ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
              }`}
            >
              <Store className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-bold text-ink">
            {currentMerchant.isOpen ? 'Abierto' : 'Cerrado'}
          </p>
          <span className="text-[11px] text-gray-400">Horario: {currentMerchant.schedule}</span>
        </div>
      </div>

      {/* Orders to Dispatch Section */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-ink">
              Pedidos Pendientes de Despacho ({pendingOrders.length})
            </h2>
            <p className="text-xs text-gray-500">
              Acepta y prepara los pedidos de tus clientes de Tingo María
            </p>
          </div>

          <Link
            to="/comercio/pedidos"
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            Ver todos los pedidos <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {pendingOrders.length === 0 ? (
          <div className="py-8 text-center text-gray-400 space-y-1">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
            <p className="font-bold text-sm text-ink">¡Todo al día!</p>
            <p className="text-xs">No tienes pedidos pendientes de atención en este momento.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingOrders.slice(0, 4).map((order) => (
              <div
                key={order.id}
                className="p-4 bg-gray-50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-extrabold text-sm text-ink">{order.parentCode}</span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="text-gray-600 font-medium">
                    Cliente: {order.customerName} • Tel: {order.customerPhone}
                  </p>
                  <p className="text-gray-500 mt-0.5">
                    {order.items.map((it) => `${it.quantity}x ${it.productName}`).join(', ')}
                  </p>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span className="text-sm font-black text-ink">
                    {formatCents(order.totalCents)}
                  </span>
                  <Link to="/comercio/pedidos">
                    <Button variant="primary" size="sm">
                      Gestionar
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
