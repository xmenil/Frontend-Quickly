import React, { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore';
import { MerchantCard } from '../../components/shared/MerchantCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { MerchantCategory } from '../../domain/types';
import { Search, Filter, RotateCcw, Store, ChevronLeft } from 'lucide-react';

export const MerchantsPage: React.FC = () => {
  const { merchants, products } = useDataStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const categoryParam = searchParams.get('categoria') as MerchantCategory | null;
  const queryParam = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [selectedCategory, setSelectedCategory] = useState<MerchantCategory | 'all'>(
    categoryParam || 'all'
  );
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'rating' | 'prepTime' | 'deliveryFee'>('rating');

  // Filter and sort merchants
  const filteredMerchants = useMemo(() => {
    return merchants
      .filter((m) => m.status === 'activo')
      .filter((m) => {
        // Category filter
        if (selectedCategory !== 'all' && m.category !== selectedCategory) {
          return false;
        }
        // Only open filter
        if (onlyOpen && !m.isOpen) {
          return false;
        }
        // Search query filter (matches merchant name or products sold by this merchant!)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const isOfferSearch =
            q === 'oferta' || q === 'ofertas' || q === 'descuento' || q === 'combo' || q === 'promocion';
          const matchesName = m.name.toLowerCase().includes(q);
          const matchesDesc = m.description.toLowerCase().includes(q);
          const matchesCategory = m.category.toLowerCase().includes(q);

          // Check if any product belongs to this merchant matches
          const matchesProduct = products.some((p) => {
            if (p.merchantId !== m.id) return false;
            if (p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)) return true;
            if (isOfferSearch && p.originalPriceCents && p.originalPriceCents > p.priceCents) return true;
            return false;
          });

          if (isOfferSearch && (matchesProduct || m.deliveryFeeCents <= 300 || m.rating >= 4.7)) {
            return true;
          }

          if (!matchesName && !matchesDesc && !matchesCategory && !matchesProduct) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'prepTime') return a.prepTimeMinutes - b.prepTimeMinutes;
        if (sortBy === 'deliveryFee') return a.deliveryFeeCents - b.deliveryFeeCents;
        return 0;
      });
  }, [merchants, products, selectedCategory, onlyOpen, searchQuery, sortBy]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setOnlyOpen(false);
    setSortBy('rating');
    setSearchParams({});
  };

  const categories: { id: MerchantCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'Todos los Comercios' },
    { id: 'restaurantes', label: 'Restaurantes Amazónicos' },
    { id: 'farmacias', label: 'Boticas & Farmacias' },
    { id: 'bodegas', label: 'Bodegas & Abarrotes' },
    { id: 'emprendedores', label: 'Cacao, Café & Selva' },
    { id: 'supermercados', label: 'Supermercados & Minimarkets' },
    { id: 'ropa', label: 'Textiles & Confección' },
  ];

  return (
    <div className="w-full pb-20">
      {/* Barra de navegación estática/fija de esquina a esquina (Full-width, Slim & Sticky) */}
      <nav
        aria-label="Barra de navegación de comercios"
        className="w-full bg-white/95 backdrop-blur-md border-b border-gray-200/80 sticky top-[125px] md:top-[106px] z-20 select-none shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 flex flex-wrap items-center justify-between gap-y-2 gap-x-4 text-xs">
          {/* Lado izquierdo: Volver solo en letras (sin botones bordeados) + Breadcrumbs */}
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
                COMERCIOS
              </span>
              <span className="text-gray-300 text-[10px]">&gt;</span>
              <span className="text-ink font-semibold">
                {selectedCategory === 'all'
                  ? 'Todos los locales'
                  : categories.find((c) => c.id === selectedCategory)?.label || selectedCategory}
              </span>
            </div>
          </div>

          {/* Lado derecho: Contador de locales disponibles */}
          <div className="flex items-center gap-3 text-xs font-semibold ml-auto text-gray-500">
            <span className="text-gray-400">
              <strong className="text-ink">{filteredMerchants.length}</strong> locales disponibles
            </span>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">Comercios en Tingo María</h1>
          <p className="text-xs sm:text-sm text-ink-light font-medium">
            Explora <span className="font-bold text-ink tabular-nums">{merchants.filter((m) => m.status === 'activo').length}</span> tiendas y negocios locales en Rupa Rupa y Castillo Grande
          </p>
        </div>

        {/* Clear Filters Button if any active */}
        {(selectedCategory !== 'all' || onlyOpen || searchQuery) && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="self-start sm:self-auto touch-target text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1.5 bg-primary-50 px-3.5 py-1.5 rounded-full border border-primary-200 transition-colors"
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
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por negocio o plato (ej: cecina, juane, paracetamol, café)..."
            className="w-full min-h-[44px] bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-ink placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all shadow-subtle"
          />
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5 pointer-events-none" />
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
                  if (cat.id !== 'all') setSearchParams({ categoria: cat.id });
                  else setSearchParams({});
                }}
                className={`touch-target whitespace-nowrap px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  isSelected
                    ? 'bg-primary text-white shadow-sm ring-2 ring-primary/20'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200/70 hover:text-ink'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Controls: Only Open & Sort */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100 text-xs">
          <label className="flex items-center gap-2 font-medium text-ink cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyOpen}
              onChange={(e) => setOnlyOpen(e.target.checked)}
              className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary cursor-pointer"
            />
            <span>Solo comercios abiertos ahora</span>
          </label>

          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-medium">Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-ink focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="rating">Mejor Calificación</option>
              <option value="prepTime">Tiempo más rápido</option>
              <option value="deliveryFee">Menor costo de envío</option>
            </select>
          </div>
        </div>
      </div>

      {/* Merchants Grid or Empty State */}
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
    </div>
  );
};
