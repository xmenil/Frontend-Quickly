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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Title & Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
              {searchQuery ? (
                <>
                  Búsqueda: <span className="text-primary">"{searchQuery}"</span>
                </>
              ) : selectedCategory !== 'all' ? (
                categories.find((c) => c.id === selectedCategory)?.label
              ) : (
                'Comercios y Productos en Tingo María'
              )}
            </h1>
            <p className="text-xs sm:text-sm text-ink-light font-medium mt-0.5">
              {searchQuery ? (
                <>
                  Encontramos <strong className="text-ink">{filteredProducts.length}</strong> productos de diversas tiendas y <strong className="text-ink">{filteredMerchants.length}</strong> comercios locales.
                </>
              ) : (
                <>
                  Explora <strong className="text-ink">{merchants.filter((m) => m.status === 'activo').length}</strong> negocios locales y sus productos disponibles en Leoncio Prado.
                </>
              )}
            </p>
          </div>

          {/* Clear Filters Button if any active */}
          {(selectedCategory !== 'all' || onlyOpen || searchQuery || productCategoryParam) && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="self-start sm:self-auto text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1.5 bg-primary-50 px-3.5 py-1.5 rounded-full border border-primary-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-subtle space-y-4">
          {/* Search Input */}
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
              className="w-full min-h-[46px] bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-11 pr-10 text-sm text-ink placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all shadow-subtle"
            />
            <Search className="w-4.5 h-4.5 text-gray-500 absolute left-3.5 top-3.5 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchParams({});
                }}
                className="absolute right-3 top-3 text-xs text-gray-400 hover:text-gray-700 bg-gray-200 hover:bg-gray-300 w-5 h-5 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                title="Borrar búsqueda"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Chips Scrollable */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
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
                  className={`whitespace-nowrap px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-white shadow-xs ring-2 ring-primary/20'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200/70 hover:text-ink'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Controls: View Tabs & Sorting & Open Filter */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
            {/* View Mode Tabs: Productos vs Comercios */}
            <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('products')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                  activeTab === 'products'
                    ? 'bg-white text-primary shadow-xs'
                    : 'text-gray-600 hover:text-ink'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Productos ({filteredProducts.length})</span>
                {filteredProducts.length > 0 && searchQuery && (
                  <span className="w-2 h-2 rounded-full bg-primary" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('merchants')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                  activeTab === 'merchants'
                    ? 'bg-white text-primary shadow-xs'
                    : 'text-gray-600 hover:text-ink'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Comercios ({filteredMerchants.length})</span>
              </button>
            </div>

            {/* Right side: Only Open Checkbox & Sort */}
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <label className="flex items-center gap-2 font-medium text-ink cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyOpen}
                  onChange={(e) => setOnlyOpen(e.target.checked)}
                  className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary cursor-pointer"
                />
                <span>Solo locales abiertos ahora</span>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-gray-500 font-medium">Ordenar:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-ink focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
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

                {/* Products Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                  {filteredProducts.map((product) => {
                    const merchant = merchantMap.get(product.merchantId);
                    const isPopular = (product.ratingCount || 0) >= 60 || (product.soldCount || 0) >= 50;
                    const hasDiscount =
                      product.originalPriceCents && product.originalPriceCents > product.priceCents;
                    const discountPercent = hasDiscount
                      ? Math.round(
                          ((product.originalPriceCents! - product.priceCents) /
                            product.originalPriceCents!) *
                            100
                        )
                      : 0;

                    return (
                      <div
                        key={product.id}
                        onClick={() => navigate(`/producto/${product.id}`)}
                        className="group bg-white rounded-2xl border border-gray-200/80 hover:border-primary-300 shadow-subtle hover:shadow-card hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer"
                      >
                        {/* Image Container with Badges */}
                        <div className="relative aspect-[4/3] bg-gray-50/80 overflow-hidden flex items-center justify-center p-3 border-b border-gray-100">
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            loading="lazy"
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          />

                          {/* Top-left Badges: Más vendido / Descuento */}
                          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
                            {isPopular && (
                              <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs flex items-center gap-0.5">
                                <Flame className="w-3 h-3 fill-white" />
                                <span>Más vendido</span>
                              </span>
                            )}
                            {hasDiscount && (
                              <span className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                                -{discountPercent}% OFF
                              </span>
                            )}
                          </div>

                          {/* Top-right Store pill */}
                          {merchant && (
                            <Link
                              to={`/negocios/${merchant.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="absolute top-2.5 right-2.5 bg-ink/75 hover:bg-primary backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs transition-colors z-10 max-w-[130px]"
                              title={`Vendido por ${merchant.name}`}
                            >
                              <Store className="w-2.5 h-2.5 flex-shrink-0" />
                              <span className="truncate">{merchant.name}</span>
                            </Link>
                          )}
                        </div>

                        {/* Product Body */}
                        <div className="p-3.5 flex flex-col flex-1 justify-between gap-2.5">
                          <div>
                            {/* Merchant name link subtitle */}
                            {merchant && (
                              <Link
                                to={`/negocios/${merchant.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-[11px] font-bold text-gray-400 hover:text-primary transition-colors flex items-center gap-1 mb-1 truncate"
                              >
                                <span>Tienda:</span>
                                <span className="text-gray-600 hover:underline">{merchant.name}</span>
                              </Link>
                            )}

                            {/* Product Name */}
                            <h3 className="font-bold text-ink text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                              {product.name}
                            </h3>

                            {/* Rating and sold count */}
                            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-gray-500">
                              <div className="flex items-center text-amber-500 font-black">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span className="ml-0.5 text-ink">{product.rating ?? 'Sin calificaciones'}</span>
                              </div>
                              <span className="text-gray-300">•</span>
                              <span className="text-gray-500 font-medium">
                                {product.soldCount !== undefined ? `${product.soldCount} vendidos` : (product.isAvailable ? 'Stock disponible' : 'Agotado')}
                              </span>
                            </div>
                          </div>

                          {/* Price & Delivery & Add to Cart */}
                          <div className="pt-2 border-t border-gray-100/80 space-y-2">
                            {/* Price */}
                            <div className="flex items-baseline gap-2">
                              <span className="text-lg font-black text-ink">
                                {product.hasPrice === false ? 'Sin presentaciones' : formatCents(product.priceCents)}
                              </span>
                              {hasDiscount && (
                                <span className="text-xs text-gray-400 line-through font-semibold">
                                  {formatCents(product.originalPriceCents!)}
                                </span>
                              )}
                            </div>

                            {/* Delivery indicator */}
                            <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                              <Truck className="w-3 h-3 text-emerald-600" />
                              <span>Envío según dirección de entrega</span>
                            </div>

                            {/* Action Button */}
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
                              className="w-full mt-1 py-2 px-3 rounded-xl bg-primary-50 hover:bg-primary text-primary hover:text-white font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-[0.98]"
                            >
                              {product.hasVariants ? (
                                <>
                                  <Eye className="w-4 h-4 stroke-[2.5]" />
                                  <span>Ver modelos y detalles</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-4 h-4 stroke-[2.5]" />
                                  <span>Agregar al carrito</span>
                                </>
                              )}
                            </button>
                          </div>
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
