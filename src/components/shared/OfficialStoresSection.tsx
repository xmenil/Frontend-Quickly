import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore';
import { useCartStore } from '../../store/cartStore';
import { formatCents } from '../../lib/currency';
import {
  Building2,
  Store,
  MapPin,
  Star,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';

export const OfficialStoresSection: React.FC = () => {
  const { merchants, products } = useDataStore();
  const { addItem } = useCartStore();
  const navigate = useNavigate();

  // Big stores from tiendas_tingo_maria.json
  const bigStoreIds = [
    'm_super_lukita',
    'm_tiendas_efe',
    'm_la_curacao',
    'm_super_baraton',
    'm_carsa',
    'm_el_balcon',
    'm_galeria_san_benito',
    'm_minisol',
  ];

  const bigStores = merchants.filter((m) => bigStoreIds.includes(m.id));

  // Big store products
  const featuredBigProducts = products
    .filter((p) => bigStoreIds.includes(p.merchantId))
    .slice(0, 8);

  const handleAddToCart = (e: React.MouseEvent, product: typeof featuredBigProducts[0]) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: product.id,
      merchantId: product.merchantId,
      quantity: 1,
      unitPriceCents: product.priceCents,
    });
  };

  return (
    <section className="space-y-6 my-8 select-none">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-ink tracking-tight flex items-center gap-2">
              <span>Grandes Tiendas y Supermercados</span>
              <span className="hidden sm:inline-flex text-[10px] uppercase font-extrabold bg-primary text-white px-2 py-0.5 rounded-full">
                Oficiales
              </span>
            </h2>
            <p className="text-xs text-gray-500">
              Surtido completo de tiendas departamentales y supermercados en Tingo María
            </p>
          </div>
        </div>

        <Link
          to="/negocios?categoria=supermercados"
          className="text-xs sm:text-sm font-bold text-primary hover:text-primary-hover flex items-center gap-1 hover:underline"
        >
          <span>Ver todas las tiendas</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Big Stores Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {bigStores.slice(0, 4).map((store) => {
          const storeProducts = products.filter((p) => p.merchantId === store.id).slice(0, 3);
          return (
            <Link
              key={store.id}
              to={`/comercio/${store.id}`}
              className="group bg-white rounded-2xl border border-gray-100 shadow-subtle hover:border-primary-300 hover:shadow-card overflow-hidden flex flex-col justify-between transition-all duration-200"
            >
              {/* Store Banner & Logo */}
              <div>
                <div className="relative h-24 sm:h-28 overflow-hidden bg-gray-100">
                  <img
                    src={store.bannerUrl}
                    alt={store.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-sm text-ink text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Verificado</span>
                  </span>
                </div>

                <div className="p-4 pt-0 relative">
                  {/* Floating Logo Badge */}
                  <div className="w-14 h-14 rounded-xl bg-white shadow-md border border-gray-100 p-1 flex items-center justify-center -mt-7 mb-2 relative z-10">
                    <img
                      src={store.logoUrl}
                      alt={store.name}
                      className="w-full h-full object-contain rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=200&auto=format&fit=crop&q=80';
                      }}
                    />
                  </div>

                  {/* Store Name & Info */}
                  <h3 className="font-extrabold text-sm sm:text-base text-ink group-hover:text-primary transition-colors truncate">
                    {store.name}
                  </h3>
                  <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                    {store.description}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-gray-600 mt-2 font-medium">
                    <div className="flex items-center gap-1 text-amber-600 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{store.rating.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      <span>{store.prepTimeMinutes} min</span>
                    </div>
                  </div>

                  {/* Mini previews of top products */}
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Artículos destacados:
                    </span>
                    <div className="flex items-center gap-2">
                      {storeProducts.map((prod) => (
                        <div
                          key={prod.id}
                          className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 p-1 flex items-center justify-center relative group/item"
                          title={prod.name}
                        >
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Card Action */}
              <div className="px-4 py-2.5 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <span>Ver catálogo de tienda</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Featured Products from Big Stores (Mercado Libre Style Carousel Cards) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-subtle p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-black text-ink flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Productos de Tiendas y Supermercados de Tingo María</span>
            </h3>
            <p className="text-xs text-gray-400">
              Alimentos, electrodomésticos, tecnología y artículos del hogar con entrega rápida
            </p>
          </div>
          <Link
            to="/negocios"
            className="text-xs font-bold text-primary hover:underline hidden sm:inline-flex items-center gap-1"
          >
            Ver todos <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {featuredBigProducts.map((item) => {
            const store = merchants.find((m) => m.id === item.merchantId);
            return (
              <Link
                key={item.id}
                to={`/producto/${item.id}`}
                className="group bg-white rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-card p-3 flex flex-col justify-between transition-all duration-200 text-left"
              >
                <div>
                  {/* Product Image */}
                  <div className="aspect-square w-full rounded-lg bg-gray-50 overflow-hidden mb-2.5 flex items-center justify-center p-2 relative">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                    {item.freeShipping && (
                      <span className="absolute top-1.5 left-1.5 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                        Envío rápido
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] font-bold text-gray-400 block truncate">
                    {store?.name || 'Tienda oficial'}
                  </span>
                  <h4 className="font-bold text-xs sm:text-[13px] text-ink group-hover:text-primary transition-colors line-clamp-2 mt-0.5 leading-snug">
                    {item.name}
                  </h4>

                  {item.originalPriceCents && (
                    <p className="text-[11px] text-gray-400 line-through mt-1">
                      {formatCents(item.originalPriceCents)}
                    </p>
                  )}

                  <p className="text-sm sm:text-base font-black text-ink mt-0.5">
                    {formatCents(item.priceCents)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleAddToCart(e, item)}
                  className="mt-3 w-full py-2 px-3 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Agregar</span>
                </button>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
