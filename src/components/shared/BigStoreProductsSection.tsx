import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useRealCartStore } from '../../store/realCartStore';
import { catalogApi, CatalogProduct, PublicStore, imageUrl, money } from '../../services/api/catalogApi';
import { ProductDetailModal } from '../../features/catalog/ProductDetailModal';
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
  const add = useRealCartStore((s) => s.add);

  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [stores, setStores] = useState<PublicStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const [selectedModalProduct, setSelectedModalProduct] = useState<CatalogProduct | null>(null);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      catalogApi.search({ limit: 15 }),
      catalogApi.stores(),
    ])
      .then(([productsRes, storesRes]) => {
        if (isMounted) {
          setProducts(productsRes.items);
          setStores(storesRes);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error al cargar productos de tiendas:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

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

    const sku = product.skus.find((s) => s.isActive && s.availableStock > 0) || product.skus[0];
    if (!sku) return;

    try {
      add(
        {
          skuId: sku.id,
          productId: product.id,
          storeId: product.storeId,
        },
        1
      );

      setAddedProductId(product.id);
      setTimeout(() => {
        setAddedProductId((curr) => (curr === product.id ? null : curr));
      }, 1500);
    } catch (err) {
      console.error('Error al agregar producto:', err);
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
                  Stock Real PostgreSQL
                </span>
              </div>
              <p className="text-xs text-ink-light">
                Abarrotes, gastronomía, boticas y productos de la selva listos para entrega inmediata
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
        {loading ? (
          <div className="py-16 flex items-center justify-center gap-2 text-xs text-ink-light">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span>Cargando productos destacados...</span>
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="py-12 text-center text-xs text-ink-light bg-white rounded-2xl border border-gray-150 p-6">
            No se encontraron productos disponibles para este filtro.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {displayedProducts.map((product) => {
              const isJustAdded = addedProductId === product.id;
              const sku = product.skus[0];
              const price = sku ? sku.priceCents : 0;
              const hasStock = (sku?.availableStock || 0) > 0;
              const productImg = product.images[0]?.url
                ? imageUrl(product.images[0].url)
                : 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80';

              return (
                <div
                  key={product.id}
                  onClick={() => setSelectedModalProduct(product)}
                  className="group bg-white rounded-2xl border border-emerald-100/70 shadow-sm hover:border-primary-400 hover:shadow-card hover:-translate-y-1 overflow-hidden flex flex-col justify-between transition-all duration-200 text-left h-full cursor-pointer"
                >
                  {/* Product Image */}
                  <div className="relative aspect-square w-full bg-gray-50 overflow-hidden border-b border-gray-100/70">
                    <img
                      src={productImg}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <span className="absolute top-2.5 left-2.5 bg-primary/95 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                      Envío local
                    </span>
                  </div>

                  {/* Content Body */}
                  <div className="p-2.5 sm:p-3 flex flex-col justify-between flex-1">
                    <div>
                      {/* Product Name */}
                      <h3 className="font-bold text-xs text-ink group-hover:text-primary transition-colors line-clamp-2 leading-snug min-h-[2rem]">
                        {product.name}
                      </h3>

                      {/* Store badge & Stock */}
                      <div className="flex items-center justify-between gap-1.5 mt-2">
                        <div
                          className="inline-flex items-center gap-1 text-[9px] text-gray-700 bg-gray-50 border border-gray-200/80 px-1.5 py-0.5 rounded-full truncate max-w-[60%]"
                          title={product.storeName}
                        >
                          <Building2 className="w-3 h-3 text-primary flex-shrink-0" />
                          <span className="font-extrabold text-[9.5px] text-black truncate leading-none">
                            {product.storeName}
                          </span>
                        </div>

                        <div className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-700 bg-emerald-50/90 border border-emerald-100/80 px-1.5 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              hasStock ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                            }`}
                          />
                          <span>{hasStock ? 'En stock' : 'Agotado'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row */}
                    <div className="flex items-end justify-between gap-2 mt-2.5 pt-2 border-t border-gray-100">
                      <span className="text-sm sm:text-base font-black text-ink leading-tight block tabular-nums">
                        {money(price)}
                      </span>

                      <button
                        type="button"
                        disabled={!hasStock}
                        onClick={(e) => handleAddToCart(e, product)}
                        title="Agregar al carrito"
                        aria-label={`Agregar ${product.name} al carrito`}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer shadow-xs flex-shrink-0 ${
                          isJustAdded
                            ? 'bg-emerald-600 text-white shadow-emerald-200 scale-105'
                            : hasStock
                            ? 'bg-primary hover:bg-primary-hover text-white hover:shadow-md'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
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
                </div>
              );
            })}
          </div>
        )}

        {/* Product Detail Modal */}
        <ProductDetailModal
          product={selectedModalProduct}
          isOpen={Boolean(selectedModalProduct)}
          onClose={() => setSelectedModalProduct(null)}
        />
      </div>
    </section>
  );
};
