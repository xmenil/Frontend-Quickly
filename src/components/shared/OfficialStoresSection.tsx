import React from 'react';
import { Link } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore';
import {
  Building2,
  Star,
  Clock,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export const OfficialStoresSection: React.FC = () => {
  const { merchants, products } = useDataStore();

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
    </section>
  );
};
