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
    <section className="space-y-4 my-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-ink tracking-tight">
                Productos de Grandes Tiendas y Supermercados
              </h2>
              <span className="hidden sm:inline-flex text-[10px] uppercase font-extrabold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                Stock local
              </span>
            </div>
            <p className="text-xs text-gray-500">
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
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none text-xs">
        {storeFilters.map((tab) => {
          const isActive = selectedStoreId === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedStoreId(tab.id)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all font-bold cursor-pointer text-xs flex items-center gap-1.5 ${
                isActive
                  ? 'bg-primary text-white shadow-sm scale-102'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-300 hover:text-primary'
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
              className="group bg-white rounded-2xl border border-gray-100 shadow-subtle hover:border-primary-300 hover:shadow-card p-3 flex flex-col justify-between transition-all duration-200 text-left"
            >
              <div>
                {/* Store Name Pill */}
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-[10px] font-extrabold text-primary truncate max-w-[130px]">
                    {store?.name || 'Tienda Oficial'}
                  </span>
                  <span className="text-[9px] text-gray-400 font-semibold">Tingo María</span>
                </div>

                {/* Product Image */}
                <div className="aspect-square w-full rounded-xl bg-gray-50 overflow-hidden mb-2.5 flex items-center justify-center p-2 relative border border-gray-50">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />

                  {discountPercent && (
                    <span className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-sm">
                      {discountPercent}% OFF
                    </span>
                  )}

                  {product.freeShipping && (
                    <span className="absolute top-2 left-2 bg-primary/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                      Envío rápido
                    </span>
                  )}
                </div>

                {/* Product Name */}
                <h3 className="font-bold text-xs text-ink group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                  {product.name}
                </h3>

                {/* Pricing */}
                <div className="mt-1.5">
                  {product.originalPriceCents && (
                    <p className="text-[11px] text-gray-400 line-through">
                      {formatCents(product.originalPriceCents)}
                    </p>
                  )}
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm sm:text-base font-black text-ink">
                      {formatCents(product.priceCents)}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-bold text-emerald-600 block mt-1">
                  ✓ Stock disponible
                </span>
              </div>

              {/* Bottom Row: Price on left, Cart Icon Button on right */}
              <div className="flex items-end justify-between gap-2 mt-3 pt-2 border-t border-gray-100/80">
                <div>
                  {product.originalPriceCents && (
                    <p className="text-[11px] text-gray-400 line-through">
                      {formatCents(product.originalPriceCents)}
                    </p>
                  )}
                  <span className="text-sm sm:text-base font-black text-ink leading-tight block">
                    {formatCents(product.priceCents)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleAddToCart(e, product)}
                  title="Agregar al carrito"
                  aria-label={`Agregar ${product.name} al carrito`}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer shadow-xs flex-shrink-0 ${
                    isJustAdded
                      ? 'bg-emerald-600 text-white shadow-emerald-200 scale-105'
                      : 'bg-primary hover:bg-primary-hover text-white hover:shadow-md'
                  }`}
                >
                  {isJustAdded ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <ShoppingCart className="w-4 h-4" />
                  )}
                </button>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};
