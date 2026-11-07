import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { catalogImage, catalogPlaceholder } from '../../lib/catalogImage';
import { addCatalogProduct } from '../../store/realCartStore';
import { preferredSku, purchasableSku } from '../../domain/catalogRules';
import { RemoteState, useRemote } from '../../features/operations/shared';
import { catalogApi, CatalogProduct, PublicStore, imageUrl, money } from '../../services/api/catalogApi';
import {
  ShoppingCart,
  Sparkles,
  ArrowRight,
  Check,
  Building2,
  Tag,
  Loader2,
} from 'lucide-react';

export const BigStoreProductsSection: React.FC = () => {
  const navigate = useNavigate();
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
  const resource = useRemote('catalog-showcase:' + selectedStoreId, async signal => {
    const [products, stores] = await Promise.all([catalogApi.search({ limit: 15, ...(selectedStoreId === 'all' ? {} : { storeId: selectedStoreId }) }, signal), catalogApi.stores(signal)]);
    return { products, stores };
  });
  const products = resource.data?.products.items || [];
  const stores = resource.data?.stores || [];
  const loading = resource.loading;
  const [addError, setAddError] = useState('');
  const [addedProductId, setAddedProductId] = useState<string | null>(null);


  const storeFilters = [
    { id: 'all', name: 'Todos los productos' },
    ...stores.slice(0, 7).map((s) => ({ id: s.id, name: s.name })),
  ];

  const displayedProducts = (
    selectedStoreId === 'all'
      ? products
      : products.filter((p) => p.storeId === selectedStoreId)
  ).slice(0, 10);

  const handleAddToCart = (e: React.MouseEvent, product: CatalogProduct) => {
    e.preventDefault();
    e.stopPropagation();

    const sku = purchasableSku(product);
    if (!sku) return;

    try {
      addCatalogProduct(product, sku.id, 1);
      setAddError('');

      setAddedProductId(product.id);
      setTimeout(() => {
        setAddedProductId((curr) => (curr === product.id ? null : curr));
      }, 1500);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'No se pudo agregar al carrito.');
    }
  };

  return (
    <section className="w-full bg-emerald-50/20 border-y border-emerald-100/60 py-8 sm:py-10 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-100/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-black text-ink tracking-tight">
                  Productos Destacados en Tingo María
                </h2>
                <span className="hidden sm:inline-flex text-[10px] uppercase font-extrabold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  Catálogo disponible
                </span>
              </div>
              <p className="text-xs text-ink-light">
                Abarrotes, gastronomía, boticas y productos de la selva según disponibilidad de cada comercio
              </p>
            </div>
          </div>

          <Link
            to="/negocios"
            className="text-xs sm:text-sm font-bold text-primary hover:text-primary-hover flex items-center gap-1 hover:underline"
          >
            <span>Ver todo el catálogo</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Interactive Store Filter Tabs */}
        {stores.length > 0 && (
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
                      : 'bg-white text-gray-700 border border-emerald-100 hover:border-primary hover:text-primary'
                  }`}
                >
                  {tab.id === 'all' ? <Tag className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* 5-Column Products Grid */}
        {addError && <p role="alert" className="text-destructive">{addError}</p>}
        {resource.error ? <RemoteState loading={false} error={resource.error} retry={resource.reload}/> : loading ? (
          <div className="py-16 flex items-center justify-center gap-2 text-xs text-ink-light">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span>Cargando productos destacados...</span>
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="py-12 text-center text-xs text-ink-light bg-white rounded-2xl border border-gray-150 p-6">
            No se encontraron productos disponibles para este filtro.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
            {displayedProducts.map((product) => {
              const isJustAdded = addedProductId === product.id;
              const sku = preferredSku(product);
              const price = sku ? sku.priceCents : 0;
              const hasStock = !!purchasableSku(product);
              const rawImg = product.images[0]?.url;
              const productImg = catalogImage(rawImg);
              const brand = (product.brand || product.storeName || 'TIENDA LOCAL').toUpperCase();

              return (
                <div
                  key={product.id}
                  onClick={() => navigate(`/producto/${product.id}`)}
                  className="group cursor-pointer flex flex-col justify-between text-left p-1.5 sm:p-2.5 transition-all duration-200 hover:bg-gray-50/60 rounded-xl bg-transparent"
                >
                  <div>
                    {/* Imagen del producto integrada */}
                    <div className="relative w-full aspect-square mb-2 overflow-hidden rounded-xl bg-transparent">
                      <img
                        src={productImg}
                        alt={product.name}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = catalogPlaceholder;
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>

                    {/* Badge ENVIO HOY */}
                    <div className="mb-1">
                      <span className="bg-[#4b5563] text-white text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-xs inline-block">
                        ENVÍO HOY
                      </span>
                    </div>

                    {/* Brand */}
                    <p className="text-[11px] font-black uppercase tracking-wider text-gray-900 line-clamp-1">
                      {brand}
                    </p>

                    {/* Product Name */}
                    <h3 className="text-xs sm:text-[13px] text-gray-700 font-medium line-clamp-2 leading-snug my-1 group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                  </div>

                  {/* Bottom Row */}
                  <div className="pt-1 mt-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-sm sm:text-base font-black text-gray-900 tabular-nums">
                        {sku ? money(price) : 'Sin presentaciones'}
                      </span>

                      <button
                        type="button"
                        disabled={!hasStock}
                        onClick={(e) => handleAddToCart(e, product)}
                        title="Agregar al carrito"
                        aria-label="Agregar al carrito"
                        className={`p-1.5 sm:p-2 rounded-lg transition-all cursor-pointer ${
                          isJustAdded
                            ? 'bg-emerald-600 text-white'
                            : hasStock
                            ? 'bg-primary hover:bg-primary-hover text-white shadow-2xs active:scale-95'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {isJustAdded ? (
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        ) : (
                          <ShoppingCart className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {product.storeName && (
                      <p className="text-[10px] text-gray-400 capitalize truncate mt-0.5">
                        {product.storeName}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
