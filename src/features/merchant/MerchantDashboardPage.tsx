import React from 'react';
import { Link } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { formatCents } from '../../lib/currency';
import { Button } from '../../components/ui/Button';
import {
  Coins,
  ShoppingCart,
  Package,
  Plus,
  ArrowRight,
  MapPin,
  Check,
  Bike,
  Sparkles,
  Settings,
  ChevronRight,
  Leaf,
} from 'lucide-react';

export const MerchantDashboardPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { merchants, products } = useDataStore();

  const currentMerchant =
    merchants.find((m) => m.ownerUserId === currentUser?.id || m.id === currentUser?.merchantId) ||
    merchants[0];

  // Reference incoming orders matching image
  const incomingOrders = [
    {
      code: '#QK1258',
      customer: 'María López',
      productCount: '2 productos',
      totalCents: 4590,
      status: 'en_preparacion',
      statusLabel: 'En preparación',
      statusClass: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      code: '#QK1257',
      customer: 'Carlos Rojas',
      productCount: '3 productos',
      totalCents: 6200,
      status: 'en_camino',
      statusLabel: 'En camino',
      statusClass: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    {
      code: '#QK1256',
      customer: 'Ana Torres',
      productCount: '1 producto',
      totalCents: 2850,
      status: 'entregada',
      statusLabel: 'Entregada',
      statusClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      code: '#QK1255',
      customer: 'Luis Pérez',
      productCount: '4 productos',
      totalCents: 9000,
      status: 'cancelada',
      statusLabel: 'Cancelada',
      statusClass: 'bg-rose-50 text-rose-700 border-rose-200',
    },
  ];

  // Products matching the 4 displayed in the reference image
  const displayProducts = [
    {
      id: 'p1',
      name: 'Combo Familiar',
      priceCents: 4590,
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
      available: true,
    },
    {
      id: 'p2',
      name: 'Lomo Saltado',
      priceCents: 1800,
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&auto=format&fit=crop&q=80',
      available: true,
    },
    {
      id: 'p3',
      name: 'Causa de pollo',
      priceCents: 1200,
      imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&auto=format&fit=crop&q=80',
      available: true,
    },
    {
      id: 'p4',
      name: 'Jugo de maracuyá',
      priceCents: 600,
      imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&auto=format&fit=crop&q=80',
      available: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-ink tracking-tight">
          Panel del proveedor
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          Gestiona tu negocio, productos y pedidos desde un solo lugar.
        </p>
      </div>

      {/* 3 KPI Stat Cards - Matching image */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Ventas del mes */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-subtle flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-gray-500 font-medium">Ventas del mes</span>
            <p className="text-xl sm:text-2xl font-black text-ink">S/ 2,480.00</p>
            <span className="inline-flex items-center text-[11px] font-bold text-emerald-600">
              ↑ 12% <span className="text-gray-400 font-normal ml-1">vs. mes anterior</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Pedidos recibidos */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-subtle flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-gray-500 font-medium">Pedidos recibidos</span>
            <p className="text-xl sm:text-2xl font-black text-ink">48</p>
            <span className="inline-flex items-center text-[11px] font-bold text-emerald-600">
              ↑ 8% <span className="text-gray-400 font-normal ml-1">vs. mes anterior</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center flex-shrink-0">
            <ShoppingCart className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Productos en stock */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-subtle flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-gray-500 font-medium">Productos en stock</span>
            <p className="text-xl sm:text-2xl font-black text-ink">23</p>
            <span className="inline-flex items-center text-[11px] font-bold text-emerald-600">
              ↑ 5% <span className="text-gray-400 font-normal ml-1">vs. mes anterior</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Package className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Store Banner Card - 2 Columns (Store Details & Visual Banner) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-subtle overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left: Merchant Info */}
        <div className="p-6 lg:col-span-7 flex flex-col justify-between space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-slate-900 border-2 border-amber-400 flex items-center justify-center text-amber-300 font-serif font-black text-lg shadow-sm flex-shrink-0">
              SG
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-ink truncate">
                  {currentMerchant.name}
                </h2>
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Activo
                </span>
              </div>
              <p className="text-xs text-gray-400 capitalize">{currentMerchant.category}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3 text-primary flex-shrink-0" />
                Av. Amazonas 456, Tingo María
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-600 leading-relaxed">
            Comida típica y fusión amazónica. ¡El verdadero sabor de la selva!
          </p>

          <div>
            <Link to="/comercio/perfil-tienda">
              <Button variant="outline" size="sm" className="text-xs px-4 border-primary text-primary">
                Editar tienda
              </Button>
            </Link>
          </div>
        </div>

        {/* Right: Dish Photo with Amazonian Banner */}
        <div className="lg:col-span-5 relative min-h-[160px] bg-slate-900 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80"
            alt="Sabores de nuestra tierra"
            className="w-full h-full object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-5 text-white">
            <div className="flex items-center gap-1.5 text-amber-300 text-xs font-semibold mb-1">
              <Leaf className="w-3.5 h-3.5" />
              <span>Selva Central</span>
            </div>
            <h3 className="text-base sm:text-lg font-serif font-bold leading-tight">
              Sabores de nuestra tierra
            </h3>
          </div>
        </div>
      </div>

      {/* Gestiona tus productos Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-ink">Gestiona tus productos</h2>
          <div className="flex items-center gap-3">
            <Link
              to="/comercio/productos"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              Ver todos <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link to="/comercio/productos">
              <Button variant="primary" size="sm" className="text-xs font-bold gap-1">
                <Plus className="w-3.5 h-3.5" /> Agregar producto
              </Button>
            </Link>
          </div>
        </div>

        {/* 4 Product Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {displayProducts.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-subtle overflow-hidden flex flex-col"
            >
              <div className="aspect-[4/3] w-full bg-gray-100 overflow-hidden">
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-ink truncate">{p.name}</h4>
                  <p className="text-xs font-extrabold text-ink mt-0.5">
                    {formatCents(p.priceCents)}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full self-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Disponible
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pedidos entrantes Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-subtle p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <h2 className="text-base sm:text-lg font-bold text-ink">Pedidos entrantes</h2>
          <Link
            to="/comercio/pedidos"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            Ver todos <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-gray-400 font-semibold border-b border-gray-100 pb-2">
                <th className="py-2.5 font-medium">N° Pedido</th>
                <th className="py-2.5 font-medium">Cliente</th>
                <th className="py-2.5 font-medium">Productos</th>
                <th className="py-2.5 font-medium">Total</th>
                <th className="py-2.5 font-medium">Estado</th>
                <th className="py-2.5 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {incomingOrders.map((order) => (
                <tr key={order.code} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-3 font-bold text-ink">{order.code}</td>
                  <td className="py-3 text-gray-700">{order.customer}</td>
                  <td className="py-3 text-gray-500">{order.productCount}</td>
                  <td className="py-3 font-bold text-ink">{formatCents(order.totalCents)}</td>
                  <td className="py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${order.statusClass}`}
                    >
                      {order.statusLabel}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <Link to="/comercio/pedidos">
                      <button
                        type="button"
                        className="px-3 py-1 rounded-lg border border-gray-200 text-gray-600 hover:text-primary hover:border-primary text-xs font-medium transition-colors"
                      >
                        Ver
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom 2 Cards Grid: Seguimiento de pedido & Configuración de la tienda */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Card 1: Seguimiento de pedido #QK1258 */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-100 shadow-subtle p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h3 className="text-sm font-bold text-ink">
              Seguimiento de pedido <span className="text-primary">#QK1258</span>
            </h3>
            <span className="text-xs text-gray-400">Cliente: María López</span>
          </div>

          {/* Stepper matching reference image */}
          <div className="py-3">
            <div className="relative flex items-center justify-between max-w-xl mx-auto">
              {/* Connecting line */}
              <div className="absolute left-6 right-6 top-3 h-0.5 bg-gray-200 -z-0" />
              <div className="absolute left-6 right-1/3 top-3 h-0.5 bg-primary -z-0" />

              {/* Step 1: Confirmado */}
              <div className="flex flex-col items-center text-center z-10 space-y-1">
                <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs shadow-sm">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-bold text-ink">Pedido confirmado</span>
                <span className="text-[10px] text-gray-400">10:24 a. m.</span>
              </div>

              {/* Step 2: En preparación */}
              <div className="flex flex-col items-center text-center z-10 space-y-1">
                <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs shadow-sm">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-bold text-ink">En preparación</span>
                <span className="text-[10px] text-gray-400">10:38 a. m.</span>
              </div>

              {/* Step 3: En camino (Active) */}
              <div className="flex flex-col items-center text-center z-10 space-y-1">
                <div className="w-6 h-6 rounded-full bg-primary ring-4 ring-primary/20 text-white flex items-center justify-center text-xs shadow-sm animate-pulse">
                  <Bike className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-bold text-primary">En camino</span>
                <span className="text-[10px] text-gray-400">11:05 a. m.</span>
              </div>

              {/* Step 4: Entregado */}
              <div className="flex flex-col items-center text-center z-10 space-y-1">
                <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-xs">
                  <span className="w-2 h-2 rounded-full bg-gray-400" />
                </div>
                <span className="text-[11px] font-medium text-gray-400">Entregado</span>
                <span className="text-[10px] text-gray-300">Estimado</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Configuración de la tienda */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-100 shadow-subtle p-5 flex flex-col justify-between space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-ink font-bold text-sm">
              <Settings className="w-4 h-4 text-primary" />
              <span>Configuración de la tienda</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Configure su información, horarios, formas de pago y más.
            </p>
          </div>

          <Link to="/comercio/configuracion" className="w-full">
            <Button variant="outline" size="sm" className="w-full text-xs font-bold border-primary text-primary">
              Ir a configuración
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
