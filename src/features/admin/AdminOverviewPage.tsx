import React from 'react';
import { useDataStore } from '../../store/dataStore';
import { formatCents } from '../../lib/currency';
import { Link } from 'react-router-dom';
import {
  Users,
  Store,
  Bike,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const AdminOverviewPage: React.FC = () => {
  const { users, merchants, couriers, purchases, tickets } = useDataStore();

  const pendingApprovalsCount = users.filter((u) => u.status === 'pendiente_aprobacion').length;
  const activeOrdersCount = purchases.filter((p) =>
    ['pendiente', 'en_proceso', 'entrega_parcial'].includes(p.status)
  ).length;

  const totalGMVCents = purchases.reduce((acc, p) => acc + p.grandTotalCents, 0);
  const openTicketsCount = tickets.filter((t) => t.status === 'abierto' || t.status === 'en_revision').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">Panel de Control Global</h1>
        <p className="text-xs sm:text-sm text-gray-500">
          Supervisión centralizada de la plataforma Quickly en Tingo María
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* GMV Volume */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Volumen Transaccionado</span>
            <div className="w-8 h-8 rounded-xl bg-primary-light text-primary flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-ink">{formatCents(totalGMVCents)}</p>
          <span className="text-[11px] text-gray-500">{purchases.length} órdenes totales</span>
        </div>

        {/* Active Orders */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Pedidos en Curso</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-ink">{activeOrdersCount}</p>
          <span className="text-[11px] text-blue-600 font-medium">En proceso de entrega</span>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Solicitudes Nuevas</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-ink">{pendingApprovalsCount}</p>
          <span className="text-[11px] text-amber-600 font-medium">Por aprobar en panel</span>
        </div>

        {/* Incidents / Tickets */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Incidencias / Soporte</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-ink">{openTicketsCount}</p>
          <span className="text-[11px] text-red-600 font-medium">Tickets abiertos</span>
        </div>
      </div>

      {/* Network Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Merchants Card */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-ink">{merchants.length} Comercios Afiliados</p>
              <p className="text-xs text-gray-500">
                {merchants.filter((m) => m.isOpen).length} abiertos ahora
              </p>
            </div>
          </div>
          <Link to="/admin/comercios" className="text-primary hover:text-primary-hover p-2">
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Couriers Card */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-ink">{couriers.length} Repartidores</p>
              <p className="text-xs text-gray-500">
                {couriers.filter((c) => c.isAvailable).length} disponibles en calle
              </p>
            </div>
          </div>
          <Link to="/admin/repartidores" className="text-primary hover:text-primary-hover p-2">
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Global Users Card */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-ink">{users.length} Cuentas Registradas</p>
              <p className="text-xs text-gray-500">Clientes, tiendas y repartidores</p>
            </div>
          </div>
          <Link to="/admin/usuarios" className="text-primary hover:text-primary-hover p-2">
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
