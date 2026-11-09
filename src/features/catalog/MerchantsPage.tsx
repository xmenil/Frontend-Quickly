import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useStorefrontCatalog } from './useStorefront';
import { RemoteState } from '../operations/shared';
import type { StorefrontProduct as Product } from './storefrontModel';
import { addCatalogProduct } from '../../store/realCartStore';
import { purchasableSku } from '../../domain/catalogRules';
import { MerchantCard } from '../../components/shared/MerchantCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatCents } from '../../lib/currency';
import {
  Search,
  RotateCcw,
  Store,
  ChevronLeft,
  ShoppingBag,
  Star,
  Plus,
  Truck,
  Check,
  Flame,
  Tag,
  ArrowRight,
  Eye,
  ShoppingCart,
} from 'lucide-react';

export const MerchantsPage: React.FC = () => {
  const catalog = useStorefrontCatalog();
  const merchants = catalog.data?.merchants || [];
  const products = catalog.data?.products || [];
  const [actionError, setActionError] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const categoryParam = searchParams.get('categoria');
  const productCategoryParam = searchParams.get('categoriaProducto') || '';
  const queryParam = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    categoryParam || 'all'
  );
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string>('catalog');
  const [activeTab, setActiveTab] = useState<'products' | 'merchants'>(
    queryParam.trim() || categoryParam || productCategoryParam ? 'products' : 'merchants'
  );
  const [addedToast, setAddedToast] = useState<string | null>(null);

  // Sync state when URL params change
  useEffect(() => {
    setSearchQuery(queryParam);
    if (queryParam.trim()) {
      setActiveTab('products');
    }
  }, [queryParam]);

  useEffect(() => {
    setSelectedCategory(categoryParam || 'all');
    if (categoryParam) setActiveTab('products');
  }, [categoryParam]);

  useEffect(() => { if (productCategoryParam) setActiveTab('products'); }, [productCategoryParam]);

  // Lookup map for fast merchant retrieval by id
  const merchantMap = useMemo(() => {
    return new Map(merchants.map((m) => [m.id, m]));
  }, [merchants]);

  // 1. FILTER AND SORT PRODUCTS (Across ALL stores mixed, preferably best sellers first)
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return products
      .filter((p) => {
        // Merchant must exist and be active
        const merchant = merchantMap.get(p.merchantId);
        if (!merchant || merchant.status !== 'activo') return false;

        if (productCategoryParam && p.categoryId !== productCategoryParam) return false;
        // Category filter
        if (selectedCategory !== 'all' && p.category !== selectedCategory) {
          return false;
        }

        // Only open merchants filter
        if (onlyOpen && !merchant.isOpen) {
          return false;
        }

        // Search query filter
        if (q) {
          const matchesName = p.name.toLowerCase().includes(q);
          const matchesDesc = p.description.toLowerCase().includes(q);
          const matchesBrand = p.brand ? p.brand.toLowerCase().includes(q) : false;
          const matchesSubCategory = p.subCategory ? p.subCategory.toLowerCase().includes(q) : false;
          const matchesMerchant = merchant.name.toLowerCase().includes(q);

          if (
            !matchesName &&
            !matchesDesc &&
            !matchesBrand &&
            !matchesSubCategory &&
            !matchesMerchant
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        // Sort order
        if (sortBy === 'price_asc') {
          return a.priceCents - b.priceCents;
        }
        if (sortBy === 'price_desc') {
          return b.priceCents - a.priceCents;
        }
        if (sortBy === 'rating') {
          return (b.rating || 0) - (a.rating || 0);
        }
        return 0;
      });
  }, [products, merchantMap, selectedCategory, onlyOpen, searchQuery, sortBy, productCategoryParam]);

  // 2. FILTER AND SORT MERCHANTS
  const filteredMerchants = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return merchants
      .filter((m) => m.status === 'activo')
      .filter((m) => {
        if (productCategoryParam && !products.some(p => p.merchantId === m.id && p.categoryId === productCategoryParam)) return false;
        // Category filter
        if (selectedCategory !== 'all' && m.category !== selectedCategory) {
          return false;
        }
        // Only open filter
        if (onlyOpen && !m.isOpen) {
          return false;
        }
        // Search query filter
        if (q) {
          const matchesName = m.name.toLowerCase().includes(q);
          const matchesDesc = m.description.toLowerCase().includes(q);
          const matchesCategory = m.category.toLowerCase().includes(q);

          const matchesProduct = products.some((p) => {
            if (p.merchantId !== m.id) return false;
            if (p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)) return true;
            if (p.brand && p.brand.toLowerCase().includes(q)) return true;
            return false;
          });


          if (!matchesName && !matchesDesc && !matchesCategory && !matchesProduct) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') return (b.rating ?? -1) - (a.rating ?? -1);
        if (sortBy === 'prepTime') return (a.prepTimeMinutes ?? Infinity) - (b.prepTimeMinutes ?? Infinity);
        if (sortBy === 'deliveryFee') return (a.deliveryFeeCents ?? Infinity) - (b.deliveryFeeCents ?? Infinity);
        return 0;
      });
  }, [merchants, products, selectedCategory, onlyOpen, searchQuery, sortBy, productCategoryParam]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setOnlyOpen(false);
    setSortBy('catalog');
    setActiveTab('merchants');
    setSearchParams({});
  };

  const handleQuickAddProduct = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    if (product.hasVariants && product.variants && product.variants.length > 0) {
      navigate(`/producto/${product.id}`);
      return;
    }

    const sku = product.source && purchasableSku(product.source);
    if (!product.source || !sku) return;
    try { addCatalogProduct(product.source, sku.id, 1); setActionError(''); }
    catch (error) { setActionError(error instanceof Error ? error.message : 'No se pudo agregar al carrito.'); return; }

    setAddedToast(product.name);
    setTimeout(() => setAddedToast(null), 2500);
  };

  const categories = [
    { id: 'all', label: 'Todas las Categorías' },
    ...Array.from(new Set(merchants.map(merchant => merchant.category))).map(category => ({ id: category, label: category.replace(/[-_]/g, ' ') })),
  ];

  return (
    <div className="w-full pb-20 select-none">
      {/* Toast de confirmación de agregado */}
      {addedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-ink text-white px-4 py-3 rounded-2xl shadow-floating flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 border border-white/10">
          <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
          <div className="text-xs">
            <p className="font-bold">Agregado al carrito</p>
            <p className="text-gray-300 max-w-xs truncate">{addedToast}</p>
          </div>
          <Link
            to="/carrito"
            className="ml-2 bg-primary text-white text-xs font-black px-3 py-1.5 rounded-xl hover:bg-primary-hover transition-colors"
          >
            Ver Carrito
          </Link>
        </div>
      )}

      {/* Barra de navegación estática/fija slim (Sticky Top Bar) */}
      <nav
        aria-label="Barra de navegación de comercios y productos"
        className="w-full bg-white/95 backdrop-blur-md border-b border-gray-200/80 sticky top-[108px] sm:top-[106px] z-20 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 flex flex-wrap items-center justify-between gap-y-2 gap-x-4 text-xs">
          {/* Lado izquierdo: Volver + Breadcrumbs */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            <Link
              to="/"
              className="inline-flex items-center gap-1 font-bold text-primary hover:text-primary-hover hover:underline transition-colors cursor-pointer text-xs group py-0.5"
              title="Volver al inicio"
            >
              <ChevronLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Volver</span>
            </Link>

            <span className="text-gray-300 font-light">|</span>

            <div className="flex items-center gap-1.5 text-gray-500 font-medium text-xs flex-wrap">
              <span className="uppercase text-[11px] font-bold tracking-wider text-gray-500">
                CATÁLOGO
              </span>
              <span className="text-gray-300 text-[10px]">&gt;</span>
              <span className="text-ink font-semibold">
                {selectedCategory === 'all'
                  ? 'Todos los productos y comercios'
                  : categories.find((c) => c.id === selectedCategory)?.label || selectedCategory}
              </span>
              {searchQuery && (
                <>
                  <span className="text-gray-300 text-[10px]">&gt;</span>
                  <span className="text-primary font-bold">"{searchQuery}"</span>
                </>
              )}
            </div>
          </div>

          {/* Lado derecho: Contadores de resultados */}
          <div className="flex items-center gap-3 text-xs font-semibold ml-auto text-gray-500">
            <span className="text-gray-400">
              <strong className="text-ink">{filteredProducts.length}</strong> productos ·{' '}
              <strong className="text-ink">{filteredMerchants.length}</strong> comercios
            </span>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 space-y-2.5">
        {/* Cabecera agrupada y compacta: Título, contadores y Limpiar filtros en una sola línea */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-baseline gap-2">
            <h1 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
              {searchQuery ? (
                <>
                  Búsqueda: <span className="text-primary font-black">"{searchQuery}"</span>
                </>
              ) : selectedCategory !== 'all' ? (
                categories.find((c) => c.id === selectedCategory)?.label
              ) : (
                'Catálogo de Comercios y Productos'
              )}
            </h1>
            <span className="text-xs text-gray-500 font-medium">
              ({filteredProducts.length} productos · {filteredMerchants.length} comercios)
            </span>
          </div>

          {/* Botón Limpiar filtros más pequeño y agrupado */}
          {(selectedCategory !== 'all' || onlyOpen || searchQuery || productCategoryParam) && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-[11px] font-bold text-primary hover:text-primary-hover flex items-center gap-1 bg-primary/10 hover:bg-primary/15 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>

        {/* Barra de filtros integrada, más simple y delgada */}
        <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-gray-200/80 shadow-2xs space-y-2">
          {/* Input de búsqueda compacto */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                setSearchQuery(val);
                if (val.trim()) {
                  setActiveTab('products');
                  setSearchParams({ ...(selectedCategory !== 'all' ? { categoria: selectedCategory } : {}), q: val });
                } else {
                  setSearchParams(selectedCategory !== 'all' ? { categoria: selectedCategory } : {});
                }
              }}
              placeholder="Buscar productos por nombre, marca o tienda (ej: shampoo, xiaomi 15t pro, tacacho, cecina)..."
              className="w-full h-9 bg-gray-50/80 border border-gray-200 rounded-lg py-1.5 pl-9 pr-8 text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1.5 focus:ring-primary focus:bg-white transition-all"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchParams({});
                }}
                className="absolute right-2.5 top-2 text-[10px] text-gray-400 hover:text-gray-700 bg-gray-200 hover:bg-gray-300 w-4.5 h-4.5 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                title="Borrar búsqueda"
              >
                ✕
              </button>
            )}
          </div>

          {/* Chips de categorías: botones más pequeños y compactos */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    const newParams: Record<string, string> = {};
                    if (searchQuery) newParams.q = searchQuery;
                    if (cat.id !== 'all') newParams.categoria = cat.id;
                    setSearchParams(newParams);
                  }}
                  className={`whitespace-nowrap px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-primary text-white border-primary shadow-2xs font-bold'
                      : 'bg-gray-50/80 text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Fila de controles compacta: Pestañas de vista, solo abiertos y ordenar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 text-xs">
            {/* Pestañas: Productos vs Comercios con botones más pequeños */}
            <div className="flex items-center gap-1 bg-gray-100/90 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setActiveTab('products')}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  activeTab === 'products'
                    ? 'bg-white text-primary shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Productos ({filteredProducts.length})</span>
                {filteredProducts.length > 0 && searchQuery && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('merchants')}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  activeTab === 'merchants'
                    ? 'bg-white text-primary shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Comercios ({filteredMerchants.length})</span>
              </button>
            </div>

            {/* Lado derecho: Solo abiertos y ordenar */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <label className="flex items-center gap-1.5 font-medium text-gray-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyOpen}
                  onChange={(e) => setOnlyOpen(e.target.checked)}
                  className="w-3.5 h-3.5 text-primary rounded border-gray-300 focus:ring-primary cursor-pointer"
                />
                <span className="text-[11px] sm:text-xs">Solo locales abiertos ahora</span>
              </label>

              <div className="flex items-center gap-1.5">
                <span className="text-gray-400 font-medium text-[11px] sm:text-xs">Ordenar:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-md px-2 py-1 text-[11px] sm:text-xs font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  {activeTab === 'products' ? (
                    <>
                      <option value="catalog">Orden del catálogo</option>
                      <option value="price_asc">Menor precio</option>
                      <option value="price_desc">Mayor precio</option>
                      <option value="rating" disabled>Calificaciones de productos no disponibles</option>
                    </>
                  ) : (
                    <>
                      <option value="catalog">Orden del catálogo</option>
                      <option value="rating">Mayor Puntuación</option>
                      <option value="prepTime">Tiempo más rápido</option>
                      <option value="deliveryFee">Menor costo de envío</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* VIEW 1: PRODUCTS TAB (PRODUCTOS TRANSVERSALES DE CUALQUIER TIENDA) */}
        {/* ============================================================== */}
        <RemoteState loading={catalog.loading} error={catalog.error} retry={catalog.reload}/>
        {actionError && <p role="alert" className="text-destructive">{actionError}</p>}
        {!catalog.loading && !catalog.error && activeTab === 'products' && (
          <div>
            {filteredProducts.length === 0 ? (
              <EmptyState
                icon={<ShoppingBag className="w-8 h-8" />}
                title={`No encontramos productos con "${searchQuery || 'esos filtros'}"`}
                description="Intenta buscar términos populares como shampoo, xiaomi 15t pro, cecina, café, o cambia la categoría para ver más opciones."
                actionText="Ver comercios y tiendas disponibles"
                onAction={() => setActiveTab('merchants')}
              />
            ) : (
              <div className="space-y-4">
                {/* Result summary banner */}
                <div className="flex items-center justify-between text-xs text-gray-500 font-medium px-1">
                  <span>
                    Mostrando <strong className="text-ink">{filteredProducts.length}</strong> productos de diversas tiendas en Tingo María
                  </span>
                  <span className="text-primary font-bold hidden sm:inline">
                    {sortBy === 'price_asc' ? '✓ Menor precio primero' : sortBy === 'price_desc' ? '✓ Mayor precio primero' : '✓ Catálogo actualizado'}
                  </span>
                </div>

                {/* Products Grid - Diseño integrado sin marco ni fondo blanco */}
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {filteredProducts.map((product) => {
                    const merchant = merchantMap.get(product.merchantId);
                    const brand = (product.brand || merchant?.name || 'TIENDA LOCAL').toUpperCase();
                    const hasDiscount =
                      product.originalPriceCents && product.originalPriceCents > product.priceCents;
                    const discountPercent = hasDiscount
                      ? Math.round(
                          ((product.originalPriceCents! - product.priceCents) /
                            product.originalPriceCents!) *
                            100
                        )
                      : 0;
                    const isJustAdded = addedToast === product.name;

                    return (
                      <div
                        key={product.id}
                        onClick={() => navigate(`/producto/${product.id}`)}
                        className="group cursor-pointer flex flex-col justify-between text-left p-1.5 sm:p-2.5 transition-all duration-200 hover:bg-gray-50/60 rounded-xl bg-transparent"
                      >
                        <div>
                          {/* Imagen del producto integrada a la pantalla */}
                          <div className="relative w-full aspect-square mb-2 overflow-hidden rounded-xl bg-transparent">
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>

                          {/* Badge ENVIO HOY */}
                          <div className="mb-1">
                            <span className="bg-[#4b5563] text-white text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-xs inline-block">
                              ENVÍO HOY
                            </span>
                          </div>

                          {/* Marca en mayúsculas negrita */}
                          <p className="text-[11px] font-black uppercase tracking-wider text-gray-900 line-clamp-1">
                            {brand}
                          </p>

                          {/* Título del producto */}
                          <h3 className="text-xs sm:text-[13px] text-gray-700 font-medium line-clamp-2 leading-snug my-1 group-hover:text-primary transition-colors">
                            {product.name}
                          </h3>
                        </div>

                        {/* Fila de precio con descuento y botón cuadrado de carrito */}
                        <div className="pt-1 mt-1">
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-sm sm:text-base font-black text-gray-900 tabular-nums">
                                {product.hasPrice === false ? 'Sin presentaciones' : formatCents(product.priceCents)}
                              </span>
                              {discountPercent > 0 && (
                                <span className="bg-[#1f2937] text-white text-[10px] font-bold px-1 py-0.5 rounded-xs">
                                  -{discountPercent}%
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              disabled={!product.isAvailable}
                              onClick={(e) => {
                                if (product.hasVariants) {
                                  e.stopPropagation();
                                  navigate(`/producto/${product.id}`);
                                } else {
                                  handleQuickAddProduct(e, product);
                                }
                              }}
                              className={`p-1.5 sm:p-2 rounded-lg transition-all cursor-pointer ${
                                isJustAdded
                                  ? 'bg-emerald-600 text-white'
                                  : product.isAvailable
                                  ? 'bg-primary hover:bg-primary-hover text-white shadow-2xs active:scale-95'
                                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              }`}
                              aria-label="Agregar al carrito"
                            >
                              {isJustAdded ? (
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              ) : (
                                <ShoppingCart className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                          {hasDiscount && (
                            <p className="text-[11px] text-gray-400 line-through tabular-nums mt-0.5">
                              {formatCents(product.originalPriceCents!)}
                            </p>
                          )}

                          {merchant && (
                            <p className="text-[10px] text-gray-400 capitalize truncate mt-0.5">
                              {merchant.name}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: MERCHANTS TAB (TIENDAS Y COMERCIOS) */}
        {/* ============================================================== */}
        {!catalog.loading && !catalog.error && activeTab === 'merchants' && (
          <div>
            {filteredMerchants.length === 0 ? (
              <EmptyState
                icon={<Store className="w-8 h-8" />}
                title="No encontramos comercios con esos filtros"
                description="Intenta buscar con otros términos o restablece los filtros para ver todos los negocios disponibles."
                actionText="Limpiar todos los filtros"
                onAction={handleClearFilters}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {filteredMerchants.map((merchant) => (
                  <MerchantCard key={merchant.id} merchant={merchant} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
