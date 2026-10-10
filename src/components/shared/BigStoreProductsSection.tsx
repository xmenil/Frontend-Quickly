import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore';
import { useCartStore } from '../../store/cartStore';
import { formatCents } from '../../lib/currency';
import {
  ShoppingCart,
  Sparkles,
  ArrowRight,
  Check,
  Building2,
  Tag,
  BadgeCheck,
} from 'lucide-react';

const BIG_STORE_IDS = [
  'm_super_lukita',
  'm_tiendas_efe',
  'm_la_curacao',
  'm_super_baraton',
  'm_carsa',
  'm_el_balcon',
  'm_minisol',
  'm_galeria_san_benito',
  'm_feria_continental',
];

export const BigStoreProductsSection: React.FC = () => {
  const { merchants, products } = useDataStore();
  const { addItem } = useCartStore();

  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  // Big store filters
  const storeFilters = [
    { id: 'all', name: 'Todas las tiendas' },
    { id: 'm_super_lukita', name: 'Supermercado Lukita' },
    { id: 'm_tiendas_efe', name: 'Tiendas EFE' },
    { id: 'm_la_curacao', name: 'La Curacao' },
    { id: 'm_super_baraton', name: 'Supermercado Baratón' },
    { id: 'm_carsa', name: 'Carsa' },
    { id: 'm_el_balcon', name: 'El Balcón' },
    { id: 'm_minisol', name: 'Minisol' },
  ];

  // Filter products by selected store or show curated mix
  const bigStoreProducts = products.filter((p) => BIG_STORE_IDS.includes(p.merchantId));

  const displayedProducts = (
    selectedStoreId === 'all'
      ? bigStoreProducts
      : bigStoreProducts.filter((p) => p.merchantId === selectedStoreId)
  ).slice(0, 10);

  const handleAddToCart = (e: React.MouseEvent, product: typeof displayedProducts[0]) => {
    e.preventDefault();
    e.stopPropagation();

    addItem({
      productId: product.id,
      merchantId: product.merchantId,
      quantity: 1,
      unitPriceCents: product.priceCents,
    });

    setAddedProductId(product.id);
    setTimeout(() => {
      setAddedProductId((current) => (current === product.id ? null : current));
    }, 1500);
  };

  return (
    <section className="w-full bg-[#FAF5F8] border-y border-pink-100/70 py-8 sm:py-10 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-pink-200/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-black text-ink tracking-tight">
                  Productos de Grandes Tiendas y Supermercados
                </h2>
                <span className="hidden sm:inline-flex text-[10px] uppercase font-extrabold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  Stock local
                </span>
              </div>
              <p className="text-xs text-ink-light">
                Abarrotes, tecnología, electrohogar y moda oficial con entrega en Tingo María
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

        {/* Interactive Store Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          {storeFilters.map((tab) => {
            const isActive = selectedStoreId === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedStoreId(tab.id)}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all font-bold cursor-pointer text-xs flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-white text-gray-700 border border-pink-200/70 hover:border-primary hover:text-primary'
                }`}
              >
                {tab.id === 'all' && <Tag className="w-3 h-3" />}
                {tab.id !== 'all' && <Building2 className="w-3 h-3" />}
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* 5-Column Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {displayedProducts.map((product) => {
            const store = merchants.find((m) => m.id === product.merchantId);
            const isJustAdded = addedProductId === product.id;

            const discountPercent =
              product.originalPriceCents && product.originalPriceCents > product.priceCents
                ? Math.round(
                    ((product.originalPriceCents - product.priceCents) / product.originalPriceCents) *
                      100
                  )
                : null;

            return (
              <Link
                key={product.id}
                to={`/producto/${product.id}`}
                className="group bg-white rounded-2xl border border-pink-100/80 shadow-[0_2px_8px_rgba(190,24,93,0.04)] hover:border-primary-400 hover:shadow-card hover:-translate-y-1 overflow-hidden flex flex-col justify-between transition-all duration-200 text-left h-full"
              >
                {/* Product Image: De esquina a esquina */}
                <div className="relative aspect-square w-full bg-gray-50 overflow-hidden border-b border-gray-100/70">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />

                  {discountPercent && (
                    <span className="absolute top-2.5 right-2.5 bg-emerald-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-xs">
                      {discountPercent}% OFF
                    </span>
                  )}

                  {product.freeShipping && (
                    <span className="absolute top-2.5 left-2.5 bg-primary/95 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                      Envío rápido
                    </span>
                  )}
                </div>

                {/* Content Body */}
                <div className="p-2.5 sm:p-3 flex flex-col justify-between flex-1">
                  <div>
                    {/* Product Name */}
                    <h3 className="font-bold text-xs text-ink group-hover:text-primary transition-colors line-clamp-2 leading-snug min-h-[2rem]">
                      {product.name}
                    </h3>

                    {/* Row: Perfil de tienda verificada a lado de Stock disponible */}
                    <div className="flex items-center justify-between gap-1.5 mt-2">
                      {/* Perfil de la tienda (pequeño y verificado) */}
                      <div
                        className="inline-flex items-center gap-1 text-[9px] text-gray-700 bg-gray-50 hover:bg-gray-100/80 border border-gray-200/80 px-1.5 py-0.5 rounded-full transition-colors min-w-0 max-w-[58%]"
                        title={`${store?.name || 'Tienda Oficial'} • Tienda verificada`}
                      >
                        {store?.logoUrl ? (
                          <img
                            src={store.logoUrl}
                            alt={store.name}
                            className="w-3.5 h-3.5 rounded-full object-cover flex-shrink-0 border border-gray-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <Building2 className="w-3 h-3 text-primary flex-shrink-0" />
                        )}
                        <span className="font-extrabold text-[9.5px] text-black truncate leading-none">
                          {(store?.name || 'Tienda Oficial')
                            .replace(/Supermercado\s+/i, 'Super ')
                            .replace(/\s+Tingo María$/i, '')}
                        </span>
                        <BadgeCheck className="w-3 h-3 text-sky-500 fill-sky-100 flex-shrink-0" />
                      </div>

                      {/* Stock disponible */}
                      <div className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-700 bg-emerald-50/90 border border-emerald-100/80 px-1.5 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block flex-shrink-0 animate-pulse" />
                        <span>Stock disponible</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row */}
                  <div className="flex items-end justify-between gap-2 mt-2.5 pt-2 border-t border-gray-100">
                    <div className="min-w-0">
                      <div className="h-3.5 flex items-center">
                        {discountPercent && product.originalPriceCents ? (
                          <span className="text-[10px] text-gray-400 line-through tabular-nums leading-none">
                            {formatCents(product.originalPriceCents)}
                          </span>
                        ) : null}
                      </div>
                      <span className="text-sm sm:text-base font-black text-ink leading-tight block tabular-nums">
                        {formatCents(product.priceCents)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleAddToCart(e, product)}
                      title="Agregar al carrito"
                      aria-label={`Agregar ${product.name} al carrito`}
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer shadow-xs flex-shrink-0 ${
                        isJustAdded
                          ? 'bg-emerald-600 text-white shadow-emerald-200 scale-105'
                          : 'bg-primary hover:bg-primary-hover text-white hover:shadow-md'
                      }`}
                    >
                      {isJustAdded ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
